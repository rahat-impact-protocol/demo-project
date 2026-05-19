import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class TxnReportDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  perPage?: number;
}
