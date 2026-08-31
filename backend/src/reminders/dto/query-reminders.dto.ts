import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class QueryRemindersDto {
  @IsOptional()
  @IsIn(['pending', 'completed', 'all'])
  status: 'pending' | 'completed' | 'all' = 'pending';

  @IsOptional()
  @IsIn(['today', 'upcoming', 'overdue'])
  range?: 'today' | 'upcoming' | 'overdue';

  @IsOptional()
  @IsUUID()
  leadId?: string;
}
