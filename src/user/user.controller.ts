import { Controller, Get, Param, Put, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('summary')
  @UseGuards(AuthGuard)
  async getUserSummary(@Request() req: any) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.userService.getUserSummary(user.userId);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(AuthGuard)
  @Put('profile')
  @UseInterceptors(
    FileInterceptor('profilePhoto', {
      storage: new FileUploadService().getStorageConfig('profiles'),
      fileFilter: new FileUploadService().getFileFilter(['.jpg', '.jpeg', '.png', '.gif']),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    }),
  )
  async updateProfile(
    @Request() req,
    @Body() updateData: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateProfile(req.user.userId, updateData, file);
  }

  @UseGuards(AuthGuard)
  @Put('change-password')
  async changePassword(
    @Request() req,
    @Body() passwordData: ChangePasswordDto,
  ) {
    return this.userService.changePassword(req.user.userId, passwordData);
  }
}
