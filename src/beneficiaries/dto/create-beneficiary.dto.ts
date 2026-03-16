import { ApiProperty } from '@nestjs/swagger';
import { DisbursementStatus } from '@prisma/client';
import { IsString, IsOptional, IsJSON } from 'class-validator';

export class CreateBeneficiaryDto {
	@ApiProperty({example:'0x1234',required:false})
	@IsString()
	@IsOptional()
	walletAddress: string;


	@ApiProperty({example:'joe',required:false})
	@IsString()
	@IsOptional()
	name:string;


	@ApiProperty({example:'+977956',required:true})
	@IsString()
	phone:string


	@ApiProperty({example:'joe@email.com',required:false})
	@IsString()
	@IsOptional()
	email:string
	

	@ApiProperty({example:'{"id":"123"}',required:false})
	@IsJSON()
	@IsOptional()
	extras:JSON
}

export class CreateBeneficiaryGroupDto{
	@ApiProperty({example:'Test Group',required:false})
	@IsString()
	name:string;


	@ApiProperty({example:'Group created for testing',required:true})
	@IsString()
	description:string


	@ApiProperty({example:'[1,2,3]',required:true})
	@IsString()
	beneficiariesId:number[]


	



}
