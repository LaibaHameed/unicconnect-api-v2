import { Module } from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { SocietiesController } from './societies.controller';

@Module({
  controllers: [SocietiesController],
  providers: [SocietiesService],
})
export class SocietiesModule {}
