import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../services/auth.service';
import { PrismaService } from '../../services/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);
  private readonly usePrisma: boolean;

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    super({
      usernameField: 'email',
    });

    // Determine if we should use Prisma (true) or TypeORM (false)
    this.usePrisma = configService.get<string>('USE_PRISMA') === 'true';
    this.logger.log(`Authentication using ${this.usePrisma ? 'Prisma' : 'TypeORM'}`);
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      if (this.usePrisma) {
        // Using Prisma
        const user = await this.prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true, // Need password for verification
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }

        // Remove password from result
        const { password: _, ...result } = user;
        return result;
      } else {
        // Using TypeORM via AuthService
        const user = await this.authService.validateUser(email, password);
        
        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
        
        return user;
      }
    } catch (error) {
      this.logger.error(`Login validation error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
} 