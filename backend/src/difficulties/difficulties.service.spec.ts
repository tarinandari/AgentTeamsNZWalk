import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
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
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
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

  describe('findOne', () => {
    it('returns the difficulty matching the id', async () => {
      const difficulty: Difficulty = { id: 'd1', name: 'Easy' };
      repo.findOneBy.mockResolvedValue(difficulty);

      const result = await service.findOne('d1');

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'd1' });
      expect(result).toEqual(difficulty);
    });

    it('throws NotFoundException when the difficulty does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates the name and returns the updated difficulty', async () => {
      const updated: Difficulty = { id: 'd1', name: 'Moderate' };
      repo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      repo.findOneBy.mockResolvedValue(updated);

      const result = await service.update('d1', { name: 'Moderate' });

      expect(repo.update).toHaveBeenCalledWith('d1', { name: 'Moderate' });
      expect(result).toEqual(updated);
    });

    it('throws BadRequestException when no fields are provided', async () => {
      await expect(service.update('d1', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when no row was affected', async () => {
      repo.update.mockResolvedValue({ affected: 0 } as UpdateResult);

      await expect(service.update('missing', { name: 'Nope' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.findOneBy).not.toHaveBeenCalled();
    });
  });
});
