import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
})
export class TransactionModule {}
