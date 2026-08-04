import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubRegion } from './subregion.entity';
import { Region } from '../regions/region.entity';
import { CreateSubRegionDto } from './dto/create-subregion.dto';
import { UpdateSubRegionDto } from './dto/update-subregion.dto';

@Injectable()
export class SubRegionsService {
  constructor(
    @InjectRepository(SubRegion)
    private readonly subRegionsRepository: Repository<SubRegion>,
    @InjectRepository(Region)
    private readonly regionsRepository: Repository<Region>,
  ) {}

  findAll(regionId?: string): Promise<SubRegion[]> {
    if (regionId) {
      return this.subRegionsRepository.find({ where: { regionId } });
    }
    return this.subRegionsRepository.find();
  }

  async findOne(id: number): Promise<SubRegion> {
    const subRegion = await this.subRegionsRepository.findOneBy({ id });
    if (!subRegion) {
      throw new NotFoundException(`SubRegion ${id} not found`);
    }
    return subRegion;
  }

  private async validateRegion(regionId: string): Promise<void> {
    const region = await this.regionsRepository.findOneBy({ id: regionId });
    if (!region) {
      throw new BadRequestException(`Region ${regionId} does not exist`);
    }
  }

  async create(dto: CreateSubRegionDto): Promise<SubRegion> {
    await this.validateRegion(dto.regionId);

    const subRegion = this.subRegionsRepository.create({
      subRegionName: dto.subRegionName,
      regionId: dto.regionId,
    });
    return this.subRegionsRepository.save(subRegion);
  }

  async update(id: number, dto: UpdateSubRegionDto): Promise<SubRegion> {
    const values = {
      ...(dto.subRegionName !== undefined && {
        subRegionName: dto.subRegionName,
      }),
      ...(dto.regionId !== undefined && { regionId: dto.regionId }),
    };

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    if (dto.regionId !== undefined) {
      await this.validateRegion(dto.regionId);
    }

    const result = await this.subRegionsRepository.update(id, values);

    if (result.affected === 0) {
      throw new NotFoundException(`SubRegion ${id} not found`);
    }
    return this.findOne(id);
  }
}
