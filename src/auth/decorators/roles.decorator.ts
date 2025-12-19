import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export enum AppRole {
  USER = 'USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
