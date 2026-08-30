import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreatePublicLeadDto } from './dto/public-lead.dto';
import { LeadsService } from './leads.service';

@Controller('public/leads')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 600_000, limit: 5 } })
export class PublicLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePublicLeadDto) {
    if (dto.website && dto.website.trim() !== '') {
      return { success: true };
    }

    const { name, company, email, phone, serviceInterest, estimatedBudget, message } = dto;

    const lead = await this.leadsService.createPublic({
      name,
      company,
      email,
      phone,
      serviceInterest,
      estimatedBudget,
      message,
    });

    return { success: true, id: lead.id };
  }
}