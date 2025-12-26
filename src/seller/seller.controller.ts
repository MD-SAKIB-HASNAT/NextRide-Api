import { Controller, Get, Param } from '@nestjs/common';
import { SellerService } from './seller.service';
import { CursorPagination } from 'src/common/decorators/cursor-pagination.decorator';
import type { PaginationParams } from 'src/common/services/pagination.service';

@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get(':sellerId')
  async getSellerProfile(
    @Param('sellerId') sellerId: string,
    @CursorPagination() page: PaginationParams,
  ) {
    return this.sellerService.getSellerProfile(sellerId, page);
  }
}
