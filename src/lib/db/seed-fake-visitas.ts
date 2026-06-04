import { db } from './index';
import { visitas, visitadores, medicos } from './schema/index';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  console.log('Generando visitas falsas...');

  const visitadoresList = await db.select({ id: visitadores.id }).from(visitadores).where(eq(visitadores.activo, '1'));
  const medicosList = await db.select({ id: medicos.id, activo: medicos.activo }).from(medicos);

  if (visitadoresList.length === 0 || medicosList.length === 0) {
    console.error('No hay visitadores o medicos. Ejecuta npm run db:seed y npm run db:seed-fake primero');
    process.exit(1);
  }

  const startDate = new Date(2026, 4, 1); // May 1, 2026
  const endDate = new Date(); // now
  let creadas = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // 2-8 visits per day
    const visitsToday = Math.floor(Math.random() * 7) + 2;

    for (let i = 0; i < visitsToday; i++) {
      const visitador = visitadoresList[Math.floor(Math.random() * visitadoresList.length)];
      const medico = medicosList[Math.floor(Math.random() * medicosList.length)];
      const efectiva = Math.random() > 0.35 ? '1' : '0';

      const hora = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
      const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const fecha = new Date(d);
      fecha.setHours(Number(hora), Number(min), 0, 0);

      const observaciones = [
        'Visita de rutina', 'Entrega de muestras médicas', 'Actualización de expediente',
        'Presentación de nuevo producto', 'Seguimiento de tratamiento', 'Capacitación médica',
        'Entrega de material promocional', 'Coordinación de cita', efectiva === '1' ? 'Visita efectiva - médico receptivo' : 'Médico no disponible',
        'Revisión de resultados', 'Programación de próxima visita',
      ];

      try {
        await db.insert(visitas).values({
          visitadorId: visitador.id,
          medicoId: medico.id,
          fecha,
          efectiva,
          observacion: observaciones[Math.floor(Math.random() * observaciones.length)],
        });
        creadas++;
      } catch (err: any) {
        if (err?.code !== 'ER_DUP_ENTRY') {
          console.error(`Error creando visita:`, err.message);
        }
      }
    }
  }

  console.log(`${creadas} visitas generadas (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
