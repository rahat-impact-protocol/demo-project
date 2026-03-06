import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { DisbursementRequestDto, CreateDisbursementDto } from './dto/disburse.dto';
import { DisbursementStatus } from '@prisma/client';
import{ACTIONS} from '@rahat/token-disbursement-actions';

@Injectable()
export class DisbursementService {
  constructor(private readonly prisma: PrismaService) {}


  async createDisbursement(payload:CreateDisbursementDto){
    try{
        const{benAddress,amount} = payload;
        await this.prisma.beneficiary.updateMany({
          where:{
            walletAddress:{
              in:
              benAddress}

          },
          data:{
            disbursementAmount:amount,
            disbursementStatus:DisbursementStatus.CREATED
          }
        })
    }
    catch(err){
      throw new InternalServerErrorException(`Failed to create disbursement ${err}`)

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


  async forwardToRegistry() {
    let disbursementData
    try {
      const projectId = process.env.PROJECT_ID;
      const core = process.env.CORE_URL
      // Query registry details from database
      const registry = await this.prisma.registry.findUnique({
        where: { id: 'main' },
      });

      if (!registry) {
        throw new BadRequestException('Registry configuration not found');
      }

      const contractSettings = await this.prisma.settings.findUnique({
        where:{
          name:'Contract'
        }
      });

      const tokenAddress = '0x92a437290E6AE7477955624859C6D15CDb324eD4'
      // const tokenAddress = (contractSettings?.value as any)?.address
      disbursementData = await this.prisma.$transaction(async (tx)=>{
        const data = await this.prisma.beneficiary.findMany({
          where: {
          disbursementStatus: DisbursementStatus.CREATED,
          disbursementAmount: {
            gt: 0,
          },
        },
        select: {
          walletAddress: true,
          disbursementAmount: true,
          id:true
        },
        });

        const ids = data.map(t => t.id);

        await tx.beneficiary.updateMany({
          where:{
           id:{in:ids}
          },
          data:{
            disbursementStatus:DisbursementStatus.PENDING
          }
        });

        return data;
      })

      // const disbursementData = await this.prisma.beneficiary.findMany({
        // where: {
        //   disbursementStatus: DisbursementStatus.CREATED,
        //   disbursementAmount: {
        //     gt: 0,
        //   },
        // },
        // select: {
        //   walletAddress: true,
        //   disbursementAmount: true,
        // },
      // });

      const benAddress = disbursementData.map((d) => d.walletAddress);
      const amount = disbursementData.map((d) => d.disbursementAmount || 0);
      const totalAmount = amount.reduce((acc, curr) => acc + curr, 0);
      


      // Validate required fields
      // if (!payload.tokenAddress || !details. || !payload.amount || !payload?.projectId) {
      //   throw new BadRequestException('Missing required fields: projectId, tokenAddress, benAddress, amount, totalAmount');
      // }

      // Format the request data according to the specified format
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
      const response = await axios.post(`${core}/request`, disbursementRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        status: 'success',
        message: 'Disbursement request forwarded to registry',
        data: response.data,
      };
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        throw error;
      }
      //revert back the beneficary data to initial state
      const ids = disbursementData.map(t=>t.id);
      await this.prisma.beneficiary.updateMany({
        where:{id:{in:ids}},
        data:{
          disbursementStatus:DisbursementStatus.CREATED
        }
      })
      throw new InternalServerErrorException(
        `Failed to forward request to registry: ${error.message}`,
      );
    }
  }
}

