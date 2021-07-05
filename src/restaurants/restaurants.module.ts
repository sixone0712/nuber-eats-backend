import { Category } from './entities/cotegory.entity';
import { RestaurantService } from './restaurants.sevice';
import { Restaurant } from './entities/restaurant.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResturantResolver } from './restaurants.resovler';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [ResturantResolver, RestaurantService],
})
export class RestaurantsModule {}
