import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DifficultiesService } from './difficulties.service';
import { Difficulty } from './entities/difficulty.entity';

type MockRepo = Partial<Record<keyof Repository<Difficulty>, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('DifficultiesService', () => {
  let service: DifficultiesService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DifficultiesService,
        { provide: getRepositoryToken(Difficulty), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<DifficultiesService>(DifficultiesService);
    repo = module.get(getRepositoryToken(Difficulty));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns all difficulties from the repository', async () => {
      const difficulties = [{ id: '1', name: 'Easy' }] as Difficulty[];
      (repo.find as jest.Mock).mockResolvedValue(difficulties);

      const result = await service.findAll();

      expect(result).toBe(difficulties);
      expect(repo.find).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('returns the difficulty when found', async () => {
      const difficulty = { id: '1', name: 'Easy' } as Difficulty;
      (repo.findOne as jest.Mock).mockResolvedValue(difficulty);

      const result = await service.findOne('1');

      expect(result).toBe(difficulty);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a difficulty with a client-generated uuid', async () => {
      const dto = { name: 'Easy' };
      const created = { id: 'generated-uuid', name: 'Easy' };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith({ id: expect.any(String), name: 'Easy' });
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('throws BadRequestException when name is empty', async () => {
      await expect(service.create({ name: '' })).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when name is whitespace only', async () => {
      await expect(service.create({ name: '   ' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates an existing difficulty', async () => {
      const existing = { id: '1', name: 'Easy' } as Difficulty;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (repo.save as jest.Mock).mockImplementation((v) => Promise.resolve(v));

      const result = await service.update('1', { name: 'Moderate' });

      expect(result).toEqual(expect.objectContaining({ id: '1', name: 'Moderate' }));
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when difficulty does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets name to empty string', async () => {
      const existing = { id: '1', name: 'Easy' } as Difficulty;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update('1', { name: '' })).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });
});
