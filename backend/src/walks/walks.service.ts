import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Walk } from './entities/walk.entity';
import { CreateWalkDto } from './dto/create-walk.dto';
import { UpdateWalkDto } from './dto/update-walk.dto';

export interface WalkResponse {
  id: string;
  name: string;
  description: string;
  lengthInKm: number;
  walkImageUrl: string | null;
  difficulty: { id: string; name: string };
  region: { id: string; name: string; code: string };
  subRegion: { id: number; subRegionName: string } | null;
}

export interface WalkFilters {
  regionId?: string;
  subRegionId?: number;
  difficultyId?: string;
  search?: string;
}

@Injectable()
export class WalksService {
  constructor(
    @InjectRepository(Walk)
    private readonly walksRepository: Repository<Walk>,
  ) {}

  async findAll(filters: WalkFilters): Promise<WalkResponse[]> {
    const qb = this.walksRepository
      .createQueryBuilder('walk')
      .leftJoinAndSelect('walk.difficulty', 'difficulty')
      .leftJoinAndSelect('walk.region', 'region')
      .leftJoinAndSelect('walk.subRegion', 'subRegion');

    if (filters.regionId) {
      qb.andWhere('walk.regionId = :regionId', { regionId: filters.regionId });
    }
    if (filters.subRegionId !== undefined) {
      qb.andWhere('walk.subRegionId = :subRegionId', { subRegionId: filters.subRegionId });
    }
    if (filters.difficultyId) {
      qb.andWhere('walk.difficultyId = :difficultyId', { difficultyId: filters.difficultyId });
    }
    if (filters.search) {
      qb.andWhere('LOWER(walk.name) LIKE :search', { search: `%${filters.search.toLowerCase()}%` });
    }

    const walks = await qb.getMany();
    return walks.filter((walk) => walk.difficulty && walk.region).map((walk) => this.toResponse(walk));
  }

  async findOne(id: string): Promise<WalkResponse> {
    const walk = await this.walksRepository.findOne({
      where: { id },
      relations: { difficulty: true, region: true, subRegion: true },
    });
    if (!walk) {
      throw new NotFoundException(`Walk with id ${id} not found`);
    }
    return this.toResponse(walk);
  }

  async create(dto: CreateWalkDto): Promise<WalkResponse> {
    this.validate(dto.name, dto.lengthInKm);
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

  async update(id: string, dto: UpdateWalkDto): Promise<WalkResponse> {
    const walk = await this.walksRepository.findOne({ where: { id } });
    if (!walk) {
      throw new NotFoundException(`Walk with id ${id} not found`);
    }
    this.validate(dto.name ?? walk.name, dto.lengthInKm ?? walk.lengthInKm);
    if (dto.name !== undefined) walk.name = dto.name;
    if (dto.description !== undefined) walk.description = dto.description;
    if (dto.lengthInKm !== undefined) walk.lengthInKm = dto.lengthInKm;
    if (dto.walkImageUrl !== undefined) walk.walkImageUrl = dto.walkImageUrl;
    if (dto.difficultyId !== undefined) walk.difficultyId = dto.difficultyId;
    if (dto.regionId !== undefined) walk.regionId = dto.regionId;
    if (dto.subRegionId !== undefined) walk.subRegionId = dto.subRegionId;
    await this.walksRepository.save(walk);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.walksRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Walk with id ${id} not found`);
    }
  }

  private validate(name: string, lengthInKm: number): void {
    if (!name || !name.trim()) {
      throw new BadRequestException('name must not be empty');
    }
    if (typeof lengthInKm !== 'number' || Number.isNaN(lengthInKm) || lengthInKm <= 0) {
      throw new BadRequestException('lengthInKm must be a positive number');
    }
  }

  private toResponse(walk: Walk): WalkResponse {
    if (!walk.difficulty || !walk.region) {
      throw new Error(
        `Walk ${walk.id} is missing its required difficulty or region relation (data integrity issue)`,
      );
    }
    return {
      id: walk.id,
      name: walk.name,
      description: walk.description,
      lengthInKm: walk.lengthInKm,
      walkImageUrl: walk.walkImageUrl,
      difficulty: { id: walk.difficulty.id, name: walk.difficulty.name },
      region: { id: walk.region.id, name: walk.region.name, code: walk.region.code },
      subRegion: walk.subRegion
        ? { id: walk.subRegion.id, subRegionName: walk.subRegion.subRegionName }
        : null,
    };
  }
}
