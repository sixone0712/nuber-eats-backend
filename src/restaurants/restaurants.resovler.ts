import { UpdateRestaurantDto } from './dtos/update-restaurant-dto';
import { RestaurantService } from './restaurants.sevice';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant-dto';
import { Restaurant } from './entities/restaurant.entity';
import { number } from 'joi';

@Resolver((of) => Restaurant)
export class ResturantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query((retruns) => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Mutation((returns) => Boolean)
  async createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(createRestaurantInput);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  @Mutation((returns) => Boolean)
  async updateRestaruant(
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.updateRestaruant(updateRestaurantDto);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
