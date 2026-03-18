import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { envSchema } from './env';
import { PrismaService } from './prisma.service';
import { AuthController, AuthService } from './auth';
import { JwtStrategy } from './passport';
import { DeduplicationService } from './common';
import { PostsController, PostsService, ScrapingController, ScrapingService, SettingsController, SettingsService, SourcesController, SourcesService } from './features';
import { HealthController } from './health';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: configService.getOrThrow('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController, AuthController, SettingsController, SourcesController, ScrapingController, PostsController],
  providers: [PrismaService, AuthService, JwtStrategy, DeduplicationService, SettingsService, SourcesService, ScrapingService, PostsService],
})
export class AppModule {}
