import { db } from '../../../lib/db';
import { solicitudes, tipoSolicitud, visitadores, medicos } from '../../../lib/db/schema/index';
import { eq, like, and, gte, lte, ilike, count, sql } from 'drizzle-orm';
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

    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.estado) {
      conditions.push(eq(solicitudes.estado, filters.estado as 'pendiente' | 'aprobada' | 'rechazada'));
    }
    if (filters.tipoId) {
      conditions.push(eq(solicitudes.tipoId, parseInt(filters.tipoId)));
    }
    if (filters.visitadorId) {
      conditions.push(eq(solicitudes.visitadorId, parseInt(filters.visitadorId)));
    }
    if (filters.fechaInicio) {
      conditions.push(gte(solicitudes.createdAt, new Date(filters.fechaInicio)));
    }
    if (filters.fechaFin) {
      const endDate = new Date(filters.fechaFin);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(solicitudes.createdAt, endDate));
    }
    if (search) {
      conditions.push(like(solicitudes.observacion, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [total] = await db
      .select({ count: count() })
      .from(solicitudes)
      .where(whereClause);

    const rows = await db
      .select({
        id: solicitudes.id,
        tipoId: solicitudes.tipoId,
        medicoId: solicitudes.medicoId,
        visitadorId: solicitudes.visitadorId,
        observacion: solicitudes.observacion,
        estado: solicitudes.estado,
        resueltoPor: solicitudes.resueltoPor,
        fechaResolucion: solicitudes.fechaResolucion,
        createdAt: solicitudes.createdAt,
        updatedAt: solicitudes.updatedAt,
        tipo: {
          id: tipoSolicitud.id,
          nombre: tipoSolicitud.nombre,
        },
        visitador: {
          id: visitadores.id,
          nombre: visitadores.nombre,
          codigo: visitadores.codigo,
        },
        medico: {
          id: medicos.id,
          nombre: medicos.nombre,
          codigo: medicos.codigo,
        },
      })
      .from(solicitudes)
      .leftJoin(tipoSolicitud, eq(solicitudes.tipoId, tipoSolicitud.id))
      .leftJoin(visitadores, eq(solicitudes.visitadorId, visitadores.id))
      .leftJoin(medicos, eq(solicitudes.medicoId, medicos.id))
      .where(whereClause)
      .orderBy(sql`solicitudes.id DESC`)
      .limit(limit)
      .offset(offset);

    return successResponse(paginatedResponse(rows, total?.count ?? 0, page, limit));
  } catch (err) {
    console.error('Solicitudes GET error:', err);
    return errorResponse('Error al obtener solicitudes', 500);
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const user = await verifyToken(token);
    const body = await request.json();

    if (!body.tipoId || !body.medicoId || !body.visitadorId) {
      return errorResponse('tipoId, medicoId y visitadorId son requeridos', 400);
    }

    const estado = body.estado || 'pendiente';

    const [created] = await db.insert(solicitudes).values({
      tipoId: body.tipoId,
      medicoId: body.medicoId,
      visitadorId: body.visitadorId,
      observacion: body.observacion || null,
      estado,
    });

    await db.insert(solicitudHistorial).values({
      solicitudId: Number(created.insertId),
      estadoAnterior: null,
      estadoNuevo: estado,
      comentario: body.comentario || 'Solicitud creada',
      usuarioId: user!.id,
    });

    const [record] = await db
      .select({
        id: solicitudes.id,
        tipoId: solicitudes.tipoId,
        medicoId: solicitudes.medicoId,
        visitadorId: solicitudes.visitadorId,
        observacion: solicitudes.observacion,
        estado: solicitudes.estado,
        resueltoPor: solicitudes.resueltoPor,
        fechaResolucion: solicitudes.fechaResolucion,
        createdAt: solicitudes.createdAt,
        updatedAt: solicitudes.updatedAt,
        tipo: {
          id: tipoSolicitud.id,
          nombre: tipoSolicitud.nombre,
        },
        visitador: {
          id: visitadores.id,
          nombre: visitadores.nombre,
          codigo: visitadores.codigo,
        },
        medico: {
          id: medicos.id,
          nombre: medicos.nombre,
          codigo: medicos.codigo,
        },
      })
      .from(solicitudes)
      .leftJoin(tipoSolicitud, eq(solicitudes.tipoId, tipoSolicitud.id))
      .leftJoin(visitadores, eq(solicitudes.visitadorId, visitadores.id))
      .leftJoin(medicos, eq(solicitudes.medicoId, medicos.id))
      .where(eq(solicitudes.id, Number(created.insertId)));

    return successResponse(record, 201);
  } catch (err: any) {
    console.error('Solicitudes POST error:', err);
    return errorResponse('Error al crear solicitud', 500);
  }
};
