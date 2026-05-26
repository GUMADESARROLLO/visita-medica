import { db } from '../../../lib/db';
import { medios } from '../../../lib/db/schema/index';
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
      .from(medios)
      .where(and(eq(medios.id, id), isNull(medios.deletedAt)));

    if (!record) {
      return errorResponse('Medio no encontrado', 404);
    }

    return successResponse(record);
  } catch (err) {
    console.error('Medios [id] GET error:', err);
    return errorResponse('Error al obtener medio', 500);
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
      .from(medios)
      .where(and(eq(medios.id, id), isNull(medios.deletedAt)));

    if (!existing) {
      return errorResponse('Medio no encontrado', 404);
    }

    const body = await request.json();

    if (!body.nombre || !body.nombre.trim()) {
      return errorResponse('El nombre es requerido', 400);
    }

    await db
      .update(medios)
      .set({
        nombre: body.nombre.trim(),
        telefono: body.telefono ?? existing.telefono,
        email: body.email ?? existing.email,
        direccion: body.direccion ?? existing.direccion,
        contacto: body.contacto ?? existing.contacto,
        activo: body.activo !== undefined ? body.activo : existing.activo,
      })
      .where(eq(medios.id, id));

    const [updated] = await db
      .select()
      .from(medios)
      .where(eq(medios.id, id));

    return successResponse(updated);
  } catch (err: any) {
    console.error('Medios [id] PUT error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe un medio con ese nombre', 409);
    }
    return errorResponse('Error al actualizar medio', 500);
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
      .from(medios)
      .where(and(eq(medios.id, id), isNull(medios.deletedAt)));

    if (!existing) {
      return errorResponse('Medio no encontrado', 404);
    }

    await db
      .update(medios)
      .set({ deletedAt: new Date() })
      .where(eq(medios.id, id));

    return successResponse({ message: 'Medio eliminado correctamente' });
  } catch (err) {
    console.error('Medios [id] DELETE error:', err);
    return errorResponse('Error al eliminar medio', 500);
  }
};
