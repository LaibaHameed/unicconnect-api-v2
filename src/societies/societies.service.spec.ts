import { Test, TestingModule } from '@nestjs/testing';
import { SocietiesService } from './societies.service';

describe('SocietiesService', () => {
  let service: SocietiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocietiesService],
    }).compile();

    service = module.get<SocietiesService>(SocietiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
