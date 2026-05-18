import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('')
  async createSetting(@Body() data: CreateSettingDto) {
    return this.settingsService.createSetting(data);
  }

  @Get('')
  async listSettings() {
    return this.settingsService.listPublicSettings();
  }

  @Get('/:name')
  async getSettingByName(@Param('name') name: string) {
    return this.settingsService.getSettingByName(name);
  }
}
