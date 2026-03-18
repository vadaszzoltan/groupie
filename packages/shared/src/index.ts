export const LABEL_OPTIONS = ['unreviewed', 'relevant', 'not_relevant'] as const;
export type LabelState = (typeof LABEL_OPTIONS)[number];

export const SOURCE_PLATFORM_OPTIONS = ['facebook_group'] as const;
export type SourcePlatform = (typeof SOURCE_PLATFORM_OPTIONS)[number];

export type TriggerType = 'manual' | 'scheduled';
export type ScrapeRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'partial_success';

export interface NormalizedPostInput {
  externalPostId?: string | null;
  url: string | null;
  text: string;
  authorName?: string | null;
  publishedAt?: string | Date | null;
  raw: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
