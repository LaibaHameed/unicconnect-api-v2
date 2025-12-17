import { Controller } from '@nestjs/common';
import { SocietiesService } from './societies.service';

@Controller('societies')
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}
}
