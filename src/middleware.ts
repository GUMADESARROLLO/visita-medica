import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth/index';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return next();
  }

  if (pathname.startsWith('/_astro') || pathname.startsWith('/favicon') || pathname.startsWith('/public')) {
    return next();
  }

  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || context.cookies.get('token')?.value;

  if (!token) {
    if (pathname === '/' || pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return context.redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    context.cookies.delete('token', { path: '/' });
    return context.redirect('/login');
  }

  context.locals.user = payload;

  return next();
});
