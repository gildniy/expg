import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';
import { VirtualAccount } from '../entities/virtual-account.entity';
import { Point } from '../entities/point.entity';
import { TransactionService } from '../services/transaction.service';
import { TransactionController } from '../controllers/transaction.controller';
import { EzpgService } from '../services/ezpg.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, VirtualAccount, Point])],
  providers: [TransactionService, EzpgService],
  controllers: [TransactionController],
  exports: [TransactionService],
})
export class TransactionModule {}
