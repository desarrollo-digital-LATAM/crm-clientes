# CRM Clientes - Roadmap

Este roadmap mantiene el MVP dividido en entregas pequeñas y verificables. No se deben implementar tareas de una fase posterior sin autorización explícita.

## Fase 0 - Arquitectura y configuración

- [x] Inspeccionar el repositorio y conservar el script raíz `npm run dev`.
- [x] Establecer el monorepo simple `frontend/` + `backend/`.
- [x] Configurar Next.js con App Router, TypeScript y Tailwind CSS.
- [x] Configurar NestJS con TypeScript, prefijo REST `/api` y validación global.
- [x] Preparar scripts de desarrollo, build, lint y typecheck.
- [x] Diseñar el esquema Prisma inicial para `User`, `Lead`, `LeadActivity` y `Client`.
- [x] Definir enums para roles, estados, orígenes y tipos de actividad.
- [x] Definir variables de entorno de ejemplo para PostgreSQL/Supabase.
- [x] Crear la documentación operativa inicial.

## Fase 1 - Backend base, Prisma y Supabase

Estado: completada.

- [x] Revisar el modelo inicial y ajustar fuentes/servicios a valores string extensibles.
- [x] Configurar `PrismaService` dentro del módulo Prisma.
- [x] Crear y revisar la primera migración normal contra PostgreSQL de Supabase.
- [x] Configurar el acceso de Prisma mediante `DATABASE_URL` y `DIRECT_URL` de Supabase.
- [x] Verificar build, lint, typecheck, tests y `prisma validate` con la configuración real.
- [x] Confirmar con `prisma migrate status` que la base de datos está al día.

## Fase 2 - Autenticación y usuarios

Estado: bloqueada para verificación end-to-end hasta configurar las variables públicas de Supabase en `frontend/.env` y probar con usuarios internos reales.

- [x] Validar tokens de Supabase Auth en NestJS mediante `supabase.auth.getUser(token)`.
- [x] Crear guard de autenticación y decorator de usuario actual.
- [x] Sincronizar el usuario autenticado con `User` usando `upsert` por `authUserId`.
- [ ] Aplicar roles `ADMIN` y `MEMBER` sin un sistema de permisos complejo.
- [x] Crear login por email/contraseña y cierre de sesión en frontend.
- [x] Proteger `/dashboard`, `/leads` y `/clientes` mediante `proxy.ts`.
- [x] Crear shell mínimo autenticado para `/dashboard`.
- [x] Crear `GET /api/auth/me` con respuesta pública mínima.
- [x] Añadir pruebas unitarias del guard y sincronización de usuarios.

## Fase 3 - CRUD de leads

- [ ] Crear DTOs y endpoints REST autenticados para leads.
- [ ] Validar nombre y al menos un medio de contacto.
- [ ] Implementar búsqueda, filtro por estado, ordenación y paginación en API.
- [ ] Implementar cambio de estado y registro de la actividad correspondiente.
- [ ] Cubrir reglas principales con tests.

## Fase 4 - Interfaz principal de leads

- [ ] Crear layout privado con sidebar compacto y header.
- [ ] Implementar tabla con TanStack Table.
- [ ] Añadir búsqueda, filtros, badges de estado y acciones.
- [ ] Añadir formulario autenticado para crear y editar leads.
- [ ] Integrar TanStack Query y estados de carga/error/vacío.

## Fase 5 - Detalle del lead y actividades

- [ ] Crear `/leads/[id]` con información principal y de contacto.
- [ ] Mostrar historial cronológico de actividades.
- [ ] Permitir registrar notas, llamadas, mensajes, reuniones y seguimientos.
- [ ] Permitir editar próximo seguimiento y datos operativos.

## Fase 6 - Formulario público

- [ ] Crear `/contacto` con formulario profesional y responsive.
- [ ] Exponer `POST /api/public/leads` sin autenticación.
- [ ] Validar y normalizar payload; crear lead `NEW` con origen `WEBSITE`.
- [ ] Añadir rate limiting y honeypot si aporta valor.
- [ ] Mostrar confirmación y errores sin revelar información interna.

## Fase 7 - Conversión a cliente

- [ ] Implementar `POST /api/leads/:id/convert` para leads `WON`.
- [ ] Garantizar conversión idempotente y relación 1:1 mediante `sourceLeadId`.
- [ ] Crear listado y detalle de clientes.
- [ ] Permitir editar los datos iniciales del cliente.

## Fase 8 - Dashboard

- [ ] Implementar resumen de leads, seguimientos, ganados, perdidos y clientes.
- [ ] Priorizar indicadores accionables sobre gráficos decorativos.
- [ ] Integrar el resumen en `/dashboard`.

## Fase 9 - UX, responsive, seguridad y pruebas

- [ ] Revisar responsive en móvil y escritorio.
- [ ] Revisar accesibilidad, estados vacíos y mensajes de error.
- [ ] Reforzar rate limiting, CORS, validación y logging.
- [ ] Añadir pruebas unitarias y de integración de flujos críticos.

## Fase 10 - Preparación para producción

- [ ] Documentar despliegue, variables y migraciones.
- [ ] Configurar observabilidad mínima y health checks.
- [ ] Ejecutar build de producción y checklist de lanzamiento.
- [ ] Revisar backups, políticas de Supabase y control de acceso.
