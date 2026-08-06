import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubRegion } from './entities/subregion.entity';
import { CreateSubRegionDto } from './dto/create-subregion.dto';
import { UpdateSubRegionDto } from './dto/update-subregion.dto';

@Injectable()
export class SubRegionsService {
  constructor(
    @InjectRepository(SubRegion)
    private readonly subRegionsRepository: Repository<SubRegion>,
  ) {}

  findAll(regionId?: string): Promise<SubRegion[]> {
    if (regionId) {
      return this.subRegionsRepository.find({ where: { regionId } });
    }
    return this.subRegionsRepository.find();
  }

  async findOne(id: number): Promise<SubRegion> {
    const subRegion = await this.subRegionsRepository.findOne({ where: { id } });
    if (!subRegion) {
      throw new NotFoundException(`SubRegion with id ${id} not found`);
    }
    return subRegion;
  }

  async create(dto: CreateSubRegionDto): Promise<SubRegion> {
    this.validate(dto.subRegionName, dto.regionId);
    const subRegion = this.subRegionsRepository.create({
      subRegionName: dto.subRegionName,
      regionId: dto.regionId,
    });
    return this.subRegionsRepository.save(subRegion);
  }

  async update(id: number, dto: UpdateSubRegionDto): Promise<SubRegion> {
    const subRegion = await this.findOne(id);
    this.validate(dto.subRegionName ?? subRegion.subRegionName, dto.regionId ?? subRegion.regionId);
    if (dto.subRegionName !== undefined) subRegion.subRegionName = dto.subRegionName;
    if (dto.regionId !== undefined) subRegion.regionId = dto.regionId;
    return this.subRegionsRepository.save(subRegion);
  }

  private validate(subRegionName: string, regionId: string): void {
    if (!subRegionName || !subRegionName.trim()) {
      throw new BadRequestException('subRegionName must not be empty');
    }
    if (!regionId || !regionId.trim()) {
      throw new BadRequestException('regionId must not be empty');
    }
  }
}
