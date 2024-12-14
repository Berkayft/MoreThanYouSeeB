import { PartialType } from '@nestjs/mapped-types';
import { AllContentDto } from './all-content.dto';

export class UpdateContentDto extends PartialType(AllContentDto) {}
