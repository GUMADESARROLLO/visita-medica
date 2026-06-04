import { db } from '../../../lib/db';
import { medicos, especialidades, medicoProductos, productos } from '../../../lib/db/schema/index';
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
      .select()
      .from(medicos)
      .leftJoin(especialidades, eq(medicos.especialidadId, especialidades.id))
      .where(eq(medicos.id, id))
      .limit(1);

    if (!result.length || result[0].medicos.deletedAt) {
      return errorResponse('Medico no encontrado', 404);
    }

    const medicoProductosList = await db
      .select()
      .from(medicoProductos)
      .innerJoin(productos, eq(medicoProductos.productoId, productos.id))
      .where(eq(medicoProductos.medicoId, id));

    return successResponse({
      ...result[0].medicos,
      especialidad: result[0].especialidades || null,
      medicoProductos: medicoProductosList.map((row) => ({
        medicoId: row.medico_productos.medicoId,
        productoId: row.medico_productos.productoId,
        createdAt: row.medico_productos.createdAt,
        producto: row.productos,
      })),
    });
  } catch (err) {
    console.error('Medico get error:', err);
    return errorResponse('Error al obtener medico', 500);
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
    const { codigo, nombre, especialidadId, direccion, telefono, email, activo } = body;

    const existing = await db
      .select({ id: medicos.id, deletedAt: medicos.deletedAt })
      .from(medicos)
      .where(eq(medicos.id, id))
      .limit(1);

    if (!existing.length || existing[0].deletedAt) {
      return errorResponse('Medico no encontrado', 404);
    }

    if (codigo) {
      const dupe = await db
        .select({ id: medicos.id })
        .from(medicos)
        .where(and(eq(medicos.codigo, codigo), ne(medicos.id, id)))
        .limit(1);

      if (dupe.length > 0) {
        return errorResponse('El codigo ya existe', 400);
      }
    }

    const updateData: Record<string, any> = {};
    if (codigo !== undefined) updateData.codigo = codigo;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (especialidadId !== undefined) updateData.especialidadId = especialidadId || null;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (email !== undefined) updateData.email = email;
    if (activo !== undefined) updateData.activo = activo === true || activo === '1' ? '1' : '0';

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No hay campos para actualizar', 400);
    }

    await db.update(medicos).set(updateData).where(eq(medicos.id, id));

    return successResponse({ id, message: 'Medico actualizado exitosamente' });
  } catch (err: any) {
    console.error('Medico update error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('El codigo o email ya existe', 400);
    }
    return errorResponse('Error al actualizar medico', 500);
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
      .select({ id: medicos.id, deletedAt: medicos.deletedAt })
      .from(medicos)
      .where(eq(medicos.id, id))
      .limit(1);

    if (!existing.length || existing[0].deletedAt) {
      return errorResponse('Medico no encontrado', 404);
    }

    await db
      .update(medicos)
      .set({ deletedAt: new Date(), activo: '0' })
      .where(eq(medicos.id, id));

    return successResponse({ id, message: 'Medico eliminado exitosamente' });
  } catch (err) {
    console.error('Medico delete error:', err);
    return errorResponse('Error al eliminar medico', 500);
  }
};
