import { Controller, Get, Param, Query } from '@nestjs/common';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';
import { FilterOrganizationDto } from './dto/filter-organization.dto';
import { OrganizationService } from './organization.service';

@Controller('organizations')
export class PublicOrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  async listActiveOrganizations(
    @Query() filter: FilterOrganizationDto,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.organizationService.listActiveOrganizations(filter, page);
  }

  @Get(':id')
  async getOrganization(@Param('id') id: string) {
    return this.organizationService.getActiveOrganizationById(id);
  }
}
