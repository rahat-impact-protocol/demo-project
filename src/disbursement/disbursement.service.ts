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
import { DisbursementStatus, DisbursementType } from '@prisma/client';
import { ACTIONS } from '@rahat/token-disbursement-actions';

@Injectable()
export class DisbursementService {
  constructor(private readonly prisma: PrismaService) {}

  private async createDisbursementRecord(
    prisma: any,
    beneficiaryIds: number[],
    amountPerBen: number,
    totalben?:number,
    totalamount?:number,
    name?:string,
    type?:DisbursementType

  ) {
    const totalBen = totalben || beneficiaryIds.length;
    const totalAmount = totalamount || amountPerBen * totalBen;

    return prisma.disbursement.create({
      data: {
        name,
        type,
        amountPerBen,
        totalAmount,
        totalBen,
        benDisbursement: {
          create: beneficiaryIds.map((id) => ({
            benId: id,
          })),
        },
      },
      include: {
        benDisbursement: true,
      },
    });
  }

  async createDisbursement(payload: CreateDisbursementDto) {
    try {
      const { benAddress, amount,totalAmount,totalBen,name,type } = payload;

      const disbursement = await this.prisma.$transaction(async (tx) => {
        const beneficiaries = await tx.beneficiary.findMany({
          where: {
            walletAddress: {
              in: benAddress,
            },
          },
          select: {
            id: true,
          },
        });

        if (!beneficiaries.length) {
          throw new BadRequestException(
            'No beneficiaries found for provided addresses',
          );
        }

        const beneficiaryIds = beneficiaries.map(
          (beneficiary) => beneficiary.id,
        );

        const createdDisbursement = await this.createDisbursementRecord(
          tx,
          beneficiaryIds,
          amount,
          totalBen,
          totalAmount,
          name,
          type
        );

        await tx.beneficiary.updateMany({
          where: {
            id: {
              in: beneficiaryIds,
            },
          },
          data: {
            disbursementAmount: amount,
            disbursementStatus: DisbursementStatus.CREATED,
          },
        });

        return createdDisbursement;
      });

      return {
        status: 'success',
        message: 'Disbursement prepared',
        data: disbursement,
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        `Failed to create disbursement ${err}`,
      );
    }
  }


