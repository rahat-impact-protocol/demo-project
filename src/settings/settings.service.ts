import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSettingDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async createSetting(data: CreateSettingDto) {
    try {
      return await this.prisma.settings.create({
        data: {
          name: data.name,
          value: data.value as Prisma.InputJsonValue,
          dataType: data.dataType,
          requiredFields: data.requiredFields ?? [],
          isReadOnly: data.isReadOnly ?? false,
          isPrivate: data.isPrivate ?? false,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Setting with this name already exists');
      }

      throw error;
    }
  }

  async listPublicSettings() {
    return this.prisma.settings.findMany({
      where: {
        isPrivate: false,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getSettingByName(name: string) {
    const setting = await this.prisma.settings.findUnique({
      where: {
        name,
      },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }
}
