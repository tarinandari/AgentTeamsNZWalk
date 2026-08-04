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
import { DifficultiesService } from './difficulties.service';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';
import { UpdateDifficultyDto } from './dto/update-difficulty.dto';
import { Difficulty } from './difficulty.entity';

@Controller('difficulties')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DifficultiesController {
  constructor(private readonly difficultiesService: DifficultiesService) {}

  @Get()
  findAll(): Promise<Difficulty[]> {
    return this.difficultiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Difficulty> {
    return this.difficultiesService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateDifficultyDto): Promise<Difficulty> {
    return this.difficultiesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDifficultyDto,
  ): Promise<Difficulty> {
    return this.difficultiesService.update(id, dto);
  }
}
