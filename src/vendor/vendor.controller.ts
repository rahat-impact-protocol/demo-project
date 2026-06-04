import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import {
  CreateClaimDto,
  CreateVendorDto,
  ListVendorDto,
  ListVendorTxnDto,
  PaginationDto,
  UpdateVendorDto,
  VendorLoginDto,
  VerifyOtpDto,
} from './dto/create-vendor.dto';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  async registerVendor(@Body() body: CreateVendorDto) {
    return this.vendorService.registerVendor(body);
  }

  @Post('/approve/:vendorId')
  async approveVendor(@Param('vendorId') vendorId: string) {
    return this.vendorService.approveVendor(vendorId);
  }

  @Post('/login')
  async loginVendor(@Body() body: VendorLoginDto) {
    return this.vendorService.loginVendor(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vendorService.findOne(id);
  }

  @Get('email/:email')
  async findOneByEmail(@Param('email') email: string) {
    return this.vendorService.findOneByEmail(email);
  }

  @Get()
  async listVendor(@Query() query: ListVendorDto) {
    return this.vendorService.listVendor(query);
  }

  @Get('/benServed/:vendorId')
  async getBeneficiaryServed(
    @Param('vendorId') vendorId: string,
    @Query() query: PaginationDto,
  ) {
    return this.vendorService.getBeneficiaryServed(vendorId, query);
  }

  @Patch('/update/:id')
  async updateVendor(@Param('id') id: string, @Body() data: UpdateVendorDto) {
    return this.vendorService.updateVendor(id, data);
  }

  @Delete(':id')
  async deleteVendor(@Param('id') id: string) {
    return this.vendorService.deleteVendor(id);
  }

  @Post('/claimcreate/:vendorId')
  async claimCreate(
    @Param('vendorId') vendorId: string,
    @Body() data: CreateClaimDto,
  ) {
    return this.vendorService.claimCreate(vendorId, data);
  }

  @Post('/verifyotp/:vendorId')
  async verfiyOtp(
    @Param('vendorId') vendorId: string,
    @Body() data: VerifyOtpDto,
  ) {
    return this.vendorService.verifyOtp(vendorId, data);
  }

  @Post('/redemptionsRequest/:vendorId')
  async redemptionsRequest(
    @Param('vendorId') vendorId: string,
    @Body() data: any,
  ) {
    return this.vendorService.redemptionRequest(data, vendorId);
  }

  @Post('/redemptionApproval/:redemptionId')
  async redemptionApproval(
    @Param('redemptionId') redemptionId: string,
    @Body() dto: any,
  ) {
    return this.vendorService.redemptionApproval(redemptionId);
  }

  @Get('/transaction/:vendorAddress')
  async getVendorTransaction(
    @Param('vendorAddress') vendorAddress: string,
    @Query() query: ListVendorTxnDto,
  ) {
    return this.vendorService.getVendorTransaction(vendorAddress, query);
  }
}
