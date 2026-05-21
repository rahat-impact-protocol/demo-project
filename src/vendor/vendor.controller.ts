import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import {
  CreateClaimDto,
  CreateVendorDto,
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
  async listVendor() {
    return this.vendorService.listVendor();
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

  @Post('/verfiyotp')
  async verfiyOtp(@Body() data: VerifyOtpDto) {
    return this.vendorService.verifyOtp(data);
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
}
