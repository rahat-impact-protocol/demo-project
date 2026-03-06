import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DisbursementStatus } from '@prisma/client';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';

@Injectable()
export class BeneficiaryService {
  constructor(private prisma: PrismaService) {}

  async addBeneficiary(createBeneficiaryDto: CreateBeneficiaryDto) {
   try{const benDetails= await this.prisma.$transaction([
      this.prisma.beneficiary.create({
        data: {
          walletAddress: createBeneficiaryDto.walletAddress,
          pii: {
            create: {
              name: createBeneficiaryDto?.name,
              phone: createBeneficiaryDto?.phone,
              email: createBeneficiaryDto?.email,
            },
          },
        },
      }),
    ]);

	return benDetails
    }
	catch(err){
		throw new Error(err);
	}
  }

  async listBeneficiaries(): Promise<any> {
    return this.prisma.beneficiary.findMany();
  }

  async deleteBeneficiary(id: string) {
    return this.prisma.beneficiary.delete({ where: { uuid:id } });
  }
}
