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
    this.jobQueue.add(data?.actionPerformed, data);
    return { status: 'queued' };
  }
}
