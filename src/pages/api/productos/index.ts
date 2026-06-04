import { db } from '../../../lib/db';
import { productos, productoImagenes, moleculas } from '../../../lib/db/schema/index';
import { eq, like, and, or, count, desc, isNull, sql } from 'drizzle-orm';
import { parseSearchParams, paginatedResponse, successResponse, errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { page, limit, search, offset, filters } = parseSearchParams(request.url);

    const conditions = and(
      isNull(productos.deletedAt),
      ...(filters.activo !== undefined && filters.activo !== ''
        ? [eq(productos.activo, filters.activo as '0' | '1')]
        : []),
      ...(filters.moleculaId !== undefined && filters.moleculaId !== ''
        ? [eq(productos.moleculaId, Number(filters.moleculaId))]
        : []),
      ...(search
        ? [or(
            like(productos.codigo, `%${search}%`),
            like(productos.nombre, `%${search}%`),
          )]
        : []),
    );

    const [total] = await db
      .select({ count: count() })
      .from(productos)
      .where(conditions);

    const data = await db
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
        moleculaNombre: moleculas.nombre,
        imagenUrl: sql<string | null>`(SELECT pi.url FROM producto_imagenes pi WHERE pi.producto_id = ${productos.id} ORDER BY pi.orden ASC, pi.id ASC LIMIT 1)`,
      })
      .from(productos)
      .leftJoin(moleculas, eq(productos.moleculaId, moleculas.id))
      .where(conditions)
      .orderBy(desc(productos.id))
      .limit(limit)
      .offset(offset);

    const mapped = data.map(r => ({
      ...r,
      molecula: r.moleculaNombre ? { nombre: r.moleculaNombre } : null,
      moleculaNombre: undefined,
      imagenUrl: r.imagenUrl || null,
    }));

    return successResponse(
      paginatedResponse(mapped, total?.count ?? 0, page, limit),
    );
  } catch (err) {
    console.error('Productos GET error:', err);
    return errorResponse('Error al obtener productos', 500);
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = await request.json();

    if (!body.codigo || !body.codigo.trim()) {
      return errorResponse('El código es requerido', 400);
    }

    if (!body.nombre || !body.nombre.trim()) {
      return errorResponse('El nombre es requerido', 400);
    }

    const [created] = await db.insert(productos).values({
      codigo: body.codigo.trim(),
      nombre: body.nombre.trim(),
      moleculaId: body.moleculaId ? Number(body.moleculaId) : null,
      descripcion: body.descripcion || null,
      activo: body.activo !== undefined ? body.activo : '1',
    });

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
        moleculaNombre: moleculas.nombre,
      })
      .from(productos)
      .leftJoin(moleculas, eq(productos.moleculaId, moleculas.id))
      .where(eq(productos.id, Number(created.insertId)));

    return successResponse({
      ...record,
      molecula: record?.moleculaNombre ? { nombre: record.moleculaNombre } : null,
      moleculaNombre: undefined,
    }, 201);
  } catch (err: any) {
    console.error('Productos POST error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe un producto con ese código', 409);
    }
    return errorResponse('Error al crear producto', 500);
  }
};
