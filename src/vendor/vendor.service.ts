import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';
import {
  Vendor,
  VendorAuthProvider,
  VendorRedemptionsStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../beneficiaries/wallet';
import {
  PaginatedResult,
  PaginateOptions,
} from '@rumsan/sdk/types/pagination.types';
import {
  CreateClaimDto,
  CreateVendorDto,
  ListVendorTxnDto,
  PaginationDto,
  VendorLoginDto,
} from './dto/create-vendor.dto';
import axios from 'axios';
import { createContractInstance, parseAmount } from 'src/utils/transaction';
import { tokenAbi } from 'src/utils/abi/token';

@Injectable()
export class VendorService {
  private readonly vendorAccessTokenTtlMs = 7 * 24 * 60 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  private normalizeAuthProvider(provider?: string): VendorAuthProvider {
    if (provider?.toUpperCase() === 'BACKEND') {
      return VendorAuthProvider.BACKEND;
    }

    return VendorAuthProvider.GOOGLE;
  }

  private hashAccessToken(accessToken: string) {
    return createHash('sha256').update(accessToken).digest('hex');
  }

  private async createVendorSession(
    vendor: Vendor,
    authProvider?: string,
    providerSubject?: string,
  ) {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + this.vendorAccessTokenTtlMs);
    const normalizedProvider = this.normalizeAuthProvider(authProvider);
    const accessToken = this.signVendorToken(vendor, sessionId);

    const session = await this.prisma.vendorAuthSession.create({
      data: {
        sessionId,
        vendorId: vendor.id,
        authProvider: normalizedProvider,
        providerSubject,
        accessTokenHash: this.hashAccessToken(accessToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      session,
    };
  }

  private async buildVendorAuthResponse(
    vendor: Vendor,
    message: string,
    authProvider?: string,
    providerSubject?: string,
  ) {
    const { accessToken, session } = await this.createVendorSession(
      vendor,
      authProvider,
      providerSubject,
    );

    return {
      status: 'success',
      message,
      tokenType: 'Bearer',
      accessToken,
      session: {
        sessionId: session.sessionId,
        authProvider: session.authProvider,
        expiresAt: session.expiresAt,
      },
      data: vendor,
    };
  }

  private signVendorToken(vendor: Vendor, sessionId: string) {
    const secret =
      process.env.JWT_SECRET ||
      process.env.ACCESS_TOKEN_SECRET ||
      'vendor-session-secret';

    return jwt.sign(
      {
        sub: vendor.uuid,
        vendorId: vendor.uuid,
        sid: sessionId,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        name: vendor.name,
        walletAddress: vendor.walletAddress,
        role: 'vendor',
      },
      secret,
      {
        expiresIn: '7d',
      },
    );
  }

  private async findVendorByLoginField(login: VendorLoginDto): Promise<Vendor> {
    const conditions = [] as Array<Record<string, string>>;

    if (login.email) {
      conditions.push({ email: login.email });
    }

    if (login.phoneNumber) {
      conditions.push({ phoneNumber: login.phoneNumber });
    }

    if (!conditions.length) {
      throw new BadRequestException(
        'Email or phone number is required to login',
      );
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: {
        OR: conditions,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async registerVendor(body: CreateVendorDto) {
    const existingVendor = await this.prisma.vendor.findFirst({
      where: {
        OR: [
          ...(body.email ? [{ email: body.email }] : []),
          { phoneNumber: body.phoneNumber },
        ],
      },
    });

    if (existingVendor) {
      return this.buildVendorAuthResponse(
        existingVendor,
        'Vendor already registered',
        body.authProvider,
        body.providerSubject,
      );
    }

    let walletAddress = body.walletAddress;
    if (!walletAddress) {
      walletAddress = await this.walletService.createWallet();
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        name: body.name || '',
        phoneNumber: body.phoneNumber,
        email: body.email,
        walletAddress,
        isApproved: false,
      },
    });

    return this.buildVendorAuthResponse(
      vendor,
      'Vendor registered successfully',
      body.authProvider,
      body.providerSubject,
    );
  }

  async approveVendor(vendorId: string) {
    try {
      const vendor = await this.prisma.vendor.findMany({
        where: {
          uuid: vendorId,
        },
      });
      if (!vendor) throw new NotFoundException('No vendor found for approval');
      return this.prisma.vendor.update({
        where: {
          uuid: vendorId,
        },
        data: {
          isApproved: true,
        },
      });
    } catch (err) {
      throw new Error('Failed to approve vendor');
    }
  }

  async loginVendor(body: VendorLoginDto) {
    const vendor = await this.findVendorByLoginField(body);
    return this.buildVendorAuthResponse(
      vendor,
      'Vendor login successful',
      body.authProvider,
      body.providerSubject,
    );
  }

  async findOne(uuid: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { uuid },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async findOneByEmail(email: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { email },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async listVendor(query: any): Promise<PaginatedResult<any>> {
    let where;

    const page = Number(query.page) || 1;
    const perPage = Number(query.perPage) || 10;
    if (query?.approved) {
      where = {
        isApproved: true,
      };
    }

    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where: where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
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

  async claimCreate(vendorId: string, data: CreateClaimDto) {
    const { amount, benAddress } = data;

    const tokenContractInstance = await createContractInstance(
      tokenAbi,
      'token',
    );
    const decimals = await tokenContractInstance.decimals();
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
        id: true,
      },
    });

    const contractSettings = await this.prisma.settings.findUnique({
      where: {
        name: 'contract',
      },
    });
    const parsedAmount = await parseAmount(amount, decimals);
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
          amount: Number(parsedAmount),
          decimal: Number(decimals),
          phoneNumber: beneficiaryDetails?.pii?.phone,
        },
      },
      serviceTags: ['claimCreate'],
    };

    if (beneficiaryDetails && vendor)
      await this.prisma.vendorBen.upsert({
        where: {
          beneficiaryId: beneficiaryDetails?.id,
        },
        update: {
          latestServedAmount: amount,
          totalServed: { increment: 1 },
        },
        create: {
          beneficiaryId: beneficiaryDetails?.id,
          vendorId: vendor?.id,
          latestServedAmount: amount,
          totalServed: +1,
        },
      });

    return this.forwardToCore(claimCreateRequest);
  }

  async verifyOtp(vendorId: string, data: any) {
    const { benAddress, otp } = data;
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        uuid: vendorId,
      },
      select: {
        walletAddress: true,
      },
    });

    const otpRequest = {
      requestData: {
        data: {
          vendorAddress: vendor?.walletAddress,
          benAddress,
          otp,
        },
      },
      serviceTags: ['verifyOtp'],
    };

    return await this.forwardToCore(otpRequest);
  }

  async redemptionRequest(data: any, vendorId: string) {
    const { request, signature, amount } = data;
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        uuid: vendorId,
      },
      select: {
        walletAddress: true,
        id: true,
      },
    });
    if (!vendor) throw new Error('No vendor found');
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
    const res = await this.forwardToCore(redemptionData);
    if (res.status == 'success') {
      const redemption = await this.prisma.vendorRedemptions.create({
        data: {
          vendorId: vendor?.id,
          amount: amount,
          status: VendorRedemptionsStatus?.REQUESTED,
        },
      });
      return { redemption, coreResponse: res };
    }
    return res;
  }

  async redemptionApproval(redemptionId: string) {
    const tokenContractInstance = await createContractInstance(
      tokenAbi,
      'token',
    );
    const decimals = await tokenContractInstance.decimals();
    // const { redemptionId } = data;
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

    if (!redemptionDetails) throw new Error('No redemption Details found');
    const amount = redemptionDetails?.amount;

    const parsedAmount = await parseAmount(amount?.toString(), decimals);

    const redemptionData = {
      requestData: {
        data: {
          tokenAddress,
          from: redemptionDetails?.vendor.walletAddress,
          to: projectAddress,
          amount: Number(parsedAmount),
          decimal: Number(decimals),
        },
      },
      serviceTags: ['redemptionApproval'],
    };

    return await this.forwardToCore(redemptionData);
  }

  async getVendorTransaction(vendorAddress: string, query: ListVendorTxnDto) {
    const projectId = process.env.PROJECT_ID;
    const core = process.env.CORE_URL;

    const txnRequest = {
      projectId: projectId || '',
      data: {
        requestParam: vendorAddress,
        query: { ...query },
      },
      serviceTags: ['vendorTxn'],
    };
    const response = await axios.get(`${core}/request`, { params: txnRequest });
    return response.data;
  }

  async getBeneficiaryServed(vendorId: string, query?: PaginationDto) {
    const page = Number(query?.page) || 1;
    const perPage = Number(query?.perPage) || 10;
    const skip = (page - 1) * perPage;

    try {
      const total = await this.prisma.vendorBen.count({
        where: {
          vendor: {
            uuid: vendorId,
          },
        },
      });
      const benList = await this.prisma.vendorBen.findMany({
        where: {
          vendor: {
            uuid: vendorId,
          },
        },
        select: {
          beneficiary: {
            select: {
              walletAddress: true,
            },
          },
          latestServedAmount: true,
          claimCreated: true,
          otpVerified: true,
        },
        skip,
        take: perPage,
      });
      const lastPage = Math.ceil(total / perPage);
      return {
        benList,
        meta: {
          total,
          lastPage,
          currentPage: page,
          perPage,
          prev: page > 1 ? page - 1 : null,
          next: page < lastPage ? page + 1 : null,
        },
      };
    } catch (err) {
      throw new Error('Error while fetching beneficiary list');
    }
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
        message: 'Request forwarded to core',
        data: response.data,
      };
    } catch (err) {
      throw err;
    }
  }
}
