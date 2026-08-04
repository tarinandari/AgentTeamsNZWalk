import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { SubRegionsService } from './subregions.service';
import { SubRegion } from './subregion.entity';
import { Region } from '../regions/region.entity';
import { CreateSubRegionDto } from './dto/create-subregion.dto';

describe('SubRegionsService', () => {
  let service: SubRegionsService;
  let repo: jest.Mocked<Repository<SubRegion>>;
  let regionsRepo: jest.Mocked<Repository<Region>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubRegionsService,
        {
          provide: getRepositoryToken(SubRegion),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Region),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SubRegionsService>(SubRegionsService);
    repo = module.get(getRepositoryToken(SubRegion));
    regionsRepo = module.get(getRepositoryToken(Region));

    // Default happy path: referenced region exists.
    regionsRepo.findOneBy.mockResolvedValue({ id: 'r1' } as Region);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all sub regions when no regionId filter is given', async () => {
      const subRegions: SubRegion[] = [
        { id: 1, subRegionName: 'Tongariro', regionId: 'r1' } as SubRegion,
      ];
      repo.find.mockResolvedValue(subRegions);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith();
      expect(result).toEqual(subRegions);
    });

    it('filters sub regions by regionId when provided', async () => {
      const subRegions: SubRegion[] = [
        { id: 1, subRegionName: 'Tongariro', regionId: 'r1' } as SubRegion,
      ];
      repo.find.mockResolvedValue(subRegions);

      const result = await service.findAll('r1');

      expect(repo.find).toHaveBeenCalledWith({ where: { regionId: 'r1' } });
      expect(result).toEqual(subRegions);
    });

    it('returns an empty array when nothing matches the regionId', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll('non-existent-region');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates and saves a sub region', async () => {
      const dto: CreateSubRegionDto = {
        subRegionName: 'Tongariro',
        regionId: 'r1',
      };
      const created = { id: 1, ...dto } as unknown as SubRegion;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subRegionName: dto.subRegionName,
          regionId: dto.regionId,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('throws BadRequestException when regionId does not exist, without touching the repository', async () => {
      regionsRepo.findOneBy.mockResolvedValue(null);
      const dto: CreateSubRegionDto = {
        subRegionName: 'Tongariro',
        regionId: 'missing-region',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the sub region matching the id', async () => {
      const subRegion = {
        id: 1,
        subRegionName: 'Tongariro',
        regionId: 'r1',
      } as SubRegion;
      repo.findOneBy.mockResolvedValue(subRegion);

      const result = await service.findOne(1);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(subRegion);
    });

    it('throws NotFoundException when the sub region does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies only the provided fields and returns the updated sub region', async () => {
      const updated = {
        id: 1,
        subRegionName: 'Tongariro North',
        regionId: 'r1',
      } as SubRegion;
      repo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      repo.findOneBy.mockResolvedValue(updated);

      const result = await service.update(1, {
        subRegionName: 'Tongariro North',
      });

      expect(repo.update).toHaveBeenCalledWith(1, {
        subRegionName: 'Tongariro North',
      });
      expect(regionsRepo.findOneBy).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('validates regionId when it is part of the update', async () => {
      repo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      repo.findOneBy.mockResolvedValue({ id: 1 } as SubRegion);

      await service.update(1, { regionId: 'r2' });

      expect(regionsRepo.findOneBy).toHaveBeenCalledWith({ id: 'r2' });
      expect(repo.update).toHaveBeenCalledWith(1, { regionId: 'r2' });
    });

    it('throws BadRequestException when the new regionId does not exist, without updating', async () => {
      regionsRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(1, { regionId: 'missing-region' }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no fields are provided', async () => {
      await expect(service.update(1, {})).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when no row was affected', async () => {
      repo.update.mockResolvedValue({ affected: 0 } as UpdateResult);

      await expect(
        service.update(999, { subRegionName: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });
  });
});
