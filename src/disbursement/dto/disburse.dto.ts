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
