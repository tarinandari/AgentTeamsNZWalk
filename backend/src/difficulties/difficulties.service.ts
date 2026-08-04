import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Difficulty } from './difficulty.entity';
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
    const difficulty = await this.difficultiesRepository.findOneBy({ id });
    if (!difficulty) {
      throw new NotFoundException(`Difficulty ${id} not found`);
    }
    return difficulty;
  }

  create(dto: CreateDifficultyDto): Promise<Difficulty> {
    const difficulty = this.difficultiesRepository.create({
      id: randomUUID(),
      ...dto,
    });
    return this.difficultiesRepository.save(difficulty);
  }

  async update(id: string, dto: UpdateDifficultyDto): Promise<Difficulty> {
    const values = {
      ...(dto.name !== undefined && { name: dto.name }),
    };

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    const result = await this.difficultiesRepository.update(id, values);

    if (result.affected === 0) {
      throw new NotFoundException(`Difficulty ${id} not found`);
    }
    return this.findOne(id);
  }
}
