import {Wallet} from 'ethers';
import { PrismaService } from 'src/prisma/prisma.service';
import { encryptForService } from '../utils/crypto.util';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  constructor(private  prisma: PrismaService) {
  }

  async createWallet(): Promise<string> {
    try {
      const wallet = await Wallet.createRandom();
      await this.saveWallet(wallet);
      return wallet.address;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

  async saveWallet(data: any) :Promise<any>{
    const publickey = process.env.PUBLIC_KEY ||''
    const encryptedValue = encryptForService(publickey, data);
    const result = await this.prisma.beneficiaryWallet.create({
      data: {
        walletAddress: data?.address,
        keyDetails: encryptedValue,
      },
    });
   return result;
  }
}
