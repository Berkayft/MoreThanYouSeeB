import { Module } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { CatalogsController } from './catalogs.controller';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ContentsModule } from 'src/contents/contents.module';
import { CommunicatesModule } from 'src/communicates/communicates.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Catalog, CatalogSchema } from './schemas/catalog.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';


@Module({
  imports: [MulterModule.register({
    storage: memoryStorage(),
  }),UsersModule,AuthModule,ContentsModule,CommunicatesModule,MongooseModule.forFeature([{name: Catalog.name , schema: CatalogSchema}]),ConfigModule],
  controllers: [CatalogsController],
  providers: [CatalogsService],
})
export class CatalogsModule {}
