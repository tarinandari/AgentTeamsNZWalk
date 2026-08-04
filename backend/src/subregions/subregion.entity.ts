import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Region } from '../regions/region.entity';

@Entity('SubRegion')
export class SubRegion {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'SubRegionName' })
  subRegionName: string;

  @Column({ name: 'RegionId' })
  regionId: string;

  @ManyToOne(() => Region)
  @JoinColumn({ name: 'RegionId' })
  region: Region;
}
