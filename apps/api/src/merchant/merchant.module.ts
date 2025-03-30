import {Module} from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {MerchantController} from './merchant.controller';
import {MerchantService} from './merchant.service';
import {PrismaModule} from '@/prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        HttpModule,
    ],
    controllers: [MerchantController],
    providers: [MerchantService],
    exports: [MerchantService],
})
export class MerchantModule {
}
