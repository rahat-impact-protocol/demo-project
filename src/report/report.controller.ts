import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/beneficiaries')
  async getBeneficiariesReport() {
    return this.reportService.getBeneficiariesReport();
  }
  @Get('/vendor')
  async getVendorReport() {
    return this.reportService.getVendorReport();
  }
}
