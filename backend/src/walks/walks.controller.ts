import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WalksService } from './walks.service';
import { CreateWalkDto } from './dto/create-walk.dto';
import { UpdateWalkDto } from './dto/update-walk.dto';
import { FindWalksDto } from './dto/find-walks.dto';
import { toWalkResponse, WalkResponse } from './walk-response';

@Controller('walks')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class WalksController {
  constructor(private readonly walksService: WalksService) {}

  @Get()
  async findAll(@Query() query: FindWalksDto): Promise<WalkResponse[]> {
    const walks = await this.walksService.findAll(query);
    return walks.map(toWalkResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WalkResponse> {
    const walk = await this.walksService.findOne(id);
    return toWalkResponse(walk);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateWalkDto): Promise<WalkResponse> {
    const walk = await this.walksService.create(dto);
    return toWalkResponse(walk);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWalkDto,
  ): Promise<WalkResponse> {
    const walk = await this.walksService.update(id, dto);
    return toWalkResponse(walk);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.walksService.remove(id);
  }
}
