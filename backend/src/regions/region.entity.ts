import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Regions')
export class Region {
  @PrimaryColumn({ name: 'Id', type: 'uniqueidentifier' })
  id: string;

  @Column({ name: 'Code' })
  code: string;

  @Column({ name: 'Name' })
  name: string;

  @Column({ name: 'RegionImageUrl', nullable: true, type: 'nvarchar' })
  regionImageUrl: string | null;
}
