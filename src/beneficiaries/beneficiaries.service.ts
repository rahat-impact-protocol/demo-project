import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  ListBeneficiaryTxnDto,
} from './dto/create-beneficiary.dto';
import { WalletService } from 'src/beneficiaries/wallet';
import { PaginatedResult, PaginateOptions } from '@rumsan/sdk/types';
import * as readline from 'node:readline';
import { Readable } from 'node:stream';
import axios from 'axios';

@Injectable()
export class BeneficiaryService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async addBeneficiary(createBeneficiaryDto: CreateBeneficiaryDto) {
    let benAddress;
    const { walletAddress } = createBeneficiaryDto;
    benAddress = walletAddress;

    const existingBen = await this.prisma.beneficiaryPii.findUnique({
      where: {
        phone: createBeneficiaryDto?.phone,
      },
    });
    const existingWallet = await this.prisma.beneficiary.findFirst({
      where: {
        walletAddress: walletAddress,
      },
    });

    if (existingBen) {
      throw new BadRequestException('Phone number already exists');
    }
    if (existingWallet) {
      throw new BadRequestException('Wallet Address already exists');
    }

    if (!walletAddress) {
      benAddress = await this.wallet.createWallet();
    }

    try {
      const benDetails = await this.prisma.$transaction([
        this.prisma.beneficiary.create({
          data: {
            walletAddress: benAddress,
            gender: createBeneficiaryDto?.gender,
            age: createBeneficiaryDto?.age || 0,
            address: createBeneficiaryDto?.address,
            bankStatus: createBeneficiaryDto?.bankStatus,
            pii: {
              create: {
                name: createBeneficiaryDto?.name,
                phone: createBeneficiaryDto?.phone,
                email: createBeneficiaryDto?.email,
                extras: (createBeneficiaryDto?.extras ?? undefined) as any,
              },
            },
          },
        }),
      ]);

      return benDetails;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Phone number already exists');
      }

