import { db } from '../../../lib/db';
import { solicitudes, tipoSolicitud, visitadores, medicos, solicitudHistorial, usuarios } from '../../../lib/db/schema/index';
import { eq, desc, sql } from 'drizzle-orm';
import { successResponse, errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, params }) => {
  const token = cookies.get('token')?.value;
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

    const historial = await db
      .select({
        id: solicitudHistorial.id,
        estadoAnterior: solicitudHistorial.estadoAnterior,
        estadoNuevo: solicitudHistorial.estadoNuevo,
        comentario: solicitudHistorial.comentario,
        createdAt: solicitudHistorial.createdAt,
        usuario: {
          id: usuarios.id,
          nombre: usuarios.nombre,
          username: usuarios.username,
        },
      })
      .from(solicitudHistorial)
      .leftJoin(usuarios, eq(solicitudHistorial.usuarioId, usuarios.id))
      .where(eq(solicitudHistorial.solicitudId, id))
      .orderBy(sql`solicitud_historial.id ASC`);

    return successResponse({ ...record, historial });
  } catch (err) {
    console.error('Solicitud GET error:', err);
    return errorResponse('Error al obtener solicitud', 500);
  }
};

export const PUT: APIRoute = async ({ cookies, params, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const user = await verifyToken(token);
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
    const historialEntries: {
      comentario: string;
    } = { comentario: '' };

    if (body.observacion !== undefined) {
      updates.observacion = body.observacion;
    }

    if (body.estado !== undefined) {
      updates.estado = body.estado;
      if (body.estado !== existing.estado) {
        await db.insert(solicitudHistorial).values({
          solicitudId: id,
          estadoAnterior: existing.estado,
          estadoNuevo: body.estado,
          comentario: body.comentario || `Estado cambiado a ${body.estado}`,
          usuarioId: user!.id,
        });
      }
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
