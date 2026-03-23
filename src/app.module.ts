import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DisbursementModule } from './disbursement/disbursement.module';
import { VendorModule } from './vendor/vendor.module';
import { ResponseModule } from './response/response.module';
import { BullModule } from '@nestjs/bullmq';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD || '',
      },
    }),

    BeneficiariesModule,
    DisbursementModule,
    VendorModule,
    ResponseModule,
    ProcessorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
