import { db } from './index';
import { solicitudes, tipoSolicitud, medicos, visitadores, usuarios } from './schema/index';
import 'dotenv/config';

const observaciones = [
  'Solicitud de alta para nuevo médico especialista en cardiología',
  'Paciente requiere cambio de médico tratante',
  'Alta de médico general para cubrir turnos',
  'Baja solicitada por el médico por motivos personales',
  'Nuevo médico internista recomendado por el hospital',
  'Alta de médico pediatra para la nueva clínica infantil',
  'Baja del médico por incumplimiento de horarios',
  'Solicitud de traslado a otra unidad médica',
  'Alta de médico cirujano para el departamento de emergencias',
  'Baja voluntaria del médico después de 5 años de servicio',
  'Incorporación de médico familiar al programa de visitas domiciliarias',
  'Solicitud urgente de alta para cubrir vacante en pediatría',
  'Baja médica por jubilación',
  'Alta de médico especialista en neurología pediátrica',
  'Renovación de contrato con opción a especialización',
];

async function main() {
  console.log('Generando solicitudes falsas...');

  const [tipos] = await Promise.all([
    db.select({ id: tipoSolicitud.id, nombre: tipoSolicitud.nombre }).from(tipoSolicitud),
  ]);

  const medicosList = await db.select({ id: medicos.id, nombre: medicos.nombre }).from(medicos);
  const visitadoresList = await db.select({ id: visitadores.id, nombre: visitadores.nombre }).from(visitadores);
  const [admin] = await db.select({ id: usuarios.id }).from(usuarios).limit(1);

  if (tipos.length === 0 || medicosList.length === 0) {
    console.error('Ejecuta npm run db:seed y npm run db:seed-fake primero');
    process.exit(1);
  }

  let creadas = 0;
  const estados = ['pendiente', 'aprobada', 'rechazada'];

  for (let i = 0; i < 80; i++) {
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const medico = medicosList[Math.floor(Math.random() * medicosList.length)];
    const visitador = visitadoresList.length > 0
      ? visitadoresList[Math.floor(Math.random() * visitadoresList.length)]
      : null;
    const observacion = observaciones[Math.floor(Math.random() * observaciones.length)];
    const estado = estados[Math.floor(Math.random() * estados.length)];

    const diasAtras = Math.floor(Math.random() * 60);

    try {
      await db.insert(solicitudes).values({
        tipoId: tipo.id,
        medicoId: medico.id,
        visitadorId: visitador?.id || null,
        observacion,
        estado: estado as 'pendiente' | 'aprobada' | 'rechazada',
        resueltoPor: estado !== 'pendiente' ? (admin?.id || null) : null,
        fechaResolucion: estado !== 'pendiente' ? new Date(Date.now() - (diasAtras - 2) * 24 * 60 * 60 * 1000) : null,
      });

      creadas++;
    } catch (err: any) {
      if (err?.code !== 'ER_DUP_ENTRY') {
        console.error(`Error creando solicitud ${i}:`, err.message);
      }
    }
  }

  console.log(`${creadas} solicitudes generadas`);

  const muestras = await db.select({ id: solicitudes.id, estado: solicitudes.estado }).from(solicitudes).limit(5);
  console.log('Muestras de solicitudes:', JSON.stringify(muestras));

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
