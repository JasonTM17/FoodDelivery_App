import { Module, forwardRef } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { StorageModule } from '@/storage/storage.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [forwardRef(() => AuthModule), StorageModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
