import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { WalletService } from 'src/beneficiaries/wallet';
import { PaginatedResult, PaginateOptions } from '@rumsan/sdk/types';

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

  async listBeneficiaries(options: PaginateOptions = {}): Promise<PaginatedResult<any>> {
    const page = Number(options.page) || 1;
    const perPage = Number(options.perPage) || 10;
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.beneficiary.findMany({ skip, take: perPage }),
      this.prisma.beneficiary.count(),
    ]);
    const lastPage = Math.ceil(total / perPage);
    return {
      data,
      meta: {
        total,
        lastPage,
        currentPage: page,
        perPage,
        prev: page > 1 ? page - 1 : null,
        next: page < lastPage ? page + 1 : null,
      },
    };
  }

  async deleteBeneficiary(id: string) {
    return this.prisma.beneficiary.delete({ where: { uuid: id } });
  }
}
