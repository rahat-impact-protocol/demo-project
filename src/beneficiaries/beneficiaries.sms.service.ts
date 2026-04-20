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
    console.log(data);
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
      console.log(beneficiaries);
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

  async listCommunication(query: any) {
    const { page = 1, limit = 20, type, status } = query;

    // Build where clause with optional filters
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    // Calculate pagination offsets
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.communication.count({
      where: whereClause,
    });

    // Fetch communications with their beneficiaries
    const communications = await this.prisma.communication.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        uuid: true,
        message: true,
        status: true,
        type: true,
        providerRef: true,
        sentAt: true,
        failedAt: true,
        errorNote: true,
        createdAt: true,
        updatedAt: true,
        benCommunication: {
          select: {
            beneficiary: {
              select: {
                id: true,
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

    // Format the response
    const data = communications.map((comm) => ({
      uuid: comm.uuid,
      message: comm.message,
      status: comm.status,
      type: comm.type,
      providerRef: comm.providerRef,
      sentAt: comm.sentAt,
      failedAt: comm.failedAt,
      errorNote: comm.errorNote,
      createdAt: comm.createdAt,
      updatedAt: comm.updatedAt,
      beneficiaries: comm.benCommunication.map((bc) => ({
        id: bc.beneficiary.id,
        uuid: bc.beneficiary.uuid,
        phone: bc.beneficiary.pii?.phone,
      })),
      totalBeneficiaries: comm.benCommunication.length,
    }));

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
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
