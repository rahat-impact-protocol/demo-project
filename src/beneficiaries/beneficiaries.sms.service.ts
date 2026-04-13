import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SendBulkSms,
  SendSms,
  SmsHistoryQueryDto,
} from './dto/beneficiary.sms.dto';
import { CommunicationStatus } from '@prisma/client';

@Injectable()
export class BeneficiarySmsService {
  constructor(private prisma: PrismaService) {}

  async sendSms(data: SendSms) {
    const { benId, message } = data;
    try {
      const beneficiary = await this.prisma.beneficiary.findUnique({
        where: {
          uuid: benId,
        },
        include: {
          pii: {
            select: {
              phone: true,
            },
          },
        },
      });

      if (!beneficiary) {
        throw new BadRequestException(`Beneficiary not found: ${benId}`);
      }

      const phone = beneficiary?.pii?.phone;
      if (!phone) {
        throw new BadRequestException(`No phone number found`);
      }
      // this.forwardToCore(phone || '', message, 'sendsms');
      // }
      const smsLog = await this.prisma.communication.create({
        data: {
          benId: beneficiary.id,
          phone,
          message,
          status: CommunicationStatus.SENDING,
        },
      });

      try {
        const result = await this.forwardToCore(phone, message, 'sendsms');

        await this.prisma.communication.update({
          where: { id: smsLog.id },
          data: {
            status: CommunicationStatus.DELIVERED,
            sentAt: new Date(),
            providerRef: result?.data?.referenceId ?? null,
          },
        });

        return { success: true, logId: smsLog.uuid, status: CommunicationStatus.DELIVERED };
      } catch (sendErr) {
        await this.prisma.communication.update({
          where: { id: smsLog.id },
          data: {
            status: CommunicationStatus.FAILED,
            failedAt: new Date(),
            errorNote: (sendErr as Error).message,
          },
        });
        throw sendErr;
      }
    } catch (err) {
      throw err;
    }
  }
  async sendBulkSms(data: SendBulkSms) {
    const { benIds, message } = data;
    try {
      const beneficiaries = await this.prisma.beneficiary.findMany({
        where: {
          uuid: { in: benIds },
        },
        include: {
          pii: {
            select: { phone: true },
          },
        },
      });

      // Fix: was `>= 0` which always threw — correct check is `=== 0`
      if (beneficiaries.length === 0) {
        throw new BadRequestException(`No matching beneficiaries found`);
      }

      const withPhone = beneficiaries.filter((b) => !!b.pii?.phone);
      const withoutPhone = beneficiaries.filter((b) => !b.pii?.phone);

      if (withPhone.length === 0) {
        throw new BadRequestException(`No phone number found`);
      }

      // Create PENDING log entries for all recipients at once
      await this.prisma.communication.createMany({
        data: withPhone.map((b) => ({
          benId: b.id,
          phone: b.pii!.phone,
          message,
          status: CommunicationStatus.SENDING,
        })),
      });

      // Fetch the log records we just created to get their IDs for updating
      const pendingLogs = await this.prisma.communication.findMany({
        where: {
          benId: { in: withPhone.map((b) => b.id) },
          status: CommunicationStatus.SENDING,
          message,
        },
        orderBy: { createdAt: 'desc' },
        take: withPhone.length,
      });

      const logByBenId = new Map(pendingLogs.map((l) => [l.benId, l]));

      // Send to each beneficiary individually and record result
      const results = await Promise.allSettled(
        withPhone.map(async (b) => {
          const log = logByBenId.get(b.id);
          const phone = b.pii!.phone;

          try {
            const result = await this.forwardToCore(phone, message, 'sendsms');

            if (log) {
              await this.prisma.communication.update({
                where: { id: log.id },
                data: {
                  status: CommunicationStatus.DELIVERED,
                  sentAt: new Date(),
                  providerRef: result?.data?.referenceId ?? null,
                },
              });
            }

            return { benUuid: b.uuid, phone, status: CommunicationStatus.DELIVERED };
          } catch (sendErr) {
            if (log) {
              await this.prisma.communication.update({
                where: { id: log.id },
                data: {
                  status: CommunicationStatus.FAILED,
                  failedAt: new Date(),
                  errorNote: (sendErr as Error).message,
                },
              });
            }

            // this.logger.warn(
            //   `Bulk SMS failed for ${phone}: ${(sendErr as Error).message}`,
            // );
            return {
              benUuid: b.uuid,
              phone,
              status: CommunicationStatus.FAILED,
              error: (sendErr as Error).message,
            };
          }
        }),
      );

      const sent = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === CommunicationStatus.DELIVERED,
      ).length;

      const failed = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === CommunicationStatus.FAILED,
      ).length;

      return {
        total: withPhone.length,
        sent,
        failed,
        skippedNoPhone: withoutPhone.length,
        details: results.map((r) =>
          r.status === 'fulfilled' ? r.value : r.reason,
        ),
      };
    } catch (err) {
      throw err;
    }
  }

  // async sendBulkSms(data: SendBulkSms) {
  //   const { benIds, message } = data;
  //   try {
  //     const beneficiaries = await this.prisma.beneficiary.findMany({
  //       where: {
  //         uuid: {
  //           in: benIds,
  //         },
  //       },
  //       include: {
  //         pii: {
  //           select: {
  //             phone: true,
  //           },
  //         },
  //       },
  //     });
  //     const phone = beneficiaries.map((ben) => ben?.pii?.phone || '');
  //     if (phone.length >= 0) {
  //       throw new BadRequestException(`No phone number found`);
  //     }
  //     this.forwardToCore(phone || [], message, 'sendsms');
  //   } catch (err) {
  //     throw err;
  //   }
  // }
  async getSmsHistory(benId: string, query: SmsHistoryQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { uuid: benId },
    });

    if (!beneficiary) {
      throw new BadRequestException(`Beneficiary not found: ${benId}`);
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.communication.findMany({
        where: { benId: beneficiary.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          uuid: true,
          phone: true,
          message: true,
          status: true,
          providerRef: true,
          sentAt: true,
          failedAt: true,
          errorNote: true,
          createdAt: true,
        },
      }),
      this.prisma.communication.count({ where: { benId: beneficiary.id } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async forwardToCore(
    phone: string | string[],
    message: any,
    actionPerformed: string,
  ) {
    try {
      const projectId = process.env.PROJECT_ID;
      const core = process.env.CORE_URL;

      const smsRequest = {
        projectId: projectId || '',
        requestData: {
          data: {
            to: phone,
            message: message,
          },
        },
        serviceTags: [actionPerformed],
      };
      const response = await axios.post(`${core}/request`, smsRequest, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return {
        status: 'success',
        message: 'Request forwarded to register',
        data: response.data,
      };
    } catch (err) {}
  }
}
