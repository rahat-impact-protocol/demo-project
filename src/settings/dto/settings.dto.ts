import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettingDataType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSettingDto {
  @ApiProperty({ example: 'contract', required: true })
  @IsString()
  name!: string;

  @ApiProperty({
    example: { token: { address: '0x123' } },
    required: true,
    description: 'JSON payload for the setting value',
  })
  value!: unknown;

  @ApiProperty({ example: 'OBJECT', enum: SettingDataType, required: true })
  @IsEnum(SettingDataType)
  dataType!: SettingDataType;

  @ApiPropertyOptional({
    example: ['token.address'],
    description: 'Field paths required to be present in the value object',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  isReadOnly!: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  isPrivate!: boolean;
}
