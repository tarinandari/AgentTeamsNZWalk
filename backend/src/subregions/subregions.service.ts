import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubRegion } from './subregion.entity';
import { Region } from '../regions/region.entity';
import { CreateSubRegionDto } from './dto/create-subregion.dto';

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

  async create(dto: CreateSubRegionDto): Promise<SubRegion> {
    const region = await this.regionsRepository.findOneBy({
      id: dto.regionId,
    });
    if (!region) {
      throw new BadRequestException(`Region ${dto.regionId} does not exist`);
    }

    const subRegion = this.subRegionsRepository.create({
      subRegionName: dto.subRegionName,
      regionId: dto.regionId,
    });
    return this.subRegionsRepository.save(subRegion);
  }
}
