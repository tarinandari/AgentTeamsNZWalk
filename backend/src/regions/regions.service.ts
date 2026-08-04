import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Region } from './region.entity';
import { CreateRegionDto } from './dto/create-region.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionsRepository: Repository<Region>,
  ) {}

  findAll(): Promise<Region[]> {
    return this.regionsRepository.find();
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
}
