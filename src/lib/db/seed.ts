import { db } from './index';
import { roles, usuarios } from './schema/index';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function seed() {
  console.log('Seeding database...');

  // Roles
  const roleData = [
    { nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
    { nombre: 'Visitador', descripcion: 'Acceso limitado a visitas y reportes' },
  ];

  for (const r of roleData) {
    const existing = await db.select().from(roles).where(eq(roles.nombre, r.nombre));
    if (existing.length === 0) {
      await db.insert(roles).values(r);
      console.log(`  Role "${r.nombre}" created.`);
    }
  }

  // Tipo Solicitud
  const { tipoSolicitud } = await import('./schema/index');
  const tiposData = [
    { nombre: 'Alta de Médico' },
    { nombre: 'Baja de Médico' },
  ];
  for (const t of tiposData) {
    const existing = await db.select().from(tipoSolicitud).where(eq(tipoSolicitud.nombre, t.nombre));
    if (existing.length === 0) {
      await db.insert(tipoSolicitud).values(t);
      console.log(`  Tipo solicitud "${t.nombre}" created.`);
    }
  }

  // Admin user
  const [adminRole] = await db.select().from(roles).where(eq(roles.nombre, 'Administrador'));
  if (adminRole) {
    const existing = await db.select().from(usuarios).where(eq(usuarios.username, 'admin'));
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await db.insert(usuarios).values({
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@visitamedica.com',
        password: hashedPassword,
        rolId: adminRole.id,
        activo: '1',
      });
      console.log('  Admin user created (admin / admin123)');
    }
  }

  // Especialidades seed
  const { especialidades } = await import('./schema/index');
  const espData = [
    'Medicina General', 'Cardiología', 'Dermatología', 'Endocrinología',
    'Gastroenterología', 'Geriatría', 'Ginecología', 'Neumología',
    'Neurología', 'Oftalmología', 'Oncología', 'Pediatría',
    'Psiquiatría', 'Reumatología', 'Traumatología', 'Urología',
  ];
  for (const nombre of espData) {
    const existing = await db.select().from(especialidades).where(eq(especialidades.nombre, nombre));
    if (existing.length === 0) {
      await db.insert(especialidades).values({ nombre, activo: '1' });
    }
  }
  console.log('  Especialidades seeded.');

  // Moleculas seed
  const { moleculas } = await import('./schema/index');
  const molData = [
    'Paracetamol', 'Ibuprofeno', 'Omeprazol', 'Amoxicilina',
    'Losartán', 'Metformina', 'Atorvastatina', 'Levotiroxina',
    'Salbutamol', 'Clonazepam',
  ];
  for (const nombre of molData) {
    const existing = await db.select().from(moleculas).where(eq(moleculas.nombre, nombre));
    if (existing.length === 0) {
      await db.insert(moleculas).values({ nombre, activo: '1' });
    }
  }
  console.log('  Moleculas seeded.');

  // Medios seed
  const { medios } = await import('./schema/index');
  const mediosData = [
    { nombre: 'Medicina Clara', telefono: '555-0101', email: 'contacto@medicinaclara.com' },
    { nombre: 'Revista Salud Hoy', telefono: '555-0102', email: 'info@saludhoy.com' },
    { nombre: 'Portal Médico', telefono: '555-0103', email: 'admin@portalmedico.com' },
    { nombre: 'Guía Farmacéutica', telefono: '555-0104', email: 'contacto@guiafarma.com' },
    { nombre: 'Red Médica Digital', telefono: '555-0105', email: 'info@redmedica.com' },
  ];
  for (const m of mediosData) {
    const existing = await db.select().from(medios).where(eq(medios.nombre, m.nombre));
    if (existing.length === 0) {
      await db.insert(medios).values({ ...m, activo: '1' });
    }
  }
  console.log('  Medios seeded.');

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
