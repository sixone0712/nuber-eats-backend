import { ConfigService } from '@nestjs/config';
import { JwtModuleOption } from './../../dist/jwt/interfaces/jwt-module-options.interface.d';
import { CONFIG_OPTIONS } from './jwt.constants';
import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOption,
    private readonly configService: ConfigService,
  ) {}

  sign(userId: number): string {
    return jwt.sign({ id: userId }, this.options.privateKey);
    //return jwt.sign(payload, this.configService.get('PRIVATE_KEY'));
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
