import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Catalog } from './schemas/catalog.schema';
import { Model, Types } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { ContentsService } from 'src/contents/contents.service';

@Injectable()
export class CatalogsService {

  private readonly bucketName = "berkayft-digitaltophy";
  private readonly region = "eu-north-1";
  private readonly accessKeyId = this.configService.get('AWS_ACCESS_KEY');
  private readonly secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
  private s3: AWS.S3;

  constructor(@InjectModel(Catalog.name) private catalogModel: Model<Catalog> , private readonly userService: UsersService,private readonly configService:ConfigService , private readonly contentService: ContentsService) {
    AWS.config.update({
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey
    });
    this.s3 = new AWS.S3();
  }


  //need user id
  async create(createCatalogDto: CreateCatalogDto , email: string ) {
    const user = await this.userService.findOneByEmail(email);
    console.log(user);
    console.log(createCatalogDto.name);
    const createdCatalog = await this.catalogModel.create(createCatalogDto);
    createdCatalog.userId = user._id;
    await this.userService.addCatalogToUser(user._id.toString(), createdCatalog._id.toString());
    return await createdCatalog.save();
  }

  async findAll() {
    return await this.catalogModel.find();
  }

  async findOne(id: string) {
    return await this.catalogModel.findById(id);
  }

  async isThereCatalog(id: string) {
    // First, check if the id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
  
    const catalog = await this.catalogModel.findById(id);
    return !!catalog; // Convert to boolean
  }
  async update(id: string, updateCatalogDto: UpdateCatalogDto) {
    return await this.catalogModel.findByIdAndUpdate(id, updateCatalogDto, { new: true });
  }

  //first delete all contents of the catalog then delete the from user's catalog list then delete the catalog
  async remove(id: string) {

    const user = await this.getUserOfCatalog(id);
    await this.userService.removeCatalogFromUser(user._id.toString(), id);
    //delete catalogs contents here
    return await this.catalogModel.findByIdAndDelete(id);
  }

  async getUserOfCatalog(catalogId: string) {
    const catalog = await this.catalogModel.findById(catalogId);
    return await this.userService.findOne(catalog.userId.toString());
  }

  //below of these will implemented in the future you will have to implement content service either


  //file upload to aws s3
  async uploadFile(file, catalogId: string , contentId: string) {
    const {originalname} = file;
    return await this.s3_upload(
      file.buffer,
      this.bucketName,
      `${catalogId}/${contentId}.${originalname.split('.').pop()}`,	
      file.mimetype,
    );
  }

  async s3_upload(file, bucket, name, mimetype){
    const params = {
        Bucket: bucket,
        Key: String(name),
        Body: file,
        ContentType: mimetype,
        ContentDisposition: 'inline',
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AwsRegion,
        },
      };
      try {
        let s3Response = await this.s3.upload(params).promise();
        return String(name);
      } catch (e) {
        console.log(e);
      }
  }



  async addContentToCatalog(catalogId: string, contentId: Types.ObjectId) {
    const catalog = await this.catalogModel.findById(catalogId);
    catalog.contents.push(contentId);
    return await catalog.save();
  }


  //file delete from aws s3
  async removeContentFromCatalog(catalogId: string, contentId: string) {
    const catalog = await this.catalogModel.findById(catalogId);
    catalog.contents = catalog.contents.filter((content) => content.toString() !== contentId);
    return await catalog.save();
  }

  async removeContentFromS3(contentId: string){
    const content = await this.contentService.findOne(contentId);
    const params = {
      Bucket: this.bucketName,
      Key: `${content.imagePath}`,
    };
    await this.s3.deleteObject(params).promise();
  }

  async removeCatalog(catalogId: string){
    const catalog = await this.findOne(catalogId);
    for(const contentId of catalog.contents){
      await this.removeContent(contentId.toString());
    }
    await this.userService.removeCatalogFromUser(catalog.userId.toString(),catalogId);
    await this.remove(catalogId);
  }

  async removeContent(contentId : string){
    const content = await this.contentService.findOne(contentId);
    const catalogId = content.catalogId;
    await this.removeContentFromCatalog(catalogId.toString(),contentId);
    await this.removeContentFromS3(contentId);
    await this.contentService.remove(contentId);
  }

  async isUserHaveThisCatalog(email: string, catalogId: string): Promise<boolean> {
    // Kullanıcıyı email ile bul
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
  
    // Catalog ID'nin geçerli bir ObjectId formatında olup olmadığını kontrol et
    if (!Types.ObjectId.isValid(catalogId)) {
      throw new BadRequestException('Invalid catalog ID format');
    }
  
    // Catalog'u bul
    const catalog = await this.catalogModel.findById(catalogId);
    if (!catalog) {
      throw new BadRequestException('Catalog not found');
    }
    //önce userserviceden catalog 
    return this.userService.isUserHasCatalog(user._id.toString(), catalog._id);
  }

  //get and set callback url of the content by using catalog id and content id
  async getSignedUrls(catalogId: string) {
    const contents = await this.contentService.findManywithCatalogId(catalogId);
    console.log(contents);
    const urls = [];
    for (const content of contents) {
      const params = {
        Bucket: this.bucketName,
        Key: `${content.imagePath}`,
        Expires: 60 * 5,
      };
      urls.push({
        url: this.s3.getSignedUrl('getObject', params),
      });
    }
    return urls;
  }
  async getCallBackUrl(contentId: string){
    const content = await this.contentService.findOne(contentId);

    if(!content.callBackUrl){
      throw new BadRequestException('No callback url');
    }
    return content.callBackUrl;
  }

  async getUserCatalogs(email: string) {
    const user = await this.userService.findOneByEmail(email);
    const catalogs = await this.userService.getUserCatalogs(user._id.toString());
    
    // Use Promise.all with map instead of forEach to handle async operations
    const returnStack = await Promise.all(
      catalogs.map(async (catalogObjectId) => {
        const catalog = await this.findOne(catalogObjectId.toString());
        return {
          catalogName: catalog.name,
          catalogId: catalogObjectId.toString()
        };
      })
    );
  
    return returnStack;
  }

  async setCallBackUrl(contentId: string, url: string) {
  
    const content = await this.contentService.findOne(contentId);
    content.callBackUrl = url;
    await content.save();
  
    return;
  }

  async getContentsOfCatalog(catalogId: string) {
    const catalog = await this.findOne(catalogId);
    const contents = [];
    for (const contentId of catalog.contents) {
      const content = await this.contentService.findOne(contentId.toString());
      const params = {
        Bucket: this.bucketName,
        Key: `${content.imagePath}`,
        Expires: 60 * 5,
      };
      const url=  this.s3.getSignedUrl('getObject', params)
      contents.push({
        contentId: contentId.toString(),
        contentCallBackUrl: content.callBackUrl,
        imageUrl:url
      });
    }
    return contents;
  }
}
