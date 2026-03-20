import { ApiProperty } from "@nestjs/swagger";

export class DisbursementDataDto {
  tokenAddress: string;
  benAddress: string[];
  amount: number[];
  totalAmount: number;
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
}

export class CreateGroupDisbursementDto{

  @ApiProperty({example:'2', required:true})
  groupId:number;
  

  @ApiProperty({example:'20', required:true})
  amount:number;
  
}



