import { Module } from '@nestjs/common';
import { ResponseController } from './response.controller';
import { ResponseService } from './response.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProcessorModule } from 'src/processor/processor.module';
import { BullModule } from '@nestjs/bullmq';
import { PROCESSOR } from 'src/common/constants/processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: PROCESSOR.RESPONSE }),
    PrismaModule,
    ProcessorModule,
  ],
  controllers: [ResponseController],
  providers: [ResponseService],
})
export class ResponseModule {}
