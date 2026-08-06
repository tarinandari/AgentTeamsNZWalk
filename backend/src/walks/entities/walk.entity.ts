import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Difficulty } from '../../difficulties/entities/difficulty.entity';
import { Region } from '../../regions/entities/region.entity';
import { SubRegion } from '../../subregions/entities/subregion.entity';

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

  @Column({ name: 'WalkImageUrl', type: 'nvarchar', nullable: true })
  walkImageUrl: string | null;

  @Column({ name: 'DifficultyId', type: 'uniqueidentifier' })
  difficultyId: string;

  @Column({ name: 'RegionId', type: 'uniqueidentifier' })
  regionId: string;

  @Column({ name: 'SubRegionId', type: 'int', nullable: true })
  subRegionId: number | null;

  @ManyToOne(() => Difficulty, (difficulty) => difficulty.walks)
  @JoinColumn({ name: 'DifficultyId' })
  difficulty: Difficulty;

  @ManyToOne(() => Region, (region) => region.walks)
  @JoinColumn({ name: 'RegionId' })
  region: Region;

  @ManyToOne(() => SubRegion, (subRegion) => subRegion.walks, { nullable: true })
  @JoinColumn({ name: 'SubRegionId' })
  subRegion: SubRegion | null;
}
