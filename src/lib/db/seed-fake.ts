import { db } from './index';
import { medicos, especialidades, productos } from './schema/index';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const nombres = [
  'Juan Pérez García', 'María López Rodríguez', 'Carlos Martínez Hernández', 'Ana García López',
  'José Torres Sánchez', 'Laura Ramírez Torres', 'Miguel Ángel Flores', 'Diana Castillo Vargas',
  'Roberto Mendoza Ortiz', 'Sofía Herrera Ríos', 'Fernando Ruiz Medina', 'Gabriela Cruz Navarro',
  'Ricardo Vargas Delgado', 'Verónica Silva Peña', 'Alberto Romero Guzmán', 'Patricia Reyes Campos',
  'Javier Ortiz Morales', 'Carmen Mendoza Luna', 'Luis Fernando Nava', 'Teresa Aguilar Vega',
  'Andrés Pérez Moya', 'Rosa Sandoval Zúñiga', 'Pedro Pablo Sánchez', 'Marcela Rivas Soto',
  'Sergio Muñoz Garza', 'Liliana Treviño Rangel', 'Héctor Delgado Salazar', 'Alejandra Paredes Leal',
  'Manuel Alejandro Ríos', 'Ximena Ortega Rivas', 'Óscar Alberto Rangel', 'Paulina Espinoza Cantú',
  'Francisco Javier Mora', 'Mónica Beltrán Aguirre', 'Daniel Covarrubias Padilla', 'Claudia Peña Marroquín',
  'Arturo Hernández Estrada', 'Rebeca Medina Arce', 'Enrique Vázquez Roldán', 'Guadalupe Rivas Navarro',
  'Rafael de la Cruz Herrera', 'Elena Zavala Quintana', 'Pablo César Luna', 'Beatriz Olivares Ceballos',
  'Jorge Alberto Soto', 'Ángeles Núñez Rangel', 'Mario Rodríguez Piña', 'Esperanza Tovar Salinas',
  'Julio César Camacho', 'Sara Benítez Galván', 'Gustavo Adolfo Rangel', 'Mariana Valdez Cárdenas',
  'Salvador Corona Mena', 'Yolanda Arriaga Rosas', 'Humberto Garza Palacios', 'Adriana Serrano Nava',
  'Alfonso Carrillo Rocha', 'Raquel Espinoza Villarreal', 'Vicente Ávila Escobar', 'Alicia Mireles Carrillo',
  'Raúl Coronado Barrón', 'Daniela Enríquez Quintana', 'Tomás Santiago Solís', 'Ruth Rendón Zamora',
  'Guillermo Pineda Guillén', 'Martha González Hurtado', 'Ángel Trinidad Montes', 'Lourdes Tejeda Guerrero',
  'Rogelio Alemán Zepeda', 'Miriam Alaniz Alvarado', 'Moisés Cárdenas Banda', 'Elsa Cervantes Ruelas',
  'Ismael Valenzuela Ruiz', 'Gloria Zambrano Quiroz', 'Samuel Robledo Segura', 'Nora Escamilla Mares',
  'Artemio Ponce Sánchez', 'Magdalena Curiel Espinoza', 'Leopoldo Rangel Amador', 'Celia Verdugo Arreola',
  'Homero Barajas Maldonado', 'Luz María Centeno Rocha', 'Efrén Castellanos Muñiz', 'Sociedad Rangel Bermúdez',
  'Eliseo Zúñiga Esparza', 'Paulina Velázquez Maya', 'Fidel Guerrero Alemán', 'Reyna Serna Cisneros',
  'Abelardo Covarrubias Ibarra', 'Mara Solís Gamboa', 'Demetrio Peñaloza Rocha', 'Coral Manríquez Tinajero',
  'Ezequiel Manzo Zavala', 'Amelia Cantú Barrientos', 'Arnulfo Tijerina Cabrera', 'Elia Cisneros Saldaña',
  'Herminio Zúñiga Briseño', 'Nereida Gallegos Calleja', 'Anselmo Garibay Sandoval', 'Leticia Rocha Alemán',
  'Baudelio Espinoza Zarate', 'Brígida Carrillo Garza', 'Feliciano Salazar Rosas', 'Consuelo Lugo Alanís',
  'Jacobo Ruiz Viera', 'Elvira Pulido Coronado', 'Leandro Mena Rangel', 'Clemencia Espinoza Cepeda',
  'Marco Vinicio Tovar', 'Marisol Acosta Rosario', 'Higinio Saldaña Terán', 'Rosalba Jacobo Tamayo',
  'Timoteo Rodríguez Córdova', 'Anastasia Álvarez Cantú', 'Procopio González Bautista', 'Filomena Castillo Islas',
  'Jovito Del Villar Jasso', 'Eufemia López Treviño', 'Albino García Gámez', 'Calixta Vela Alemán',
  'Crispín Hernández Molina', 'Hermelinda Alcaraz Bermúdez', 'Epifanio Briseño Yáñez', 'Gertrudis Tamez Reyna',
  'Melquiades Moreno Navarro', 'Eleuterio Rendón', 'Cleofás Rangel Saucedo', 'Amada Contreras Loredo',
  'Bonifacio Lara Sosa', 'Feliciana Medrano Zavala', 'Celestino Chávez Marín', 'Priscila Galván Moreno',
  'Eligio Rosales Herrera', 'Candelaria Casillas Mendoza', 'Ambrosio Mayorga Casas', 'Fermina Alcántar Rivera',
  'Toribio Páez Alcaraz', 'Leonarda Godínez Enriquez', 'Amadeo Noriega Galván', 'Delfina Carvajal Valdez',
  'Saturnino Ruelas Botello', 'Jovita Barrios Carrión', 'Froylán Lerma Zamora', 'Domitila Trejo Amaro',
  'Eleuterio Montalvo Rico', 'Epifania Pelayo Cabrera', 'Fidencio Gámez Banda', 'Rutilia Guardiola Villalobos',
  'Nepomuceno Encinia Cárdenas', 'Petronila Niño Padilla', 'Rutilio Valadez Holguín', 'Evarista Granados Borrego',
  'Wenceslao Mireles Quiñones', 'Marciana Román Angulo', 'Hilario Posada Saavedra', 'Prudencia Almaraz Bouquet',
  'Atanasio Rodríguez Maldonado', 'Honorina Monsiváis Villanueva', 'Prudencio Alcalá Galaviz', 'Anselma Vázquez Galindo',
  'Quirino Montes Ávalos', 'Clotilde Corona Macías', 'Baldomero Esquivel Duarte', 'Herminia de la Torre Guzmán',
  'Eleuterio Orozco Raya', 'Adelina Vélez Marmolejo', 'Xicoténcatl Peña Garfias', 'Macaria Luevano Rubalcava',
  'Cuauhtémoc Muro Avilés', 'Luisa María García Torres', 'Tenoch Álvarez Robles', 'Rocío Guerrero Núñez',
  'Nezahualcóyotl Ramírez Luna', 'Valentina Morales Santos', 'Iztaccíhuatl Hernández Ríos', 'Ariadna Cervantes Molina',
  'Quetzalcóatl Mendoza Vega', 'Mía Fernanda Rangel', 'Citlali Juárez Estrada', 'Renata Tapia Miranda',
  'Huitzilopochtli Serrano Ponce', 'Camila Navarro Aguirre', 'Malinalxóchitl Vargas Rojas', 'Jimena Salazar Cruz',
  'Tonatiuh González Padilla', 'Regina Sandoval Zamora', 'Xóchitl Sánchez Olvera', 'María José Fuentes',
  'Yólotl Martínez Rico', 'Ana Sofía Rentería Lozano', 'Ehékatl Corona Villar', 'Valeria Carranza Alanís',
  'Tláloc Espinoza Marín', 'Paola Núñez Barragán', 'Mictlán Aguayo Romo', 'Fernanda Villarreal Ceballos',
  'Chimalli Acosta Viera', 'Samantha Godínez Ríos', 'Tecuichpo Huerta Paredes', 'Andrea Lomelí Partida',
  'Moctezuma Tovar Medina', 'Alejandra Del Río Calderón', 'Cuitláhuac Larios Villalpando', 'Daniela Padilla Anguiano',
  'Coyolxauhqui Castañeda Robles', 'Regina Zúñiga Cepeda'
];

