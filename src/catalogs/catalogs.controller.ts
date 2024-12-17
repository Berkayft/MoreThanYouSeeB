import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards , Request, UseInterceptors, UploadedFile, BadRequestException} from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ContentsService } from 'src/contents/contents.service';
import { Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';


@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly catalogsService: CatalogsService,
    private authService: AuthService,
    private contentService: ContentsService,
  ) {}

  @Post("isCatalogExist/:id")
  async isCatalogExist(@Param('id') id: string) {
    return await this.catalogsService.isThereCatalog(id);
  }

  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @Post("matchImage/:catalogId")
  async matchImage(@UploadedFile() file: Express.Multer.File, @Param('catalogId') catalogId: string) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    if(await this.catalogsService.isModelCanUse(catalogId) == false){
      const urls = await this.catalogsService.getSignedUrls(catalogId);
      await this.catalogsService.sendToFlaskApi(urls ,catalogId);
      await this.catalogsService.updateModelTrainedTime(catalogId);
    }

    const dateString = new Date().toISOString().replace(/:/g, '-');
    const imagePath = await this.catalogsService.matchUploadFile(file,dateString);
    const url = await this.catalogsService.getSignedUrl(imagePath);
    const response = await this.catalogsService.sendToFlaskApiForMatch(url,catalogId);
    await this.catalogsService.removeFromS3(imagePath);
    return await this.catalogsService.findCallBackUrl(response,catalogId);
  }



  @UseGuards(JwtAuthGuard)
  @Post("getusercatalogs")
  async getuserCatalogs(@Request() req) {
    const { email } = req.user;
    return await this.catalogsService.getUserCatalogs(email);
  }

  @UseGuards(JwtAuthGuard)
  @Post("newCatalog")
  async create(@Body() createCatalogDto: CreateCatalogDto, @Request() req) {
    const { username, email } = req.user;
    return await this.catalogsService.create(createCatalogDto, email);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @Post("newcontent/:catalogId")
  async addContentToCatalog(
    @Param('catalogId') catalogId: string,
    @UploadedFile() file: Express.Multer.File, 
    @Request() req,
  ) {
    console.log('Received catalogId:', catalogId);
    const { username, email } = req.user;

    // Validate catalog ID format first
    if (!Types.ObjectId.isValid(catalogId)) {
      throw new BadRequestException("Invalid catalog ID");
    }

    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const catalogExists = await this.catalogsService.isThereCatalog(catalogId);
    if (!catalogExists) {
      throw new BadRequestException("Catalog does not exist");
    }

    const userHasCatalog = await this.catalogsService.isUserHaveThisCatalog(email, catalogId);
    if (!userHasCatalog) {
      throw new BadRequestException("User does not have this catalog");
    }

    const content = await this.contentService.create({ catalogId });
    const filename = await this.catalogsService.uploadFile(file, catalogId, content._id.toString());
    await this.catalogsService.addContentToCatalog(catalogId, content._id);
    await this.contentService.update(content._id.toString(), { imagePath: filename });
    await this.catalogsService.updateLastUpdate(catalogId);
    return "Success";
  }

  @UseGuards(JwtAuthGuard)
  @Delete("deletecontent/:contentId")
  async removeContent(@Param('contentId') contentId: string) {
    return await this.catalogsService.removeContent(contentId);
  }
  @Get('testR/:id')
  async sendToflaskapi(@Param('id') id: string) {
    const urls = await this.catalogsService.getSignedUrls(id);
    await this.catalogsService.sendToFlaskApi(urls ,id);
    return;
  }


  @UseGuards(JwtAuthGuard)
  @Post('contents/:id')
  async setCallBackUrl(
    @Param('id') contentId: string,
    @Body() body: { callBackUrl: string }, // Expect an object with callBackUrl
  ) {
    console.log('Received contentId:', contentId);
    console.log('Received body:', body);
    return await this.catalogsService.setCallBackUrl(contentId, body.callBackUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get("contents/:id")
  async getCallBackUrl(@Param('id') id: string) {
    return await this.catalogsService.getCallBackUrl(id);
  }

  // Make sure that routes with :id and :index are handled in the correct order
  @UseGuards(JwtAuthGuard)
  @Get(':id/contents')
  async getContentsOfCatalog(@Param('id') id: string) {
    return await this.catalogsService.getContentsOfCatalog(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async removeCatalog(@Param('id') id: string) {
    return await this.catalogsService.removeCatalog(id);
  }


  @Get(':id') 
  async getSignedUrls(@Param('id') id: string) {
    return await this.catalogsService.getSignedUrls(id);
  }


}

