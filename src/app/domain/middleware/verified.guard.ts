import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  CanActivate,
} from '@nestjs/common';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Check if the route is marked as public
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true; // Allow access to public routes
    }
    if (!request.user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!request.user.isVerified) {
      throw new ForbiddenException('Email not verified.');
    }

    return true;
  }
}
