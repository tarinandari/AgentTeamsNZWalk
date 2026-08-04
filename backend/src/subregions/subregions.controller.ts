import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SubRegionsService } from './subregions.service';
import { CreateSubRegionDto } from './dto/create-subregion.dto';
import { UpdateSubRegionDto } from './dto/update-subregion.dto';
import { FindSubRegionsDto } from './dto/find-subregions.dto';
import { SubRegion } from './subregion.entity';

@Controller('subregions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SubRegionsController {
  constructor(private readonly subRegionsService: SubRegionsService) {}

  @Get()
  findAll(@Query() query: FindSubRegionsDto): Promise<SubRegion[]> {
    return this.subRegionsService.findAll(query.regionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SubRegion> {
    return this.subRegionsService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateSubRegionDto): Promise<SubRegion> {
    return this.subRegionsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubRegionDto,
  ): Promise<SubRegion> {
    return this.subRegionsService.update(id, dto);
  }
}
