import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PageInfo {
  nextCursor?: string;
  hasNextPage: boolean;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pageInfo: PageInfo;
}

@Injectable()
export class PaginationService {
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  clampLimit(limit?: number): number {
    const l = limit || this.DEFAULT_LIMIT;
    return Math.min(Math.max(l, 1), this.MAX_LIMIT);
  }

  encodeCursor(id: string | Types.ObjectId): string {
    const raw = typeof id === 'string' ? id : id.toString();
    return Buffer.from(raw, 'utf8').toString('base64');
  }

  decodeCursor(cursor?: string): Types.ObjectId | null {
    if (!cursor) return null;
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      if (!Types.ObjectId.isValid(decoded)) return null;
      return new Types.ObjectId(decoded);
    } catch {
      return null;
    }
  }

  buildResponse<T extends { _id?: any }>(items: T[], limit: number): PaginatedResult<T> {
    const hasNextPage = items.length > limit;
    const data = hasNextPage ? items.slice(0, limit) : items;

    const last = data[data.length - 1];
    const nextCursor = last && last._id ? this.encodeCursor(last._id) : undefined;

    return {
      data,
      pageInfo: {
        nextCursor,
        hasNextPage,
        limit,
      },
    };
  }
}
