import {Module} from '@nestjs/common';
import {CustomerController} from './customer.controller';
import {CustomerService} from './customer.service';
import {PrismaModule} from '@/prisma/prisma.module';
import {MerchantModule} from '@/merchant/merchant.module';

@Module({
    imports: [PrismaModule, MerchantModule],
    controllers: [CustomerController],
    providers: [CustomerService],
    exports: [CustomerService],
})
export class CustomerModule {
}
