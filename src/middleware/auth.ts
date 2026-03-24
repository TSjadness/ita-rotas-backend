import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/http.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    username: string;
    role: 'admin';
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return fail(res, 'Token não enviado.', 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthenticatedRequest['user'];
    req.user = payload;
    next();
  } catch {
    return fail(res, 'Token inválido ou expirado.', 401);
  }
}
