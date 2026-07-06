import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InvestorStatus } from '@prisma/client';

export class TransitionStageDto {
  @ApiProperty({ enum: InvestorStatus })
  @IsEnum(InvestorStatus)
  toStage: InvestorStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
