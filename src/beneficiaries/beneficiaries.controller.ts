import { Controller, Post, Get, Delete, Body, Param } from "@nestjs/common";
import { BeneficiaryService } from "./beneficiaries.service";
import { CreateBeneficiaryDto } from "./dto/create-beneficiary.dto";

@Controller('beneficiaries')
export class BeneficiaryController {
    constructor(private readonly beneficiaryService: BeneficiaryService) {}

    @Post()
    async addBeneficiary(@Body() body: CreateBeneficiaryDto) {
        return this.beneficiaryService.addBeneficiary(body);
    }

    @Get()
    async listBeneficiaries() {
        return this.beneficiaryService.listBeneficiaries();
    }

    @Delete(':id')
    async deleteBeneficiary(@Param('id') id: string) {
        return this.beneficiaryService.deleteBeneficiary(id);
    }
}