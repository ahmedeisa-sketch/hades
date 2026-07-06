import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReviewStatus, RiskRating } from '@prisma/client';

export class UpdateComplianceDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  kycStatus?: ReviewStatus;

  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  sourceOfFundsStatus?: ReviewStatus;

  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  amlStatus?: ReviewStatus;

  @ApiPropertyOptional({ enum: RiskRating })
  @IsOptional()
  @IsEnum(RiskRating)
  riskRating?: RiskRating;
}
