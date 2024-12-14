import { Module } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Content, ContentSchema } from './schemas/content.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: Content.name, schema: ContentSchema}])],
  providers: [ContentsService],
  exports: [ContentsService]
})
export class ContentsModule {}
