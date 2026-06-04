import { db } from '../../../lib/db';
import { solicitudes } from '../../../lib/db/schema/index';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const user = await verifyToken(token);
    const body = await request.json();

    if (!body.solicitudId) {
      return errorResponse('solicitudId es requerido', 400);
    }

    const estado = body.estado;
    if (estado !== 'aprobada' && estado !== 'rechazada') {
      return errorResponse('estado debe ser "aprobada" o "rechazada"', 400);
    }

    const solicitudId = parseInt(body.solicitudId);
    if (isNaN(solicitudId)) {
      return errorResponse('solicitudId inválido', 400);
    }

    const [existing] = await db
      .select()
      .from(solicitudes)
      .where(eq(solicitudes.id, solicitudId));

    if (!existing) {
      return errorResponse('Solicitud no encontrada', 404);
    }

    if (existing.estado !== 'pendiente') {
      return errorResponse('La solicitud ya fue resuelta', 400);
    }

    await db.update(solicitudes)
      .set({
        estado,
        resueltoPor: user!.id,
        fechaResolucion: new Date(),
      })
      .where(eq(solicitudes.id, solicitudId));

    return successResponse({
      solicitudId,
      estado,
      resueltoPor: user!.id,
      message: `Solicitud ${estado} correctamente`,
    });
  } catch (err) {
    console.error('Resolver solicitud error:', err);
    return errorResponse('Error al resolver solicitud', 500);
  }
};
