import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VirtualAccount } from '../entities/virtual-account.entity';
import { VirtualAccountService } from '../services/virtual-account.service';
import { VirtualAccountController } from '../controllers/virtual-account.controller';
import { EZPGService } from '../services/ezpg.service';

@Module({
  imports: [TypeOrmModule.forFeature([VirtualAccount])],
  providers: [VirtualAccountService, EZPGService],
  controllers: [VirtualAccountController],
  exports: [VirtualAccountService],
})
export class VirtualAccountModule {}
