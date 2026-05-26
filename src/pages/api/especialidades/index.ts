import { db } from '../../../lib/db';
import { especialidades } from '../../../lib/db/schema/index';
import { eq, like, and, or, count, desc, isNull } from 'drizzle-orm';
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
      isNull(especialidades.deletedAt),
      ...(filters.activo !== undefined && filters.activo !== ''
        ? [eq(especialidades.activo, filters.activo as '0' | '1')]
        : []),
      ...(search
        ? [or(like(especialidades.nombre, `%${search}%`))]
        : []),
    );

    const [total] = await db
      .select({ count: count() })
      .from(especialidades)
      .where(conditions);

    const data = await db
      .select()
      .from(especialidades)
      .where(conditions)
      .orderBy(desc(especialidades.id))
      .limit(limit)
      .offset(offset);

    return successResponse(
      paginatedResponse(data, total?.count ?? 0, page, limit),
    );
  } catch (err) {
    console.error('Especialidades GET error:', err);
    return errorResponse('Error al obtener especialidades', 500);
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

    const [created] = await db.insert(especialidades).values({
      nombre: body.nombre.trim(),
      descripcion: body.descripcion || null,
      activo: body.activo !== undefined ? body.activo : '1',
    });

    const [record] = await db
      .select()
      .from(especialidades)
      .where(eq(especialidades.id, Number(created.insertId)));

    return successResponse(record, 201);
  } catch (err: any) {
    console.error('Especialidades POST error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('Ya existe una especialidad con ese nombre', 409);
    }
    return errorResponse('Error al crear especialidad', 500);
  }
};
