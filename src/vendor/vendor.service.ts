
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../beneficiaries/wallet';
import { PaginatedResult, PaginateOptions } from '@rumsan/sdk/types/pagination.types';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { PaginateFunction,Pagination } from '@rumsan/sdk/types';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService, private walletService: WalletService) {}

  async addVendor(body: CreateVendorDto) {
    // Generate wallet if not provided
    let walletAddress = body.walletAddress;
    if (!walletAddress) {
      walletAddress = await this.walletService.createWallet();
    }
    // Store wallet in BeneficiaryWallet (already handled by WalletService)
    const vendor = await this.prisma.vendor.create({
      data: {
        name: body.name,
        phoneNumber: body.phoneNumber,
        email: body.email,
        walletAddress,
      },
    });
    return vendor;
  }

  async findOne(uuid: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { uuid },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async listVendor(options: PaginateOptions = {}): Promise<PaginatedResult<any>> {
    const page = Number(options.page) || 1;
    const perPage = Number(options.perPage) || 10;
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({ skip, take: perPage }),
      this.prisma.vendor.count(),
    ]);
    const lastPage = Math.ceil(total / perPage);
    return {
      data,
      meta: {
        total,
        lastPage,
        currentPage: page,
        perPage,
        prev: page > 1 ? page - 1 : null,
        next: page < lastPage ? page + 1 : null,
      },
    };
  }

  async updateVendor(uuid: string, update: any) {
    const vendor = await this.prisma.vendor.findUnique({ where: { uuid } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    // Optionally update wallet
    let walletAddress = update.walletAddress || vendor.walletAddress;
    if (!walletAddress) {
      walletAddress = await this.walletService.createWallet();
    }
    return this.prisma.vendor.update({
      where: { uuid },
      data: {
        name: update.name ?? vendor.name,
        phoneNumber: update.phoneNumber ?? vendor.phoneNumber,
        email: update.email ?? vendor.email,
        walletAddress,
      },
    });
  }

  async deleteVendor(uuid: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { uuid } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.delete({ where: { uuid } });
  }
}
