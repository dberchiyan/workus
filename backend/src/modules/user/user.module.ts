import { Module } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { UserService } from './service/user.service';

@Module({
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
