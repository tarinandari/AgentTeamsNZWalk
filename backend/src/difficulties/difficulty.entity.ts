import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Difficulties')
export class Difficulty {
  @PrimaryColumn({ name: 'Id', type: 'uniqueidentifier' })
  id: string;

  @Column({ name: 'Name' })
  name: string;
}
