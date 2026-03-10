import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/create-vendor.dto';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  async addVendor(@Body() body: CreateVendorDto) {
    return this.vendorService.addVendor(body);
  }

  @Get(':id')
  async findOne(@Param('id') id:string) {
    return this.vendorService.findOne(id);
  }

  @Get()
  async listVendor() {
    return this.vendorService.listVendor();
  }

  @Patch('/update/;id')
  async updateVendor(@Param('id')id:string, @Body() data:UpdateVendorDto) {
    return this.vendorService.updateVendor(id, data);
  }

  @Delete(':id')
  async deleteVendor(@Param('id')id:string) {
    return this.vendorService.deleteVendor(id);
  }
}
