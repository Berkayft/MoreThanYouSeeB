import { Test, TestingModule } from '@nestjs/testing';
import { CommunicatesService } from './communicates.service';

describe('CommunicatesService', () => {
  let service: CommunicatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommunicatesService],
    }).compile();

    service = module.get<CommunicatesService>(CommunicatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
