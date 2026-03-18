import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApifyClient } from '@apify/client';
import { LabelState, ScrapeRunStatus, TriggerType } from '@prisma/client';
import type { JwtUser } from './common';
import {
  buildPagination,
  DeduplicationService,
  ensureOwned,
  hashContent,
  normalizeApifyRecord,
  normalizeDate,
  sanitizeToken,
} from './common';
import {
  PostsQueryDto,
  SourceDto,
  TestApifyTokenDto,
  UpdateApifyTokenDto,
  UpdateLabelDto,
  UpdateSourceDto,
  UpsertDraftDto,
} from './dtos';
import { JwtAuthGuard } from './passport';
import { PrismaService } from './prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  updateToken(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { apifyToken: token.trim() },
      select: { id: true, email: true, updatedAt: true },
    });
  }

  async deleteToken(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { apifyToken: null } });
    return { success: true };
  }

  async testToken(token: string) {
    const client = new ApifyClient({ token: token.trim() });
    const user = await client.user().get();
    return {
      success: true,
      username: user?.username ?? 'unknown',
      tokenPreview: sanitizeToken(token),
    };
  }
}

@Injectable()
export class SourcesService {
  constructor(private prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.source.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(userId: string, dto: SourceDto) {
    return this.prisma.source.create({
      data: { ...dto, userId, isActive: dto.isActive ?? true },
    });
  }

  async get(userId: string, id: string) {
    return ensureOwned(await this.prisma.source.findUnique({ where: { id } }), userId);
  }

  async update(userId: string, id: string, dto: UpdateSourceDto) {
    await this.get(userId, id);
    return this.prisma.source.update({ where: { id }, data: dto });
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.source.delete({ where: { id } });
    return { success: true };
  }

  async toggle(userId: string, id: string) {
    const source = await this.get(userId, id);
    return this.prisma.source.update({
      where: { id },
      data: { isActive: !source.isActive },
    });
  }
}

@Injectable()
export class ScrapingService {
  constructor(private prisma: PrismaService, private dedupe: DeduplicationService) {}

