import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PROCESSOR } from 'src/common/constants/processor';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResponseProcessor } from './response.processor';

@Module({
    imports:[
        BullModule.registerQueue({
            name:PROCESSOR.RESPONSE
        }),
        PrismaModule
    ],
    providers:[ResponseProcessor]
})
export class ProcessorModule {}
