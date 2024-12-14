import { Module } from '@nestjs/common';
import { CommunicatesService } from './communicates.service';

@Module({
  providers: [CommunicatesService],
  exports: [CommunicatesService]
})
export class CommunicatesModule {}
