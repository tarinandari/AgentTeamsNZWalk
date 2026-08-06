import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { SubRegion } from '../../subregions/entities/subregion.entity';
import { Walk } from '../../walks/entities/walk.entity';

@Entity('Regions')
export class Region {
  @PrimaryColumn({ name: 'Id', type: 'uniqueidentifier' })
  id: string;

  @Column({ name: 'Code' })
  code: string;

  @Column({ name: 'Name' })
  name: string;

  @Column({ name: 'RegionImageUrl', type: 'nvarchar', nullable: true })
  regionImageUrl: string | null;

  @OneToMany(() => SubRegion, (subRegion) => subRegion.region)
  subRegions: SubRegion[];

  @OneToMany(() => Walk, (walk) => walk.region)
  walks: Walk[];
}
