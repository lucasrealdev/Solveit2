import { Dictionary, EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import slugify from 'slugify';
import { MessageMapper } from './mappers/message.mapper';
import { isNull, isUndefined } from './utils/validation.util';

@Injectable()
export class CommonService {
  private readonly loggerService: LoggerService;

  constructor(private readonly entityManager: EntityManager) {
    this.loggerService = new Logger(CommonService.name);
  }

  public async validateEntity(entity: Dictionary): Promise<void> {
    const errors = await validate(entity);
    const messages: string[] = [];

    for (const error of errors) {
      messages.push(...Object.values(error.constraints));
    }

    if (errors.length > 0) {
      throw new BadRequestException(messages.join(',\n'));
    }
  }

  public checkEntityExistence<T extends Dictionary>(
    entity: T | null | undefined,
    name: string,
  ): void {
    if (isNull(entity) || isUndefined(entity)) {
      throw new NotFoundException(`${name} not found`);
    }
  }

  public async saveEntity<T extends Dictionary>(
    entity: T,
    isNew = false,
  ): Promise<void> {
    await this.validateEntity(entity);

    if (isNew) {
      this.entityManager.persist(entity);
    }

    await this.throwDuplicateError(this.entityManager.flush());
  }

  public async removeEntity<T extends Dictionary>(entity: T): Promise<void> {
    await this.throwInternalError(this.entityManager.removeAndFlush(entity));
  }

  public async removeEntities<T extends Dictionary>(entities: T[]): Promise<void> {
    if (entities.length === 0) return;

    await this.throwInternalError(
      this.entityManager.removeAndFlush(entities)
    );
  }

  public async throwDuplicateError<T>(promise: Promise<T>, message?: string) {
    try {
      return await promise;
    } catch (error) {
      this.loggerService.error(error);

      if (error.code === '23505') {
        throw new ConflictException(message ?? 'Duplicated value in database');
      }

      throw new BadRequestException(error.message);
    }
  }

  public async throwInternalError<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      this.loggerService.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  public async throwUnauthorizedError<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      this.loggerService.error(error);
      throw new UnauthorizedException();
    }
  }

  public formatName(title: string): string {
    return title
      .trim()
      .replace(/\n/g, ' ')
      .replace(/\s\s+/g, ' ')
      .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
  }

  public generatePointSlug(str: string): string {
    return slugify(str, { lower: true, replacement: '.', remove: /['_\.\-]/g });
  }

  public generateMessage(message: string): MessageMapper {
    return new MessageMapper(message);
  }
}
