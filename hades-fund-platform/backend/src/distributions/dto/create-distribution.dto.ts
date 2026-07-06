import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateDistributionDto {
  @ApiProperty()
  @IsString()
  fundId: string;

  @ApiProperty({ description: 'Human-readable period, e.g. "2026-Q2"' })
  @IsString()
  distributionPeriod: string;

  @ApiProperty()
  @IsDateString()
  distributionDate: string;

  @ApiProperty({ description: 'Total amount to distribute across all unit holders (pro-rata)' })
  @IsNumber()
  @IsPositive()
  distributionAmount: number;

  @ApiPropertyOptional({
    description: 'Optional descriptive distribution percentage (e.g. 2.5 for 2.5%)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  distributionPct?: number;
}
