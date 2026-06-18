import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunicationType } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
} from 'class-validator';
// export class SendSms {
//   @ApiPropertyOptional({
//     example: '09876-4567-0987-4567',
//     description: 'Communication UUID',
//   })
//   @IsOptional()
//   @IsUUID()
//   communicationId?: string;

//   @ApiPropertyOptional({
//     example: '09876-4567-0987-4567',
//     description: 'Alias of communication UUID',
//   })
//   @IsOptional()
//   @IsUUID()
//   smsId?: string;
// }

export class CreateCommunication {
  @ApiProperty({
    example: ['232-4444-423-654,1314-765-9876-1234'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  benIds?: string[];

  @ApiProperty({
    example: ['232-4444-423-654'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  groupId?: string[];

  @ApiProperty({ example: 'this is test message', required: true })
  @IsString()
  message!: string;

  @ApiProperty({ example: 'test communication', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'SMS', required: true })
  @IsString()
  type!: CommunicationType;
}

export class UpdateCommunication {
  @ApiProperty({ example: 'this is test message', required: true })
  @IsString()
  message!: string;
}

export class SendCommunication {
  @ApiProperty({
    example: '1234-546-2435-345',
    required: true,
    description: 'UUID of the communication',
  })
  @IsString()
  @IsUUID()
  id!: string;
}

// export class SendBulkSms {
//   @ApiProperty({ example: '09876-4567-0987-4567', required: true })
//   @IsArray()
//   benIds!: string[];

//   @ApiProperty({ example: 'Hi the alert message', required: true })
//   @IsString()
//   message!: string;
// }
export class CommunicationHistoryQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (1-based)',
    default: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  limit?: number = 20;
}

export class ListCommunicationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (1-based)',
    default: 1,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page',
    default: 20,
  })
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({
    example: 'SMS',
    description: 'Filter by communication type (SMS, IVR)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: 'DELIVERED',
    description:
      'Filter by communication status (CREATED, SENDING, DELIVERED, FAILED)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

// export class GetCommunicatonHistory {
//   @ApiProperty({
//     example: '1234-546-2435-345',
//     required: true,
//     description: 'UUID of the communication',
//   })
//   @IsString()
//   @IsUUID()
//   id!: string;
// }
