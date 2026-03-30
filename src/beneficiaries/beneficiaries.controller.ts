import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { BeneficiaryService } from './beneficiaries.service';
import {
  CreateBeneficiaryDto,
  CreateBeneficiaryGroupDto,
} from './dto/create-beneficiary.dto';
import { BeneficiaryGroupService } from './beneficiaries.group.service';
import { CsvFileValidator } from './filevalidator';

@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(
    private readonly beneficiaryService: BeneficiaryService,
    private readonly beneficiaryGroupService: BeneficiaryGroupService,
  ) {}

  @Post()
  async addBeneficiary(@Body() body: CreateBeneficiaryDto) {
    return this.beneficiaryService.addBeneficiary(body);
  }

  // @Get()
  // async listBeneficiaries() {
  //   return this.beneficiaryService.listBeneficiaries();
  // }

  //added by sushil sushil
  @Get()
  async listBeneficiaries(@Query() query: { page?: string; perPage?: string }) {
    return this.beneficiaryService.listBeneficiaries({
      page: Number(query.page) || 1,
      perPage: Number(query.perPage) || 10,
    });
  }
  // end

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
    //start add to test for add group beneficiart SUSHIL
    const summary = await this.beneficiaryService.uploadFromCsv(file.buffer);
    const result = await this.beneficiaryService.listBeneficiaries({
      page: 1,
      perPage: summary.total + summary.skipped, // fetch everything that was in the CSV
    });
    return {
      data: result.data,
      meta: result.meta,
      importSummary: summary, // optional — handy for debugging
    };
    //end
  }

  @Get('/group')
  async listGroups() {
    return this.beneficiaryGroupService.listGroups();
  }

  @Get('/group/:id')
  async getGroupById(@Param('id') id: number) {
    return this.beneficiaryGroupService.getGroupById(+id);
  }
}
