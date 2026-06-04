import { db } from '../../../lib/db';
import { productoImagenes } from '../../../lib/db/schema/index';
import { successResponse, errorResponse } from '../../../lib/utils/index';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productoId, url } = await request.json();
    if (!productoId || !url) return errorResponse('productoId y url requeridos', 400);
    const [result] = await db.insert(productoImagenes).values({ productoId, url });
    return successResponse({ id: Number(result.insertId), url, productoId }, 201);
  } catch (err) {
    console.error('Create imagen error:', err);
    return errorResponse('Error al guardar imagen', 500);
  }
};