  async createGroupDisbursement(payload: CreateGroupDisbursementDto) {
    try {
      const { groupId, amount,totalBen,totalAmount,name,type } = payload;

      const disbursement = await this.prisma.$transaction(async (tx) => {
        const members = await tx.beneficiaryGroupMember.findMany({
          where: {
            groupId: groupId,
          },
          select: {
            beneficiaryId: true,
          },
        });

        if (!members.length) {
          throw new BadRequestException(
            'No beneficiaries found in the provided group',
          );
        }

        const beneficiaryIds = members.map((member) => member.beneficiaryId);

        const createdDisbursement = await this.createDisbursementRecord(
          tx,
          beneficiaryIds,
          amount,
          totalBen,
          totalAmount,
          name,
          type
        );

        await tx.beneficiary.updateMany({
          where: {
            id: {
              in: beneficiaryIds,
            },
          },
          data: {
            disbursementAmount: amount,
            disbursementStatus: DisbursementStatus.CREATED,
          },
        });

        return createdDisbursement;
      });

      return {
        status: 'success',
        message: 'Group disbursement prepared',
        data: disbursement,
      };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }

      throw new InternalServerErrorException(
        `Failed to create disbursement ${err}`,
      );
    }
  }

  async listDisbursement(){
    try{
      return this.prisma.disbursement.findMany({
        select:{
          name:true,
          type:true,
          uuid:true,
          amountPerBen:true,
          totalAmount:true,
          totalBen:true,
          createdAt:true,
          updatedAt:true
        }
      })
    }
    catch(err){
      throw new Error(`Failed to list the disbursement,${err.message}`)
    }
  }

  async getDisbursementDetails(uuid:string){
    try{
      const data = await this.prisma.disbursement.findUnique({where:{
        uuid
      },
      select:{
        uuid:true,
        amountPerBen:true,
        totalAmount:true,
        totalBen:true,
        createdAt:true,
        updatedAt:true,
        benDisbursement:{
          select:{
            beneficiary:{
              select:{
                walletAddress:true,
                disbursementStatus:true
                
              }
            }
          },
          
        }
      }
    })
   
    return data;
    }
    catch(err){
      console.log(err);
      throw new InternalServerErrorException(`failed to load the disbursement for ${uuid}: ${err.message}`)
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
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to fetch disbursement data: ${error.message}`,
      );
    }
  }
  async executeDisbursement(disbursementUuid: string) {
    let beneficiaryIds: number[] = [];

    try {
      const disbursementData = await this.prisma.$transaction(async (tx) => {
        const data = await tx.disbursement.findUnique({
          where: {
            uuid: disbursementUuid,
          },
          include: {
            benDisbursement: {
              include: {
                beneficiary: {
                  select: {
                    id: true,
                    walletAddress: true,
                  },
                },
              },
            },
          },
        });

        if (!data) {
          throw new BadRequestException('Disbursement not found');
        }

        const beneficiaries = data.benDisbursement.map(
          (item) => item.beneficiary,
        );
        const ids = beneficiaries.map((beneficiary) => beneficiary.id);

        if (!ids.length) {
          throw new BadRequestException(
            'No beneficiaries linked to disbursement',
          );
        }

        await tx.beneficiary.updateMany({
          where: {
            id: {
              in: ids,
            },
          },
          data: {
            disbursementStatus: DisbursementStatus.PENDING,
            disbursementAmount: data.amountPerBen,
          },
        });

        return {
          uuid: data.uuid,
          amountPerBen: data.amountPerBen,
          totalAmount: data.totalAmount,
          beneficiaries,
        };
      });

      beneficiaryIds = disbursementData.beneficiaries.map(
        (beneficiary) => beneficiary.id,
      );

      const benAddress = disbursementData.beneficiaries.map(
        (beneficiary) => beneficiary.walletAddress,
      );
      const amount = disbursementData.beneficiaries.map(
        () => disbursementData.amountPerBen,
      );

      const response = await this.forwardToRegistry(
        benAddress,
        amount,
        disbursementData.totalAmount,
      );

      return {
        status: 'success',
        message: 'Disbursement execution initiated',
        disbursementUuid: disbursementData.uuid,
        data: response,
      };
    } catch (err) {
      if (
        beneficiaryIds.length &&
        !(err.response?.status === 400 || err.response?.status === 404)
      ) {
        await this.prisma.beneficiary.updateMany({
          where: {
            id: {
              in: beneficiaryIds,
            },
          },
          data: {
            disbursementStatus: DisbursementStatus.CREATED,
          },
        });
      }

      if (err instanceof BadRequestException) {
        throw err;
      }

      if (err.response?.status === 400 || err.response?.status === 404) {
        throw err;
      }

      throw new InternalServerErrorException(
        `Failed to execute disbursement: ${err.message}`,
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

      console.log(disbursementData);
      if (disbursementData?.length === 0) {
        throw new BadRequestException('No data found for disbursement');
      }

      const benAddress = disbursementData.map((d) => d.walletAddress);
      const amount = disbursementData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);
      await this.forwardToRegistry(benAddress, amount, totalAmount);

      // Validate required fields
      // if (!payload.tokenAddress || !details. || !payload.amount || !payload?.projectId) {
      //   throw new BadRequestException('Missing required fields: projectId, tokenAddress, benAddress, amount, totalAmount');
      // }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        throw error;
      }
      //revert back the beneficary data to initial state
      if (disbursementData?.length) {
        const ids = disbursementData.map((t) => t.id);
        await this.prisma.beneficiary.updateMany({
          where: { id: { in: ids } },
          data: {
            disbursementStatus: DisbursementStatus.CREATED,
          },
        });
      }
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

    await this.forwardToRegistry(benAddress, amount, totalAmount);
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
        const beneficiaries = data.map((member) => member.beneficiary);
        const ids = beneficiaries.map((beneficiary) => beneficiary.id);

        await tx.beneficiary.updateMany({
          where: {
            id: { in: ids },
          },
          data: {
            disbursementStatus: DisbursementStatus.PENDING,
          },
        });
        return beneficiaries;
      });

      if (!benData.length) {
        throw new BadRequestException(
          'No beneficiaries found for disbursement',
        );
      }

      const benAddress = benData.map((d) => d.walletAddress);
      const amount = benData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);

      await this.forwardToRegistry(benAddress, amount, totalAmount);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        throw err;
      }
      //revert back the beneficary data to initial state
      if (benData?.length) {
        const ids = benData.map((t) => t.id);
        await this.prisma.beneficiary.updateMany({
          where: { id: { in: ids } },
          data: {
            disbursementStatus: DisbursementStatus.CREATED,
          },
        });
      }

      throw new InternalServerErrorException(
        `Failed to disburse to group: ${err.message}`,
      );
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

        const ids = data.map((beneficiary) => beneficiary.id);

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

      if (!benData.length) {
        throw new BadRequestException(
          'No beneficiaries found for disbursement',
        );
      }

      const benAddress = benData.map((d) => d.walletAddress);
      const amount = benData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);
      await this.forwardToRegistry(benAddress, amount, totalAmount);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 404) {
        throw err;
      }
      //revert back the beneficary data to initial state
      if (benData?.length) {
        const ids = benData.map((t) => t.id);
        await this.prisma.beneficiary.updateMany({
          where: { id: { in: ids } },
          data: {
            disbursementStatus: DisbursementStatus.CREATED,
          },
        });
      }

      throw new InternalServerErrorException(
        `Failed to disburse to selected beneficiaries: ${err.message}`,
      );
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

      const settings: any = contractSettings?.value;
      const fundStorageContract = settings?.fundStorageContract?.address;
      console.log(fundStorageContract);
      const tokenAddress =
        settings?.token?.address ||
        '0x92a437290E6AE7477955624859C6D15CDb324eD4';

      const disbursementRequest: DisbursementRequestDto = {
        projectId: projectId || '',
        requestData: {
          data: {
            tokenAddress: tokenAddress,
            benAddress: benAddress,
            amount: amount,
            totalAmount: totalAmount,
            projectAddress: fundStorageContract,
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
