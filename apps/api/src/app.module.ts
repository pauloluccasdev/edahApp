import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChurchesModule } from "./modules/churches/churches.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { InvitesModule } from "./modules/invites/invites.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local"],
    }),
    HealthModule,
    AuthModule,
    ChurchesModule,
    DepartmentsModule,
    InvitesModule,
  ],
})
export class AppModule {}
