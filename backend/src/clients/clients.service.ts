import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const sourceLeadSelect = { id: true, status: true, source: true, createdAt: true } as const;
const clientInclude = { sourceLead: { select: sourceLeadSelect } } as const;
const sortableFields = ['convertedAt', 'createdAt', 'updatedAt', 'name'] as const;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryClientsDto) {
    const where: Prisma.ClientWhereInput = query.search ? {
      OR: ['name', 'company', 'email', 'phone'].map((field) => ({ [field]: { contains: query.search, mode: 'insensitive' } })),
    } : {};
    const sortBy = sortableFields.includes(query.sortBy) ? query.sortBy : 'convertedAt';
    const skip = (query.page - 1) * query.limit;
    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({ where, include: clientInclude, orderBy: { [sortBy]: query.sortOrder }, skip, take: query.limit }),
      this.prisma.client.count({ where }),
    ]);
    return { data: clients, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, include: clientInclude });
    if (!client) throw new NotFoundException('Cliente no encontrado.');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    const current = await this.prisma.client.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Cliente no encontrado.');
    const email = dto.email === undefined ? current.email : dto.email;
    const phone = dto.phone === undefined ? current.phone : dto.phone;
    if (!email && !phone) throw new ConflictException('El cliente debe conservar un correo electrónico o un teléfono.');
    return this.prisma.client.update({ where: { id }, data: { name: dto.name, company: dto.company, email: dto.email, phone: dto.phone, notes: dto.notes }, include: clientInclude });
  }

  async convertLead(leadId: string, currentUser: AuthenticatedUser) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, name: true, company: true, email: true, phone: true, status: true } });
    if (!lead) throw new NotFoundException('Lead no encontrado.');
    if (lead.status !== LeadStatus.WON) throw new ConflictException('El lead debe estar en estado Ganado antes de convertirse en cliente.');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.client.findUnique({ where: { sourceLeadId: leadId } });
        if (existing) throw new ConflictException('Este lead ya fue convertido en cliente.');
        const client = await tx.client.create({ data: { name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, notes: null, sourceLeadId: lead.id }, include: clientInclude });
        await tx.leadActivity.create({ data: { leadId, userId: currentUser.id, type: ActivityType.NOTE, description: 'Lead convertido en cliente.' } });
        return client;
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Este lead ya fue convertido en cliente.');
      throw error;
    }
  }
}
