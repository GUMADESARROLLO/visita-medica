import { db } from '../../../../lib/db';
import { medicos, medicoProductos, productos } from '../../../../lib/db/schema/index';
import { eq, and } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { verifyToken } from '../../../../lib/auth/index';
import { successResponse, errorResponse } from '../../../../lib/utils/index';

export const GET: APIRoute = async ({ params, cookies }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const medicoId = parseInt(params.medicoId!);
    if (isNaN(medicoId)) return errorResponse('ID de medico invalido', 400);

    const existing = await db
      .select({ id: medicos.id, deletedAt: medicos.deletedAt })
      .from(medicos)
      .where(eq(medicos.id, medicoId))
      .limit(1);

    if (!existing.length || existing[0].deletedAt) {
      return errorResponse('Medico no encontrado', 404);
    }

    const result = await db
      .select({
        medicoId: medicoProductos.medicoId,
        productoId: medicoProductos.productoId,
        createdAt: medicoProductos.createdAt,
        producto: productos,
      })
      .from(medicoProductos)
      .innerJoin(productos, eq(medicoProductos.productoId, productos.id))
      .where(eq(medicoProductos.medicoId, medicoId));

    const allProductos = await db
      .select()
      .from(productos)
      .where(eq(productos.activo, '1'));

    return successResponse({
      asignados: result,
      disponibles: allProductos,
    });
  } catch (err) {
    console.error('Medico productos get error:', err);
    return errorResponse('Error al obtener productos del medico', 500);
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const medicoId = parseInt(params.medicoId!);
    if (isNaN(medicoId)) return errorResponse('ID de medico invalido', 400);

    const body = await request.json();
    const productoIds: number[] = body.productoIds || [];

    const existing = await db
      .select({ id: medicos.id, deletedAt: medicos.deletedAt })
      .from(medicos)
      .where(eq(medicos.id, medicoId))
      .limit(1);

    if (!existing.length || existing[0].deletedAt) {
      return errorResponse('Medico no encontrado', 404);
    }

    await db.delete(medicoProductos).where(eq(medicoProductos.medicoId, medicoId));

    if (productoIds.length > 0) {
      const values = productoIds.map((productoId) => ({
        medicoId,
        productoId,
      }));

      await db.insert(medicoProductos).values(values);
    }

    return successResponse({ medicoId, productoIds, message: 'Productos asignados exitosamente' });
  } catch (err) {
    console.error('Medico productos sync error:', err);
    return errorResponse('Error al asignar productos', 500);
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const medicoId = parseInt(params.medicoId!);
    if (isNaN(medicoId)) return errorResponse('ID de medico invalido', 400);

    const body = await request.json();
    const productoId = body.productoId;

    if (!productoId) {
      return errorResponse('productoId es requerido', 400);
    }

    await db
      .delete(medicoProductos)
      .where(and(eq(medicoProductos.medicoId, medicoId), eq(medicoProductos.productoId, productoId)));

    return successResponse({ medicoId, productoId, message: 'Producto removido exitosamente' });
  } catch (err) {
    console.error('Medico producto remove error:', err);
    return errorResponse('Error al remover producto', 500);
  }
};
