import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';
import { PaymentStatus, VehicleStatus } from 'src/common/enums/vehicle.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('vehicles')
export class VehiclesController {
  constructor(
    private vehiclesService: VehiclesService,
    private fileUploadService: FileUploadService,
  ) {}

  @Post('sell')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: new FileUploadService().getFieldStorage('vehicles'),
        fileFilter: new FileUploadService().getFileFilter(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']),
      },
    ),
  )
  async createVehicle(
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles() files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Request() req: any,
  ) {
   
    const user = req.user;
    const userId = user?.userId || user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated. Please login and try again.');
    }

    const images = files?.images || [];
    const video = files?.video?.[0];

    return this.vehiclesService.createVehicle(
      createVehicleDto,
      userId,
      images,
      video,
    );
  }

}
