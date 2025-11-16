import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto, SendEmailDto } from './dto/subscriber.dto';

@Controller('api/subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Get()
  findAll() {
    return this.subscribersService.findAll();
  }

  @Post('subscribe')
  subscribe(@Body() createSubscriberDto: CreateSubscriberDto) {
    return this.subscribersService.subscribe(createSubscriberDto);
  }

  @Delete('unsubscribe/:email')
  unsubscribe(@Param('email') email: string) {
    return this.subscribersService.unsubscribe(email);
  }

  @Post('send-email')
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.subscribersService.sendPostByEmail(
      sendEmailDto.email,
      sendEmailDto.postId,
    );
  }
}
