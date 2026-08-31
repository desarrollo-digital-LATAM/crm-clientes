import { IsDateString, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  @Length(2, 150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsDateString()
  dueAt!: string;

  @IsOptional()
  @IsUUID()
  leadId?: string | null;
}

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string | null;

  @IsOptional()
  @IsUUID()
  leadId?: string | null;
}
