import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { WalletService } from 'src/beneficiaries/wallet';

@Injectable()
export class BeneficiaryService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {  }

  async addBeneficiary(createBeneficiaryDto: CreateBeneficiaryDto) {
    const { walletAddress } = createBeneficiaryDto;

    if (!walletAddress)
      createBeneficiaryDto.walletAddress = await this.wallet.createWallet();
    try {
      const benDetails = await this.prisma.$transaction([
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

      return benDetails;
    } catch (err) {
      throw new Error(err);
    }
  }

  async listBeneficiaries(): Promise<any> {
    return this.prisma.beneficiary.findMany();
  }

  async deleteBeneficiary(id: string) {
    return this.prisma.beneficiary.delete({ where: { uuid: id } });
  }
}
