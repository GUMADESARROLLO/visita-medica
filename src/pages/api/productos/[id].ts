import { db } from '../../../lib/db';
import { productos, productoImagenes, moleculas } from '../../../lib/db/schema/index';
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
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        moleculaId: productos.moleculaId,
        descripcion: productos.descripcion,
        activo: productos.activo,
        deletedAt: productos.deletedAt,
        createdAt: productos.createdAt,
        updatedAt: productos.updatedAt,
        molecula: {
          id: moleculas.id,
          nombre: moleculas.nombre,
        },
      })
      .from(productos)
      .leftJoin(moleculas, eq(productos.moleculaId, moleculas.id))
      .where(and(eq(productos.id, id), isNull(productos.deletedAt)));

    if (!record) {
      return errorResponse('Producto no encontrado', 404);
    }

    const imagenes = await db
      .select()
      .from(productoImagenes)
      .where(eq(productoImagenes.productoId, id))
      .orderBy(productoImagenes.orden);

    return successResponse({ ...record, imagenes });
  } catch (err) {
    console.error('Productos [id] GET error:', err);
    return errorResponse('Error al obtener producto', 500);
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
      .from(productos)
      .where(and(eq(productos.id, id), isNull(productos.deletedAt)));

    if (!existing) {
      return errorResponse('Producto no encontrado', 404);
    }

    const body = await request.json();

    if (!body.codigo || !body.codigo.trim()) {
      return errorResponse('El código es requerido', 400);
    }

    if (!body.nombre || !body.nombre.trim()) {
      return errorResponse('El nombre es requerido', 400);
    }

    await db
      .update(productos)
      .set({
        codigo: body.codigo.trim(),
        nombre: body.nombre.trim(),
        moleculaId: body.moleculaId !== undefined ? (body.moleculaId ? Number(body.moleculaId) : null) : existing.moleculaId,
        descripcion: body.descripcion !== undefined ? body.descripcion : existing.descripcion,
        activo: body.activo !== undefined ? body.activo : existing.activo,
      })
      .where(eq(productos.id, id));

    const [updated] = await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        moleculaId: productos.moleculaId,
        descripcion: productos.descripcion,
        activo: productos.activo,
        deletedAt: productos.deletedAt,
        createdAt: productos.createdAt,
        updatedAt: productos.updatedAt,
        molecula: {
          id: moleculas.id,
          nombre: moleculas.nombre,
        },
      })
      .from(productos)
      .leftJoin(moleculas, eq(productos.moleculaId, moleculas.id))
      .where(eq(productos.id, id));

    const imagenes = await db
      .select()
      .from(productoImagenes)
      .where(eq(productoImagenes.productoId, id))
      .orderBy(productoImagenes.orden);

    return successResponse({ ...updated, imagenes });
  } catch (err: any) {
    console.error('Productos [id] PUT error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe un producto con ese código', 409);
    }
    return errorResponse('Error al actualizar producto', 500);
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
      .from(productos)
      .where(and(eq(productos.id, id), isNull(productos.deletedAt)));

    if (!existing) {
      return errorResponse('Producto no encontrado', 404);
    }

    await db
      .update(productos)
      .set({ deletedAt: new Date() })
      .where(eq(productos.id, id));

    return successResponse({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Productos [id] DELETE error:', err);
    return errorResponse('Error al eliminar producto', 500);
  }
};
