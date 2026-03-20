import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { DisbursementService } from './disbursement.service';
import {
  CreateDisbursementDto,
  CreateGroupDisbursementDto,
} from './dto/disburse.dto';
import { DisbursementStatus } from '@prisma/client';

@Controller('disbursement')
export class DisbursementController {
  constructor(private readonly disbursementService: DisbursementService) {}

  @Post()
  async createDisbursement(@Body() payload: CreateDisbursementDto) {
    return this.disbursementService.createDisbursement(payload);
  }

  @Post('/group')
  async createGroupDisbursement(@Body() payload: CreateGroupDisbursementDto) {
    return this.disbursementService.createGroupDisbursement(payload);
  }

  @Post('disburse')
  async disburse() {
    return this.disbursementService.alldisburse();
  }

  @Post('disburse/ben/:id')
  async disburseToBen(@Param('id') id: string) {
    return this.disbursementService.disburseToBen(id);
  }

  @Post('disburse/group/:groupId')
  async disburseToGroup(@Param('groupId') groupId: number) {
    return this.disbursementService.disburseToGroup(+groupId);
  }

  @Post('disburse/beneficiaries')
  async disburseToBeneficiaries(@Body() benId: string[]) {
    return this.disbursementService.disburseToMultiBen(benId);
  }

  @Get()
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
