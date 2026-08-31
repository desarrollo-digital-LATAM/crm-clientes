import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateReminderDto, UpdateReminderDto } from './dto/reminder.dto';
import { QueryRemindersDto } from './dto/query-reminders.dto';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(SessionAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@Query() query: QueryRemindersDto, @CurrentUser() user: AuthenticatedUser) {
    return this.remindersService.findAll(query, user.id);
  }

  @Post()
  create(@Body() dto: CreateReminderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.remindersService.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateReminderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.remindersService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.remindersService.remove(id, user.id);
  }
}
