import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Walk } from './walk.entity';
import { Region } from '../regions/region.entity';
import { Difficulty } from '../difficulties/difficulty.entity';
import { SubRegion } from '../subregions/subregion.entity';
import { CreateWalkDto } from './dto/create-walk.dto';
import { UpdateWalkDto } from './dto/update-walk.dto';
import { FindWalksDto } from './dto/find-walks.dto';

interface WalkReferences {
  regionId?: string;
  difficultyId?: string;
  subRegionId?: number | null;
}

@Injectable()
export class WalksService {
  constructor(
    @InjectRepository(Walk)
    private readonly walksRepository: Repository<Walk>,
    @InjectRepository(Region)
    private readonly regionsRepository: Repository<Region>,
    @InjectRepository(Difficulty)
    private readonly difficultiesRepository: Repository<Difficulty>,
    @InjectRepository(SubRegion)
    private readonly subRegionsRepository: Repository<SubRegion>,
  ) {}

  private async validateReferences(refs: WalkReferences): Promise<void> {
    if (refs.regionId !== undefined) {
      const region = await this.regionsRepository.findOneBy({
        id: refs.regionId,
      });
      if (!region) {
        throw new BadRequestException(
          `Region ${refs.regionId} does not exist`,
        );
      }
    }
    if (refs.difficultyId !== undefined) {
      const difficulty = await this.difficultiesRepository.findOneBy({
        id: refs.difficultyId,
      });
      if (!difficulty) {
        throw new BadRequestException(
          `Difficulty ${refs.difficultyId} does not exist`,
        );
      }
    }
    if (refs.subRegionId !== undefined && refs.subRegionId !== null) {
      const subRegion = await this.subRegionsRepository.findOneBy({
        id: refs.subRegionId,
      });
      if (!subRegion) {
        throw new BadRequestException(
          `SubRegion ${refs.subRegionId} does not exist`,
        );
      }
    }
  }

  private joinedQuery() {
    return this.walksRepository
      .createQueryBuilder('walk')
      .leftJoinAndSelect('walk.difficulty', 'difficulty')
      .leftJoinAndSelect('walk.region', 'region')
      .leftJoinAndSelect('walk.subRegion', 'subRegion');
  }

  findAll(filters: FindWalksDto): Promise<Walk[]> {
    const query = this.joinedQuery();

    if (filters.regionId) {
      query.andWhere('walk.regionId = :regionId', {
        regionId: filters.regionId,
      });
    }
    if (filters.subRegionId) {
      query.andWhere('walk.subRegionId = :subRegionId', {
        subRegionId: filters.subRegionId,
      });
    }
    if (filters.difficultyId) {
      query.andWhere('walk.difficultyId = :difficultyId', {
        difficultyId: filters.difficultyId,
      });
    }
    if (filters.search) {
      query.andWhere('LOWER(walk.name) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Walk> {
    const walk = await this.joinedQuery()
      .andWhere('walk.id = :id', { id })
      .getOne();

    if (!walk) {
      throw new NotFoundException(`Walk ${id} not found`);
    }
    return walk;
  }

  async create(dto: CreateWalkDto): Promise<Walk> {
    await this.validateReferences({
      regionId: dto.regionId,
      difficultyId: dto.difficultyId,
      subRegionId: dto.subRegionId,
    });

    const walk = this.walksRepository.create({
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      lengthInKm: dto.lengthInKm,
      walkImageUrl: dto.walkImageUrl ?? null,
      difficultyId: dto.difficultyId,
      regionId: dto.regionId,
      subRegionId: dto.subRegionId ?? null,
    });
    const saved = await this.walksRepository.save(walk);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateWalkDto): Promise<Walk> {
    const values = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.lengthInKm !== undefined && { lengthInKm: dto.lengthInKm }),
      ...(dto.walkImageUrl !== undefined && {
        walkImageUrl: dto.walkImageUrl,
      }),
      ...(dto.difficultyId !== undefined && {
        difficultyId: dto.difficultyId,
      }),
      ...(dto.regionId !== undefined && { regionId: dto.regionId }),
      ...(dto.subRegionId !== undefined && {
        subRegionId: dto.subRegionId,
      }),
    };

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    await this.validateReferences({
      regionId: dto.regionId,
      difficultyId: dto.difficultyId,
      subRegionId: dto.subRegionId,
    });

    const result = await this.walksRepository.update(id, values);

    if (result.affected === 0) {
      throw new NotFoundException(`Walk ${id} not found`);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.walksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Walk ${id} not found`);
    }
  }
}
