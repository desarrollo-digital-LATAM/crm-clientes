import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { LeadStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() || undefined : value;

export class QueryLeadsDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @Transform(trim)
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  source?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  serviceInterest?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'nextFollowUpAt', 'status'])
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'nextFollowUpAt' | 'status' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
