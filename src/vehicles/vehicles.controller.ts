import {
  Controller,
  Post,
  Get,
  Patch,
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
import { UpdateRequestActionDto } from './dto/update-request-action.dto';
import { UpdateRequestFilterDto } from './dto/update-request-filter.dto';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';
import { FileUploadService } from 'src/common/services/file-upload.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/common/enums/user.enum';
import { VehicleType } from 'src/common/enums/vehicle.enum';

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

  @Get('public/filtered-listings')
  async getPublicVehiclesFiltered(
    @Request() req: any,
    @Query() filters: VehicleFilterDto,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.vehiclesService.getPublicVehiclesFiltered(filters, page);
  }


  @Get('filtered-listings')
  @UseGuards(AuthGuard)
  async getVehiclesFiltered(
    @Request() req: any,
    @Query() filters: VehicleFilterDto,
    @CursorPagination() page: PaginationParams,
  ) {
    const user = req.user;

    if (!user.userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.vehiclesService.getVehiclesFiltered(user, filters, page);
  }

  @Get(':id')
  async getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.getVehicleById(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  async deleteVehicle(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.vehiclesService.deleteVehicle(id, user);
  }

  @Post(':id/update-request')
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
  async createUpdateRequest(
    @Request() req: any,
    @Param('id') vehicleId: string,
    @Body() body: any,
    @UploadedFiles() files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    const user = req.user;
    if (!user || !user.userId) {
      throw new BadRequestException('User not authenticated');
    }

    const images = files?.images || [];
    const video = files?.video?.[0];

    return this.vehiclesService.createUpdateRequest(
      vehicleId,
      user.userId,
      body,
      images,
      video,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('status/:id')
  async updateVehicleStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateVehicleStatusDto,
  ) {
    return this.vehiclesService.updateVehicleStatus(id, body.status);
  }

  @Get('updates-requests/list')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getAllUpdateRequestsList(
    @Request() req: any,
    @CursorPagination() pagination: PaginationParams,
    @Query() filters: UpdateRequestFilterDto,
  ) {
    return this.vehiclesService.getAllUpdateRequestsList(pagination, req.user, filters);
  }

  @Patch('admin/update-requests/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async handleUpdateRequest(
    @Request() req: any,
    @Param('id') updateRequestId: string,
    @Body() dto: UpdateRequestActionDto,
  ) {
    const adminId = req.user?.userId || req.user?.id;
    return this.vehiclesService.handleUpdateRequest(
      updateRequestId,
      dto.action,
      adminId,
      dto.note,
    );
  }

}
