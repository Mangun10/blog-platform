import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { creation_date: 'desc' },
      include: {
        comments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(id) },
      include: {
        comments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async create(createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        creation_date: new Date(),
        category: 'General',
        likes: 0,
        shares: 0,
      },
    });
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    await this.findOne(id);
    
    return this.prisma.post.update({
      where: { id: BigInt(id) },
      data: updatePostDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.post.delete({
      where: { id: BigInt(id) },
    });
  }

  async like(id: number) {
    const post = await this.findOne(id);
    
    return this.prisma.post.update({
      where: { id: BigInt(id) },
      data: {
        likes: post.likes + 1,
      },
    });
  }

  async share(id: number) {
    const post = await this.findOne(id);
    
    return this.prisma.post.update({
      where: { id: BigInt(id) },
      data: {
        shares: post.shares + 1,
      },
    });
  }
}
