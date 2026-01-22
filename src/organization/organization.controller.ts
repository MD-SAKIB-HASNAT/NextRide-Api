import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';
import { OrganizationService } from './organization.service';
import { FilterOrganizationDto } from './dto/filter-organization.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';

@Controller('admin/organizations')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.createOrganization(dto);
  }

  @Get()
  async getAllOrganizations(
    @Query() filter: FilterOrganizationDto,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.organizationService.listOrganizations(filter, page);
  }

  @Get('pending')
  async getPendingOrganizations(
    @Query() filter: FilterOrganizationDto,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.organizationService.listPendingOrganizations(filter, page);
  }

  @Patch(':id/approve')
  async approveOrganization(@Param('id') id: string) {
    return this.organizationService.approveOrganization(id);
  }

  @Patch(':id/reject')
  async rejectOrganization(@Param('id') id: string) {
    return this.organizationService.rejectOrganization(id);
  }
}
