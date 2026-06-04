import { db } from '../../../lib/db';
import { visitas, visitadores, medicos, especialidades } from '../../../lib/db/schema/index';
import { eq, and, gte, lte, count, desc, sql } from 'drizzle-orm';
import { parseSearchParams, paginatedResponse, successResponse, errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, request }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { page, limit, offset, filters } = parseSearchParams(request.url);

    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.fechaInicio) {
      conditions.push(gte(visitas.fecha, new Date(filters.fechaInicio)));
    }
    if (filters.fechaFin) {
      const endDate = new Date(filters.fechaFin);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(visitas.fecha, endDate));
    }
    if (filters.visitadorId) {
      conditions.push(eq(visitas.visitadorId, parseInt(filters.visitadorId)));
    }
    if (filters.medicoId) {
      conditions.push(eq(visitas.medicoId, parseInt(filters.medicoId)));
    }
    if (filters.especialidadId) {
      conditions.push(eq(medicos.especialidadId, parseInt(filters.especialidadId)));
    }
    if (filters.efectiva === '0' || filters.efectiva === '1') {
      conditions.push(eq(visitas.efectiva, filters.efectiva as '0' | '1'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [total] = await db
      .select({ count: count() })
      .from(visitas)
      .leftJoin(medicos, eq(visitas.medicoId, medicos.id))
      .where(whereClause);

    const rows = await db
      .select({
        id: visitas.id,
        fecha: visitas.fecha,
        efectiva: visitas.efectiva,
        observacion: visitas.observacion,
        visitadorId: visitadores.id,
        visitadorNombre: visitadores.nombre,
        visitadorCodigo: visitadores.codigo,
        medicoNombre: medicos.nombre,
        medicoCodigo: medicos.codigo,
        especialidadNombre: especialidades.nombre,
      })
      .from(visitas)
      .leftJoin(visitadores, eq(visitas.visitadorId, visitadores.id))
      .leftJoin(medicos, eq(visitas.medicoId, medicos.id))
      .leftJoin(especialidades, eq(medicos.especialidadId, especialidades.id))
      .where(whereClause)
      .orderBy(desc(visitas.fecha))
      .limit(limit)
      .offset(offset);

    const mapped = rows.map(r => ({
      id: r.id,
      fecha: r.fecha,
      efectiva: r.efectiva,
      observacion: r.observacion,
      visitador: {
        id: r.visitadorId,
        nombre: r.visitadorNombre,
        codigo: r.visitadorCodigo,
      },
      medico: {
        nombre: r.medicoNombre,
        codigo: r.medicoCodigo,
        especialidad: {
          nombre: r.especialidadNombre,
        },
      },
    }));

    const [stats] = await db
      .select({
        total: count(),
        efectivas: sql<number>`SUM(CASE WHEN ${visitas.efectiva} = '1' THEN 1 ELSE 0 END)`,
        noEfectivas: sql<number>`SUM(CASE WHEN ${visitas.efectiva} = '0' THEN 1 ELSE 0 END)`,
      })
      .from(visitas)
      .leftJoin(medicos, eq(visitas.medicoId, medicos.id))
      .where(whereClause);

    const totalCount = Number(stats?.total ?? 0);
    const efectivasCount = Number(stats?.efectivas ?? 0);
    const noEfectivasCount = Number(stats?.noEfectivas ?? 0);
    const efectividad = totalCount > 0 ? Math.round((efectivasCount / totalCount) * 100) : 0;

    return successResponse({
      ...paginatedResponse(mapped, total?.count ?? 0, page, limit),
      stats: {
        total: totalCount,
        efectivas: efectivasCount,
        noEfectivas: noEfectivasCount,
        efectividad,
      },
    });
  } catch (err) {
    console.error('Reportes GET error:', err);
    return errorResponse('Error al obtener reportes', 500);
  }
};
