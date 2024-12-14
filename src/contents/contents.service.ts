import { Injectable } from '@nestjs/common';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Content } from './schemas/content.schema';
import { Model } from 'mongoose';

@Injectable()
export class ContentsService {

  constructor(@InjectModel(Content.name) private contentModel: Model<Content>){}

  async create(createContentDto: CreateContentDto) {
    const content = await this.contentModel.create({catalogId: createContentDto.catalogId});
    return await content.save();
  }

  async findAll() {
    return await this.contentModel.find();
  }

  async findOne(id: string) {
    return await this.contentModel.findById(id);
  }

  async findManywithCatalogId(catalogId: string) {
    return await this.contentModel.find({catalogId: catalogId});
  }

  async update(id: string, updateContentDto: UpdateContentDto) {
    return await this.contentModel.findByIdAndUpdate(id, updateContentDto, { new: true });
  }

  async remove(id: string) {
    return await this.contentModel.findByIdAndDelete(id);
  }
}
