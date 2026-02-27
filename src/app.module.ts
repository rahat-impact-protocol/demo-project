import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';

@Module({
  imports: [BeneficiariesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
