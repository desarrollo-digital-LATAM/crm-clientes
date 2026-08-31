import { UsersService } from './users.service';

describe('UsersService', () => {
  it('returns only active public user fields', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new UsersService({ user: { findMany } } as never);
    await service.findActive();
    expect(findMany).toHaveBeenCalledWith({ where: { active: true }, select: { id: true, name: true, email: true }, orderBy: [{ name: 'asc' }, { email: 'asc' }] });
  });
});
