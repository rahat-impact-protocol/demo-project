import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../beneficiaries/wallet';
import {
  PaginatedResult,
  PaginateOptions,
} from '@rumsan/sdk/types/pagination.types';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { PaginateFunction, Pagination } from '@rumsan/sdk/types';
import axios from 'axios';

@Injectable()
export class VendorService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

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

  async listVendor(
    options: PaginateOptions = {},
  ): Promise<PaginatedResult<any>> {
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

  async claimCreate(vendorId: string, data: any) {
    const { amount, benAddress } = data;
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        uuid: vendorId,
      },
    });

    const beneficiaryDetails = await this.prisma.beneficiary.findFirst({
      where: {
        walletAddress: benAddress,
      },
      select: {
        pii: {
          select: { phone: true },
        },
      },
    });

    const contractSettings = await this.prisma.settings.findUnique({
      where: {
        name: 'contract',
      },
    });
    const settings: any = contractSettings?.value;
    const tokenAddress = settings?.token?.address;
    const projectAddress = settings?.fundStorageContract?.address;
    const claimCreateRequest = {
      requestData: {
        data: {
          tokenAddress,
          projectAddress,
          benAddress,
          vendorAddress: vendor?.walletAddress,
          amount,
          phoneNumber: beneficiaryDetails?.pii?.phone,
        },
      },
      serviceTags: ['claimCreate'],
    };
    console.log(claimCreateRequest);

    await this.forwardToCore(claimCreateRequest);
  }

  async verifyOtp(data: any) {
    const { claimId, otp } = data;
    const otpRequest = {
      requestData: {
        data: {
          claimId,
          otp,
        },
      },
      serviceTags: ['verifyOtp'],
    };

    await this.forwardToCore(otpRequest);
  }

  async redemptionRequest(data: any) {
    const { request, signature, vendorId } = data;
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        uuid: vendorId,
      },
      select: {
        walletAddress: true,
      },
    });
    const redemptionData = {
      requestData: {
        data: {
          request,
          signature,
          vendorAddress: vendor?.walletAddress,
        },
      },
      serviceTags: ['redemptionRequest'],
    };
    await this.forwardToCore(redemptionData);
  }

  async redemptionApproval(data: any) {
    const { redemptionId } = data;
    const contractSettings = await this.prisma.settings.findUnique({
      where: {
        name: 'contract',
      },
    });
    const settings: any = contractSettings?.value;
    const tokenAddress = settings?.token?.address;
    const projectAddress = settings?.fundStorageContract?.address;

    const redemptionDetails = await this.prisma.vendorRedemptions.findUnique({
      where: {
        uuid: redemptionId,
      },
      select: {
        vendor: {
          select: {
            walletAddress: true,
          },
        },
        amount: true,
      },
    });

    const redemptionData = {
      requestData: {
        data: {
          tokenAddress,
          from: redemptionDetails?.vendor.walletAddress,
          to: projectAddress,
          amount: redemptionDetails?.amount,
        },
      },
      serviceTags: ['redemptionApproval'],
    };

    await this.forwardToCore(redemptionData);
  }

  async forwardToCore(data) {
    try {
      const projectId = process.env.PROJECT_ID;
      const core = process.env.CORE_URL;
      const requestData = data;
      requestData.projectId = projectId;

      // const contractSettings = await this.prisma.settings.findUnique({
      //   where: {
      //     name: 'Contract',
      //   },
      // });
      // const settings: any = contractSettings?.value;
      // const tokenAddress = settings?.token?.address;
      // const projectAddress = settings?.fundStorageContract?.address;
      // const claimCreateRequest = {
      //   projectId: projectId || '',
      //   // requestData: {
      //   //   data: {
      //   //     tokenAddress,
      //   //     projectAddress,
      //   //     beneficiaryAddress,
      //   //     vendorAddress,
      //   //     amount,
      //   //   },
      //   // },
      //   // serviceTags: ['claim-create'],
      // };

      const response = await axios.post(`${core}/request`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return {
        status: 'success',
        message: 'Claim Request forwarded to core',
        data: response.data,
      };
    } catch (err) {
      throw err;
    }
  }
}
