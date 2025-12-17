import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    try {
      const user = await this.usersService.findById(payload.sub);

      if (!user) throw new UnauthorizedException('Invalid token');
      if (!user.isActive) throw new UnauthorizedException('Account disabled');

      // this becomes req.user
      return user;
    } catch (error) {
      throw error;
    }
  }
}
