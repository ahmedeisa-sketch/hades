import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { InvestorType } from '@prisma/client';

export class CreateInvestorDto {
  // General information
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsString()
  mobile: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  // Banking
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swift?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  virtualIban?: string;

  // Classification
  @ApiProperty({ enum: InvestorType })
  @IsEnum(InvestorType)
  investorType: InvestorType;

  // Relationship
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationshipManagerId?: string;
}
