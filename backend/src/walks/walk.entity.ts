import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Difficulty } from '../difficulties/difficulty.entity';
import { Region } from '../regions/region.entity';
import { SubRegion } from '../subregions/subregion.entity';

@Entity('Walks')
export class Walk {
  @PrimaryColumn({ name: 'Id', type: 'uniqueidentifier' })
  id: string;

  @Column({ name: 'Name' })
  name: string;

  @Column({ name: 'Description' })
  description: string;

  @Column({ name: 'LengthInKm', type: 'float' })
  lengthInKm: number;

  @Column({ name: 'WalkImageUrl', nullable: true, type: 'nvarchar' })
  walkImageUrl: string | null;

  @Column({ name: 'DifficultyId' })
  difficultyId: string;

  @ManyToOne(() => Difficulty)
  @JoinColumn({ name: 'DifficultyId' })
  difficulty: Difficulty;

  @Column({ name: 'RegionId' })
  regionId: string;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'RegionId' })
  region: Region;

  @Column({ name: 'SubRegionId', nullable: true, type: 'int' })
  subRegionId: number | null;

  @ManyToOne(() => SubRegion, { nullable: true })
  @JoinColumn({ name: 'SubRegionId' })
  subRegion: SubRegion | null;
}
