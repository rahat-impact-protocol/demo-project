import { ApiProperty } from '@nestjs/swagger';
import { DisbursementStatus, Gender } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsJSON,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class CreateBeneficiaryDto {
  @ApiProperty({ example: '0x1234', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ example: 'joe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+977956', required: true })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '+977956', required: true })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: 'joe@email.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '{"id":"123"}', required: false })
  @IsJSON()
  @IsOptional()
  extras?: JSON;
}

export class CreateBeneficiaryGroupDto {
  @ApiProperty({ example: 'Test Group', required: false })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Group created for testing', required: true })
  @IsString()
  description!: string;

  @ApiProperty({ example: '[1,2,3]', required: true })
  @IsString()
  beneficiariesId!: number[];
}

export class ListBeneficiaryDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  perPage?: number;

  @ApiProperty({ example: 'john', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+97798', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class ListBeneficiaryTxnDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  perPage?: number;
}
