import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { InvestorStatus } from '@prisma/client';

/**
 * Previously `page`/`pageSize`/etc. were read as raw query strings and
 * passed straight to Number() in the controller — a non-numeric value
 * became NaN and reached Prisma's skip/take unvalidated (500 error), and
 * there was no upper bound on pageSize (a client could request an
 * arbitrarily large page). This DTO validates and clamps those inputs.
 */
export class QueryInvestorsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: InvestorStatus })
  @IsOptional()
  @IsEnum(InvestorStatus)
  status?: InvestorStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relationshipManagerId?: string;
}
