import { SourcesService } from '../src/features';

const prisma = {
  source: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

describe('SourcesService CRUD', () => {
  const service = new SourcesService(prisma);
  beforeEach(() => jest.clearAllMocks());

  it('creates and toggles a source', async () => {
    prisma.source.create.mockResolvedValue({ id: 's1', userId: 'u1', isActive: true });
    prisma.source.findUnique.mockResolvedValue({ id: 's1', userId: 'u1', isActive: true });
    prisma.source.update.mockResolvedValue({ id: 's1', userId: 'u1', isActive: false });

    await service.create('u1', { name: 'Source', platform: 'facebook_group', groupUrl: 'https://example.com', actorId: 'actor', actorInputJson: {} });
    const toggled = await service.toggle('u1', 's1');

    expect(prisma.source.create).toHaveBeenCalled();
    expect(toggled.isActive).toBe(false);
  });
});
