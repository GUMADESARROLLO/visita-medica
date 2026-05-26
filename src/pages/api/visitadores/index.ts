import { db } from '../../../lib/db';
import { visitadores, usuarios, roles } from '../../../lib/db/schema/index';
import { eq, like, or, and, count } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { verifyToken, hashPassword } from '../../../lib/auth/index';
import { successResponse, errorResponse, parseSearchParams, paginatedResponse } from '../../../lib/utils/index';

export const GET: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { page, limit, search, offset, filters } = parseSearchParams(request.url);

    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(visitadores.codigo, `%${search}%`),
          like(visitadores.nombre, `%${search}%`),
          like(visitadores.email, `%${search}%`),
        ),
      );
    }

    if (filters.activo !== undefined && filters.activo !== '') {
      whereConditions.push(eq(visitadores.activo, filters.activo as '0' | '1'));
    }

    const whereClause = whereConditions.length > 0
      ? whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions)
      : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: visitadores.id,
          codigo: visitadores.codigo,
          nombre: visitadores.nombre,
          email: visitadores.email,
          telefono: visitadores.telefono,
          activo: visitadores.activo,
          usuarioId: visitadores.usuarioId,
          deletedAt: visitadores.deletedAt,
          createdAt: visitadores.createdAt,
          updatedAt: visitadores.updatedAt,
          usuario: {
            id: usuarios.id,
            username: usuarios.username,
            email: usuarios.email,
            activo: usuarios.activo,
          },
        })
        .from(visitadores)
        .leftJoin(usuarios, eq(visitadores.usuarioId, usuarios.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(visitadores.nombre),
      db.select({ count: count() }).from(visitadores).where(whereClause),
    ]);

    return successResponse(paginatedResponse(items, totalResult[0]?.count ?? 0, page, limit));
  } catch (err) {
    console.error('Visitadores list error:', err);
    return errorResponse('Error al obtener visitadores', 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const body = await request.json();
    const { codigo, nombre, email, telefono, activo, createUser } = body;

    if (!nombre) {
      return errorResponse('El nombre es requerido', 400);
    }

    let visitadorCodigo = codigo;
    if (!visitadorCodigo) {
      visitadorCodigo = `VIS-${Date.now()}`;
    }

    const existing = await db
      .select({ id: visitadores.id })
      .from(visitadores)
      .where(eq(visitadores.codigo, visitadorCodigo))
      .limit(1);

    if (existing.length > 0) {
      return errorResponse('El codigo ya existe', 400);
    }

    let usuarioId: number | null = null;

    if (createUser && email) {
      const visitadorRole = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.nombre, 'Visitador'))
        .limit(1);

      if (visitadorRole.length > 0) {
        const username = email.split('@')[0];
        const tempPassword = `Visita${Date.now().toString().slice(-6)}`;

        const userResult = await db.insert(usuarios).values({
          nombre,
          username,
          email,
          password: await hashPassword(tempPassword),
          rolId: visitadorRole[0].id,
          activo: '1',
        });

        usuarioId = Number(userResult[0].insertId);
      }
    }

    const result = await db.insert(visitadores).values({
      codigo: visitadorCodigo,
      nombre,
      email: email || null,
      telefono: telefono || null,
      activo: activo !== undefined ? activo : '1',
      usuarioId,
    });

    return successResponse(
      {
        id: Number(result[0].insertId),
        codigo: visitadorCodigo,
        nombre,
        usuarioId,
        userCreated: !!usuarioId,
      },
      201,
    );
  } catch (err: any) {
    console.error('Visitadores create error:', err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return errorResponse('El codigo o email ya existe', 400);
    }
    return errorResponse('Error al crear visitador', 500);
  }
};
