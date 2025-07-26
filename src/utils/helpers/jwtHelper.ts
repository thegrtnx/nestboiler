import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

function createJwtService(
  configService: ConfigService,
  expiresIn: string,
): JwtService {
  return new JwtService({
    secret: configService.get<string>('SECRET_KEY'),
    signOptions: { expiresIn },
  });
}

export async function signToken(
  userid: any,
  email: string,
  configService: ConfigService,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessTokenExpiresIn =
    configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') || '12h';
  const refreshTokenExpiresIn =
    configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d';

  const accessTokenService = createJwtService(
    configService,
    accessTokenExpiresIn,
  );
  const refreshTokenService = createJwtService(
    configService,
    refreshTokenExpiresIn,
  );

  const payload = {
    sub: userid,
    email,
  };

  const accessToken = await accessTokenService.signAsync(payload);
  const refreshToken = await refreshTokenService.signAsync(payload);

  return { accessToken, refreshToken };
}

export async function verifyToken(
  token: string,
  configService: ConfigService,
): Promise<{ sub: string; email: string; iat: number; exp: number }> {
  try {
    const jwtService = new JwtService({
      secret: configService.get<string>('SECRET_KEY'),
    });

    const payload = await jwtService.verifyAsync(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

//sign temp token
export async function signTempToken(
  userid: any,
  email: string,
  configService: ConfigService,
  expiresIn: string = '1h',
): Promise<{ accessToken: string }> {
  const accessTokenService = createJwtService(configService, expiresIn);

  const payload = {
    sub: userid,
    email,
  };

  const accessToken = await accessTokenService.signAsync(payload);

  return { accessToken };
}
