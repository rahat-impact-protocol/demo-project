import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DisbursementType } from '@prisma/client';

export interface DisbursementDataDto {
  tokenAddress: string;
  benAddress: string[];
  amount: string[];
  totalAmount: string;
  projectAddress: string;
  decimal: number;
}

export interface DisbursementRequestDto {
  projectId: string;
  requestData: {
    data: DisbursementDataDto;
  };
  serviceTags: string[];
}

export class CreateDisbursementDto {
  @ApiProperty({ example: '0x1234', required: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  benAddress!: string[];

  @ApiProperty({ example: 10, required: true })
  @IsNumber()
  amount!: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  totalBen?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiProperty({ example: 'test', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'test disbursement', required: false })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({ example: 'test disbursement', required: false })
  @IsString()
  type?: DisbursementType;
}

export class CreateGroupDisbursementDto {
  @ApiProperty({ example: '2', required: true })
  groupId!: number;

  @ApiProperty({ example: '20', required: true })
  amount!: number;

  @ApiProperty({ example: '5', required: true })
  @IsOptional()
  totalBen?: number;

  @ApiProperty({ example: '100', required: false })
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ example: 'test disbursement', required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'test disbursement', required: false })
  @IsOptional()
  type?: DisbursementType;
}
