import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateLeadActivityDto } from './dto/activity.dto';
import { SessionAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
@UseGuards(SessionAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateLeadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.update(id, dto, user);
  }

  @Get(':id/activities')
  findActivities(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.leadsService.findActivities(id);
  }

  @Post(':id/activities')
  createActivity(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CreateLeadActivityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.createActivity(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.leadsService.remove(id);
  }
}
