import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RegionsModule } from './regions/regions.module';
import { SubRegionsModule } from './subregions/subregions.module';
import { DifficultiesModule } from './difficulties/difficulties.module';
import { WalksModule } from './walks/walks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        options: { encrypt: false, trustServerCertificate: true },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,   // IMPORTANT — never let TypeORM alter the existing schema
        autoLoadEntities: true,
      }),
    }),
    RegionsModule,
    SubRegionsModule,
    DifficultiesModule,
    WalksModule,
  ],
})
export class AppModule {}
