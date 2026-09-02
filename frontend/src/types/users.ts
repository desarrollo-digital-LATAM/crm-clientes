export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  createdAt: string;
};

export type CreateUserPayload = { name: string; email: string; password: string };
export type UpdateUserPayload = { name?: string; email?: string; active?: boolean };
