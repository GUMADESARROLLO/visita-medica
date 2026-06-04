import { db } from '../../../lib/db';
import { visitadores, usuarios } from '../../../lib/db/schema/index';
import { eq, and, ne } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth/index';
import { successResponse, errorResponse } from '../../../lib/utils/index';

export const GET: APIRoute = async ({ request, params, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return errorResponse('ID invalido', 400);

    const result = await db
      .select({
        id: visitadores.id,
        codigo: visitadores.codigo,
        nombre: visitadores.nombre,
        email: visitadores.email,
        telefono: visitadores.telefono,
        activo: visitadores.activo,
        usuarioId: visitadores.usuarioId,
        deletedAt: visitadores.deletedAt,
        createdAt: visitadores.createdAt,
        updatedAt: visitadores.updatedAt,
        usuarioId_: usuarios.id,
        usuarioUsername: usuarios.username,
        usuarioEmail: usuarios.email,
        usuarioActivo: usuarios.activo,
      })
      .from(visitadores)
      .leftJoin(usuarios, eq(visitadores.usuarioId, usuarios.id))
      .where(eq(visitadores.id, id))
      .limit(1);

    if (!result.length || result[0].deletedAt) {
      return errorResponse('Visitador no encontrado', 404);
    }

    const mapped = {
      ...result[0],
      usuario: result[0].usuarioId_
        ? { id: result[0].usuarioId_, username: result[0].usuarioUsername, email: result[0].usuarioEmail, activo: result[0].usuarioActivo }
        : null,
      usuarioId_: undefined,
      usuarioUsername: undefined,
      usuarioEmail: undefined,
      usuarioActivo: undefined,
    };

    return successResponse(mapped);
  } catch (err) {
    console.error('Visitador get error:', err);
    return errorResponse('Error al obtener visitador', 500);
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return errorResponse('ID invalido', 400);

    const body = await request.json();
    const { codigo, nombre, email, telefono, activo } = body;

    const existing = await db
      .select({ id: visitadores.id, deletedAt: visitadores.deletedAt })
      .from(visitadores)
      .where(eq(visitadores.id, id))
      .limit(1);

    if (!existing.length || existing[0].deletedAt) {
      return errorResponse('Visitador no encontrado', 404);
    }

    if (codigo) {
      const dupe = await db
        .select({ id: visitadores.id })
        .from(visitadores)
        .where(and(eq(visitadores.codigo, codigo), ne(visitadores.id, id)))
        .limit(1);

      if (dupe.length > 0) {
        return errorResponse('El codigo ya existe', 400);
      }
    }

    const updateData: Record<string, any> = {};
    if (codigo !== undefined) updateData.codigo = codigo;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (activo !== undefined) updateData.activo = activo;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No hay campos para actualizar', 400);
    }

    await db.update(visitadores).set(updateData).where(eq(visitadores.id, id));

    return successResponse({ id, message: 'Visitador actualizado exitosamente' });
  } catch (err: any) {
    console.error('Visitador update error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('El codigo o email ya existe', 400);
    }
    return errorResponse('Error al actualizar visitador', 500);
  }
};

export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return errorResponse('ID invalido', 400);

    const existing = await db
      .select({ id: visitadores.id, deletedAt: visitadores.deletedAt, usuarioId: visitadores.usuarioId })
      .from(visitadores)
      .where(eq(visitadores.id, id))
      .limit(1);

    if (!existing.length || existing[0].deletedAt) {
      return errorResponse('Visitador no encontrado', 404);
    }

    await db
      .update(visitadores)
      .set({ deletedAt: new Date(), activo: '0' })
      .where(eq(visitadores.id, id));

    if (existing[0].usuarioId) {
      await db
        .update(usuarios)
        .set({ activo: '0', deletedAt: new Date() })
        .where(eq(usuarios.id, existing[0].usuarioId));
    }

    return successResponse({ id, message: 'Visitador eliminado exitosamente' });
  } catch (err) {
    console.error('Visitador delete error:', err);
    return errorResponse('Error al eliminar visitador', 500);
  }
};
