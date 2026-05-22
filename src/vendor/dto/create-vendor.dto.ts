import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ example: '0x1234', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ example: 'joe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+977956', required: true })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ example: 'joe@email.com', required: false })
  @IsString()
  email!: string;

  @ApiProperty({ example: 'GOOGLE', required: false })
  @IsString()
  @IsOptional()
  authProvider?: string;

  @ApiProperty({ example: 'google-sub-123', required: false })
  @IsString()
  @IsOptional()
  providerSubject?: string;
}

export class VendorLoginDto {
  @ApiProperty({ example: 'vendor@email.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+977956', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'GOOGLE', required: false })
  @IsString()
  @IsOptional()
  authProvider?: string;

  @ApiProperty({ example: 'google-sub-123', required: false })
  @IsString()
  @IsOptional()
  providerSubject?: string;
}

export class UpdateVendorDto {
  @ApiProperty({ example: 'joe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'joe', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({ example: '+977956', required: true })
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'joe@email.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;
}

export class ListVendorDto {
  @ApiProperty({ example: 'joe', required: false })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({ example: '+977956', required: true })
  @IsString()
  perPage?: string;

  @ApiProperty({ example: 'joe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+977956', required: true })
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: '0x22f456', required: false })
  @IsString()
  @IsOptional()
  walletAddress?: string;
}

export class CreateClaimDto {
  @ApiProperty({ example: '1200', required: true })
  @IsString()
  amount!: string;

  @ApiProperty({ example: '0x1wrfgth', required: true })
  @IsString()
  benAddress!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '0', required: true })
  @IsString()
  claimId!: string;

  @ApiProperty({ example: '345678', required: true })
  @IsString()
  otp!: string;
}
