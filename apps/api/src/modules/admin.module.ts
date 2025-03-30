import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { AdminUserController } from '../controllers/admin/user.controller';
import { AuthService } from '../services/auth.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Module for admin-specific functionality
 * Provides controllers and services for admin operations
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminUserController],
  providers: [AuthService, JwtService],
})
export class AdminModule {}
