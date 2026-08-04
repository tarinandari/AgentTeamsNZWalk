import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalksService } from './walks.service';
import { Walk } from './walk.entity';
import { Region } from '../regions/region.entity';
import { Difficulty } from '../difficulties/difficulty.entity';
import { SubRegion } from '../subregions/subregion.entity';
import { CreateWalkDto } from './dto/create-walk.dto';
import { UpdateWalkDto } from './dto/update-walk.dto';
import { FindWalksDto } from './dto/find-walks.dto';

type MockQueryBuilder = {
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  getMany: jest.Mock;
  getOne: jest.Mock;
};

function createQueryBuilderMock(): MockQueryBuilder {
  const qb: Partial<MockQueryBuilder> = {};
  qb.leftJoinAndSelect = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.getMany = jest.fn();
  qb.getOne = jest.fn();
  return qb as MockQueryBuilder;
}

describe('WalksService', () => {
  let service: WalksService;
  let repo: jest.Mocked<Repository<Walk>>;
  let regionsRepo: jest.Mocked<Repository<Region>>;
  let difficultiesRepo: jest.Mocked<Repository<Difficulty>>;
  let subRegionsRepo: jest.Mocked<Repository<SubRegion>>;
  let queryBuilder: MockQueryBuilder;

  const sampleWalk = (overrides: Partial<Walk> = {}): Walk =>
    ({
      id: 'walk-1',
      name: 'Tongariro Crossing',
      description: 'A great walk',
      lengthInKm: 19.4,
      walkImageUrl: null,
      difficultyId: 'diff-1',
      regionId: 'region-1',
      subRegionId: null,
      ...overrides,
    }) as Walk;

  beforeEach(async () => {
    queryBuilder = createQueryBuilderMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalksService,
        {
          provide: getRepositoryToken(Walk),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Region),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Difficulty),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(SubRegion),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WalksService>(WalksService);
    repo = module.get(getRepositoryToken(Walk));
    regionsRepo = module.get(getRepositoryToken(Region));
    difficultiesRepo = module.get(getRepositoryToken(Difficulty));
    subRegionsRepo = module.get(getRepositoryToken(SubRegion));

    // Default happy path: referenced region/difficulty/subRegion all exist.
    regionsRepo.findOneBy.mockResolvedValue({ id: 'region-1' } as Region);
    difficultiesRepo.findOneBy.mockResolvedValue({
      id: 'diff-1',
    } as Difficulty);
    subRegionsRepo.findOneBy.mockResolvedValue({ id: 42 } as SubRegion);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll - joins', () => {
    it('always joins difficulty, region and subRegion', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({} as FindWalksDto);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('walk');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'walk.difficulty',
        'difficulty',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'walk.region',
        'region',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'walk.subRegion',
        'subRegion',
      );
    });
  });

  describe('findAll - no filters', () => {
    it('applies no andWhere clauses when no filters are provided', async () => {
      const walks = [sampleWalk()];
      queryBuilder.getMany.mockResolvedValue(walks);

      const result = await service.findAll({} as FindWalksDto);

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual(walks);
    });
  });

  describe('findAll - individual filters', () => {
    it('filters by regionId only', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ regionId: 'region-1' } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'walk.regionId = :regionId',
        { regionId: 'region-1' },
      );
    });

    it('filters by subRegionId only', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ subRegionId: 42 } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'walk.subRegionId = :subRegionId',
        { subRegionId: 42 },
      );
    });

    it('filters by difficultyId only', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ difficultyId: 'diff-1' } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'walk.difficultyId = :difficultyId',
        { difficultyId: 'diff-1' },
      );
    });

    it('filters by search only, using a parameterized case-insensitive LIKE', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ search: 'Crossing' } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(walk.name) LIKE LOWER(:search)',
        { search: '%Crossing%' },
      );

      // Ensure the search term is passed as a bound parameter, never
      // concatenated directly into the SQL fragment string.
      const [sql, params] = queryBuilder.andWhere.mock.calls[0];
      expect(sql).not.toContain('Crossing');
      expect(params.search).toBe('%Crossing%');
    });
  });

  describe('findAll - combined filters', () => {
    it('combines region + difficulty', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({
        regionId: 'region-1',
        difficultyId: 'diff-1',
      } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'walk.regionId = :regionId',
        { regionId: 'region-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'walk.difficultyId = :difficultyId',
        { difficultyId: 'diff-1' },
      );
    });

    it('combines region + search', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({
        regionId: 'region-1',
        search: 'loop',
      } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'walk.regionId = :regionId',
        { regionId: 'region-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'LOWER(walk.name) LIKE LOWER(:search)',
        { search: '%loop%' },
      );
    });

    it('combines difficulty + search', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({
        difficultyId: 'diff-1',
        search: 'loop',
      } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'walk.difficultyId = :difficultyId',
        { difficultyId: 'diff-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'LOWER(walk.name) LIKE LOWER(:search)',
        { search: '%loop%' },
      );
    });

    it('combines region + subRegion + difficulty + search, in that order', async () => {
      const walks = [sampleWalk()];
      queryBuilder.getMany.mockResolvedValue(walks);

      const result = await service.findAll({
        regionId: 'region-1',
        subRegionId: 42,
        difficultyId: 'diff-1',
        search: 'Crossing',
      } as FindWalksDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(4);
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'walk.regionId = :regionId',
        { regionId: 'region-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'walk.subRegionId = :subRegionId',
        { subRegionId: 42 },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        3,
        'walk.difficultyId = :difficultyId',
        { difficultyId: 'diff-1' },
      );
      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        4,
        'LOWER(walk.name) LIKE LOWER(:search)',
        { search: '%Crossing%' },
      );
      expect(result).toEqual(walks);
    });

    it('ignores empty string search (falsy) and applies no search clause', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ search: '' } as FindWalksDto);

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the walk when found', async () => {
      const walk = sampleWalk();
      queryBuilder.getOne.mockResolvedValue(walk);

      const result = await service.findOne('walk-1');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('walk.id = :id', {
        id: 'walk-1',
      });
      expect(result).toEqual(walk);
    });

    it('throws NotFoundException when the walk does not exist', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates, saves, and returns the freshly joined walk', async () => {
      const dto: CreateWalkDto = {
        name: 'Tongariro Crossing',
        description: 'A great walk',
        lengthInKm: 19.4,
        difficultyId: 'diff-1',
        regionId: 'region-1',
      };
      const created = { id: 'walk-1', ...dto } as unknown as Walk;
      const saved = { ...created };
      const withRelations = sampleWalk();

      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(saved);
      queryBuilder.getOne.mockResolvedValue(withRelations);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: dto.name,
          description: dto.description,
          lengthInKm: dto.lengthInKm,
          walkImageUrl: null,
          difficultyId: dto.difficultyId,
          regionId: dto.regionId,
          subRegionId: null,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(withRelations);
    });

    it('throws BadRequestException when regionId does not exist, without touching the repository', async () => {
      regionsRepo.findOneBy.mockResolvedValue(null);
      const dto: CreateWalkDto = {
        name: 'Tongariro Crossing',
        description: 'A great walk',
        lengthInKm: 19.4,
        difficultyId: 'diff-1',
        regionId: 'missing-region',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when difficultyId does not exist', async () => {
      difficultiesRepo.findOneBy.mockResolvedValue(null);
      const dto: CreateWalkDto = {
        name: 'Tongariro Crossing',
        description: 'A great walk',
        lengthInKm: 19.4,
        difficultyId: 'missing-diff',
        regionId: 'region-1',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when subRegionId does not exist', async () => {
      subRegionsRepo.findOneBy.mockResolvedValue(null);
      const dto: CreateWalkDto = {
        name: 'Tongariro Crossing',
        description: 'A great walk',
        lengthInKm: 19.4,
        difficultyId: 'diff-1',
        regionId: 'region-1',
        subRegionId: 999,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('does not check subRegion existence when subRegionId is omitted', async () => {
      const dto: CreateWalkDto = {
        name: 'Tongariro Crossing',
        description: 'A great walk',
        lengthInKm: 19.4,
        difficultyId: 'diff-1',
        regionId: 'region-1',
      };
      const created = { id: 'walk-1', ...dto } as unknown as Walk;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);
      queryBuilder.getOne.mockResolvedValue(sampleWalk());

      await service.create(dto);

      expect(subRegionsRepo.findOneBy).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates only the provided fields and returns the refreshed walk', async () => {
      const dto: UpdateWalkDto = { name: 'New name', lengthInKm: 5 };
      repo.update.mockResolvedValue({ affected: 1 } as any);
      const updated = sampleWalk({ name: 'New name', lengthInKm: 5 });
      queryBuilder.getOne.mockResolvedValue(updated);

      const result = await service.update('walk-1', dto);

      expect(repo.update).toHaveBeenCalledWith('walk-1', {
        name: 'New name',
        lengthInKm: 5,
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when no rows are affected', async () => {
      repo.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.update('missing', { name: 'x' } as UpdateWalkDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException on an empty update body, without touching the repository', async () => {
      await expect(
        service.update('walk-1', {} as UpdateWalkDto),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the update references a non-existent regionId', async () => {
      regionsRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('walk-1', { regionId: 'missing-region' }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the update references a non-existent difficultyId', async () => {
      difficultiesRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('walk-1', { difficultyId: 'missing-diff' }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the update references a non-existent subRegionId', async () => {
      subRegionsRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('walk-1', { subRegionId: 999 }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the walk when it exists', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as any);

      await expect(service.remove('walk-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('walk-1');
    });

    it('throws NotFoundException when no rows are affected', async () => {
      repo.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
