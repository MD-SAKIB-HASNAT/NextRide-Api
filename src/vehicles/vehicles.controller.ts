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
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { UserVehicleFilterDto } from './dto/user-vehicle-filter.dto';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';
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

  @Get('user/my-listings')
  @UseGuards(AuthGuard)
  async getUserVehicles(@Request() req: any, @CursorPagination() page: PaginationParams) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.vehiclesService.getUserVehicles(user.userId, page);
  }

  @Get('user/my-listings-filtered')
  @UseGuards(AuthGuard)
  async getUserVehiclesFiltered(
    @Request() req: any,
    @Query() filters: UserVehicleFilterDto,
    @CursorPagination() page: PaginationParams,
  ) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.vehiclesService.getUserVehiclesFiltered(user.userId, filters, page);
  }

  @Get('user/summary')
  @UseGuards(AuthGuard)
  async getUserSummary(@Request() req: any) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.vehiclesService.getUserSummary(user.userId);
  }

  @Get('type/:vehicleType')
  async getVehiclesByType(
    @Param('vehicleType') vehicleType: string,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.vehiclesService.getVehiclesByType(vehicleType, page);
  }

  @Get('type/:vehicleType/filter')
  async filterVehicles(
    @Param('vehicleType') vehicleType: string,
    @Query() filters: VehicleFilterDto,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.vehiclesService.filterVehicles(vehicleType, filters, page);
  }

  @Get(':id')
  async getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.getVehicleById(id);
  }

}
