import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationParams } from '../services/pagination.service';

export const CursorPagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationParams => {
    const request = ctx.switchToHttp().getRequest();
    const { limit, cursor } = request.query || {};

    const parsedLimit = parseInt(limit as string, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : undefined;

    return {
      limit: safeLimit ?? 20,
      cursor: typeof cursor === 'string' ? cursor : undefined,
    };
  },
);
