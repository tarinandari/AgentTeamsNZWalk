import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Region } from '../../regions/entities/region.entity';
import { Walk } from '../../walks/entities/walk.entity';

@Entity('SubRegion')
export class SubRegion {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'SubRegionName', length: 100 })
  subRegionName: string;

  @Column({ name: 'RegionId', type: 'uniqueidentifier' })
  regionId: string;

  @ManyToOne(() => Region, (region) => region.subRegions)
  @JoinColumn({ name: 'RegionId' })
  region: Region;

  @OneToMany(() => Walk, (walk) => walk.subRegion)
  walks: Walk[];
}
