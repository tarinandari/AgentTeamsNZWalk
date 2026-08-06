import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Walk } from './entities/walk.entity';
import { WalksService } from './walks.service';
import { WalksController } from './walks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Walk])],
  controllers: [WalksController],
  providers: [WalksService],
  exports: [WalksService],
})
export class WalksModule {}
