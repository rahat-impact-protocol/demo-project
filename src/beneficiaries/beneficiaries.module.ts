import { Module } from '@nestjs/common';
import { BeneficiaryController } from './beneficiaries.controller';
import { BeneficiaryService } from './beneficiaries.service';
import { PrismaModule } from 'src/prisma/prisma.module'

@Module({
    imports:[PrismaModule],
    controllers:[BeneficiaryController],
    providers:[BeneficiaryService]
})
export class BeneficiariesModule {}
