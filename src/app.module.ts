import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DisbursementModule } from './disbursement/disbursement.module';
import { VendorModule } from './vendor/vendor.module';

@Module({
  imports: [BeneficiariesModule, DisbursementModule, VendorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
