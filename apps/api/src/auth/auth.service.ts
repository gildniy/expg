import {ConflictException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '@/prisma/prisma.service';
import {LoginDto, RegisterDto} from './dto/auth.dto';
import {Role} from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {
    }

    async register(registerDto: RegisterDto, role: Role = Role.CUSTOMER) {
        const {email, password, name} = registerDto;

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: {email},
        });

        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                pointBalance: {
                    create: {
                        balance: 0,
                    },
                },
            },
        });

        // Generate JWT token
        const token = this.generateToken(user.id, user.email);

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            token,
        };
    }

    async login(loginDto: LoginDto) {
        const {email, password} = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: {email},
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await this.comparePasswords(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT token
        const token = this.generateToken(user.id, user.email);

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            token,
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
            include: {
                pointBalance: true,
                virtualAccount: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            pointBalance: user.pointBalance?.balance || 0,
            virtualAccount: user.virtualAccount
                ? {
                    accountNumber: user.virtualAccount.accountNumber,
                    bankCode: user.virtualAccount.bankCode,
                    bankName: user.virtualAccount.bankName,
                }
                : null,
        };
    }

    private generateToken(userId: string, email: string) {
        const payload = {sub: userId, email};
        return this.jwtService.sign(payload);
    }

    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(password, salt);
    }

    private async comparePasswords(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}
