import { Test, TestingModule } from '@nestjs/testing';
import { SocietiesController } from './societies.controller';
import { SocietiesService } from './societies.service';

describe('SocietiesController', () => {
  let controller: SocietiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocietiesController],
      providers: [SocietiesService],
    }).compile();

    controller = module.get<SocietiesController>(SocietiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
