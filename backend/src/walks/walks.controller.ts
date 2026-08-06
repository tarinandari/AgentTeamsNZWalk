import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { WalksService } from './walks.service';
import { CreateWalkDto } from './dto/create-walk.dto';
import { UpdateWalkDto } from './dto/update-walk.dto';

@Controller('walks')
export class WalksController {
  constructor(private readonly walksService: WalksService) {}

  @Get()
  findAll(
    @Query('regionId') regionId?: string,
    @Query('subRegionId', new ParseIntPipe({ optional: true })) subRegionId?: number,
    @Query('difficultyId') difficultyId?: string,
    @Query('search') search?: string,
  ) {
    return this.walksService.findAll({
      regionId,
      subRegionId,
      difficultyId,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWalkDto) {
    return this.walksService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWalkDto) {
    return this.walksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.walksService.remove(id);
  }
}
