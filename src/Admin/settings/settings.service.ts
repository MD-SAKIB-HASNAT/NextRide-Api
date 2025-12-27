import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting } from './schemas/system-setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SystemSetting.name) private settingsModel: Model<SystemSetting>,
  ) {}

  async getSettings(): Promise<SystemSetting> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = new this.settingsModel({});
      await settings.save();
    }
    return settings;
  }

  async updateSettings(update: Partial<SystemSetting>): Promise<SystemSetting> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = new this.settingsModel({});
    }
    Object.assign(settings, update);
    await settings.save();
    return settings;
  }
}
