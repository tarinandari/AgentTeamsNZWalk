import { Body, Controller, Get, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { Region } from './region.entity';

@Controller('regions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  findAll(): Promise<Region[]> {
    return this.regionsService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateRegionDto): Promise<Region> {
    return this.regionsService.create(dto);
  }
}
