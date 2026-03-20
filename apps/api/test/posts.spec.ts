import { PostsService } from '../src/features';

const prisma = {
  post: {
    findUnique: jest.fn(),
  },
  postLabel: {
    upsert: jest.fn(),
  },
  postLabelEvent: {
    create: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
} as any;

describe('PostsService label update', () => {
  const service = new PostsService(prisma);
  beforeEach(() => jest.clearAllMocks());

  it('updates label and writes audit event', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1' });
    prisma.postLabel.upsert.mockResolvedValue({ id: 'l1', label: 'relevant' });
    prisma.postLabelEvent.create.mockResolvedValue({ id: 'e1' });

    const result = await service.updateLabel('u1', 'p1', { label: 'relevant', note: 'Looks good' });

    expect(prisma.postLabel.upsert).toHaveBeenCalled();
    expect(prisma.postLabelEvent.create).toHaveBeenCalled();
    expect(result.label).toBe('relevant');
  });
});