const calles = ['Bolívar', 'Rubén Darío', 'Central', 'Real', 'Colón', 'Estrada', 'Sandinista', 'Universidad', 'Catedral', 'Libertad',
  'Abelardo', 'Boer', 'Chinandega', 'Duarte', 'El Calvario', 'Guadalupe', 'Hospital', 'Independencia', 'Juárez', 'Los Desamparados',
  'Malecón', 'Nicaragua', 'Ocampo', 'Portales', 'Quezada', 'Rotonda', 'San Antonio', 'Telcor', 'Unión', 'Villa Progreso',
  'Agustín', 'Bello Horizonte', 'Cristo Rey', 'Divina Pastora', 'El Carmen', 'Fátima', 'Granada', 'Héroes', 'Israel', 'Jocote'];

const colonias = ['Centro', 'Altamira', 'Bello Horizonte', 'Ciudad Jardín', 'Divina Pastora', 'El Recreo', 'Fátima', 'Granada', 'Héroes de la Patria', 'Independencia',
  'Jocote Dulce', 'Kilimanjaro', 'La Fuente', 'Las Brisas', 'Monseñor Lezcano', 'Nicarao', 'Omietepe', 'Pancasán', 'Quitirrí', 'Santa Ana',
  'Santa Rosa', 'Sierras de Managua', 'Tiscapa', 'Universidad Centroamericana', 'Villa Flor', 'Villa Progreso', 'Villa Soberana', 'Villa Venezuela', 'Yaguara', 'Zumen'];

