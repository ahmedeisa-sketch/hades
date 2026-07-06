import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RedemptionStatus } from '@prisma/client';

export class TransitionRedemptionDto {
  @ApiProperty({ enum: RedemptionStatus })
  @IsEnum(RedemptionStatus)
  toStatus: RedemptionStatus;

  @ApiPropertyOptional({ description: 'Payment reference — recorded when moving to PAID' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
