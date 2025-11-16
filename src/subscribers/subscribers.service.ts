import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { CreateSubscriberDto } from './dto/subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll() {
    return this.prisma.subscriber.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async subscribe(createSubscriberDto: CreateSubscriberDto) {
    const existing = await this.prisma.subscriber.findUnique({
      where: { email: createSubscriberDto.email },
    });

    if (existing && existing.active) {
      throw new ConflictException('Email already subscribed');
    }

    if (existing) {
      return this.prisma.subscriber.update({
        where: { email: createSubscriberDto.email },
        data: { active: true },
      });
    }

    return this.prisma.subscriber.create({
      data: createSubscriberDto,
    });
  }

  async unsubscribe(email: string) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      throw new NotFoundException('Email not found');
    }

    return this.prisma.subscriber.update({
      where: { email },
      data: { active: false },
    });
  }

  async notifyNewPost(post: any) {
    const subscribers = await this.findAll();
    const emails = subscribers.map((s) => s.email);

    if (emails.length > 0) {
      await this.emailService.sendNewPostNotification(post, emails);
    }
  }

  async sendPostByEmail(email: string, postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.emailService.sendPostToEmail(email, post);
    return { message: 'Email sent successfully' };
  }
}
