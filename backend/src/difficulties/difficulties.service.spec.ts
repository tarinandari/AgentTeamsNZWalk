import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DifficultiesService } from './difficulties.service';
import { Difficulty } from './difficulty.entity';
import { CreateDifficultyDto } from './dto/create-difficulty.dto';

describe('DifficultiesService', () => {
  let service: DifficultiesService;
  let repo: jest.Mocked<Repository<Difficulty>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DifficultiesService,
        {
          provide: getRepositoryToken(Difficulty),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DifficultiesService>(DifficultiesService);
    repo = module.get(getRepositoryToken(Difficulty));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all difficulties from the repository', async () => {
      const difficulties: Difficulty[] = [
        { id: '1', name: 'Easy' },
        { id: '2', name: 'Hard' },
      ];
      repo.find.mockResolvedValue(difficulties);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith();
      expect(result).toEqual(difficulties);
    });

    it('returns an empty array when there are no difficulties', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates and saves a difficulty with a generated id', async () => {
      const dto: CreateDifficultyDto = { name: 'Medium' };
      const created = { id: expect.any(String), ...dto } as unknown as Difficulty;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(String), name: dto.name }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });
});
