import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getBeneficiariesReport() {
    const [
      totalBen,
      totalBenDisbursed,
      totalBenAssignedToken,
      genderStats,
      benDisbursement,
    ] = await Promise.all([
      this.prisma.beneficiary.count(),
      this.prisma.beneficiary.count({
        where: {
          disbursementStatus: 'DISBURSED',
        },
      }),
      this.prisma.beneficiary.count({
        where: {
          OR: [
            {
              disbursementAmount: {
                not: null,
              },
            },
            {
              disbursementStatus: 'DISBURSED',
            },
          ],
        },
      }),
      this.prisma.beneficiary.groupBy({
        by: [Prisma.BeneficiaryScalarFieldEnum.gender],
        _count: {
          id: true,
        },
      }),
      this.prisma.beneficiary.groupBy({
        by: ['disbursementStatus'],
        _count: {
          id: true,
        },
      }),
    ]);

    const gender: Record<string, number> = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
      NOTAVAILABLE: 0,
    };

    for (const stat of genderStats) {
      gender[stat.gender] = Number(stat._count.id ?? 0);
    }
    const benDis: any = {};

    for (const bendis of benDisbursement) {
      benDis[bendis.disbursementStatus] = Number(bendis._count.id ?? 0) as any;
    }

    return {
      gender,
      totalBen,
      totalBenAssignedToken,
      totalBenDisbursed,
      benDis,
    };
  }
  async getVendorReport() {
    const [totalVendor] = await Promise.all([this.prisma.vendor.count()]);
    return {
      totalVendor,
    };
  }
}
