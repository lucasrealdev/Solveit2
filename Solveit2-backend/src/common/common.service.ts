import { Dictionary } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { validate } from 'class-validator';

@Injectable()
export class CommonService {
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
}
