import { db } from '../../../lib/db';
import { productoImagenes } from '../../../lib/db/schema/index';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../../../lib/utils/index';
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    if (!id) return errorResponse('ID requerido', 400);
    await db.delete(productoImagenes).where(eq(productoImagenes.id, id));
    return successResponse({ message: 'Imagen eliminada' });
  } catch (err) {
    console.error('Delete imagen error:', err);
    return errorResponse('Error al eliminar imagen', 500);
  }
};
