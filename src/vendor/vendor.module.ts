import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from 'src/prisma/prisma.module'
import { WalletService } from 'src/beneficiaries/wallet';

@Module({
    imports:[PrismaModule],
    controllers:[VendorController],
    providers:[VendorService,WalletService]
})
export class VendorModule {}
