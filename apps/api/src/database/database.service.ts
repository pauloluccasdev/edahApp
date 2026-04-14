import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  private normalizeDatabaseUrl(databaseUrl: string | undefined): string | undefined {
    if (!databaseUrl) {
      return undefined;
    }

    try {
      new URL(databaseUrl);
      return databaseUrl;
    } catch {
      // Continue with fallback normalization for raw passwords in URL.
    }

    const parsed = databaseUrl.match(
      /^(postgres(?:ql)?:\/\/)([^:]+):(.+)@([^/]+)(\/.*)$/
    );

    if (!parsed) {
      return databaseUrl;
    }

    const [, protocol, username, rawPassword, host, pathAndQuery] = parsed;
    const encodedPassword = encodeURIComponent(rawPassword);
    const normalizedUrl = `${protocol}${username}:${encodedPassword}@${host}${pathAndQuery}`;

    try {
      new URL(normalizedUrl);
      this.logger.warn(
        "DATABASE_URL password had reserved characters and was URL-encoded automatically."
      );
      return normalizedUrl;
    } catch {
      return databaseUrl;
    }
  }

  private resolvePgSsl(databaseUrl: string | undefined):
    | { rejectUnauthorized: boolean }
    | undefined {
    if (!databaseUrl) {
      return undefined;
    }

    const strictSsl =
      this.configService.get<string>("DATABASE_SSL_REJECT_UNAUTHORIZED") ===
      "true";

    try {
      const { hostname } = new URL(databaseUrl);
      const host = hostname.toLowerCase();
      const isSupabaseHost =
        host.endsWith(".supabase.co") || host.endsWith(".supabase.com");

      if (!isSupabaseHost) {
        return undefined;
      }

      return { rejectUnauthorized: strictSsl };
    } catch {
      const lower = databaseUrl.toLowerCase();
      if (
        lower.includes("supabase.co") ||
        lower.includes("supabase.com")
      ) {
        return { rejectUnauthorized: strictSsl };
      }
      return undefined;
    }
  }

  constructor(private readonly configService: ConfigService) {
    const rawDatabaseUrl = this.configService.get<string>("DATABASE_URL");
    const databaseUrl = this.normalizeDatabaseUrl(rawDatabaseUrl);

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: this.resolvePgSsl(databaseUrl)
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch (error) {
      this.logger.error(
        "Database connection failed",
        error instanceof Error ? error.stack : undefined
      );
      return false;
    }
  }

  async getHealthCheckValue(): Promise<string | null> {
    try {
      const result = await this.pool.query<{ text: string }>(
        'SELECT "text" FROM health_check ORDER BY id DESC LIMIT 1'
      );

      return result.rows[0]?.text ?? null;
    } catch (error) {
      this.logger.error(
        "Failed to fetch health_check value",
        error instanceof Error ? error.stack : undefined
      );
      return null;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
