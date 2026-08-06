import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SubRegionsService } from './subregions.service';
import { SubRegion } from './entities/subregion.entity';

type MockRepo = Partial<Record<keyof Repository<SubRegion>, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('SubRegionsService', () => {
  let service: SubRegionsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubRegionsService,
        { provide: getRepositoryToken(SubRegion), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<SubRegionsService>(SubRegionsService);
    repo = module.get(getRepositoryToken(SubRegion));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns all subregions when no regionId filter is given', async () => {
      const subRegions = [{ id: 1, subRegionName: 'Bay of Islands', regionId: 'r1' }] as SubRegion[];
      (repo.find as jest.Mock).mockResolvedValue(subRegions);

      const result = await service.findAll();

      expect(result).toBe(subRegions);
      expect(repo.find).toHaveBeenCalledWith();
    });

    it('filters by regionId when provided', async () => {
      const subRegions = [{ id: 1, subRegionName: 'Bay of Islands', regionId: 'r1' }] as SubRegion[];
      (repo.find as jest.Mock).mockResolvedValue(subRegions);

      const result = await service.findAll('r1');

      expect(result).toBe(subRegions);
      expect(repo.find).toHaveBeenCalledWith({ where: { regionId: 'r1' } });
    });
  });

  describe('findOne', () => {
    it('returns the subregion when found', async () => {
      const subRegion = { id: 1, subRegionName: 'Bay of Islands', regionId: 'r1' } as SubRegion;
      (repo.findOne as jest.Mock).mockResolvedValue(subRegion);

      const result = await service.findOne(1);

      expect(result).toBe(subRegion);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws NotFoundException when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a subregion (id is DB-generated, not client-generated)', async () => {
      const dto = { subRegionName: 'Bay of Islands', regionId: 'r1' };
      const created = { id: 1, ...dto };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith({
        subRegionName: 'Bay of Islands',
        regionId: 'r1',
      });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('throws BadRequestException when subRegionName is empty', async () => {
      await expect(service.create({ subRegionName: '', regionId: 'r1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when regionId is empty', async () => {
      await expect(
        service.create({ subRegionName: 'Bay of Islands', regionId: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates an existing subregion', async () => {
      const existing = { id: 1, subRegionName: 'Bay of Islands', regionId: 'r1' } as SubRegion;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (repo.save as jest.Mock).mockImplementation((v) => Promise.resolve(v));

      const result = await service.update(1, { subRegionName: 'Updated Name' });

      expect(result).toEqual(
        expect.objectContaining({ id: 1, subRegionName: 'Updated Name', regionId: 'r1' }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when subregion does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, { subRegionName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets subRegionName to empty string', async () => {
      const existing = { id: 1, subRegionName: 'Bay of Islands', regionId: 'r1' } as SubRegion;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update(1, { subRegionName: '' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets regionId to empty string', async () => {
      const existing = { id: 1, subRegionName: 'Bay of Islands', regionId: 'r1' } as SubRegion;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update(1, { regionId: '' })).rejects.toThrow(BadRequestException);
    });
  });
});
