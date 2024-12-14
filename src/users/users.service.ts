import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  constructor(@InjectModel(User.name) private userModel : Model<User>){}


  async create(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto);
    createdUser.password = await bcrypt.hash(createUserDto.password, 10);
    return createdUser.save();
  }

  async findAll() {
    return this.userModel.find();
  }

  async findOne(id: string) {
    return await this.userModel.findById(id);
  }

  async findOneByEmail(email: string) {
    return await this.userModel.findOne({email: email}).lean();
  }
  async validateUser(email: string, password: string){
    const user = await this.findOneByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const {password , ...result} = user;
      return result;
    }
    return null;
  }



  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.userModel.findByIdAndUpdate(id, updateUserDto, {new: true});
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    return await this.userModel.findByIdAndUpdate(id, {refreshToken: refreshToken}, {new: true});
  }
  async removeRefreshToken(id: string) {
    return await this.userModel.findByIdAndUpdate(id, {refreshToken: null}, {new: true});
  }

  async getUserCatalogs(id: string) {
    const user = await this.userModel.findById(id);
    return user.catalogIds;
  }

  async getUserCatalog(id: string, catalogId: string) {
    const catalogs = await this.getUserCatalogs(id);
    return catalogs.find(catalog => catalog.toString() === catalogId);
  }

  async addCatalogToUser(id: string, catalogId: string) {
    return await this.userModel.findByIdAndUpdate(id, {$push: {catalogIds: catalogId}}, {new: true});
  }

  async removeCatalogFromUser(id: string, catalogId: string) {
    return await this.userModel.findByIdAndUpdate(id, {$pull: {catalogIds: catalogId}}, {new: true});
  }

  async isUserHasCatalog(id: string, catalogId: Types.ObjectId) {
    const user = await this.userModel.findById(id);
    return user.catalogIds.includes(catalogId);
  }

  
}
