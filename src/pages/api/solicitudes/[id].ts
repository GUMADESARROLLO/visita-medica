import { db } from '../../../lib/db';
import { solicitudes, tipoSolicitud, visitadores, medicos } from '../../../lib/db/schema/index';
import { eq } from 'drizzle-orm';
import { verifyToken } from '../../../lib/auth/index';
import { successResponse, errorResponse } from '../../../lib/utils/index';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies, params }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return errorResponse('ID inválido', 400);
    }

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
      .where(eq(solicitudes.id, id));

    if (!record) {
      return errorResponse('Solicitud no encontrada', 404);
    }

    return successResponse(record);
  } catch (err) {
    console.error('Solicitud GET error:', err);
    return errorResponse('Error al obtener solicitud', 500);
  }
};

export const PUT: APIRoute = async ({ cookies, params, request }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return errorResponse('ID inválido', 400);
    }

    const [existing] = await db
      .select()
      .from(solicitudes)
      .where(eq(solicitudes.id, id));

    if (!existing) {
      return errorResponse('Solicitud no encontrada', 404);
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.observacion !== undefined) {
      updates.observacion = body.observacion;
    }

    if (body.estado !== undefined) {
      updates.estado = body.estado;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No hay campos para actualizar', 400);
    }

    await db.update(solicitudes)
      .set(updates)
      .where(eq(solicitudes.id, id));

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
      .where(eq(solicitudes.id, id));

    return successResponse(record);
  } catch (err) {
    console.error('Solicitud PUT error:', err);
    return errorResponse('Error al actualizar solicitud', 500);
  }
};

export const DELETE: APIRoute = async () => {
  return errorResponse('No se permite eliminar solicitudes', 405);
};
