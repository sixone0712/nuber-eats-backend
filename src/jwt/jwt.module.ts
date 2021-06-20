import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtService } from './jwt.service';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModuleOption } from './jwt.interfaces';

@Module({})
@Global()
export class JwtModule {
  static forRoot(options: JwtModuleOption): DynamicModule {
    return {
      module: JwtModule,
      //providers: [JwtService],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        JwtService,
      ],
      exports: [JwtService],
    };
  }
}
