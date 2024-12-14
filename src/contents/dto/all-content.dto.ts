import { IsString } from "class-validator";


export class AllContentDto {

    @IsString()
    imagePath: string;

    @IsString()
    callBackUrl: string;
}