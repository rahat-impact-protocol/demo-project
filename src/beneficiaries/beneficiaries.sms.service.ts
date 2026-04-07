import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendBulkSms, SendSms } from './dto/beneficiary.sms.dto';

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
      const phone = beneficiary?.pii?.phone;
      if (!phone) {
        throw new BadRequestException(`No phone number found`);
      }
      this.forwardToCore(phone || '', message, 'sendsms');
    } catch (err) {
      throw err;
    }
  }

  async sendBulkSms(data: SendBulkSms) {
    const { benIds, message } = data;
    try {
      const beneficiaries = await this.prisma.beneficiary.findMany({
        where: {
          uuid: {
            in: benIds,
          },
        },
        include: {
          pii: {
            select: {
              phone: true,
            },
          },
        },
      });
      const phone = beneficiaries.map((ben) => ben?.pii?.phone || '');
      if (phone.length >= 0) {
        throw new BadRequestException(`No phone number found`);
      }
      this.forwardToCore(phone || [], message, 'sendsms');
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
    } catch (err) {}
  }
}
