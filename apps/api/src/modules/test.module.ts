import { Global, Module } from '@nestjs/common';
import { TestDatabaseService } from '../services/test-database.service';
import { PrismaModule } from './prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TestDatabaseService],
  exports: [TestDatabaseService],
})
export class TestModule {}
