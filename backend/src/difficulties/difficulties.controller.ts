import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DifficultiesService } from './difficulties.service';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';
import { UpdateDifficultyDto } from './dto/update-difficulty.dto';

@Controller('difficulties')
export class DifficultiesController {
  constructor(private readonly difficultiesService: DifficultiesService) {}

  @Get()
  findAll() {
    return this.difficultiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.difficultiesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDifficultyDto) {
    return this.difficultiesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDifficultyDto) {
    return this.difficultiesService.update(id, dto);
  }
}
