import { Body, Controller, Post } from '@nestjs/common';
import { ResponseService } from './response.service';

@Controller('response')
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  @Post()
  async receiveResponse(@Body() data: any) {
    return this.responseService.receiveResponse(data);
  }
}
