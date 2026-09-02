import { UsersService } from './users.service';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  it('returns only active public user fields', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new UsersService({ user: { findMany } } as never);
    await service.findActive();
    expect(findMany).toHaveBeenCalledWith({ where: { active: true }, select: { id: true, name: true, email: true }, orderBy: [{ name: 'asc' }, { email: 'asc' }] });
  });

  it('lists only public fields for every user', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new UsersService({ user: { findMany } } as never);
    await service.findAll();
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, email: true, active: true, createdAt: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
  });

  it('creates a normalized user with an Argon2id hash and public response', async () => {
    const create = jest.fn().mockImplementation(async ({ data, select }) => ({ id: '1', name: data.name, email: data.email, active: true, createdAt: new Date(), select }));
    const service = new UsersService({ user: { create } } as never);
    const result = await service.create({ name: ' Ana ', email: ' ANA@example.com ', password: 'CorrectPassword!' });
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({ name: 'Ana', email: 'ana@example.com' });
    expect(data.passwordHash).toMatch(/^\$argon2id\$v=19\$/);
    expect(await argon2.verify(data.passwordHash, 'CorrectPassword!')).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('changes only the password and stores a verifiable Argon2id hash', async () => {
    const update = jest.fn().mockResolvedValue({ id: '1' });
    const service = new UsersService({ user: { update } } as never);
    await expect(service.changePassword('1', 'AnotherPassword!')).resolves.toEqual({ success: true });
    const data = update.mock.calls[0][0].data;
    expect(data.passwordHash).toMatch(/^\$argon2id\$v=19\$/);
    expect(await argon2.verify(data.passwordHash, 'AnotherPassword!')).toBe(true);
    expect(data).not.toHaveProperty('password');
  });

  it('returns a conflict for a duplicate email', async () => {
    const create = jest.fn().mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'test' }));
    const service = new UsersService({ user: { create } } as never);
    await expect(service.create({ name: 'Ana', email: 'ana@example.com', password: 'CorrectPassword!' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates active state without physical deletion', async () => {
    const update = jest.fn().mockResolvedValue({ id: '1', name: 'Ana', email: 'ana@example.com', active: false, createdAt: new Date() });
    const service = new UsersService({ user: { update } } as never);
    await service.update('1', { active: false });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: '1' }, data: { active: false } }));
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.anything() }) }));
  });
});
