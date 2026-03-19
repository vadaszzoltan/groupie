import { createHash } from 'crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LabelState, Prisma } from '@prisma/client';
import type { NormalizedPostInput, PaginatedResult } from '@group-watch/shared';

export interface JwtUser {
  sub: string;
  email: string;
}

export const hashContent = (value: string) => createHash('sha256').update(value).digest('hex');
export const sanitizeToken = (token: string | null | undefined) => {
  if (!token) return null;
  return `${token.slice(0, 4)}••••${token.slice(-2)}`;
};

export const buildPagination = <T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> => ({
  items,
  total,
  page,
  pageSize,
});

export const ensureOwned = <T extends { userId: string }>(record: T | null, userId: string): T => {
  if (!record) throw new NotFoundException();
  if (record.userId !== userId) throw new ForbiddenException();
  return record;
};

export const normalizeDate = (value?: Date | string | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeApifyRecord = (rawRecord: Record<string, unknown>): NormalizedPostInput => {
  const externalPostId = String(rawRecord.postId ?? rawRecord.id ?? rawRecord.externalPostId ?? '').trim() || null;
  const url = String(rawRecord.postUrl ?? rawRecord.url ?? rawRecord.link ?? '').trim() || null;
  const text = String(rawRecord.text ?? rawRecord.content ?? rawRecord.message ?? '').trim();
  const authorName = String(rawRecord.authorName ?? rawRecord.author ?? rawRecord.userName ?? '').trim() || null;
  const publishedAt = normalizeDate(rawRecord.publishedAt as string | null) ?? normalizeDate(rawRecord.timestamp as string | null);

  return {
    externalPostId,
    url,
    text,
    authorName,
    publishedAt,
    raw: rawRecord,
  };
};

@Injectable()
export class DeduplicationService {
  buildWhere(sourceId: string, input: NormalizedPostInput): Prisma.PostWhereInput {
    if (input.externalPostId) {
      return { sourceId, externalPostId: input.externalPostId };
    }
    if (input.url) {
      return { sourceId, postUrl: input.url };
    }
    const publishedAt = normalizeDate(input.publishedAt);
    if (!publishedAt) {
      throw new BadRequestException('Published date required when deduplicating by content hash.');
    }
    return { sourceId, contentHash: hashContent(input.text), publishedAt };
  }

  getDefaultLabel(): LabelState {
    return LabelState.unreviewed;
  }
}
