import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class SendSms{
    @ApiProperty({example:'09876-4567-0987-4567', required:true})
    @IsString()
    benId:string

    @ApiProperty({example:'Hi the alert message', required:true})
    @IsString()
    message:string
}

export class SendBulkSms{
    @ApiProperty({example:'09876-4567-0987-4567', required:true})
    @IsArray()
    benIds:string[]

    @ApiProperty({example:'Hi the alert message', required:true})
    @IsString()
    message:string
}