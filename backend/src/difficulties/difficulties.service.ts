import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Difficulty } from './entities/difficulty.entity';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';
import { UpdateDifficultyDto } from './dto/update-difficulty.dto';

@Injectable()
export class DifficultiesService {
  constructor(
    @InjectRepository(Difficulty)
    private readonly difficultiesRepository: Repository<Difficulty>,
  ) {}

  findAll(): Promise<Difficulty[]> {
    return this.difficultiesRepository.find();
  }

  async findOne(id: string): Promise<Difficulty> {
    const difficulty = await this.difficultiesRepository.findOne({ where: { id } });
    if (!difficulty) {
      throw new NotFoundException(`Difficulty with id ${id} not found`);
    }
    return difficulty;
  }

  async create(dto: CreateDifficultyDto): Promise<Difficulty> {
    this.validate(dto.name);
    const difficulty = this.difficultiesRepository.create({ id: randomUUID(), name: dto.name });
    return this.difficultiesRepository.save(difficulty);
  }

  async update(id: string, dto: UpdateDifficultyDto): Promise<Difficulty> {
    const difficulty = await this.findOne(id);
    this.validate(dto.name ?? difficulty.name);
    if (dto.name !== undefined) difficulty.name = dto.name;
    return this.difficultiesRepository.save(difficulty);
  }

  private validate(name: string): void {
    if (!name || !name.trim()) {
      throw new BadRequestException('name must not be empty');
    }
  }
}
