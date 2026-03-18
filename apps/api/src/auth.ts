import { Body, Controller, Get, Injectable, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from './prisma.service';
import { LoginDto, RegisterDto } from './dtos';
import type { JwtUser } from './common';
import { JwtAuthGuard } from './passport';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new UnauthorizedException('Email already registered.');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({ data: { email: dto.email.toLowerCase(), passwordHash } });
    return this.issueAuth(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    return this.issueAuth(user);
  }

  issueAuth(user: User) {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      accessToken,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      email: user.email,
      apifyTokenConfigured: Boolean(user.apifyToken),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: JwtUser }) {
    return this.authService.me(req.user.sub);
  }
}
