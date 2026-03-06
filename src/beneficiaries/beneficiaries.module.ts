import { Module } from '@nestjs/common';
import { BeneficiaryController } from './beneficiaries.controller';
import { BeneficiaryService } from './beneficiaries.service';
import { PrismaModule } from 'src/prisma/prisma.module'
import { WalletService } from 'src/beneficiaries/wallet';

@Module({
    imports:[PrismaModule],
    controllers:[BeneficiaryController],
    providers:[BeneficiaryService,WalletService]
})
export class BeneficiariesModule {}
