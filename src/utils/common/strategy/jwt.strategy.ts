import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Status } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'securitysecured', // match the guard name in JwtGuard
) {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const secret = config.get<string>('SECRET_KEY');
    if (!secret) {
      throw new Error('SECRET_KEY is not defined in configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        userId: payload.sub,
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        bio: true,
        dob: true,
        role: true,
        referralCode: true,
        telephoneNumber: true,
        profilePictureUrl: true,
        profilePicturePublicId: true,
        accountStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if the user account is active
    if (user.accountStatus !== Status.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Check if the user session is active (this invalidates tokens on logout)
    if (!user.isActive) {
      throw new UnauthorizedException('Session has been terminated');
    }

    // Return the user object, which will be attached to the request object
    return user;
  }
}
