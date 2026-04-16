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

  async createSms(data: any) {
    const { benIds, message, groupId, type } = data;
    let beneficiaries;
    try {
      if (groupId) {
        beneficiaries = await this.prisma.beneficiaryGroup.findMany({
          where: {
            uuid: { in: groupId },
          },
          select: {
            members: {
              include: {
                beneficiary: {
                  select: {
                    id: true,
                    pii: {
                      select: {
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      } else {
        beneficiaries = await this.prisma.beneficiary.findMany({
          where: {
            uuid: { in: benIds },
          },
          select: {
            id: true,
            pii: {
              select: {
                phone: true,
              },
            },
          },
        });
      }

      const communicationLog = await this.prisma.communication.create({
        data: {
          message: message,
          type: type,
          benCommunication: {
            create: beneficiaries.map((d) => ({
              benId: d?.id,
            })),
          },
        },
      });
      return communicationLog;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async sendSms(id: string) {
    if (!id) {
      throw new BadRequestException('communicationId or smsId is required');
    }
    try {
      const communication = await this.prisma.communication.findUnique({
        where: {
          uuid: id,
        },
        select: {
          uuid: true,
          message: true,
          benCommunication: {
            select: {
              beneficiary: {
                select: {
                  uuid: true,
                  pii: {
                    select: {
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!communication) {
        throw new BadRequestException(`Communication not found: ${id}`);
      }

      const recipients = communication.benCommunication.map((record) => ({
        benUuid: record.beneficiary.uuid,
        phone: record.beneficiary.pii?.phone ?? null,
      }));

      const withPhone = recipients.filter(
        (recipient): recipient is { benUuid: string; phone: string } =>
          !!recipient.phone,
      );
      console.log(withPhone);
      if (withPhone.length === 0) {
        throw new BadRequestException(`No phone number found`);
      }
      await this.forwardToCore(
        withPhone.map((recipient) => recipient.phone),
        communication.message,
        'sendsms',
      );
    } catch (err) {
      throw err;
    }
  }

  async getBenSmsHistory(benId: string, query: SmsHistoryQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const details = this.prisma.beneficiary.findUnique({
      where: {
        uuid: benId,
      },
      select: {
        communication: {
          select: {
            communication: {
              select: {
                message: true,
                status: true,
                type: true,
              },
            },
          },
        },
      },
    });
    if (!details) {
      throw new BadRequestException(`Beneficiary not found: ${benId}`);
    }
    return details;

    // const [logs, total] = await this.prisma.$transaction([
    //   this.prisma.communication.findMany({
    //     where: { benId: beneficiary.id },
    //     orderBy: { createdAt: 'desc' },
    //     skip,
    //     take: Number(limit),
    //     select: {
    //       uuid: true,
    //       phone: true,
    //       message: true,
    //       status: true,
    //       providerRef: true,
    //       sentAt: true,
    //       failedAt: true,
    //       errorNote: true,
    //       createdAt: true,
    //     },
    //   }),
    //   this.prisma.communication.count({ where: { benId: beneficiary.id } }),
    // ]);

    // return {
    //   data: logs,
    //   meta: {
    //     total,
    //     page: Number(page),
    //     limit: Number(limit),
    //     totalPages: Math.ceil(total / Number(limit)),
    //   },
    // };
  }

  async getSmsHistory(communicationId: string) {
    try {
      const details = await this.prisma.communication.findUnique({
        where: {
          uuid: communicationId,
        },
        select: {
          message: true,
          status: true,
          createdAt: true,
          sentAt: true,
          benCommunication: {
            select: {
              beneficiary: {
                select: {
                  walletAddress: true,
                  pii: {
                    select: {
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return details;
    } catch (err) {
      throw err;
    }
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
    } catch (err) {
      throw err;
    }
  }
}
