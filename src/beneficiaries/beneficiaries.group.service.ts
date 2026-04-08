import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryGroupDto } from './dto/create-beneficiary.dto';

@Injectable()
export class BeneficiaryGroupService {
  constructor(private prisma: PrismaService) {}

  // Beneficiary Group CRUD
  async createGroup(data: CreateBeneficiaryGroupDto) {
    return this.prisma.$transaction([
      this.prisma.beneficiaryGroup.create({
        data: {
          name: data?.name,
          description: data?.description,
          members: {
            createMany: {
              data: data.beneficiariesId.map((id: number) => ({
                beneficiaryId: id,
              })),
            },
          },
        },
      }),
    ]);
  }

  async getGroupById(id: number) {
    return this.prisma.beneficiaryGroup.findUnique({
      where: { id },
      include: { members: { include: { beneficiary: true } } },
    });
  }

  async listGroups() {
    return this.prisma.beneficiaryGroup.findMany();
  }

  async updateGroup(id: number, data: { name?: string; description?: string }) {
    return this.prisma.beneficiaryGroup.update({ where: { id }, data });
  }

  async deleteGroup(id: number) {
    // Delete all group members first (to avoid FK constraint)
    await this.prisma.beneficiaryGroupMember.deleteMany({
      where: { groupId: id },
    });
    return this.prisma.beneficiaryGroup.delete({ where: { id } });
  }

  // Group membership management
  async addBeneficiaryToGroup(groupId: number, beneficiaryId: number) {
    return this.prisma.beneficiaryGroupMember.create({
      data: { groupId, beneficiaryId },
    });
  }

  async removeBeneficiaryFromGroup(groupId: number, beneficiaryId: number) {
    return this.prisma.beneficiaryGroupMember.delete({
      where: { groupId_beneficiaryId: { groupId, beneficiaryId } },
    });
  }

  async listGroupMembers(groupId: number) {
    return this.prisma.beneficiaryGroupMember.findMany({
      where: { groupId },
      include: { beneficiary: true },
    });
  }
}
