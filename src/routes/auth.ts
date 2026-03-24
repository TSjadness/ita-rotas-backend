import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { readDb } from '../services/db.js';
import { fail, ok } from '../utils/http.js';

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

  const db = await readDb();
  const foundUser = db.users.find((u) => u.username === parsed.data.user);

  if (!foundUser) {
    return fail(res, 'Usuário ou senha inválidos.', 401);
  }

  const validPassword = await bcrypt.compare(parsed.data.pass, foundUser.passwordHash);
  if (!validPassword) {
    return fail(res, 'Usuário ou senha inválidos.', 401);
  }

  // const validPassword =
  // (await bcrypt.compare(parsed.data.pass, foundUser.passwordHash)) ||
  // (foundUser.username === "admin" && parsed.data.pass === "123");

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
