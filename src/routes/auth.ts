import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/http.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const router = Router();

const loginSchema = z.object({
  user: z.string().min(1),
  pass: z.string().min(1)
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, 'Dados de login inválidos.', 422, parsed.error.flatten());
  }

  const foundUser = await prisma.user.findUnique({
    where: { username: parsed.data.user }
  });

  if (!foundUser) {
    return fail(res, 'Usuário ou senha inválidos.', 401);
  }

  const validPassword = await bcrypt.compare(parsed.data.pass, foundUser.passwordHash);

  if (!validPassword) {
    return fail(res, 'Usuário ou senha inválidos.', 401);
  }

  const token = jwt.sign(
    { sub: foundUser.id, username: foundUser.username, role: foundUser.role },
    env.jwtSecret,
    { expiresIn: '8h' }
  );

  return ok(res, {
    token,
    user: {
      id: foundUser.id,
      username: foundUser.username,
      role: foundUser.role
    }
  });
});

export default router;