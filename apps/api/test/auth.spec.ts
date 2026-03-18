import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth';

const prisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
} as any;

describe('AuthService smoke', () => {
  const service = new AuthService(prisma, new JwtService({ secret: 'test-secret' }));

  beforeEach(() => jest.clearAllMocks());

  it('registers a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1', email: 'demo@example.com', createdAt: new Date(), passwordHash: 'hash' });

    const result = await service.register({ email: 'demo@example.com', password: 'password123' });

    expect(prisma.user.create).toHaveBeenCalled();
    expect(result.accessToken).toBeDefined();
  });
});
