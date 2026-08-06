import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubRegion } from './entities/subregion.entity';
import { SubRegionsService } from './subregions.service';
import { SubRegionsController } from './subregions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubRegion])],
  controllers: [SubRegionsController],
  providers: [SubRegionsService],
  exports: [SubRegionsService],
})
export class SubRegionsModule {}
