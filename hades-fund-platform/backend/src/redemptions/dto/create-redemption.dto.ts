import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateRedemptionDto {
  @ApiProperty()
  @IsString()
  fundId: string;

  @ApiProperty({ description: 'Amount the investor wishes to redeem (units derived from latest NAV)' })
  @IsNumber()
  @IsPositive()
  requestAmount: number;
}
