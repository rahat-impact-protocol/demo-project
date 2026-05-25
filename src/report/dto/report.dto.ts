import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TxnReportDto {
  @ApiProperty({ example: 1, required: false })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({ example: 1, required: false })
  @IsString()
  @IsOptional()
  perPage?: string;
}
