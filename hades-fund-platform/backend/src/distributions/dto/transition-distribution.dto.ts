import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DistributionStatus } from '@prisma/client';

export class TransitionDistributionDto {
  @ApiProperty({ enum: DistributionStatus })
  @IsEnum(DistributionStatus)
  toStatus: DistributionStatus;

  @ApiPropertyOptional({ description: 'Payment reference — recorded when moving to PAID' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
