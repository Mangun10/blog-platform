import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByPostId(postId: number) {
    return this.prisma.comment.findMany({
      where: { post_id: BigInt(postId) },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(createCommentDto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        author: createCommentDto.author,
        post_id: BigInt(createCommentDto.postId),
        created_at: new Date(),
      },
    });
  }

  async remove(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return this.prisma.comment.delete({
      where: { id: BigInt(id) },
    });
  }
}
