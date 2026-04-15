/**
 * migrate-rollback.ts
 *
 * Executa o down.sql de uma migration específica e remove o registro
 * da tabela _prisma_migrations, efetivamente revertendo a migration.
 *
 * Uso:
 *   pnpm prisma:migrate:rollback 20260414000000_init_base_tables
 */

import { Client } from 'pg';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const envPath = resolve(__dirname, '../.env.local');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sep = trimmed.indexOf('=');
    if (sep <= 0) continue;
    const key = trimmed.slice(0, sep).trim();
    const val = trimmed.slice(sep + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

async function rollback(migrationName: string) {
  loadEnvLocal();

  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new Error('DIRECT_URL não encontrada. Verifique o .env.local.');
  }

  const downSqlPath = resolve(
    __dirname,
    '../prisma/migrations',
    migrationName,
    'down.sql',
  );

  if (!existsSync(downSqlPath)) {
    throw new Error(`down.sql não encontrado para: ${migrationName}\n  Esperado em: ${downSqlPath}`);
  }

  const sql = readFileSync(downSqlPath, 'utf8');

  const client = new Client({ connectionString: directUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    console.log(`▶ Executando rollback: ${migrationName}`);
    await client.query(sql);

    await client.query(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = $1`,
      [migrationName],
    );

    await client.query('COMMIT');
    console.log(`✓ Rollback concluído: ${migrationName}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Uso: pnpm prisma:migrate:rollback <nome-da-migration>');
  console.error('Ex:  pnpm prisma:migrate:rollback 20260414000000_init_base_tables');
  process.exit(1);
}

rollback(migrationName).catch((err: Error) => {
  console.error(`✗ Erro: ${err.message}`);
  process.exit(1);
});
