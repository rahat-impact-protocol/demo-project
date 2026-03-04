import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DisbursementModule } from './disbursement/disbursement.module';

@Module({
  imports: [BeneficiariesModule, DisbursementModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
