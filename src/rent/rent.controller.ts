import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RentService } from './rent.service';
import { CreateRentVehicleDto } from './dto/create-rent-vehicle.dto';
import { FilterRentVehicleDto } from './dto/filter-rent-vehicle.dto';
import { UpdateRentVehicleStatusDto, UpdateRentVehicleAvailabilityDto } from './dto/update-rent-vehicle-status.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';
import { FileUploadService } from 'src/common/services/file-upload.service';

@Controller('rent')
export class RentController {
  constructor(
    private rentService: RentService,
    private fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      storage: new FileUploadService().getFieldStorage('rent-vehicles'),
      fileFilter: new FileUploadService().getFileFilter([
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
      ]),
    }),
  )
  async createRentVehicle(
    @Request() req: any,
    @Body() createDto: CreateRentVehicleDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const images = files?.images || [];
    
    // Validate at least one image is uploaded
    if (images.length === 0) {
      throw new BadRequestException('At least one image is required for the rent vehicle');
    }
    
    return this.rentService.createRentVehicle(createDto, userId, images);
  }

  @Get('public')
  async listPublicRentVehicles(@Query() filters: FilterRentVehicleDto) {
    return this.rentService.listRentVehicles(filters, false);
  }

  @Get('public/suggested')
  async getSuggestedRentVehicles() {
    return this.rentService.getSuggestedRentVehicles();
  }

  @Get('admin/list')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listAdminRentVehicles(@Query() filters: FilterRentVehicleDto) {
    return this.rentService.listRentVehicles(filters, true);
  }

  @Get('my-listings')
  @UseGuards(AuthGuard)
  async getMyRentVehicles(
    @Request() req: any,
    @Query() filters: FilterRentVehicleDto,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.rentService.getMyRentVehicles(userId, filters);
  }

  @Get(':id')
  async getRentVehicleById(@Param('id') id: string) {
    return this.rentService.getRentVehicleById(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRentVehicleStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateRentVehicleStatusDto,
  ) {
    const adminId = req.user?.userId || req.user?.id;
    return this.rentService.updateRentVehicleStatus(
      id,
      updateDto.status,
      adminId,
    );
  }

  @Patch(':id/availability')
  @UseGuards(AuthGuard)
  async updateRentVehicleAvailability(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateRentVehicleAvailabilityDto,
  ) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.rentService.updateRentVehicleAvailability(
      id,
      updateDto.availability,
      userId,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteRentVehicle(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return this.rentService.deleteRentVehicle(id, userId);
  }
}
