import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsJSON, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, Max, Min, MinLength } from 'class-validator';
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

  @IsEnum(SOURCE_PLATFORM_OPTIONS)
  platform!: (typeof SOURCE_PLATFORM_OPTIONS)[number];

  @IsUrl()
  groupUrl!: string;

  @IsOptional()
  @IsString()
  groupExternalId?: string;

  @IsString()
  actorId!: string;

  @IsObject()
  actorInputJson!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSourceDto extends SourceDto {}

export class PostsQueryDto {
  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsEnum(LABEL_OPTIONS)
  label?: (typeof LABEL_OPTIONS)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
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
  @IsEnum(LABEL_OPTIONS)
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
