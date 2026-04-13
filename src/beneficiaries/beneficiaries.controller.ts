import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { BeneficiaryService } from './beneficiaries.service';
import {
  CreateBeneficiaryDto,
  CreateBeneficiaryGroupDto,
  ListBeneficiaryDto,
} from './dto/create-beneficiary.dto';
import { BeneficiaryGroupService } from './beneficiaries.group.service';
import { CsvFileValidator } from './filevalidator';
import { BeneficiarySmsService } from './beneficiaries.sms.service';
import {
  SendBulkSms,
  SendSms,
  SmsHistoryQueryDto,
} from './dto/beneficiary.sms.dto';

@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(
    private readonly beneficiaryService: BeneficiaryService,
    private readonly beneficiaryGroupService: BeneficiaryGroupService,
    private readonly beneficiarySmsService: BeneficiarySmsService,
  ) {}

  @Post()
  async addBeneficiary(@Body() body: CreateBeneficiaryDto) {
    return this.beneficiaryService.addBeneficiary(body);
  }

  @Get()
  async listBeneficiaries(@Query() data?: ListBeneficiaryDto) {
    return this.beneficiaryService.listBeneficiaries(data);
  }

  @Delete(':id')
  async deleteBeneficiary(@Param('id') id: string) {
    return this.beneficiaryService.deleteBeneficiary(id);
  }

  @Post('/group')
  async createBeneficiaryGroup(@Body() body: CreateBeneficiaryGroupDto) {
    return this.beneficiaryGroupService.createGroup(body);
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB Limit
          new CsvFileValidator(),

          // new FileTypeValidator({ fileType: /(text\/csv|application\/vnd.ms-excel)/i}),
        ],
        fileIsRequired: true,
      }),
    )
    file: Multer.File,
  ) {
    return this.beneficiaryService.uploadFromCsv(file.buffer);
  }

  @Post('/upload/group')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsvAsGroup(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB Limit
          new CsvFileValidator(),

          // new FileTypeValidator({ fileType: /(text\/csv|application\/vnd.ms-excel)/i}),
        ],
        fileIsRequired: true,
      }),
    )
    file: Multer.File,
  ) {
    const groupName = file.originalname
      ? `Imported Group - ${file.originalname.replace(/\.[^/.]+$/, '')}`
      : undefined;
    return this.beneficiaryService.uploadFromCsvAsGroup(file.buffer, groupName);
  }

  @Get('/group')
  async listGroups() {
    return this.beneficiaryGroupService.listGroups();
  }

  @Patch('/group/update/:id')
  async updateGroup(@Param('id') id: number, @Body() body: any) {
    return this.beneficiaryGroupService.updateGroup(+id, body);
  }

  @Get('/group/:id')
  async getGroupById(@Param('id') id: number) {
    return this.beneficiaryGroupService.getGroupById(+id);
  }

  //sms service for beneficiary

  @Post('/sms')
  async sendSms(@Body() data: SendSms) {
    return this.beneficiarySmsService.sendSms(data);
  }

  @Post('/bulksms')
  async sendBulkSms(@Body() data: SendBulkSms) {
    return this.beneficiarySmsService.sendBulkSms(data);
  }

  @Get('/sms/:benId/history')
  async getSmsHistory(
    @Param('benId') benId: string,
    @Query() query: SmsHistoryQueryDto,
  ) {
    return this.beneficiarySmsService.getSmsHistory(benId, query);
  }
}
