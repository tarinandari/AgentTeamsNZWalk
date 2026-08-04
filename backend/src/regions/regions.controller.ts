import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Region } from './region.entity';

@Controller('regions')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  findAll(): Promise<Region[]> {
    return this.regionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Region> {
    return this.regionsService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateRegionDto): Promise<Region> {
    return this.regionsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRegionDto,
  ): Promise<Region> {
    return this.regionsService.update(id, dto);
  }
}
