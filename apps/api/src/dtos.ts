import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, Max, Min, MinLength, IsDateString, IsEmail } from 'class-validator';
import { LABEL_OPTIONS, SOURCE_PLATFORM_OPTIONS } from '@group-watch/shared';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto extends RegisterDto {}

export class UpdateApifyTokenDto {
  @IsString()
  @MinLength(10)
  token!: string;
}

export class TestApifyTokenDto extends UpdateApifyTokenDto {}

export class SourceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(SOURCE_PLATFORM_OPTIONS)
  platform!: (typeof SOURCE_PLATFORM_OPTIONS)[number];

  @IsUrl()
  groupUrl!: string;

  @IsOptional()
  @IsString()
  groupExternalId?: string;

  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @IsObject()
  actorInputJson!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSourceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(SOURCE_PLATFORM_OPTIONS)
  platform?: (typeof SOURCE_PLATFORM_OPTIONS)[number];

  @IsOptional()
  @IsUrl()
  groupUrl?: string;

  @IsOptional()
  @IsString()
  groupExternalId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  actorId?: string;

  @IsOptional()
  @IsObject()
  actorInputJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PostsQueryDto {
  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsIn(LABEL_OPTIONS)
  label?: (typeof LABEL_OPTIONS)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export class UpdateLabelDto {
  @IsIn(LABEL_OPTIONS)
  label!: (typeof LABEL_OPTIONS)[number];

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpsertDraftDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
