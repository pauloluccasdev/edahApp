import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuporteGuard } from './guards/suporte.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SupabaseAuthService } from './services/supabase-auth.service';
import { TokenService } from './services/token.service';
import { LoginUseCase } from './use-cases/login.use-case';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // cast necessário: @nestjs/jwt v11 usa StringValue do ms, mas string literal é compatível em runtime
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m') as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUserUseCase,
    SupabaseAuthService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    SuporteGuard,
  ],
  exports: [JwtAuthGuard, JwtStrategy, RolesGuard, SuporteGuard, SupabaseAuthService, TokenService],
})
export class AuthModule {}
