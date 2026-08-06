import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionsRepository: Repository<Region>,
  ) {}

  findAll(): Promise<Region[]> {
    return this.regionsRepository.find();
  }

  async findOne(id: string): Promise<Region> {
    const region = await this.regionsRepository.findOne({ where: { id } });
    if (!region) {
      throw new NotFoundException(`Region with id ${id} not found`);
    }
    return region;
  }

  async create(dto: CreateRegionDto): Promise<Region> {
    this.validate(dto.code, dto.name);
    const region = this.regionsRepository.create({
      id: randomUUID(),
      code: dto.code,
      name: dto.name,
      regionImageUrl: dto.regionImageUrl ?? null,
    });
    return this.regionsRepository.save(region);
  }

  async update(id: string, dto: UpdateRegionDto): Promise<Region> {
    const region = await this.findOne(id);
    this.validate(dto.code ?? region.code, dto.name ?? region.name);
    if (dto.code !== undefined) region.code = dto.code;
    if (dto.name !== undefined) region.name = dto.name;
    if (dto.regionImageUrl !== undefined) region.regionImageUrl = dto.regionImageUrl;
    return this.regionsRepository.save(region);
  }

  private validate(code: string, name: string): void {
    if (!code || !code.trim()) {
      throw new BadRequestException('code must not be empty');
    }
    if (!name || !name.trim()) {
      throw new BadRequestException('name must not be empty');
    }
  }
}
