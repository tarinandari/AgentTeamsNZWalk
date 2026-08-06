import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RegionsService } from './regions.service';
import { Region } from './entities/region.entity';

type MockRepo = Partial<Record<keyof Repository<Region>, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('RegionsService', () => {
  let service: RegionsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionsService,
        { provide: getRepositoryToken(Region), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get<RegionsService>(RegionsService);
    repo = module.get(getRepositoryToken(Region));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns all regions from the repository', async () => {
      const regions = [{ id: '1', code: 'NTL', name: 'Northland' }] as Region[];
      (repo.find as jest.Mock).mockResolvedValue(regions);

      const result = await service.findAll();

      expect(result).toBe(regions);
      expect(repo.find).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('returns the region when found', async () => {
      const region = { id: '1', code: 'NTL', name: 'Northland' } as Region;
      (repo.findOne as jest.Mock).mockResolvedValue(region);

      const result = await service.findOne('1');

      expect(result).toBe(region);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a region with a client-generated uuid', async () => {
      const dto = { code: 'NTL', name: 'Northland', regionImageUrl: 'http://img' };
      const created = { id: 'generated-uuid', ...dto };
      (repo.create as jest.Mock).mockReturnValue(created);
      (repo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NTL',
          name: 'Northland',
          regionImageUrl: 'http://img',
          id: expect.any(String),
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('defaults regionImageUrl to null when not provided', async () => {
      const dto = { code: 'NTL', name: 'Northland' };
      (repo.create as jest.Mock).mockImplementation((v) => v);
      (repo.save as jest.Mock).mockImplementation((v) => Promise.resolve(v));

      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ regionImageUrl: null }),
      );
    });

    it('throws BadRequestException when code is empty', async () => {
      await expect(service.create({ code: '', name: 'Northland' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when code is whitespace only', async () => {
      await expect(service.create({ code: '   ', name: 'Northland' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when name is empty', async () => {
      await expect(service.create({ code: 'NTL', name: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('updates an existing region', async () => {
      const existing = { id: '1', code: 'NTL', name: 'Northland', regionImageUrl: null } as Region;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (repo.save as jest.Mock).mockImplementation((v) => Promise.resolve(v));

      const result = await service.update('1', { name: 'Northland Updated' });

      expect(result).toEqual(
        expect.objectContaining({ id: '1', code: 'NTL', name: 'Northland Updated' }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when region does not exist', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets code to empty string', async () => {
      const existing = { id: '1', code: 'NTL', name: 'Northland' } as Region;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update('1', { code: '' })).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when update sets name to empty string', async () => {
      const existing = { id: '1', code: 'NTL', name: 'Northland' } as Region;
      (repo.findOne as jest.Mock).mockResolvedValue(existing);

      await expect(service.update('1', { name: '' })).rejects.toThrow(BadRequestException);
    });
  });
});
