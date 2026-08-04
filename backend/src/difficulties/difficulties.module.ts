import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Difficulty } from './difficulty.entity';
import { DifficultiesService } from './difficulties.service';
import { DifficultiesController } from './difficulties.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Difficulty])],
  controllers: [DifficultiesController],
  providers: [DifficultiesService],
  exports: [TypeOrmModule],
})
export class DifficultiesModule {}
