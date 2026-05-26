import { db } from '../../../lib/db';
import { usuarios, roles, sesiones } from '../../../lib/db/schema/index';
import { comparePassword, createToken } from '../../../lib/auth/index';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '../../../lib/utils/index';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('Usuario y contraseña requeridos', 400);
    }

    const [user] = await db
      .select({
        id: usuarios.id,
        username: usuarios.username,
        password: usuarios.password,
        nombre: usuarios.nombre,
        activo: usuarios.activo,
        rolId: usuarios.rolId,
        rolNombre: roles.nombre,
      })
      .from(usuarios)
      .innerJoin(roles, eq(usuarios.rolId, roles.id))
      .where(eq(usuarios.username, username))
      .limit(1);

    if (!user || user.activo === '0') {
      return errorResponse('Credenciales inválidas', 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return errorResponse('Credenciales inválidas', 401);
    }

    const token = await createToken({
      id: user.id,
      username: user.username,
      rol: user.rolNombre,
      rolId: user.rolId,
    });

    cookies.set('token', token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    await db.update(usuarios).set({ ultimoAcceso: new Date() }).where(eq(usuarios.id, user.id));

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rolNombre,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Error del servidor', 500);
  }
};
