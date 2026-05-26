import { db } from '../../../lib/db';
import { medios } from '../../../lib/db/schema/index';
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
      isNull(medios.deletedAt),
      ...(filters.activo !== undefined && filters.activo !== ''
        ? [eq(medios.activo, filters.activo as '0' | '1')]
        : []),
      ...(search
        ? [or(like(medios.nombre, `%${search}%`), like(medios.email, `%${search}%`))]
        : []),
    );

    const [total] = await db
      .select({ count: count() })
      .from(medios)
      .where(conditions);

    const data = await db
      .select()
      .from(medios)
      .where(conditions)
      .orderBy(desc(medios.id))
      .limit(limit)
      .offset(offset);

    return successResponse(
      paginatedResponse(data, total?.count ?? 0, page, limit),
    );
  } catch (err) {
    console.error('Medios GET error:', err);
    return errorResponse('Error al obtener medios', 500);
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = await request.json();

    if (!body.nombre || !body.nombre.trim()) {
      return errorResponse('El nombre es requerido', 400);
    }

    const [created] = await db.insert(medios).values({
      nombre: body.nombre.trim(),
      telefono: body.telefono || null,
      email: body.email || null,
      direccion: body.direccion || null,
      contacto: body.contacto || null,
      activo: body.activo !== undefined ? body.activo : '1',
    });

    const [record] = await db
      .select()
      .from(medios)
      .where(eq(medios.id, Number(created.insertId)));

    return successResponse(record, 201);
  } catch (err: any) {
    console.error('Medios POST error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe un medio con ese nombre', 409);
    }
    return errorResponse('Error al crear medio', 500);
  }
};
