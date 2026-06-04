import { db } from '../../../lib/db';
import { especialidades } from '../../../lib/db/schema/index';
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
      return errorResponse('ID inválido', 400);
    }

    const [record] = await db
      .select()
      .from(especialidades)
      .where(and(eq(especialidades.id, id), isNull(especialidades.deletedAt)));

    if (!record) {
      return errorResponse('Especialidad no encontrada', 404);
    }

    return successResponse(record);
  } catch (err) {
    console.error('Especialidades [id] GET error:', err);
    return errorResponse('Error al obtener especialidad', 500);
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
      return errorResponse('ID inválido', 400);
    }

    const [existing] = await db
      .select()
      .from(especialidades)
      .where(and(eq(especialidades.id, id), isNull(especialidades.deletedAt)));

    if (!existing) {
      return errorResponse('Especialidad no encontrada', 404);
    }

    const body = await request.json();

    if (!body.nombre || !body.nombre.trim()) {
      return errorResponse('El nombre es requerido', 400);
    }

    await db
      .update(especialidades)
      .set({
        nombre: body.nombre.trim(),
        descripcion: body.descripcion ?? existing.descripcion,
        activo: body.activo !== undefined ? body.activo : existing.activo,
      })
      .where(eq(especialidades.id, id));

    const [updated] = await db
      .select()
      .from(especialidades)
      .where(eq(especialidades.id, id));

    return successResponse(updated);
  } catch (err: any) {
    console.error('Especialidades [id] PUT error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe una especialidad con ese nombre', 409);
    }
    return errorResponse('Error al actualizar especialidad', 500);
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
      return errorResponse('ID inválido', 400);
    }

    const [existing] = await db
      .select()
      .from(especialidades)
      .where(and(eq(especialidades.id, id), isNull(especialidades.deletedAt)));

    if (!existing) {
      return errorResponse('Especialidad no encontrada', 404);
    }

    await db
      .update(especialidades)
      .set({ deletedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
      .where(eq(especialidades.id, id));

    return successResponse({ message: 'Especialidad eliminada correctamente' });
  } catch (err) {
    console.error('Especialidades [id] DELETE error:', err);
    return errorResponse('Error al eliminar especialidad', 500);
  }
};
