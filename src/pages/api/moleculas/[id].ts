import { db } from '../../../lib/db';
import { moleculas } from '../../../lib/db/schema/index';
import { eq, and, isNull } from 'drizzle-orm';
import { successResponse, errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, params }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return errorResponse('ID invalido', 400);
    }

    const [record] = await db
      .select()
      .from(moleculas)
      .where(and(eq(moleculas.id, id), isNull(moleculas.deletedAt)));

    if (!record) {
      return errorResponse('Molecula no encontrada', 404);
    }

    return successResponse(record);
  } catch (err) {
    console.error('Moleculas [id] GET error:', err);
    return errorResponse('Error al obtener molecula', 500);
  }
};

export const PUT: APIRoute = async ({ cookies, params, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return errorResponse('ID invalido', 400);
    }

    const [existing] = await db
      .select()
      .from(moleculas)
      .where(and(eq(moleculas.id, id), isNull(moleculas.deletedAt)));

    if (!existing) {
      return errorResponse('Molecula no encontrada', 404);
    }

    const body = await request.json();

    if (!body.nombre || !body.nombre.trim()) {
      return errorResponse('El nombre es requerido', 400);
    }

    await db
      .update(moleculas)
      .set({
        nombre: body.nombre.trim(),
        descripcion: body.descripcion !== undefined ? body.descripcion : existing.descripcion,
        activo: body.activo !== undefined ? body.activo : existing.activo,
      })
      .where(eq(moleculas.id, id));

    const [updated] = await db
      .select()
      .from(moleculas)
      .where(eq(moleculas.id, id));

    return successResponse(updated);
  } catch (err: any) {
    console.error('Moleculas [id] PUT error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe una molecula con ese nombre', 409);
    }
    return errorResponse('Error al actualizar molecula', 500);
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return errorResponse('ID invalido', 400);
    }

    const [existing] = await db
      .select()
      .from(moleculas)
      .where(and(eq(moleculas.id, id), isNull(moleculas.deletedAt)));

    if (!existing) {
      return errorResponse('Molecula no encontrada', 404);
    }

    await db
      .update(moleculas)
      .set({ deletedAt: new Date() })
      .where(eq(moleculas.id, id));

    return successResponse({ message: 'Molecula eliminada correctamente' });
  } catch (err) {
    console.error('Moleculas [id] DELETE error:', err);
    return errorResponse('Error al eliminar molecula', 500);
  }
};
