import { ApiProperty } from '@nestjs/swagger';
import { BankStatus, Gender } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsJSON,
  IsEnum,
  IsObject,
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

  @ApiProperty({ example: 'MALE', required: true })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '24', required: false })
  @IsOptional()
  age?: number;

  @ApiProperty({ example: 'BANKED', required: false })
  @IsEnum(BankStatus)
  @IsOptional()
  bankStatus?: BankStatus;

  @ApiProperty({ example: 'joe@email.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '{"id":"123"}', required: false })
  @IsObject()
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
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({ example: 1, required: false })
  @IsString()
  @IsOptional()
  perPage?: string;

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
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({ example: 1, required: false })
  @IsString()
  @IsOptional()
  perPage?: string;
}
