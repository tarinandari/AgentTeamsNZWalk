import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { SubRegionsService } from './subregions.service';
import { CreateSubRegionDto } from './dto/create-subregion.dto';
import { UpdateSubRegionDto } from './dto/update-subregion.dto';

@Controller('subregions')
export class SubRegionsController {
  constructor(private readonly subRegionsService: SubRegionsService) {}

  @Get()
  findAll(@Query('regionId') regionId?: string) {
    return this.subRegionsService.findAll(regionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subRegionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubRegionDto) {
    return this.subRegionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubRegionDto) {
    return this.subRegionsService.update(id, dto);
  }
}
