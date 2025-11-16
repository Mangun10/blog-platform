import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'main', 'resources', 'static'),
      exclude: ['/api*'],
    }),
    PrismaModule,
    PostsModule,
    CommentsModule,
    SubscribersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
