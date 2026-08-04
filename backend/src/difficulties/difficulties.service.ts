import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Difficulty } from './difficulty.entity';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';

@Injectable()
export class DifficultiesService {
  constructor(
    @InjectRepository(Difficulty)
    private readonly difficultiesRepository: Repository<Difficulty>,
  ) {}

  findAll(): Promise<Difficulty[]> {
    return this.difficultiesRepository.find();
  }

  create(dto: CreateDifficultyDto): Promise<Difficulty> {
    const difficulty = this.difficultiesRepository.create({
      id: randomUUID(),
      ...dto,
    });
    return this.difficultiesRepository.save(difficulty);
  }
}
