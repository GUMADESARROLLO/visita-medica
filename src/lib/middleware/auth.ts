import type { APIContext, MiddlewareNext } from 'astro';
import { verifyToken, type JWTPayload } from '../auth/index';

export interface AuthRequest extends APIContext {
  user?: JWTPayload;
}

export function requireAuth(roles?: string[]) {
  return async (context: APIContext, next: MiddlewareNext) => {
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') ||
      context.cookies.get('token')?.value;

    if (!token) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Sesion expirada' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (roles && roles.length > 0 && !roles.includes(payload.rol)) {
      return new Response(JSON.stringify({ error: 'Permisos insuficientes' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    (context as AuthRequest).user = payload;
    return next();
  };
}

export function getCurrentUser(context: APIContext): JWTPayload | undefined {
  return (context as AuthRequest).user;
}
