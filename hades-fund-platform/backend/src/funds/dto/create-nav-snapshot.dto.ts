import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsPositive } from 'class-validator';

export class CreateNavSnapshotDto {
  @ApiProperty({ description: 'The date this NAV applies to' })
  @IsDateString()
  asOfDate: string;

  @ApiProperty({ description: 'Net asset value per fund unit' })
  @IsNumber()
  @IsPositive()
  navPerUnit: number;

  @ApiProperty({ description: 'Total assets under management as of this date' })
  @IsNumber()
  @IsPositive()
  totalAum: number;
}
