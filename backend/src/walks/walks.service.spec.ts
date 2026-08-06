import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WalksService } from './walks.service';
import { Walk } from './entities/walk.entity';

type MockRepo = Partial<Record<keyof Repository<Walk>, jest.Mock>>;

const createQueryBuilderMock = (result: Walk[]) => {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
  };
  return qb;
};

const createMockRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const makeWalk = (overrides: Partial<Walk> = {}): Walk =>
  ({
    id: 'walk-1',
    name: 'Tongariro Crossing',
    description: 'A great walk',
    lengthInKm: 19.4,
    walkImageUrl: null,
    difficultyId: 'diff-1',
    regionId: 'region-1',
    subRegionId: null,
    difficulty: { id: 'diff-1', name: 'Hard' },
    region: { id: 'region-1', name: 'Manawatu', code: 'MWT' },
    subRegion: null,
    ...overrides,
  }) as Walk;

describe('WalksService', () => {
  let service: WalksService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalksService, { provide: getRepositoryToken(Walk), useValue: createMockRepo() }],
    }).compile();

    service = module.get<WalksService>(WalksService);
    repo = module.get(getRepositoryToken(Walk));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('joins difficulty, region and subRegion and returns mapped responses with no filters', async () => {
      const walk = makeWalk();
      const qb = createQueryBuilderMock([walk]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({});

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('walk');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('walk.difficulty', 'difficulty');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('walk.region', 'region');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('walk.subRegion', 'subRegion');
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'walk-1',
          name: 'Tongariro Crossing',
          description: 'A great walk',
          lengthInKm: 19.4,
          walkImageUrl: null,
          difficulty: { id: 'diff-1', name: 'Hard' },
          region: { id: 'region-1', name: 'Manawatu', code: 'MWT' },
          subRegion: null,
        },
      ]);
    });

    it('includes a nested subRegion in the response when the walk has one', async () => {
      const walk = makeWalk({
        subRegionId: 5,
        subRegion: { id: 5, subRegionName: 'Central Plateau' } as any,
      });
      const qb = createQueryBuilderMock([walk]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findAll({});

      expect(result[0].subRegion).toEqual({ id: 5, subRegionName: 'Central Plateau' });
    });

    it('filters by regionId only', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ regionId: 'region-1' });

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('walk.regionId = :regionId', {
        regionId: 'region-1',
      });
    });

    it('filters by subRegionId only, including subRegionId 0', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ subRegionId: 0 });

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('walk.subRegionId = :subRegionId', {
        subRegionId: 0,
      });
    });

    it('filters by difficultyId only', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ difficultyId: 'diff-1' });

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('walk.difficultyId = :difficultyId', {
        difficultyId: 'diff-1',
      });
    });

    it('filters by search, lower-casing the term and wrapping it with wildcards', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ search: 'Tongariro' });

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('LOWER(walk.name) LIKE :search', {
        search: '%tongariro%',
      });
    });

    it('never interpolates the search term into the SQL string, even for a SQL-injection payload', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      const payload = "'; DROP TABLE Walks; --";

      await service.findAll({ search: payload });

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('LOWER(walk.name) LIKE :search', {
        search: "%'; drop table walks; --%",
      });
      const [sqlArg] = (qb.andWhere as jest.Mock).mock.calls[0];
      expect(sqlArg).toBe('LOWER(walk.name) LIKE :search');
      expect(sqlArg).not.toContain(payload);
    });

    it('treats empty-string regionId/difficultyId/search as "no filter" (falsy guard)', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ regionId: '', difficultyId: '', search: '' });

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('combines all filters together', async () => {
      const qb = createQueryBuilderMock([]);
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({
        regionId: 'region-1',
        subRegionId: 5,
        difficultyId: 'diff-1',
        search: 'crossing',
      });

      expect(qb.andWhere).toHaveBeenCalledTimes(4);
      expect(qb.andWhere).toHaveBeenNthCalledWith(1, 'walk.regionId = :regionId', {
        regionId: 'region-1',
      });
      expect(qb.andWhere).toHaveBeenNthCalledWith(2, 'walk.subRegionId = :subRegionId', {
        subRegionId: 5,
      });
      expect(qb.andWhere).toHaveBeenNthCalledWith(3, 'walk.difficultyId = :difficultyId', {
        difficultyId: 'diff-1',
      });
      expect(qb.andWhere).toHaveBeenNthCalledWith(4, 'LOWER(walk.name) LIKE :search', {
        search: '%crossing%',
      });
    });
  });

  describe('findOne', () => {
    it('returns the mapped walk when found', async () => {
      const walk = makeWalk();
      (repo.findOne as jest.Mock).mockResolvedValue(walk);

      const result = await service.findOne('walk-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'walk-1' },
        relations: { difficulty: true, region: true, subRegion: true },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'walk-1',
          name: 'Tongariro Crossing',
          difficulty: { id: 'diff-1', name: 'Hard' },
          region: { id: 'region-1', name: 'Manawatu', code: 'MWT' },
        }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Tongariro Crossing',
      description: 'A great walk',
      lengthInKm: 19.4,
      difficultyId: 'diff-1',
      regionId: 'region-1',
    };

    it('creates a walk with a client-generated uuid and returns the joined response', async () => {
      const created = { id: 'generated-uuid', ...dto };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);
      (repo.findOne as jest.Mock).mockResolvedValue(makeWalk({ id: 'generated-uuid' }));

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Tongariro Crossing',
          lengthInKm: 19.4,
          walkImageUrl: null,
          subRegionId: null,
          difficultyId: 'diff-1',
          regionId: 'region-1',
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'generated-uuid' },
        relations: { difficulty: true, region: true, subRegion: true },
      });
      expect(result.id).toBe('generated-uuid');
    });

    it('passes walkImageUrl and subRegionId through unchanged when supplied', async () => {
      const dtoWithNullables = {
        ...dto,
        walkImageUrl: 'https://example.com/x.jpg',
        subRegionId: 5,
      };
      const created = { id: 'generated-uuid', ...dtoWithNullables };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);
      (repo.findOne as jest.Mock).mockResolvedValue(makeWalk({ id: 'generated-uuid' }));

      await service.create(dtoWithNullables);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          walkImageUrl: 'https://example.com/x.jpg',
          subRegionId: 5,
        }),
      );
    });

    it('throws BadRequestException when name is empty', async () => {
      await expect(service.create({ ...dto, name: '' })).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when lengthInKm is zero', async () => {
      await expect(service.create({ ...dto, lengthInKm: 0 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when lengthInKm is negative', async () => {
      await expect(service.create({ ...dto, lengthInKm: -5 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when lengthInKm is NaN', async () => {
      await expect(service.create({ ...dto, lengthInKm: NaN })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates an existing walk and returns the joined response', async () => {
      const existing = makeWalk();
      (repo.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(makeWalk({ name: 'Updated Name' }));
      (repo.save as jest.Mock).mockResolvedValue(existing);

      const result = await service.update('walk-1', { name: 'Updated Name' });

      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('throws NotFoundException when walk does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets lengthInKm to a non-positive number', async () => {
      const existing = makeWalk();
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update('walk-1', { lengthInKm: -1 })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets name to empty string', async () => {
      const existing = makeWalk();
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update('walk-1', { name: '' })).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the walk when it exists', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(service.remove('walk-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('walk-1');
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when affected is undefined', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({});

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