  async runForSource(
    userId: string,
    sourceId: string,
    triggerType: TriggerType = TriggerType.manual,
  ) {
    const source = ensureOwned(await this.prisma.source.findUnique({ where: { id: sourceId } }), userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.apifyToken) {
      throw new BadRequestException('Apify token is not configured.');
    }

    const run = await this.prisma.scrapeRun.create({
      data: { userId, sourceId, triggerType, status: ScrapeRunStatus.running },
    });

    try {
      const client = new ApifyClient({ token: user.apifyToken });
      const actorRun = await client
        .actor(source.actorId)
        .call(source.actorInputJson as Record<string, unknown>);

      if (!actorRun.defaultDatasetId) {
        throw new BadRequestException('The Apify actor run did not produce a dataset.');
      }

      const items = await client.dataset(actorRun.defaultDatasetId).listItems();
      const records = items.items as Record<string, unknown>[];
      let insertedCount = 0;
      let duplicateCount = 0;

      for (const rawRecord of records) {
        const normalized = normalizeApifyRecord(rawRecord);
        if (!normalized.url) {
          continue;
        }

        const publishedAt = normalizeDate(normalized.publishedAt);
        const contentHash = hashContent(normalized.text || normalized.url);
        const existing = await this.prisma.post.findFirst({
          where: this.dedupe.buildWhere(source.id, normalized),
        });

        if (existing) {
          duplicateCount += 1;
          await this.prisma.post.update({
            where: { id: existing.id },
            data: { lastSeenAt: new Date() },
          });
          continue;
        }

        await this.prisma.post.create({
          data: {
            userId,
            sourceId: source.id,
            externalPostId: normalized.externalPostId,
            postUrl: normalized.url,
            authorName: normalized.authorName,
            contentText: normalized.text,
            contentHash,
            publishedAt,
            rawPayloadJson: normalized.raw,
            label: { create: { userId, label: LabelState.unreviewed } },
          },
        });
        insertedCount += 1;
      }

      await this.prisma.source.update({
        where: { id: source.id },
        data: { lastSuccessfulRunAt: new Date() },
      });

      return this.prisma.scrapeRun.update({
        where: { id: run.id },
        data: {
          status:
            duplicateCount > 0 && insertedCount > 0
              ? ScrapeRunStatus.partial_success
              : ScrapeRunStatus.success,
          apifyRunId: actorRun.id,
          fetchedCount: records.length,
          insertedCount,
          duplicateCount,
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scraping failure';
      return this.prisma.scrapeRun.update({
        where: { id: run.id },
        data: {
          status: ScrapeRunStatus.failed,
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
    }
  }

  async runAll(userId: string, triggerType: TriggerType = TriggerType.manual) {
    const sources = await this.prisma.source.findMany({ where: { userId, isActive: true } });
    const results = [];
    for (const source of sources) {
      results.push(await this.runForSource(userId, source.id, triggerType));
    }
    return results;
  }

  @Cron(process.env.SCRAPE_CRON ?? '0 */6 * * *', {
    disabled: process.env.ENABLE_SCRAPE_SCHEDULER !== 'true',
  })
  async runScheduled() {
    const users = await this.prisma.user.findMany({
      where: {
        apifyToken: { not: null },
        sources: { some: { isActive: true } },
      },
      select: { id: true },
    });

    for (const user of users) {
      await this.runAll(user.id, TriggerType.scheduled);
    }
  }

  listRuns(userId: string) {
    return this.prisma.scrapeRun.findMany({
      where: { userId },
      include: { source: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRun(userId: string, id: string) {
    return ensureOwned(
      await this.prisma.scrapeRun.findUnique({ where: { id }, include: { source: true } }),
      userId,
    );
  }
}

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, query: PostsQueryDto) {
    const where: Record<string, unknown> = { userId };

    if (query.sourceId) {
      where.sourceId = query.sourceId;
    }

    if (query.search) {
      where.OR = [
        { contentText: { contains: query.search, mode: 'insensitive' } },
        { authorName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.publishedAt = {} as Record<string, Date>;
      if (query.dateFrom) {
        (where.publishedAt as Record<string, Date>).gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (where.publishedAt as Record<string, Date>).lte = new Date(query.dateTo);
      }
    }

    if (query.label) {
      where.label = { is: { label: query.label } };
    }

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: { source: true, label: true, draft: true },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return buildPagination(items, total, query.page, query.pageSize);
  }

  async get(userId: string, id: string) {
    return ensureOwned(
      await this.prisma.post.findUnique({
        where: { id },
        include: {
          source: true,
          label: true,
          draft: true,
          labelEvents: { orderBy: { createdAt: 'desc' } },
        },
      }),
      userId,
    );
  }

  async updateLabel(userId: string, postId: string, dto: UpdateLabelDto) {
    await this.get(userId, postId);

    const label = await this.prisma.postLabel.upsert({
      where: { userId_postId: { userId, postId } },
      update: { label: dto.label, note: dto.note },
      create: { userId, postId, label: dto.label, note: dto.note },
    });

    await this.prisma.postLabelEvent.create({
      data: { userId, postId, label: dto.label, note: dto.note },
    });

    return label;
  }

  async upsertDraft(userId: string, postId: string, content: string) {
    await this.get(userId, postId);
    return this.prisma.postDraft.upsert({
      where: { userId_postId: { userId, postId } },
      update: { content },
      create: { userId, postId, content },
    });
  }

  async deleteDraft(userId: string, postId: string) {
    await this.get(userId, postId);
    await this.prisma.postDraft.deleteMany({ where: { userId, postId } });
    return { success: true };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Put('apify-token')
  update(@Req() req: { user: JwtUser }, @Body() dto: UpdateApifyTokenDto) {
    return this.service.updateToken(req.user.sub, dto.token);
  }

  @Post('apify-token/test')
  test(@Body() dto: TestApifyTokenDto) {
    return this.service.testToken(dto.token);
  }

  @Delete('apify-token')
  remove(@Req() req: { user: JwtUser }) {
    return this.service.deleteToken(req.user.sub);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/sources')
export class SourcesController {
  constructor(
    private service: SourcesService,
    private scraping: ScrapingService,
  ) {}

  @Get()
  list(@Req() req: { user: JwtUser }) {
    return this.service.list(req.user.sub);
  }

  @Post()
  create(@Req() req: { user: JwtUser }, @Body() dto: SourceDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get(':id')
  get(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.get(req.user.sub, id);
  }

  @Put(':id')
  update(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
  ) {
    return this.service.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  delete(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.delete(req.user.sub, id);
  }

  @Post(':id/toggle')
  toggle(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.toggle(req.user.sub, id);
  }

  @Post(':id/run')
  run(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.scraping.runForSource(req.user.sub, id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/scraping')
export class ScrapingController {
  constructor(private service: ScrapingService) {}

  @Post('run-all')
  runAll(@Req() req: { user: JwtUser }) {
    return this.service.runAll(req.user.sub);
  }

  @Get('runs')
  list(@Req() req: { user: JwtUser }) {
    return this.service.listRuns(req.user.sub);
  }

  @Get('runs/:id')
  get(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.getRun(req.user.sub, id);
  }

  @Post('sources/:id/run')
  run(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.runForSource(req.user.sub, id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/posts')
export class PostsController {
  constructor(private service: PostsService) {}

  @Get()
  list(@Req() req: { user: JwtUser }, @Query() query: PostsQueryDto) {
    return this.service.list(req.user.sub, query);
  }

  @Get(':id')
  get(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.get(req.user.sub, id);
  }

  @Put(':id/label')
  updateLabel(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpdateLabelDto,
  ) {
    return this.service.updateLabel(req.user.sub, id, dto);
  }

  @Post(':id/draft')
  createDraft(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpsertDraftDto,
  ) {
    return this.service.upsertDraft(req.user.sub, id, dto.content);
  }

  @Put(':id/draft')
  updateDraft(
    @Req() req: { user: JwtUser },
    @Param('id') id: string,
    @Body() dto: UpsertDraftDto,
  ) {
    return this.service.upsertDraft(req.user.sub, id, dto.content);
  }

  @Delete(':id/draft')
  deleteDraft(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return this.service.deleteDraft(req.user.sub, id);
  }
}
