import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Walk } from './walk.entity';
import { Region } from '../regions/region.entity';
import { Difficulty } from '../difficulties/difficulty.entity';
import { SubRegion } from '../subregions/subregion.entity';
import { WalksService } from './walks.service';
import { WalksController } from './walks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Walk, Region, Difficulty, SubRegion]),
  ],
  controllers: [WalksController],
  providers: [WalksService],
})
export class WalksModule {}
