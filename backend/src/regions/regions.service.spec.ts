import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionsService } from './regions.service';
import { Region } from './region.entity';
import { CreateRegionDto } from './dto/create-region.dto';

describe('RegionsService', () => {
  let service: RegionsService;
  let repo: jest.Mocked<Repository<Region>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionsService,
        {
          provide: getRepositoryToken(Region),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegionsService>(RegionsService);
    repo = module.get(getRepositoryToken(Region));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all regions from the repository', async () => {
      const regions: Region[] = [
        { id: '1', code: 'WGN', name: 'Wellington', regionImageUrl: null },
        { id: '2', code: 'AKL', name: 'Auckland', regionImageUrl: null },
      ];
      repo.find.mockResolvedValue(regions);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith();
      expect(result).toEqual(regions);
    });

    it('returns an empty array when there are no regions', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates and saves a region with a generated id', async () => {
      const dto: CreateRegionDto = {
        code: 'WGN',
        name: 'Wellington',
        regionImageUrl: 'http://example.com/img.png',
      };
      const created = { id: expect.any(String), ...dto } as unknown as Region;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          code: dto.code,
          name: dto.name,
          regionImageUrl: dto.regionImageUrl,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('defaults regionImageUrl to null when not provided', async () => {
      const dto: CreateRegionDto = { code: 'AKL', name: 'Auckland' };
      repo.create.mockImplementation((entity) => entity as Region);
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Region));

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ regionImageUrl: null }),
      );
      expect(result.regionImageUrl).toBeNull();
    });
  });
});
