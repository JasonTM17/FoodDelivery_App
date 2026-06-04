import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
