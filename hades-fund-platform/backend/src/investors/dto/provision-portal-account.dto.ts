import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class ProvisionPortalAccountDto {
  @ApiPropertyOptional({
    description: 'Login email for the portal account. Defaults to the investor’s email.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Optional initial password. A secure temporary one is generated when omitted.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
