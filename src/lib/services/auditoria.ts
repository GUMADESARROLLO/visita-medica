import { db } from '../db';
import { auditoria } from '../db/schema/index';

export async function logAudit(
  usuarioId: number | null,
  accion: string,
  entidad: string,
  entidadId?: number,
  detalle?: string,
  ip?: string,
) {
  try {
    await db.insert(auditoria).values({
      usuarioId,
      accion,
      entidad,
      entidadId,
      detalle,
      ip,
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
