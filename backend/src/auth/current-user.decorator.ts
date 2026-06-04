import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Extract the authenticated user (or a specific field) from the request.
 *
 * The user object is populated by Passport after JWT validation in JwtStrategy.
 *
 * @example
 *   @Get('me')
 *   getProfile(@CurrentUser() user) { ... }
 *
 *   @Get('me/email')
 *   getEmail(@CurrentUser('email') email: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
