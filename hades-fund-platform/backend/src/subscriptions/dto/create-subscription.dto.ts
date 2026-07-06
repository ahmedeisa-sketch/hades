import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  fundId: string;

  @ApiProperty({ description: 'Gross amount the investor subscribed' })
  @IsNumber()
  @IsPositive()
  subscriptionAmount: number;

  @ApiPropertyOptional({
    description:
      'Net amount actually allocated to units (after any fees). Defaults to subscriptionAmount when omitted.',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  allocationAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transferReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
