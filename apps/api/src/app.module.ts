import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// REST Modules
import { AuthModule } from './rest/modules/auth.module';
import { VirtualAccountModule } from './rest/modules/virtual-account.module';
import { TransactionModule } from './rest/modules/transaction.module';
import { PointModule } from './rest/modules/point.module';
import { SupportTicketModule } from './rest/modules/support-ticket.module';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User, VirtualAccount, Transaction, Point],
      synchronize: process.env.NODE_ENV !== 'production',
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
