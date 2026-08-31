import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/auth.guard';
import { AutomationService } from './automation.service';

@Controller('automation')
@UseGuards(SessionAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('recommendations')
  recommendations() {
    return this.automationService.getRecommendations();
  }
}
