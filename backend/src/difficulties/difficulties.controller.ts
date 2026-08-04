import { Body, Controller, Get, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { DifficultiesService } from './difficulties.service';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';
import { Difficulty } from './difficulty.entity';

@Controller('difficulties')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DifficultiesController {
  constructor(private readonly difficultiesService: DifficultiesService) {}

  @Get()
  findAll(): Promise<Difficulty[]> {
    return this.difficultiesService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateDifficultyDto): Promise<Difficulty> {
    return this.difficultiesService.create(dto);
  }
}
