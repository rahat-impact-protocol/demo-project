import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { DisbursementType } from "@prisma/client";

export class DisbursementDataDto {
  tokenAddress: string;
  benAddress: string[];
  amount: number[];
  totalAmount: number;
  projectAddress: string;
}

export class DisbursementRequestDto {
  projectId: string;
  requestData: {
    data: DisbursementDataDto;
  };
  serviceTags: string[];
}

export class CreateDisbursementDto {
  benAddress: string[];
  amount: number;
  totalBen?:number;
  totalAmount?:number;
  name?:string
  type?:DisbursementType
}

export class CreateGroupDisbursementDto {
  @ApiProperty({ example: '2', required: true })
  groupId: number;

  @ApiProperty({ example: '20', required: true })
  amount: number;

  @ApiProperty({ example: '5', required: true })
  @IsOptional()
  totalBen?: number;

  @ApiProperty({example:'100', required:false})
  @IsOptional()
  totalAmount?:number;


  @ApiProperty({example:'test disbursement', required:false})
  @IsOptional()
  name?:string;

  @ApiProperty({example:'test disbursement', required:false})
  @IsOptional()
  type?:DisbursementType; 
}
