import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubRegion } from './subregion.entity';
import { Region } from '../regions/region.entity';
import { SubRegionsService } from './subregions.service';
import { SubRegionsController } from './subregions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubRegion, Region])],
  controllers: [SubRegionsController],
  providers: [SubRegionsService],
  exports: [TypeOrmModule],
})
export class SubRegionsModule {}
