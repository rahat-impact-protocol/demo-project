import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { DisbursementService } from './disbursement.service';
import { CreateDisbursementDto } from './dto/disburse.dto';
import { DisbursementStatus } from '@prisma/client';

@Controller('disbursement')
export class DisbursementController {
  constructor(private readonly disbursementService: DisbursementService) {}

  @Post()
  async createDisbursement(@Body() payload: CreateDisbursementDto) {
    return this.disbursementService.createDisbursement(payload);
  }

  @Post('disburse')
  async disburse() {
    return this.disbursementService.forwardToRegistry();
  }

  @Get('data')
  async getDisbursementData(
    @Query('status') status: DisbursementStatus,
    @Query('minAmount') minAmount: string = '0',
  ) {
    return this.disbursementService.getDisbursementData(
      status,
      parseInt(minAmount, 10),
    );
  }
}

