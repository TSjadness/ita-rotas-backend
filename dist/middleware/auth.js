import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/http.js';
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return fail(res, 'Token não enviado.', 401);
    }
    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        req.user = payload;
        next();
    }
    catch {
        return fail(res, 'Token inválido ou expirado.', 401);
    }
}
