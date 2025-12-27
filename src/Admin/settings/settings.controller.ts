import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';

@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getSettings(@Request() req: any) {
    return this.settingsService.getSettings();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch()
  async updateSettings(@Request() req: any, @Body() update: any) {
    return this.settingsService.updateSettings(update);
  }
}
