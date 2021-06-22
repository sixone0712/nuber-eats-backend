import { GqlExecutionContext } from '@nestjs/graphql';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlConetxt = GqlExecutionContext.create(context).getContext();
    const user = gqlConetxt['user'];
    return user;
  },
);
