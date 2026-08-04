import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Region } from './region.entity';
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
    const region = await this.regionsRepository.findOneBy({ id });
    if (!region) {
      throw new NotFoundException(`Region ${id} not found`);
    }
    return region;
  }

  create(dto: CreateRegionDto): Promise<Region> {
    const region = this.regionsRepository.create({
      id: randomUUID(),
      code: dto.code,
      name: dto.name,
      regionImageUrl: dto.regionImageUrl ?? null,
    });
    return this.regionsRepository.save(region);
  }

  async update(id: string, dto: UpdateRegionDto): Promise<Region> {
    const values = {
      ...(dto.code !== undefined && { code: dto.code }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.regionImageUrl !== undefined && {
        regionImageUrl: dto.regionImageUrl,
      }),
    };

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    const result = await this.regionsRepository.update(id, values);

    if (result.affected === 0) {
      throw new NotFoundException(`Region ${id} not found`);
    }
    return this.findOne(id);
  }
}
