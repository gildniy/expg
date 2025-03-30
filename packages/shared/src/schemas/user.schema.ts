import { z } from 'zod';
import { UserRole, AccountStatus } from '../types/user';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(AccountStatus),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  metadata: z.record(z.any()).optional(),
});