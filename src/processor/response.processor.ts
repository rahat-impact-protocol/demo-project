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
    console.log(job)
    switch (job.name) {
      case PROCESSOR_JOB.DISBURSEMENT: {
        const data = job.data as any;
        return this.processDisbursement(data);
      }
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async processDisbursement(data: any) {
    try {
      const { status, responsePayload, actionPerformed } = data;
      if (status === 'sucess') {
        await this.prisma.beneficiary.updateMany({
          where: {
            id: {
              in: [1, 2],
            },
          },
          data: {
            disbursementStatus: DisbursementStatus.DISBURSED,
          },
        });
      }
      else {
        await this.prisma.beneficiary.updateMany({
            where:{
                id:{
                    in:[1,3]
                }
            },
            data:{
                disbursementStatus:DisbursementStatus.FAILED
            }
        })
      }
    } catch (error) {
      console.error({
        message: `Response failed: ${data.url}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
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
      message: `Completed Response job ${job.id}: ${result?.success ? 'SUCCESS' : 'FAILED'}`,
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
