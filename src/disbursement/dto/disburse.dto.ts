import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class DisbursementDataDto {
  tokenAddress: string;
  benAddress: string[];
  amount: number[];
  totalAmount: number;
  projectAddress:string
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
}

export class CreateGroupDisbursementDto{

  @ApiProperty({example:'2', required:true})
  groupId:number;
  

  @ApiProperty({example:'20', required:true})
  amount:number;

  @ApiProperty({example:'5', required:true})
  @IsOptional()
  totalBen?:number;

  @ApiProperty({example:'100', required:true})
  @IsOptional()
  totalAmount?:number;



  
}



