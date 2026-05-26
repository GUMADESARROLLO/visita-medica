import { mysqlTable, int, varchar, text, datetime, mysqlEnum, decimal, primaryKey, index } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

export const roles = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 50 }).notNull().unique(),
  descripcion: varchar('descripcion', { length: 255 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const usuarios = mysqlTable('usuarios', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  rolId: int('rol_id').notNull().references(() => roles.id),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  ultimoAcceso: datetime('ultimo_acceso'),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_usuarios_rol').on(table.rolId),
  index('idx_usuarios_activo').on(table.activo),
]);

export const especialidades = mysqlTable('especialidades', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull().unique(),
  descripcion: varchar('descripcion', { length: 500 }),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const medios = mysqlTable('medios', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  telefono: varchar('telefono', { length: 20 }),
  email: varchar('email', { length: 150 }),
  direccion: varchar('direccion', { length: 300 }),
  contacto: varchar('contacto', { length: 150 }),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const moleculas = mysqlTable('moleculas', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 200 }).notNull().unique(),
  descripcion: text('descripcion'),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const productos = mysqlTable('productos', {
  id: int('id').autoincrement().primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  moleculaId: int('molecula_id').references(() => moleculas.id),
  descripcion: text('descripcion'),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_productos_molecula').on(table.moleculaId),
]);

export const productoImagenes = mysqlTable('producto_imagenes', {
  id: int('id').autoincrement().primaryKey(),
  productoId: int('producto_id').notNull().references(() => productos.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  orden: int('orden').default(0),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_imagenes_producto').on(table.productoId),
]);

export const medicos = mysqlTable('medicos', {
  id: int('id').autoincrement().primaryKey(),
  codigo: varchar('codigo', { length: 30 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  especialidadId: int('especialidad_id').references(() => especialidades.id),
  direccion: varchar('direccion', { length: 300 }),
  telefono: varchar('telefono', { length: 20 }),
  email: varchar('email', { length: 150 }),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_medicos_especialidad').on(table.especialidadId),
  index('idx_medicos_activo').on(table.activo),
]);

export const medicoMedios = mysqlTable('medico_medios', {
  medicoId: int('medico_id').notNull().references(() => medicos.id, { onDelete: 'cascade' }),
  medioId: int('medio_id').notNull().references(() => medios.id, { onDelete: 'cascade' }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.medicoId, table.medioId] }),
]);

export const medicoProductos = mysqlTable('medico_productos', {
  medicoId: int('medico_id').notNull().references(() => medicos.id, { onDelete: 'cascade' }),
  productoId: int('producto_id').notNull().references(() => productos.id, { onDelete: 'cascade' }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.medicoId, table.productoId] }),
]);

export const visitadores = mysqlTable('visitadores', {
  id: int('id').autoincrement().primaryKey(),
  usuarioId: int('usuario_id').references(() => usuarios.id),
  codigo: varchar('codigo', { length: 30 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  email: varchar('email', { length: 150 }),
  telefono: varchar('telefono', { length: 20 }),
  activo: mysqlEnum('activo', ['0', '1']).default('1').notNull(),
  deletedAt: datetime('deleted_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_visitadores_usuario').on(table.usuarioId),
]);

export const tipoSolicitud = mysqlTable('tipo_solicitud', {
  id: int('id').autoincrement().primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const solicitudes = mysqlTable('solicitudes', {
  id: int('id').autoincrement().primaryKey(),
  tipoId: int('tipo_id').notNull().references(() => tipoSolicitud.id),
  medicoId: int('medico_id').references(() => medicos.id),
  visitadorId: int('visitador_id').references(() => visitadores.id),
  observacion: text('observacion'),
  estado: mysqlEnum('estado', ['pendiente', 'aprobada', 'rechazada']).default('pendiente').notNull(),
  resueltoPor: int('resuelto_por').references(() => usuarios.id),
  fechaResolucion: datetime('fecha_resolucion'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_solicitudes_tipo').on(table.tipoId),
  index('idx_solicitudes_estado').on(table.estado),
  index('idx_solicitudes_visitador').on(table.visitadorId),
]);

export const solicitudHistorial = mysqlTable('solicitud_historial', {
  id: int('id').autoincrement().primaryKey(),
  solicitudId: int('solicitud_id').notNull().references(() => solicitudes.id, { onDelete: 'cascade' }),
  estadoAnterior: varchar('estado_anterior', { length: 50 }),
  estadoNuevo: varchar('estado_nuevo', { length: 50 }).notNull(),
  comentario: text('comentario'),
  usuarioId: int('usuario_id').references(() => usuarios.id),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_historial_solicitud').on(table.solicitudId),
]);

export const visitas = mysqlTable('visitas', {
  id: int('id').autoincrement().primaryKey(),
  visitadorId: int('visitador_id').notNull().references(() => visitadores.id),
  medicoId: int('medico_id').notNull().references(() => medicos.id),
  fecha: datetime('fecha').notNull(),
  efectiva: mysqlEnum('efectiva', ['0', '1']).default('0').notNull(),
  observacion: text('observacion'),
  latitud: decimal('latitud', { precision: 10, scale: 8 }),
  longitud: decimal('longitud', { precision: 11, scale: 8 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_visitas_fecha').on(table.fecha),
  index('idx_visitas_visitador').on(table.visitadorId),
  index('idx_visitas_medico').on(table.medicoId),
  index('idx_visitas_efectiva').on(table.efectiva),
]);

export const auditoria = mysqlTable('auditoria', {
  id: int('id').autoincrement().primaryKey(),
  usuarioId: int('usuario_id').references(() => usuarios.id),
  accion: varchar('accion', { length: 100 }).notNull(),
  entidad: varchar('entidad', { length: 100 }).notNull(),
  entidadId: int('entidad_id'),
  detalle: text('detalle'),
  ip: varchar('ip', { length: 45 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_auditoria_usuario').on(table.usuarioId),
  index('idx_auditoria_fecha').on(table.createdAt),
]);

export const sesiones = mysqlTable('sesiones', {
  id: int('id').autoincrement().primaryKey(),
  usuarioId: int('usuario_id').notNull().references(() => usuarios.id),
  token: varchar('token', { length: 500 }).notNull(),
  expiracion: datetime('expiracion').notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('idx_sesiones_usuario').on(table.usuarioId),
  index('idx_sesiones_token').on(table.token),
]);

// Relations
export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  rol: one(roles, { fields: [usuarios.rolId], references: [roles.id] }),
  visitador: one(visitadores, { fields: [usuarios.id], references: [visitadores.usuarioId] }),
  sesiones: many(sesiones),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  usuarios: many(usuarios),
}));

export const especialidadesRelations = relations(especialidades, ({ many }) => ({
  medicos: many(medicos),
}));

export const medicosRelations = relations(medicos, ({ one, many }) => ({
  especialidad: one(especialidades, { fields: [medicos.especialidadId], references: [especialidades.id] }),
  medicoMedios: many(medicoMedios),
  medicoProductos: many(medicoProductos),
  visitas: many(visitas),
  solicitudes: many(solicitudes),
}));

export const medicoMediosRelations = relations(medicoMedios, ({ one }) => ({
  medico: one(medicos, { fields: [medicoMedios.medicoId], references: [medicos.id] }),
  medio: one(medios, { fields: [medicoMedios.medioId], references: [medios.id] }),
}));

export const medicoProductosRelations = relations(medicoProductos, ({ one }) => ({
  medico: one(medicos, { fields: [medicoProductos.medicoId], references: [medicos.id] }),
  producto: one(productos, { fields: [medicoProductos.productoId], references: [productos.id] }),
}));

export const mediosRelations = relations(medios, ({ many }) => ({
  medicoMedios: many(medicoMedios),
}));

export const moleculasRelations = relations(moleculas, ({ many }) => ({
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
  molecula: one(moleculas, { fields: [productos.moleculaId], references: [moleculas.id] }),
  imagenes: many(productoImagenes),
  medicoProductos: many(medicoProductos),
}));

export const productoImagenesRelations = relations(productoImagenes, ({ one }) => ({
  producto: one(productos, { fields: [productoImagenes.productoId], references: [productos.id] }),
}));

export const visitadoresRelations = relations(visitadores, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [visitadores.usuarioId], references: [usuarios.id] }),
  visitas: many(visitas),
  solicitudes: many(solicitudes),
}));

export const solicitudesRelations = relations(solicitudes, ({ one, many }) => ({
  tipo: one(tipoSolicitud, { fields: [solicitudes.tipoId], references: [tipoSolicitud.id] }),
  medico: one(medicos, { fields: [solicitudes.medicoId], references: [medicos.id] }),
  visitador: one(visitadores, { fields: [solicitudes.visitadorId], references: [visitadores.id] }),
  resueltoPorUsuario: one(usuarios, { fields: [solicitudes.resueltoPor], references: [usuarios.id] }),
  historial: many(solicitudHistorial),
}));

export const solicitudHistorialRelations = relations(solicitudHistorial, ({ one }) => ({
  solicitud: one(solicitudes, { fields: [solicitudHistorial.solicitudId], references: [solicitudes.id] }),
  usuario: one(usuarios, { fields: [solicitudHistorial.usuarioId], references: [usuarios.id] }),
}));

export const visitasRelations = relations(visitas, ({ one }) => ({
  visitador: one(visitadores, { fields: [visitas.visitadorId], references: [visitadores.id] }),
  medico: one(medicos, { fields: [visitas.medicoId], references: [medicos.id] }),
}));

export const auditoriaRelations = relations(auditoria, ({ one }) => ({
  usuario: one(usuarios, { fields: [auditoria.usuarioId], references: [usuarios.id] }),
}));
