import mysql from 'mysql2/promise';
import { comparePassword, createToken } from '../../../lib/auth/index';
import { errorResponse, successResponse } from '../../../lib/utils/index';
import type { APIRoute } from 'astro';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'visitamedica',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return errorResponse('Usuario y contraseña requeridos', 400);
    }

    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.password, u.nombre, u.activo, u.rol_id as rolId, r.nombre as rolNombre
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE u.username = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [username]
    ) as [any[], any];

    const user = rows[0];

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

    await pool.execute(
      `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?`,
      [user.id]
    );

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rolNombre,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err.message, err.code);
    return errorResponse('Error del servidor', 500);
  }
};
