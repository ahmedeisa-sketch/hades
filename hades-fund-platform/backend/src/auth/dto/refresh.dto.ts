import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  refreshToken: string;
}
