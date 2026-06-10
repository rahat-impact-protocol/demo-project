import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryGroupDto } from './dto/create-beneficiary.dto';

@Injectable()
export class BeneficiaryGroupService {
  constructor(private prisma: PrismaService) {}

  // Beneficiary Group CRUD
  async createGroup(data: CreateBeneficiaryGroupDto) {
    const beneficiaryUuids = [...new Set(data?.beneficiariesId || [])];

    if (!beneficiaryUuids.length) {
      throw new BadRequestException(
        'beneficiariesId must contain at least one beneficiary UUID',
      );
    }

    const benDetails = await this.prisma.beneficiary.findMany({
      where: {
        uuid: { in: beneficiaryUuids },
      },
      select: {
        id: true,
        uuid: true,
      },
    });

    if (benDetails.length !== beneficiaryUuids.length) {
      const foundUuids = new Set(benDetails.map((ben) => ben.uuid));
      const missingUuids = beneficiaryUuids.filter(
        (uuid) => !foundUuids.has(uuid),
      );
      throw new BadRequestException(
        `Some beneficiaries were not found: ${missingUuids.join(', ')}`,
      );
    }

    return this.prisma.beneficiaryGroup.create({
      data: {
        name: data?.name,
        description: data?.description,
        members: {
          createMany: {
            data: benDetails.map((ben) => ({
              beneficiaryId: ben.id,
            })),
          },
        },
      },
    });
  }

  async getGroupById(uuid: string) {
    return this.prisma.beneficiaryGroup.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        name: true,
        description: true,
        members: {
          include: {
            beneficiary: {
              include: {
                pii: true,
              },
            },
          },
        },
      },
    });
  }

  async listGroups() {
    return this.prisma.beneficiaryGroup.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        uuid: true,
        name: true,
        description: true,
        createdAt: true,
        members: {
          select: {
            beneficiary: {
              select: {
                uuid: true,
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
  }

  async updateGroup(
    uuid: string,
    data: { name?: string; description?: string },
  ) {
    return this.prisma.beneficiaryGroup.update({ where: { uuid }, data });
  }

  async deleteGroup(uuid: string) {
    const groupDetails = await this.prisma.beneficiaryGroup.findUnique({
      where: { uuid },
    });

    const tx = await this.prisma.$transaction(async (prisma) => {
      prisma.beneficiaryGroupMember.deleteMany({
        where: { groupId: groupDetails?.id },
      });
      prisma.beneficiaryGroup.delete({ where: { id: groupDetails?.id } });
    });
    return tx;
  }

  // Group membership management
  async addBeneficiaryToGroup(groupUuid: string, beneficiaryUuid: string) {
    const groupDetails = await this.prisma.beneficiaryGroup.findUnique({
      where: { uuid: groupUuid },
    });
    const benDetails = await this.prisma.beneficiary.findUnique({
      where: { uuid: beneficiaryUuid },
    });
    if (groupDetails && benDetails)
      return this.prisma.beneficiaryGroupMember.create({
        data: { groupId: groupDetails?.id, beneficiaryId: benDetails?.id },
      });
    else throw new Error('Cannot add beneficiary to the group');
  }

  async removeBeneficiaryFromGroup(groupUuid: string, beneficiaryUuid: string) {
    const groupDetails = await this.prisma.beneficiaryGroup.findUnique({
      where: { uuid: groupUuid },
    });
    const benDetails = await this.prisma.beneficiary.findUnique({
      where: { uuid: beneficiaryUuid },
    });
    if (groupDetails && benDetails)
      return this.prisma.beneficiaryGroupMember.delete({
        where: {
          groupId_beneficiaryId: {
            groupId: groupDetails?.id,
            beneficiaryId: benDetails?.id,
          },
        },
      });
    else throw new Error('Cannot add beneficiary to the group');
  }

  async listGroupMembers(groupUuid: string) {
    return this.prisma.beneficiaryGroup.findUnique({
      where: { uuid: groupUuid },
      include: {
        members: {
          include: {
            beneficiary: {
              select: {
                uuid: true,
                walletAddress: true,
                address: true,
                age: true,
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
    // return this.prisma.beneficiaryGroupMember.findMany({
    //   where: {  },
    //   include: { beneficiary: true },
    // });
  }
}
