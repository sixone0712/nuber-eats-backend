import { Restaurant } from './../entities/restaurant.entity';
import { Field, InputType, OmitType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';

@InputType()
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'],
  //InputType,
) {}
