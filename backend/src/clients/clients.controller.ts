import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/auth.guard';
import { ClientsService } from './clients.service';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@UseGuards(SessionAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Query() query: QueryClientsDto) { return this.clientsService.findAll(query); }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) { return this.clientsService.findOne(id); }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateClientDto) { return this.clientsService.update(id, dto); }
}
