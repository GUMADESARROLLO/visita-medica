import { db } from '../../../lib/db';
import { visitas, visitadores, medicos, especialidades } from '../../../lib/db/schema/index';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { errorResponse } from '../../../lib/utils/index';
import { verifyToken } from '../../../lib/auth/index';
import ExcelJS from 'exceljs';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, request }) => {
  const token = cookies.get('token')?.value;
  if (!token || !(await verifyToken(token))) {
    return errorResponse('No autorizado', 401);
  }

  try {
    const { searchParams } = new URL(request.url);

    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const visitadorId = searchParams.get('visitadorId');
    const medicoId = searchParams.get('medicoId');
    const especialidadId = searchParams.get('especialidadId');
    const efectiva = searchParams.get('efectiva');

    const conditions: ReturnType<typeof eq>[] = [];

    if (fechaInicio) {
      conditions.push(gte(visitas.fecha, new Date(fechaInicio)));
    }
    if (fechaFin) {
      const endDate = new Date(fechaFin);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(visitas.fecha, endDate));
    }
    if (visitadorId) {
      conditions.push(eq(visitas.visitadorId, parseInt(visitadorId)));
    }
    if (medicoId) {
      conditions.push(eq(visitas.medicoId, parseInt(medicoId)));
    }
    if (especialidadId) {
      conditions.push(eq(medicos.especialidadId, parseInt(especialidadId)));
    }
    if (efectiva === '0' || efectiva === '1') {
      conditions.push(eq(visitas.efectiva, efectiva));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        fecha: visitas.fecha,
        efectiva: visitas.efectiva,
        observacion: visitas.observacion,
        visitadorNombre: visitadores.nombre,
        medicoNombre: medicos.nombre,
        especialidadNombre: especialidades.nombre,
      })
      .from(visitas)
      .leftJoin(visitadores, eq(visitas.visitadorId, visitadores.id))
      .leftJoin(medicos, eq(visitas.medicoId, medicos.id))
      .leftJoin(especialidades, eq(medicos.especialidadId, especialidades.id))
      .where(whereClause)
      .orderBy(desc(visitas.fecha));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte de Visitas');

    const headerStyle = {
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF2563EB' },
      },
      font: {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 12,
      },
      alignment: {
        vertical: 'middle' as const,
        horizontal: 'center' as const,
      },
      border: {
        top: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    };

    const headers = ['Fecha', 'Visitador', 'Médico', 'Especialidad', 'Efectiva', 'Observación'];
    const headerRow = sheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });

    headerRow.height = 24;

    const dataStyle = {
      border: {
        top: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        left: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
      alignment: {
        vertical: 'middle' as const,
      },
    };

    for (const row of rows) {
      const fecha = row.fecha
        ? new Date(row.fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '';

      const excelRow = sheet.addRow([
        fecha,
        row.visitadorNombre || '',
        row.medicoNombre || '',
        row.especialidadNombre || '',
        row.efectiva === '1' ? 'Sí' : 'No',
        row.observacion || '',
      ]);

      excelRow.eachCell((cell) => {
        cell.border = dataStyle.border;
        cell.alignment = dataStyle.alignment;
      });

      if (row.efectiva === '1') {
        const efectivaCell = excelRow.getCell(5);
        efectivaCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      } else {
        const efectivaCell = excelRow.getCell(5);
        efectivaCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    }

    sheet.columns = [
      { key: 'fecha', width: 14 },
      { key: 'visitador', width: 28 },
      { key: 'medico', width: 28 },
      { key: 'especialidad', width: 24 },
      { key: 'efectiva', width: 12 },
      { key: 'observacion', width: 40 },
    ];

    const today = new Date().toISOString().slice(0, 10);
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte-visitas-${today}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('Reportes Excel error:', err);
    return errorResponse('Error al generar reporte Excel', 500);
  }
};
