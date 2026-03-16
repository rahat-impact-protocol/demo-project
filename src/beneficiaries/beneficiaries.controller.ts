import { Controller, Post, Get, Delete, Body, Param } from "@nestjs/common";
import { BeneficiaryService } from "./beneficiaries.service";
import { CreateBeneficiaryDto, CreateBeneficiaryGroupDto } from "./dto/create-beneficiary.dto";
import { BeneficiaryGroupService } from "./beneficiaries.group.service";

@Controller('beneficiaries')
export class BeneficiaryController {
    constructor(
        private readonly beneficiaryService: BeneficiaryService,
        private readonly beneficiaryGroupService:BeneficiaryGroupService
    )
    
    {}

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

    @Post('/group')
    async createBeneficiaryGroup(@Body() body:CreateBeneficiaryGroupDto){
        return this.beneficiaryGroupService.createGroup(body)
    }

    @Get('/group')
    async listGroups(){
        return this.beneficiaryGroupService.listGroups();
    }

    @Get('/group/:id')
    async getGroupById(@Param('id')id:number)
    {
         return this.beneficiaryGroupService.getGroupById(+id)
    }
}