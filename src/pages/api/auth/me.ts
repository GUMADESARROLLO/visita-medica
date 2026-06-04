import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth/index';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    authenticated: true,
    user: payload,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
