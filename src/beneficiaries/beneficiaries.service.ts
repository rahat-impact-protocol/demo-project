import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { DisbursementStatus } from '@prisma/client';
import { CreateBeneficiaryDto } from "./dto/create-beneficiary.dto";

@Injectable()
export class BeneficiaryService {
    constructor(	private prisma :PrismaService
){}

	async addBeneficiary(createBeneficiaryDto:CreateBeneficiaryDto) {
		return this.prisma.beneficiary.create({
			data:createBeneficiaryDto
			,
		});
	}

	async listBeneficiaries(): Promise<any> {
		return this.prisma.beneficiary.findMany();
	}

	async deleteBeneficiary(id: string) {
		return this.prisma.beneficiary.delete({ where: { id } });
	}
}