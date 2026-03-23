import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PROCESSOR, PROCESSOR_JOB } from 'src/common/constants/processor';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ResponseService {
  constructor(
    @InjectQueue(PROCESSOR.RESPONSE) private readonly jobQueue: Queue,
  ) {}
  async receiveResponse(data: any) {
    console.log(data);
    this.jobQueue.add(PROCESSOR_JOB.DISBURSEMENT, data);
    return { status: 'queued' };
  }
}
