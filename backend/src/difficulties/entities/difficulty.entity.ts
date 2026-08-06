import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Walk } from '../../walks/entities/walk.entity';

@Entity('Difficulties')
export class Difficulty {
  @PrimaryColumn({ name: 'Id', type: 'uniqueidentifier' })
  id: string;

  @Column({ name: 'Name' })
  name: string;

  @OneToMany(() => Walk, (walk) => walk.difficulty)
  walks: Walk[];
}
