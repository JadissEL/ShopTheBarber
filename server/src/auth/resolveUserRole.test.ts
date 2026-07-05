import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirstBarber: vi.fn(),
  findFirstShopMember: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../db/prisma', () => ({
  prisma: {
    barbers: { findFirst: mocks.findFirstBarber },
    shop_members: { findFirst: mocks.findFirstShopMember },
    users: { update: mocks.updateUser },
  },
}));

import { resolveAndSyncUserRole } from './resolveUserRole';

describe('resolveAndSyncUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirstBarber.mockResolvedValue(null);
    mocks.findFirstShopMember.mockResolvedValue(null);
  });

  it('returns stored barber role without queries', async () => {
    const role = await resolveAndSyncUserRole('u1', 'barber');
    expect(role).toBe('barber');
    expect(mocks.findFirstBarber).not.toHaveBeenCalled();
  });

  it('infers barber from independent barber workspace', async () => {
    mocks.findFirstBarber.mockResolvedValue({ id: 'b1', title: 'Independent Barber' });
    mocks.findFirstShopMember.mockImplementation(({ where }) =>
      where?.role === 'owner' ? Promise.resolve({ id: 'm1' }) : Promise.resolve(null),
    );

    const role = await resolveAndSyncUserRole('u1', 'client');

    expect(role).toBe('barber');
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ role: 'barber' }),
      }),
    );
  });

  it('infers shop_owner from shop owner title', async () => {
    mocks.findFirstBarber.mockResolvedValue({ id: 'b1', title: 'Shop Owner' });
    mocks.findFirstShopMember.mockImplementation(({ where }) =>
      where?.role === 'owner' ? Promise.resolve({ id: 'm1' }) : Promise.resolve(null),
    );

    const role = await resolveAndSyncUserRole('u1', 'client');

    expect(role).toBe('shop_owner');
  });
});
