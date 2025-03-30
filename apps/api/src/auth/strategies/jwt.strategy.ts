import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../services/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly usePrisma: boolean;

  constructor(
    private prisma: PrismaService, 
    private configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });

    // Determine if we should use Prisma (true) or TypeORM (false)
    this.usePrisma = configService.get<string>('USE_PRISMA') === 'true';
    this.logger.log(`Authentication using ${this.usePrisma ? 'Prisma' : 'TypeORM'}`);
  }

  async validate(payload: any) {
    try {
      if (this.usePrisma) {
        // Find user using Prisma
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            name: true,
          },
        });

        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        return user;
      } else {
        // This will be handled by TypeORM via the AuthService
        // Return the payload for TypeORM to handle the user fetch
        return {
          id: payload.sub,
          email: payload.email,
          role: payload.role
        };
      }
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 