const ciudades = ['Managua', 'León', 'Granada', 'Masaya', 'Estelí', 'Chinandega', 'Matagalpa', 'Jinotega',
  'Rivas', 'Boaco', 'Ocotal', 'Jalapa', 'El Viejo', 'Chichigalpa', 'Tipitapa', 'Ciudad Sandino',
  'Diriamba', 'Jinotepe', 'San Marcos', 'Nandaime'];

async function main() {
  console.log('Generating fake doctors...');

  const especialidadesList = await db.select({ id: especialidades.id }).from(especialidades);
  const productosList = await db.select({ id: productos.id, nombre: productos.nombre }).from(productos).where(eq(productos.activo, '1'));
  const espIds = especialidadesList.map(e => e.id);
  const prodIds = productosList.map(p => p.id);

  if (espIds.length === 0) {
    console.error('No hay especialidades. Ejecuta npm run db:seed primero.');
    process.exit(1);
  }

  let created = 0;
  
  for (let i = 0; i < nombres.length; i++) {
    const nombre = nombres[i];
        const nombreClean = nombre.toLowerCase().replace(/[^a-záéíóúüñ ]/g, '').split(' ')[0];
    const codigo = `MED-${String(1001 + i).padStart(4, '0')}`;
    const especialidadId = espIds[Math.floor(Math.random() * espIds.length)];
    const telefono = `505${String(Math.floor(Math.random() * 80000000) + 10000000)}`;
    const email = `${nombreClean}${1001 + i}@consultorio.com`;
    const ciudad = ciudades[Math.floor(Math.random() * ciudades.length)];
    const direccion = `De la ${calles[Math.floor(Math.random() * calles.length)]}, ${Math.floor(Math.random() * 200) + 50} varas al ${['Norte', 'Sur', 'Este', 'Oeste'][Math.floor(Math.random() * 4)]}, casa #${Math.floor(Math.random() * 50) + 1}, ${colonias[Math.floor(Math.random() * colonias.length)]}, ${ciudad}`;
    const activo = Math.random() > 0.15 ? '1' : '0';

    try {
      await db.insert(medicos).values({
        codigo,
        nombre,
        especialidadId,
        direccion,
        telefono,
        email,
        activo,
      });
      created++;
    } catch (err: any) {
      if (err?.code !== 'ER_DUP_ENTRY') {
        console.error(`Error creating ${nombre}:`, err.message);
      }
    }
  }

  console.log(`Created ${created} doctors`);

  // Assign random products to doctors
  if (prodIds.length > 0) {
    const allMedicos = await db.select({ id: medicos.id }).from(medicos);
    let assigned = 0;
    const { medicoProductos } = await import('./schema/index');

    for (const medico of allMedicos) {
      const numProducts = Math.floor(Math.random() * 5) + 1; // 1-5 products per doctor
      const shuffled = [...prodIds].sort(() => Math.random() - 0.5).slice(0, numProducts);
      for (const prodId of shuffled) {
        try {
          await db.insert(medicoProductos).values({ medicoId: medico.id, productoId: prodId });
          assigned++;
        } catch { /* ignore duplicates */ }
      }
    }

    console.log(`Assigned ${assigned} product-doctor relations`);
  }

  console.log('Done!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
