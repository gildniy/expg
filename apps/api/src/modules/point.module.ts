import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointController } from '../controllers/point.controller';
import { PointService } from '../services/point.service';
import { Point } from '../entities/point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Point])],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}
