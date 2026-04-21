import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CommunicationHistoryQueryDto,
  CreateCommunication,
  ListCommunicationQueryDto,
} from './dto/communication.dto';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  async createCommunication(data: CreateCommunication) {
    const { benIds, message, groupId, type } = data;

    const hasGroupIds = groupId && groupId.length > 0;
    const hasBenIds = benIds && benIds.length > 0;

    if (!hasGroupIds && !hasBenIds) {
      throw new BadRequestException(
        'Either benIds or groupId must be provided.',
      );
    }

    let beneficiaries;
    try {
      if (hasGroupIds) {
        const benData = await this.prisma.beneficiaryGroup.findMany({
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
        beneficiaries = benData.flatMap((d) =>
          d.members.map((ben) => ben.beneficiary),
        );
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
        select: {
          uuid: true,
          message: true,
          type: true,
          status: true,
          createdAt: true,
        },
      });
      return communicationLog;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async listCommunication(query: ListCommunicationQueryDto) {
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

  async sendCommunication(id: string) {
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

  async getBenCommunicationHistory(
    benId: string,
    query: CommunicationHistoryQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const details = this.prisma.beneficiary.findUnique({
      where: {
        uuid: benId,
      },
      select: {
        uuid: true,
        communication: {
          select: {
            communication: {
              select: {
                uuid: true,
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
  }

  async getCommunicationHistory(communicationId: string) {
    try {
      const details = await this.prisma.communication.findUnique({
        where: {
          uuid: communicationId,
        },
        select: {
          uuid: true,
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
