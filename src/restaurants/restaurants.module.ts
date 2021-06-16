import { ResturantResolver } from './restaurants.resovler';
import { Module } from '@nestjs/common';

@Module({
  providers: [ResturantResolver],
})
export class RestaurantsModule {}
