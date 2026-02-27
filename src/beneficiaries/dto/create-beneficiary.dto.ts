import { DisbursementStatus } from '@prisma/client';
import { IsString, IsOptional } from 'class-validator';

export class CreateBeneficiaryDto {
	@IsString()
	walletAddress: string;

	@IsString()
    @IsOptional()
	requestId: string;

	@IsOptional()
	@IsString()
	disbursementStatus?: DisbursementStatus;
}
