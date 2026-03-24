 import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { WalletService } from 'src/beneficiaries/wallet';
import { PaginatedResult, PaginateOptions } from '@rumsan/sdk/types';
import * as readline from 'node:readline';
import { Readable } from 'node:stream';

@Injectable()
export class BeneficiaryService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  async addBeneficiary(createBeneficiaryDto: CreateBeneficiaryDto) {
    const { walletAddress } = createBeneficiaryDto;

    if (!walletAddress) {
      createBeneficiaryDto.walletAddress = await this.wallet.createWallet();
    }

    try {
      const benDetails = await this.prisma.$transaction([
        this.prisma.beneficiary.create({
          data: {
            walletAddress: createBeneficiaryDto.walletAddress,
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
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  }

  async uploadFromCsv(csv: string | Buffer) {
    const startedAt = Date.now();
    const csvString = Buffer.isBuffer(csv) ? csv.toString('utf8') : csv;
    if (typeof csvString !== 'string' || !csvString.trim()) throw new Error('Empty CSV');

    const configuredConcurrency = Number(process.env.BENEFICIARY_UPLOAD_CONCURRENCY ?? 10);
    const concurrency = Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
      ? Math.floor(configuredConcurrency)
      : 10;

    // --- Phase 1: collect all CSV phones for a single bulk duplicate check ---
    const allPhones: string[] = [];
    const allLines: { line: string; lineNumber: number }[] = [];

    {
      let phaseLineNumber = 0;
      let phaseHeader: string[] | null = null;
      const phaseReader = readline.createInterface({
        input: Readable.from([csvString]),
        crlfDelay: Infinity,
      });

      for await (const rawLine of phaseReader) {
        phaseLineNumber += 1;
        const line = rawLine.trim();
        if (!line) continue;

        if (!phaseHeader) {
          phaseHeader = line.split(',').map((h) => h.trim().toLowerCase());
          const expected = ['name', 'phone'];
          const missing = expected.filter((e) => !phaseHeader!.includes(e));
          if (missing.length) throw new Error(`CSV is missing required headers: ${missing.join(',')}`);
          continue;
        }

        const cols = line.split(',').map((c) => c.trim());
        const phoneIdx = phaseHeader.indexOf('phone');
        const phone = cols[phoneIdx]?.trim();
        if (phone) allPhones.push(phone);
        allLines.push({ line, lineNumber: phaseLineNumber });
      }

      if (!phaseHeader) throw new Error('CSV has no data');
    }

    // Single bulk query — much cheaper than one query per row
    const existingRows = await this.prisma.beneficiaryPii.findMany({
      where: { phone: { in: allPhones } },
      select: { phone: true },
    });
    const existingPhones = new Set(existingRows.map((r) => r.phone));

    // --- Phase 2: process rows, skipping known duplicates ---
    let csvLineNumber = 0;
    let total = 0;
    let created = 0;
    let skipped = 0;
    const failedArr: string[] = [];
    let header: string[] | null = null;
    const inFlight = new Set<Promise<void>>();

    const processLine = async (line: string, rowNumber: number) => {
      const cols = line.split(',').map((c) => c.trim());
      const row: any = {};
      (header || []).forEach((h, idx) => {
        row[h] = cols[idx] ?? '';
      });

      const phone: string = row['phone'];
      if (existingPhones.has(phone)) {
        skipped += 1;
        failedArr.push(`row ${rowNumber}: phone ${phone} already exists, skipped`);
        return;
      }

      const ageVal = row['age'] && row['age'].length ? Number(row['age']) : undefined;
      const dto: CreateBeneficiaryDto = {
        name: row['name'],
        phone,
        email: row['email'] || undefined,
        walletAddress: row['walletaddress'] || row['walletAddress'] || undefined,
        extras: ageVal !== undefined ? ({ age: ageVal } as any) : undefined,
      };

      try {
        await this.addBeneficiary(dto);
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
        if (missing.length) throw new Error(`CSV is missing required headers: ${missing.join(',')}`);
        continue;
      }

      total += 1;
      await scheduleRow(line, csvLineNumber);
    }

    await Promise.all(inFlight);

    if (!header) throw new Error('CSV has no data');

    return {
      total,
      created,
      skipped,
      failedCount: failedArr.length - skipped,
      errors: failedArr,
      meta: {
        concurrency,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  async listBeneficiaries(options: PaginateOptions = {}): Promise<PaginatedResult<any>> {
    const page = Number(options.page) || 1;
    const perPage = Number(options.perPage) || 10;
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      this.prisma.beneficiary.findMany({ skip, take: perPage ,include:{pii:{
        select:{
          name:true,
          phone:true,
          email:true
        }
      }}}),
      this.prisma.beneficiary.count(),
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

  async deleteBeneficiary(id: string) {
    return this.prisma.beneficiary.delete({ where: { uuid: id } });
  }
}
