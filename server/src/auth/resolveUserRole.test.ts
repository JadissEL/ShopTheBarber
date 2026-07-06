import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUniqueUser: vi.fn(),
  findFirstBarber: vi.fn(),
  findFirstShopMember: vi.fn(),
  findUniqueSeller: vi.fn(),
  findUniqueCompany: vi.fn(),
  findUniqueAuthor: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../db/prisma', () => ({
  prisma: {
    users: {
      findUnique: mocks.findUniqueUser,
      update: mocks.updateUser,
    },
    barbers: { findFirst: mocks.findFirstBarber },
    shop_members: { findFirst: mocks.findFirstShopMember },
    seller_profiles: { findUnique: mocks.findUniqueSeller },
    company_accounts: { findUnique: mocks.findUniqueCompany },
    author_profiles: { findUnique: mocks.findUniqueAuthor },
  },
}));

import { resolveAndSyncUserRole } from './resolveUserRole';

describe('resolveAndSyncUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirstBarber.mockResolvedValue(null);
    mocks.findFirstShopMember.mockResolvedValue(null);
    mocks.findUniqueSeller.mockResolvedValue(null);
    mocks.findUniqueCompany.mockResolvedValue(null);
    mocks.findUniqueAuthor.mockResolvedValue(null);
    mocks.updateUser.mockResolvedValue({});
  });

  it('returns locked barber role from account_type without workspace queries', async () => {
    mocks.findUniqueUser.mockResolvedValue({
      role: 'barber',
      account_type: 'solo_barber',
      account_type_locked_at: '2026-01-01T00:00:00.000Z',
    });

    const role = await resolveAndSyncUserRole('u1', 'barber');

    expect(role).toBe('barber');
    expect(mocks.findFirstBarber).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('infers barber from independent barber workspace for legacy users', async () => {
    mocks.findUniqueUser.mockResolvedValue({
      role: 'client',
      account_type: null,
      account_type_locked_at: null,
    });
    mocks.findFirstBarber.mockResolvedValue({ id: 'b1', title: 'Independent Barber' });
    mocks.findFirstShopMember.mockResolvedValue(null);

    const role = await resolveAndSyncUserRole('u1', 'client');

    expect(role).toBe('barber');
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ role: 'barber', account_type: 'solo_barber' }),
      }),
    );
  });

  it('infers shop_owner from shop owner membership for legacy users', async () => {
    mocks.findUniqueUser.mockResolvedValue({
      role: 'client',
      account_type: null,
      account_type_locked_at: null,
    });
    mocks.findFirstBarber.mockResolvedValue({ id: 'b1', title: 'Shop Owner' });
    mocks.findFirstShopMember.mockResolvedValue({ id: 'm1' });

    const role = await resolveAndSyncUserRole('u1', 'client');

    expect(role).toBe('shop_owner');
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'shop_owner', account_type: 'shop' }),
      }),
    );
  });
});
