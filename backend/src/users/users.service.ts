import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hashPassword } from '../auth/password';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
  }

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: { name: dto.name.trim(), email: dto.email.trim().toLowerCase(), passwordHash: await hashPassword(dto.password) },
        select: publicUserSelect,
      });
    } catch (error) {
      this.throwIfDuplicateEmail(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const data = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
    };
    try {
      return await this.prisma.user.update({ where: { id }, data, select: publicUserSelect });
    } catch (error) {
      this.throwIfDuplicateEmail(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException('Usuario no encontrado.');
      throw error;
    }
  }

  async changePassword(id: string, password: string) {
    try {
      await this.prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) }, select: { id: true } });
      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException('Usuario no encontrado.');
      throw error;
    }
  }

  findActive() {
    return this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
  }

  private throwIfDuplicateEmail(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Ya existe un usuario con ese email.');
  }
}
