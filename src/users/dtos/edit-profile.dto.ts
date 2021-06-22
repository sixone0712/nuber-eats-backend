import { ObjectType, PickType, PartialType, InputType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from './../../common/dtos/output.dto';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password']),
) {}

@ObjectType()
export class EditProfileOutput extends CoreOutput {}
