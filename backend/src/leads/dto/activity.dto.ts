import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateLeadActivityDto {
  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  description!: string;
}
