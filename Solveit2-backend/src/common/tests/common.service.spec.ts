import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from '../common.service';
import { EntityMock } from './mocks/entity.mock';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/config.schema';
import { config } from '../../config';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
      ],
      providers: [CommonService],
    }).compile();

    service = module.get<CommonService>(CommonService);
  });

  describe('entity validation', () => {
    it('should throw a BadRequestException with one error', () => {
      const invalidEntity = new EntityMock('a!_a9{');
      expect(service.validateEntity(invalidEntity)).rejects.toThrow(
        'name must not have special characters',
      );
    });

    it('should throw a BadRequestException with multiple', () => {
      const invalidEntity = new EntityMock('a!');
      invalidEntity.id = 'invalid id';
      expect(service.validateEntity(invalidEntity)).rejects.toThrow(
        'id must be a UUID,\nname must not have special characters,\nname must be longer than or equal to 3 characters',
      );
    });

    it('should not throw a BadRequestException', () => {
      const validEntity = new EntityMock('Valid Name');
      expect(service.validateEntity(validEntity)).resolves.toBeUndefined();
    });
  });

  describe('error wrappers', () => {
    const mockPromise = (code: string) => {
      return new Promise((_, reject) => {
        const err = new Error('mock error') as unknown as Record<
          string,
          string
        >;
        err.code = code;
        reject(err);
      });
    };

    it('should throw a ConflictException if code is correct', async () => {
      await expect(
        service.throwDuplicateError(mockPromise('23505')),
      ).rejects.toThrow('Duplicated value in database');
      await expect(
        service.throwDuplicateError(mockPromise('23514')),
      ).rejects.toThrow('mock error');
    });

    it('should throw a InternalServerErrorException', async () => {
      await expect(
        service.throwInternalError(mockPromise('23514')),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('entity actions', () => {
    const entity = new EntityMock('Valid Name');

    it('check entity existence', () => {
      expect(() =>
        service.checkEntityExistence(entity, 'Entity'),
      ).not.toThrow();
      expect(() => service.checkEntityExistence(null, 'Entity')).toThrow(
        'Entity not found',
      );
      expect(() =>
        service.checkEntityExistence(undefined, 'Entity'),
      ).toThrow('Entity not found');
    });
  });

  describe('string manipulation', () => {
    it('should format names', () => {
      expect(service.formatName('hello whole world')).toBe('Hello Whole World');
      expect(service.formatName('\nvery\nbad     \n\n\n\n\n\n\n\n')).toBe(
        'Very Bad',
      );
      expect(
        service.formatName(
          '              Loads             of                 Spaces                   \n',
        ),
      ).toBe('Loads Of Spaces');
    });

    it('should generate a point slug', () => {
      expect(service.generatePointSlug("Sir' John Doe")).toBe('sir.john.doe');
      expect(service.generatePointSlug('Some-linked name')).toBe(
        'somelinked.name',
      );
      expect(service.generatePointSlug('Some_linked name')).toBe(
        'somelinked.name',
      );
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
