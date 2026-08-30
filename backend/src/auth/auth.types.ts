import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'MEMBER';
};

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
