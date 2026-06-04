import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PROCESSOR, PROCESSOR_JOB } from '../common/constants/processor';
import { PrismaService } from 'src/prisma/prisma.service';
import { DisbursementStatus } from '@prisma/client';

@Injectable()
@Processor(PROCESSOR.RESPONSE)
export class ResponseProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case PROCESSOR_JOB.DISBURSEMENT: {
        const data = job.data as any;
        return this.processDisbursement(data);
      }
      case PROCESSOR_JOB.CLAIMCREATE: {
        const data = job.data as any;
        return this.processClaim(data);
      }
      case PROCESSOR_JOB.SENDSMS: {
        const data = job.data as any;
        return this.processSMS(data);
      }
      case PROCESSOR_JOB.VERIFYOTP: {
        const data = job.data as any;
        return this.processVerifyOtp(data);
      }

      case PROCESSOR_JOB.REDEMPTIONREQUEST: {
        const data = job.data as any;
        return this.processRedemptionRequest(data);
      }

      case PROCESSOR_JOB.REDEMPTIONAPPROVAL: {
        const data = job.data as any;
        return this.processRedemptionApproval(data);
      }
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async processDisbursement(data: any) {
    try {
      const { status, responsePayload, actionPerformed } = data;
      const walletDetails = (responsePayload?.updateData ?? [])
        .flat()
        .filter(Boolean);

      if (!walletDetails.length) {
        console.warn({
          message:
            'No wallet addresses found in response payload to update beneficiaries',
          actionPerformed,
          status,
        });
        return;
      }

      if (status === 'success') {
        await this.prisma.beneficiary.updateMany({
          where: {
            walletAddress: {
              in: walletDetails,
            },
          },
          data: {
            disbursementStatus: DisbursementStatus.DISBURSED,
          },
        });
      } else {
        await this.prisma.beneficiary.updateMany({
          where: {
            walletAddress: {
              in: walletDetails,
            },
          },
          data: {
            disbursementStatus: DisbursementStatus.FAILED,
          },
        });
      }
    } catch (error) {
      console.error({
        message: `Response failed: ${data.url}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async processSMS(data: any) {
    console.log(data);
  }

  private async processClaim(data: any) {
    const { status, responsePayload } = data;
    let claimStatus = false;
    const vendorAddress = responsePayload?.updateData?.vendorAddress ?? [];
    const beneficiaryAddress = responsePayload?.updateData?.benAddress ?? [];
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        walletAddress: vendorAddress,
      },
    });

    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        walletAddress: beneficiaryAddress,
      },
    });

    if (status === 'suceess') {
      claimStatus = true;
    }
    return this.prisma.vendorBen.update({
      where: {
        vendorId: vendor?.id,
        beneficiaryId: beneficiary?.id,
      },
      data: {
        claimCreated: claimStatus,
      },
    });
  }

  private async processVerifyOtp(data: any) {
    const { status, responsePayload } = data;
    let otpStatus = false;
    const vendorAddress = responsePayload?.updateData?.vendorAddress ?? [];
    const beneficiaryAddress = responsePayload?.updateData?.benAddress ?? [];
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        walletAddress: vendorAddress,
      },
    });

    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        walletAddress: beneficiaryAddress,
      },
    });

    if (status === 'suceess') {
      otpStatus = true;
    }
    return this.prisma.vendorBen.update({
      where: {
        vendorId: vendor?.id,
        beneficiaryId: beneficiary?.id,
      },
      data: {
        claimCreated: otpStatus,
      },
    });
  }

  private async processRedemptionRequest(data: any) {
    console.log(data);
  }

  private async processRedemptionApproval(data: any) {
    console.log(data);
  }

  @OnWorkerEvent('active')
  async onActive(job: Job<any>) {
    console.log({
      message: `Processing Response job ${job.id} (type: ${job.name})`,
    });
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<any>, result: any) {
    console.log({
      message: `Completed Response job ${job.id}: ${result}`,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<any>, error: Error) {
    console.error({
      message: `Response job ${job.id} failed: ${error.message}`,
      error,
    });
  }
}
