import { db } from '../../../lib/db';
import { especialidades, medicos, visitadores, productos, solicitudes, visitas } from '../../../lib/db/schema/index';
import { count, eq, and, gte, lte, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { verifyToken } from '../../../lib/auth/index';
import { successResponse, errorResponse } from '../../../lib/utils/index';

export const GET: APIRoute = async ({ request, cookies }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalMedicos,
      totalVisitadores,
      totalProductos,
      totalEspecialidades,
      totalSolicitudesPendientes,
      visitasMes,
      visitasEfectivasMes,
    ] = await Promise.all([
      db.select({ count: count() }).from(medicos).where(eq(medicos.activo, '1')),
      db.select({ count: count() }).from(visitadores).where(eq(visitadores.activo, '1')),
      db.select({ count: count() }).from(productos).where(eq(productos.activo, '1')),
      db.select({ count: count() }).from(especialidades).where(eq(especialidades.activo, '1')),
      db.select({ count: count() }).from(solicitudes).where(eq(solicitudes.estado, 'pendiente')),
      db.select({ count: count() })
        .from(visitas)
        .where(and(gte(visitas.fecha, startOfMonth), lte(visitas.fecha, endOfMonth))),
      db.select({ count: count() })
        .from(visitas)
        .where(and(
          gte(visitas.fecha, startOfMonth),
          lte(visitas.fecha, endOfMonth),
          eq(visitas.efectiva, '1'),
        )),
    ]);

    const totalVisitasMes = visitasMes[0]?.count ?? 0;
    const totalEfectivas = visitasEfectivasMes[0]?.count ?? 0;
    const efectividad = totalVisitasMes > 0 ? Math.round((totalEfectivas / totalVisitasMes) * 100) : 0;

    // Ultimas solicitudes
    const ultimasSolicitudes = await db
      .select({
        id: solicitudes.id,
        tipo: { nombre: sql`tipo_solicitud.nombre` },
        estado: solicitudes.estado,
        createdAt: solicitudes.createdAt,
        visitador: { nombre: sql`v.nombre` },
      })
      .from(solicitudes)
      .leftJoin(sql`tipo_solicitud`, eq(solicitudes.tipoId, sql`tipo_solicitud.id`))
      .leftJoin(sql`visitadores v`, eq(solicitudes.visitadorId, sql`v.id`))
      .orderBy(sql`solicitudes.created_at DESC`)
      .limit(5);

    // Solicitudes por dia (ultimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const solicitudesPorDia = await db
      .select({
        fecha: sql`DATE(solicitudes.created_at)`,
        total: count(),
      })
      .from(solicitudes)
      .where(gte(solicitudes.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(solicitudes.created_at)`)
      .orderBy(sql`DATE(solicitudes.created_at)`);

    // Visitas por dia (ultimos 30 dias)
    const visitasPorDia = await db
      .select({
        fecha: sql`DATE(visitas.fecha)`,
        total: count(),
        efectivas: sql`SUM(CASE WHEN visitas.efectiva = '1' THEN 1 ELSE 0 END)`,
      })
      .from(visitas)
      .where(and(
        gte(visitas.fecha, startOfMonth),
        lte(visitas.fecha, endOfMonth),
      ))
      .groupBy(sql`DATE(visitas.fecha)`)
      .orderBy(sql`DATE(visitas.fecha)`);

    return successResponse({
      counts: {
        medicos: totalMedicos[0]?.count ?? 0,
        visitadores: totalVisitadores[0]?.count ?? 0,
        productos: totalProductos[0]?.count ?? 0,
        especialidades: totalEspecialidades[0]?.count ?? 0,
        solicitudesPendientes: totalSolicitudesPendientes[0]?.count ?? 0,
      },
      visitas: {
        totalMes: totalVisitasMes,
        efectivasMes: totalEfectivas,
        noEfectivasMes: totalVisitasMes - totalEfectivas,
        efectividad,
      },
      ultimasSolicitudes,
      charts: {
        solicitudesPorDia,
        visitasPorDia,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return errorResponse('Error al obtener datos del dashboard', 500);
  }
};
