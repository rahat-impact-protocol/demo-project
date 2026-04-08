import { ApiProperty } from '@nestjs/swagger';
import { DisbursementStatus } from '@prisma/client';
import { IsString, IsOptional, IsJSON } from 'class-validator';

export class CreateVendorDto {
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
    phoneNumber:string


    @ApiProperty({example:'joe@email.com',required:false})
    @IsString()
    @IsOptional()
    email:string
    

    
}

export class UpdateVendorDto{

    @ApiProperty({example:'joe',required:false})
    @IsString()
    @IsOptional()
    name:string;


    @ApiProperty({example:'+977956',required:true})
    @IsString()
    phoneNumber:string


    @ApiProperty({example:'joe@email.com',required:false})
    @IsString()
    @IsOptional()
    email:string

}


export class ListVendorDto{

    @ApiProperty({example:'joe',required:false})
    @IsString()
    @IsOptional()
    page:string;

    @ApiProperty({example:'+977956',required:true})
    @IsString()
    perPage:string

    @ApiProperty({example:'joe',required:false})
    @IsString()
    @IsOptional()
    name:string;


    @ApiProperty({example:'+977956',required:true})
    @IsString()
    phoneNumber:string


    @ApiProperty({example:'0x22f456',required:false})
    @IsString()
    @IsOptional()
    walletAddress:string


}
