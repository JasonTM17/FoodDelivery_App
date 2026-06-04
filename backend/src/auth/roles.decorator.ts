import { SetMetadata } from '@nestjs/common'
import { UserRole } from '@prisma/client'

export const ROLES_KEY = 'roles'

/**
 * Declare required roles for a route handler or controller.
 * When no roles are specified, the route is accessible to any authenticated user.
 *
 * @example @Roles(UserRole.admin, UserRole.restaurant)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
