import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async health() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db-status')
  async dbStatus() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'Connected',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'Disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
