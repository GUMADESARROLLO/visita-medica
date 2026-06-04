import { db } from '../../../lib/db';
import { medicos, especialidades } from '../../../lib/db/schema/index';
import { eq, like, and, count, isNull, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth/index';
import { successResponse, errorResponse, parseSearchParams, paginatedResponse } from '../../../lib/utils/index';

export const GET: APIRoute = async ({ request, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { page, limit, search, offset, filters } = parseSearchParams(request.url);

    const whereConditions = [
      eq(medicos.activo, '1'),
      isNull(medicos.deletedAt),
    ];

    if (search) {
      whereConditions.push(
        sql`(${like(medicos.codigo, `%${search}%`)} OR ${like(medicos.nombre, `%${search}%`)} OR ${like(medicos.email, `%${search}%`)})`,
      );
    }

    if (filters.especialidadId) {
      whereConditions.push(eq(medicos.especialidadId, parseInt(filters.especialidadId)));
    }
    if (filters.activo !== undefined && filters.activo !== '') {
      whereConditions.push(eq(medicos.activo, filters.activo as '0' | '1'));
    }

    const whereClause = whereConditions.length > 0
      ? whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions)
      : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(medicos)
        .leftJoin(especialidades, eq(medicos.especialidadId, especialidades.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(medicos.nombre),
      db.select({ count: count() }).from(medicos).where(whereClause),
    ]);

    const mapped = items.map((row) => ({
      ...row.medicos,
      especialidad: row.especialidades || null,
    }));

    const [especialidadesList] = await Promise.all([
      db.select().from(especialidades).where(eq(especialidades.activo, '1')),
    ]);

    return successResponse({
      ...paginatedResponse(mapped, totalResult[0]?.count ?? 0, page, limit),
      especialidades: especialidadesList,
    });
  } catch (err) {
    console.error('Medicos list error:', err);
    return errorResponse('Error al obtener medicos', 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = await request.json();
    const { nombre, especialidadId, direccion, telefono, email, activo } = body;

    if (!nombre) {
      return errorResponse('El nombre es requerido', 400);
    }

    let codigo = body.codigo;
    if (!codigo) {
      codigo = `MED-${Date.now()}`;
    }

    const existing = await db
      .select({ id: medicos.id })
      .from(medicos)
      .where(eq(medicos.codigo, codigo))
      .limit(1);

    if (existing.length > 0) {
      return errorResponse('El codigo ya existe', 400);
    }

    const result = await db.insert(medicos).values({
      codigo,
      nombre,
      especialidadId: especialidadId || null,
      direccion: direccion || null,
      telefono: telefono || null,
      email: email || null,
      activo: activo !== undefined ? (activo === true || activo === '1' ? '1' : '0') : '1',
    });

    return successResponse({ id: Number(result[0].insertId), codigo, nombre }, 201);
  } catch (err: any) {
    console.error('Medicos create error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('El codigo o email ya existe', 400);
    }
    return errorResponse('Error al crear medico', 500);
  }
};
