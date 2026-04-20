import {
  Controller,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Get,
} from '@nestjs/common';
import {
  CommunicationHistoryQueryDto,
  CreateCommunication,
  ListCommunicationQueryDto,
} from './dto/communication.dto';
import { CommunicationService } from './communication.service';

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('')
  async createSms(@Body() data: CreateCommunication) {
    return this.communicationService.createSms(data);
  }

  @Get('')
  async listCommunication(@Query() query: ListCommunicationQueryDto) {
    return this.communicationService.listCommunication(query);
  }

  @Patch('send/:id')
  async sendSms(@Param('id') id: string) {
    return this.communicationService.sendSms(id);
  }

  @Get(':id')
  async getSmsHistory(@Param('id') id: string) {
    return this.communicationService.getSmsHistory(id);
  }

  @Get(':benId/history')
  async getBenSmsHistory(
    @Param('benId') benId: string,
    @Query() query: CommunicationHistoryQueryDto,
  ) {
    return this.communicationService.getBenSmsHistory(benId, query);
  }
}
