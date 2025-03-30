import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AuthModule} from './auth/auth.module';
import {CustomerModule} from './customer/customer.module';
import {MerchantModule} from './merchant/merchant.module';
import {WebhooksModule} from './webhooks/webhooks.module';
import {PrismaModule} from './prisma/prisma.module';
import {ConfigModule} from '@nestjs/config';
import {APP_FILTER} from '@nestjs/core';
import {GlobalExceptionFilter} from './common/filters/http-exception.filter';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        CustomerModule,
        MerchantModule,
        WebhooksModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {
}
