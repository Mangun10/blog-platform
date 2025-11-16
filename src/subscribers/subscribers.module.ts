import { Module } from '@nestjs/common';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { EmailService } from './email.service';

@Module({
  controllers: [SubscribersController],
  providers: [SubscribersService, EmailService],
  exports: [SubscribersService, EmailService],
})
export class SubscribersModule {}
