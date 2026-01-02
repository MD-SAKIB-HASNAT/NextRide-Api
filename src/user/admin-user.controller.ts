import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';
import { UserService } from './user.service';
import { FilterUserDto } from './dto/filter-user.dto';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async listUsers(
    @Query() filter: FilterUserDto,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.userService.listUsers(filter, page);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(id, body.status);
  }
}
