import { PrismaClient, LabelState, SourcePlatform } from '@prisma/client';
import * as argon2 from 'argon2';
import { hashContent } from '../src/common';

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_DEMO !== 'true') return;

  const email = 'demo@example.com';
  const passwordHash = await argon2.hash('demo12345');
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  const source = await prisma.source.upsert({
    where: { id: 'demo-source' },
    update: {},
    create: {
      id: 'demo-source',
      userId: user.id,
      name: 'Demo Group Watch',
      platform: SourcePlatform.facebook_group,
      groupUrl: 'https://facebook.com/groups/demo-group',
      actorId: 'demo/actor',
      actorInputJson: { startUrls: ['https://facebook.com/groups/demo-group'] },
    },
  });

  const demoPosts = [
    {
      id: 'demo-post-1',
      externalPostId: 'ext-1',
      postUrl: 'https://facebook.com/groups/demo-group/posts/1',
      contentText: 'Looking for reliable group engagement tools.',
    },
    {
      id: 'demo-post-2',
      externalPostId: 'ext-2',
      postUrl: 'https://facebook.com/groups/demo-group/posts/2',
      contentText: 'Need a virtual assistant to manage member outreach.',
    },
  ];

  for (const post of demoPosts) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {},
      create: {
        id: post.id,
        userId: user.id,
        sourceId: source.id,
        externalPostId: post.externalPostId,
        postUrl: post.postUrl,
        contentText: post.contentText,
        contentHash: hashContent(post.contentText),
        rawPayloadJson: { seeded: true },
        label: { create: { userId: user.id, label: LabelState.unreviewed } },
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
