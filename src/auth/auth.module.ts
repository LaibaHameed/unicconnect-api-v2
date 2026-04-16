import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ProfilesModule } from 'src/profiles/profiles.module';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    UsersModule,
    forwardRef(() => ProfilesModule),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev_secret',
        signOptions: { expiresIn: 60 * 60 * 24 * 15 },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // ✅ THIS is the key
  exports: [PassportModule, JwtModule],   // ✅ optional but recommended if other modules need them
})
export class AuthModule {}
