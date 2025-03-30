import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// REST Modules
import { AuthModule } from './auth/auth.module';
import { VirtualAccountModule } from './modules/virtual-account.module';
import { TransactionModule } from './modules/transaction.module';
import { PointModule } from './modules/point.module';
import { SupportTicketModule } from './modules/support-ticket.module';
import { AdminModule } from './modules/admin.module';

// Prisma Module
import { PrismaModule } from './modules/prisma.module';

// Security Module
import { SecurityModule } from './modules/security.module';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CorsMiddleware } from './middleware/cors.middleware';
import { User } from './entities/user.entity';
import { VirtualAccount } from './entities/virtual-account.entity';
import { Transaction } from './entities/transaction.entity';
import { Point } from './entities/point.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User, VirtualAccount, Transaction, Point],
        synchronize: configService.get('NODE_ENV') !== 'production',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
    // Security Module
    SecurityModule,
    // Prisma Module
    PrismaModule,
    // REST API Modules
    AuthModule,
    VirtualAccountModule,
    TransactionModule,
    PointModule,
    SupportTicketModule,
    // Admin Module
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
