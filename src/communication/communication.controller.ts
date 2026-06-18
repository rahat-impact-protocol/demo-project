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
  UpdateCommunication,
} from './dto/communication.dto';
import { CommunicationService } from './communication.service';

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('')
  async createCommunication(@Body() data: CreateCommunication) {
    return this.communicationService.createCommunication(data);
  }

  @Get('')
  async listCommunication(@Query() query: ListCommunicationQueryDto) {
    return this.communicationService.listCommunication(query);
  }

  @Patch('send/:id')
  async sendCommunication(@Param('id') id: string) {
    return this.communicationService.sendCommunication(id);
  }

  @Patch(':id')
  async updateSms(@Param('id') id: string, @Body() data: UpdateCommunication) {
    return this.communicationService.updateSms(id, data);
  }

  @Get(':id')
  async getCommunicationHistory(@Param('id') id: string) {
    return this.communicationService.getCommunicationHistory(id);
  }

  @Get(':benId/history')
  async getBenCommunicationHistory(
    @Param('benId') benId: string,
    @Query() query: CommunicationHistoryQueryDto,
  ) {
    return this.communicationService.getBenCommunicationHistory(benId, query);
  }
}
