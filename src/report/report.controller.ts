import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { TxnReportDto } from './dto/report.dto';

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

  @Get('/transaction')
  async getProjectTransaction(@Query() query: TxnReportDto) {
    return this.reportService.getProjectTransaction(query);
  }
}
