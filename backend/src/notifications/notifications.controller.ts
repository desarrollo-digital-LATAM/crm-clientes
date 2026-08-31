import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SessionAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Query() query: QueryNotificationsDto, @CurrentUser() user: AuthenticatedUser) { return this.notificationsService.findAll(query, user.id); }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) { return this.notificationsService.unreadCount(user.id); }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) { return this.notificationsService.markAllRead(user.id); }

  @Patch(':id/read')
  markRead(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() user: AuthenticatedUser) { return this.notificationsService.markRead(id, user.id); }
}