      throw new Error(err instanceof Error ? err.message : String(err));
    }
  }

  async uploadFromCsv(csv: string | Buffer) {
    return this.importFromCsv(csv, { createGroup: false });
  }

  async uploadFromCsvAsGroup(
    csv: string | Buffer,
    groupName?: string,
    groupDescription?: string,
  ) {
    return this.importFromCsv(csv, {
      createGroup: true,
      groupName,
      groupDescription,
    });
  }

  private async importFromCsv(
    csv: string | Buffer,
    options: {
      createGroup: boolean;
      groupName?: string;
      groupDescription?: string;
    },
  ) {
    const startedAt = Date.now();
    const csvString = Buffer.isBuffer(csv) ? csv.toString('utf8') : csv;
    if (typeof csvString !== 'string' || !csvString.trim())
      throw new Error('Empty CSV');

    const configuredConcurrency = Number(
      process.env.BENEFICIARY_UPLOAD_CONCURRENCY ?? 10,
    );
    const concurrency =
      Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
        ? Math.floor(configuredConcurrency)
        : 10;

    const allPhones: string[] = [];
    {
      let phaseHeader: string[] | null = null;
      const phaseReader = readline.createInterface({
        input: Readable.from([csvString]),
        crlfDelay: Infinity,
      });

      for await (const rawLine of phaseReader) {
        const line = rawLine.trim();
        if (!line) continue;

        if (!phaseHeader) {
          phaseHeader = line.split(',').map((h) => h.trim().toLowerCase());
          const expected = ['name', 'phone'];
          const missing = expected.filter((e) => !phaseHeader!.includes(e));
          if (missing.length)
            throw new Error(
              `CSV is missing required headers: ${missing.join(',')}`,
            );
          continue;
        }

        const cols = line.split(',').map((c) => c.trim());
        const phoneIdx = phaseHeader.indexOf('phone');
        const phone = cols[phoneIdx]?.trim();
        if (phone) allPhones.push(phone);
      }

      if (!phaseHeader) throw new Error('CSV has no data');
    }

    const existingRows = await this.prisma.beneficiaryPii.findMany({
      where: { phone: { in: allPhones } },
      select: { phone: true },
    });
    const existingPhones = new Set(existingRows.map((r) => r.phone));

    let csvLineNumber = 0;
    let total = 0;
    let created = 0;
    let skipped = 0;
    const failedArr: string[] = [];
    let header: string[] | null = null;
    const inFlight = new Set<Promise<void>>();
    const createdBeneficiaryIds: number[] = [];

    const processLine = async (line: string, rowNumber: number) => {
      const cols = line.split(',').map((c) => c.trim());
      const row: any = {};
      (header || []).forEach((h, idx) => {
        row[h] = cols[idx] ?? '';
      });

      const phone: string = row['phone'];
      if (existingPhones.has(phone)) {
        skipped += 1;
        failedArr.push(
          `row ${rowNumber}: phone ${phone} already exists, skipped`,
        );
        return;
      }

      const ageVal =
        row['age'] && row['age'].length ? Number(row['age']) : undefined;
      const dto: CreateBeneficiaryDto = {
        name: row['name'],
        phone,
        email: row['email'] || undefined,
        walletAddress:
          row['walletaddress'] || row['walletAddress'] || undefined,
        extras: ageVal !== undefined ? ({ age: ageVal } as any) : undefined,
      };

      try {
        const createdRow = await this.addBeneficiary(dto);
        const beneficiary = Array.isArray(createdRow)
          ? createdRow[0]
          : createdRow;
        if (options.createGroup && beneficiary?.id) {
          createdBeneficiaryIds.push(beneficiary.id);
        }
        created += 1;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        failedArr.push(`row ${rowNumber}: ${errorMessage}`);
      }
    };

    const scheduleRow = async (line: string, rowNumber: number) => {
      const task = processLine(line, rowNumber).finally(() => {
        inFlight.delete(task);
      });
      inFlight.add(task);
      if (inFlight.size >= concurrency) {
        await Promise.race(inFlight);
      }
    };

    const lineReader = readline.createInterface({
      input: Readable.from([csvString]),
      crlfDelay: Infinity,
    });

    for await (const rawLine of lineReader) {
      csvLineNumber += 1;
      const line = rawLine.trim();
      if (!line) continue;

      if (!header) {
        header = line.split(',').map((h) => h.trim().toLowerCase());
        const expected = ['name', 'phone'];
        const missing = expected.filter((e) => !header!.includes(e));
        if (missing.length)
          throw new Error(
            `CSV is missing required headers: ${missing.join(',')}`,
          );
        continue;
      }

      total += 1;
      await scheduleRow(line, csvLineNumber);
    }

    await Promise.all(inFlight);

    if (!header) throw new Error('CSV has no data');

    let group: { id: number; uuid: string; name: string } | null = null;
    if (options.createGroup && createdBeneficiaryIds.length > 0) {
      const uniqueBenIds = [...new Set(createdBeneficiaryIds)];
      const createdGroup = await this.prisma.beneficiaryGroup.create({
        data: {
          name:
            options.groupName || `Imported Group ${new Date().toISOString()}`,
          description:
            options.groupDescription ||
            'Auto-created from CSV beneficiary import',
          members: {
            createMany: {
              data: uniqueBenIds.map((beneficiaryId) => ({ beneficiaryId })),
            },
          },
        },
        select: {
          id: true,
          uuid: true,
          name: true,
        },
      });
      group = createdGroup;
    }

    return {
      total,
      created,
      skipped,
      failedCount: failedArr.length - skipped,
      errors: failedArr,
      meta: {
        concurrency,
        durationMs: Date.now() - startedAt,
        group,
      },
    };
  }

  async listBeneficiaries(
    options?: ListBeneficiaryDto,
  ): Promise<PaginatedResult<any>> {
    const page = Number(options?.page) || 1;
    const perPage = Number(options?.perPage) || 10;
    const skip = (page - 1) * perPage;
    const hasNameFilter = Boolean(options?.name?.trim());
    const hasPhoneFilter = Boolean(options?.phoneNumber?.trim());

    const where =
      hasNameFilter || hasPhoneFilter
        ? {
            pii: {
              is: {
                ...(hasNameFilter
                  ? {
                      name: {
                        contains: options?.name?.trim(),
                        mode: 'insensitive' as const,
                      },
                    }
                  : {}),
                ...(hasPhoneFilter
                  ? { phone: { contains: options?.phoneNumber?.trim() } }
                  : {}),
              },
            },
          }
        : undefined;

    const [data, total] = await Promise.all([
      this.prisma.beneficiary.findMany({
        skip,
        orderBy: { createdAt: 'desc' },
        take: perPage,
        where,
        select: {
          uuid: true,
          walletAddress: true,
          age: true,
          gender: true,
          address: true,
          bankStatus: true,
          disbursementAmount: true,
          disbursementStatus: true,
          createdAt: true,
          pii: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.beneficiary.count({ where }),
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

  async getByPhone(phoneNumber: string) {
    try {
      const benDetails = await this.prisma.beneficiaryPii.findUnique({
        where: {
          phone: phoneNumber,
        },
        select: {
          name: true,
          beneficiary: {
            select: {
              walletAddress: true,
              uuid: true,
            },
          },
        },
      });
      if (!benDetails)
        throw new NotFoundException('No Beneficiary details found');
      const bendetails = {
        name: benDetails?.name,
        phone: phoneNumber,
        walletAddress: benDetails?.beneficiary?.walletAddress,
      };
      return bendetails;
    } catch (err) {
      throw err;
    }
  }

  async getByWallet(walletAddress: string) {
    try {
      const benDetails = await this.prisma.beneficiary.findFirst({
        where: {
          walletAddress: walletAddress,
        },
        select: {
          pii: {
            select: {
              name: true,
              phone: true,
            },
          },
          uuid: true,
          walletAddress: true,
        },
      });
      if (!benDetails)
        throw new NotFoundException('No Beneficiary details found');
      const bendetails = {
        name: benDetails?.pii?.name,
        phone: benDetails?.pii?.phone,
        walletAddress: benDetails?.walletAddress,
      };

      return bendetails;
    } catch (err) {
      throw err;
    }
  }

  async deleteBeneficiary(id: string) {
    return this.prisma.beneficiary.delete({ where: { uuid: id } });
  }

  async getBeneficiaryTransaction(
    benAddress: string,
    query: ListBeneficiaryTxnDto,
  ) {
    const benDetails = await this.prisma.beneficiary.findFirst({
      where: {
        walletAddress: benAddress,
      },
    });
    if (!benDetails)
      throw new NotFoundException('No Beneficiary details found');
    const projectId = process.env.PROJECT_ID;
    const core = process.env.CORE_URL;

    const txnRequest = {
      projectId: projectId || '',
      data: {
        requestParam: benAddress,
        query: { ...query },
      },
      serviceTags: ['benTxn'],
    };

    const response = await axios.get(`${core}/request`, { params: txnRequest });
    return response.data;
  }
}
