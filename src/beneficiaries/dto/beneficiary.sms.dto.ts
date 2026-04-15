import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ArrayNotEmpty,
} from 'class-validator';
export class SendSms{
  @ApiPropertyOptional({example:'09876-4567-0987-4567', description:'Communication UUID'})
  @IsOptional()
  @IsUUID()
  communicationId?: string

  @ApiPropertyOptional({example:'09876-4567-0987-4567', description:'Alias of communication UUID'})
  @IsOptional()
  @IsUUID()
  smsId?: string
}

export class SendBulkSms{
    @ApiProperty({example:'09876-4567-0987-4567', required:true})
    @IsArray()
  benIds!:string[]

    @ApiProperty({example:'Hi the alert message', required:true})
    @IsString()
  message!:string
}
export class SmsHistoryQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;
}