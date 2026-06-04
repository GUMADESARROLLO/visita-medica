import { successResponse, errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import type { APIRoute } from 'astro';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const POST: APIRoute = async ({ cookies, request }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('Content-Type debe ser multipart/form-data', 400);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('Archivo requerido', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('El archivo excede el limite de 5MB', 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Tipo de archivo no permitido. Use JPEG, PNG, GIF, WebP o SVG', 400);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '');
    const uniqueName = `${randomUUID()}.${sanitizedExt}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;

    return successResponse({ url }, 201);
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse('Error al subir archivo', 500);
  }
};
