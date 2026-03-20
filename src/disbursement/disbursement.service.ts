import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import {
  DisbursementRequestDto,
  CreateDisbursementDto,
  CreateGroupDisbursementDto,
} from './dto/disburse.dto';
import { DisbursementStatus } from '@prisma/client';
import { ACTIONS } from '@rahat/token-disbursement-actions';

@Injectable()
export class DisbursementService {
  constructor(private readonly prisma: PrismaService) {}

  async createDisbursement(payload: CreateDisbursementDto) {
    try {
      const { benAddress, amount } = payload;
      await this.prisma.beneficiary.updateMany({
        where: {
          walletAddress: {
            in: benAddress,
          },
        },
        data: {
          disbursementAmount: amount,
          disbursementStatus: DisbursementStatus.CREATED,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create disbursement ${err}`,
      );
    }
  }

  async getDisbursementData(status: DisbursementStatus, minAmount: number = 0) {
    try {
      const beneficiaries = await this.prisma.beneficiary.findMany({
        where: {
          disbursementStatus: status,
          disbursementAmount: {
            gt: minAmount,
          },
        },
      });

      if (!beneficiaries || beneficiaries.length === 0) {
        throw new BadRequestException(
          `No beneficiaries found with status ${status} and amount greater than ${minAmount}`,
        );
      }

      return beneficiaries;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch disbursement data: ${error.message}`,
      );
    }
  }

  async createGroupDisbursement(payload: CreateGroupDisbursementDto) {
    try {
      const { groupId, amount } = payload;
      await this.prisma.beneficiary.updateMany({
        where: {
          group: {
            groupId: groupId,
          },
        },
        data: {
          disbursementAmount: amount,
          disbursementStatus: DisbursementStatus.CREATED,
        },
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create disbursement ${err}`,
      );
    }
  }

  async alldisburse() {
    let disbursementData;
    try {
      // const projectId = process.env.PROJECT_ID;
      // const core = process.env.CORE_URL;
      // // Query registry details from database
      // const registry = await this.prisma.registry.findUnique({
      //   where: { id: 'main' },
      // });

      // if (!registry) {
      //   throw new BadRequestException('Registry configuration not found');
      // }

      // const contractSettings = await this.prisma.settings.findUnique({
      //   where: {
      //     name: 'Contract',
      //   },
      // });

      // const tokenAddress = '0x92a437290E6AE7477955624859C6D15CDb324eD4';
      disbursementData = await this.prisma.$transaction(async (tx) => {
        const data = await tx.beneficiary.findMany({
          where: {
            disbursementStatus: DisbursementStatus.CREATED,
            disbursementAmount: {
              gt: 0,
            },
          },
          select: {
            walletAddress: true,
            disbursementAmount: true,
            id: true,
          },
        });

        const ids = data.map((t) => t.id);

        await tx.beneficiary.updateMany({
          where: {
            id: { in: ids },
          },
          data: {
            disbursementStatus: DisbursementStatus.PENDING,
          },
        });

        return data;
      });

      console.log(disbursementData)
      if(disbursementData?.length ===0 ){
        throw new BadRequestException('No data found for disbursement');
      }

      const benAddress = disbursementData.map((d) => d.walletAddress);
      const amount = disbursementData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);
      this.forwardToRegistry(benAddress, amount, totalAmount);

      // Validate required fields
      // if (!payload.tokenAddress || !details. || !payload.amount || !payload?.projectId) {
      //   throw new BadRequestException('Missing required fields: projectId, tokenAddress, benAddress, amount, totalAmount');
      // }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        throw error;
      }
      //revert back the beneficary data to initial state
      const ids = disbursementData.map((t) => t.id);
      await this.prisma.beneficiary.updateMany({
        where: { id: { in: ids } },
        data: {
          disbursementStatus: DisbursementStatus.CREATED,
        },
      });
      throw new InternalServerErrorException(
        `Failed to forward request to registry: ${error.message}`,
      );
    }
  }

  async disburseToBen(benId: string) {
    const data = await this.prisma.beneficiary.update({
      where: {
        uuid: benId,
      },
      data: {
        disbursementStatus: DisbursementStatus.PENDING,
      },
      select: {
        walletAddress: true,
        disbursementAmount: true,
        id: true,
      },
    });

    const benAddress = [data?.walletAddress];
    const amount = [Number(data?.disbursementAmount)];
    const totalAmount = Number(amount);

    this.forwardToRegistry(benAddress, amount, totalAmount);
  }

  async disburseToGroup(groupId: number) {
    let benData;
    try {
      benData = await this.prisma.$transaction(async (tx) => {
        const data = await tx.beneficiaryGroupMember.findMany({
          where: {
            groupId: groupId,
          },
          include: {
            beneficiary: {
              select: {
                id: true,
                walletAddress: true,
                disbursementAmount: true,
              },
            },
          },
        });
        const ids = data.map((t) => t.id);

        await tx.beneficiary.updateMany({
          where: {
            id: { in: ids },
          },
          data: {
            disbursementStatus: DisbursementStatus.PENDING,
          },
        });
        return data;
      });

      const benAddress = benData.map((d) => d.walletAddress);
      const amount = benData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);

      this.forwardToRegistry(benAddress, amount, totalAmount);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        throw err;
      }
      //revert back the beneficary data to initial state
      const ids = benData.map((t) => t.id);
      await this.prisma.beneficiary.updateMany({
        where: { id: { in: ids } },
        data: {
          disbursementStatus: DisbursementStatus.CREATED,
        },
      });
    }
  }

  async disburseToMultiBen(benIds: string[]) {
    let benData;
    try {
      benData = await this.prisma.$transaction(async (tx) => {
        const data = await tx.beneficiary.findMany({
          where: {
            uuid: {
              in: benIds,
            },
          },
          select: {
            id: true,
            walletAddress: true,
            disbursementAmount: true,
          },
        });
      });
      const benAddress = benData.map((d) => d.walletAddress);
      const amount = benData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);
      this.forwardToRegistry(benAddress, amount, totalAmount);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        throw err;
      }
      //revert back the beneficary data to initial state
      const ids = benData.map((t) => t.id);
      await this.prisma.beneficiary.updateMany({
        where: { id: { in: ids } },
        data: {
          disbursementStatus: DisbursementStatus.CREATED,
        },
      });
    }
  }

  async forwardToRegistry(
    benAddress: string[],
    amount: number[],
    totalAmount: number,
  ) {
    try {
      const projectId = process.env.PROJECT_ID;
      const core = process.env.CORE_URL;
      const registry = await this.prisma.registry.findUnique({
        where: { id: 'main' },
      });

      if (!registry) {
        throw new BadRequestException('Registry configuration not found');
      }

      const contractSettings = await this.prisma.settings.findUnique({
        where: {
          name: 'Contract',
        },
      });
      const tokenAddress = '0x92a437290E6AE7477955624859C6D15CDb324eD4';

      const disbursementRequest: DisbursementRequestDto = {
        projectId: projectId || '',
        requestData: {
          data: {
            tokenAddress: tokenAddress,
            benAddress: benAddress,
            amount: amount,
            totalAmount: totalAmount,
          },
        },
        serviceTags: [ACTIONS.DISBURSEMENT.name],
      };

       // Post request to registry baseUrl

      const response = await axios.post(
        `${core}/request`,
        disbursementRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        status: 'success',
        message: 'Disbursement request forwarded to registry',
        data: response.data,
      };
    } catch (err) {
      throw err;
    }
  }
}
