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

Estado: completada.

- [x] Autenticar email/password en NestJS con hash Argon2id y mensaje de error uniforme.
- [x] Crear `SessionAuthGuard` y conservar el decorator de usuario actual.
- [x] Persistir solo SHA-256 del token de sesión y enviarlo como cookie HttpOnly de siete días.
- [x] Conservar roles `ADMIN` y `MEMBER` preparados, sin implementar RBAC complejo durante el MVP.
- [x] Crear login y logout contra NestJS; logout revoca sesión y limpia cookie.
- [x] Proteger `/dashboard`, `/leads` y `/clientes` mediante `/api/auth/me`, sin proxy ni Supabase Auth.
- [x] Crear shell mínimo autenticado para `/dashboard`.
- [x] Crear `GET /api/auth/me` con respuesta pública mínima.
- [x] Añadir rate limit de 5 intentos/minuto/IP solo al login.
- [x] Añadir CLI interactivo para contraseña inicial y creación de usuarios internos, sin signup público.
- [x] Migrar el usuario existente preservando ID/datos/relaciones y eliminar `authUserId`.
- [x] Añadir pruebas unitarias de login, sesión, guard, logout y protección de Leads.

Siguiente fase: Fase 3 - Backend/API de Leads.

## Fase 3 - Backend/API de Leads

Estado: completada.

- [x] Crear DTOs y endpoints REST autenticados para leads.
- [x] Validar nombre y al menos un medio de contacto.
- [x] Implementar búsqueda, filtros, ordenación y paginación en API.
- [x] Implementar detalle, actualización y eliminación segura de leads.
- [x] Cubrir reglas principales con tests.

## Fase 4 - CRM Shell + UI de Leads + Branding + Dark Mode

Estado: completada.

- [x] Crear layout privado con sidebar compacto, header y navegación responsive.
- [x] Implementar tabla server-side con TanStack Table.
- [x] Añadir búsqueda con debounce, filtros, badges de estado y acciones.
- [x] Añadir formulario autenticado para crear y editar leads con React Hook Form y Zod.
- [x] Integrar TanStack Query y estados de carga, error, vacío y feedback.
- [x] Añadir temas Light, Dark y System con tokens CSS persistentes.
- [x] Aplicar branding oficial de Desarrollo Digital Latam.
- [x] Refinar la tabla de Leads con menú de acciones mediante Portal, overflow solo horizontal, filas/columnas legibles y paginación integrada.

Siguiente fase: Fase 5 - Detalle del lead y actividades.

## Fase 4.1 - Refinamiento UX/UI del CRM Shell

Estado: completada.

- [x] Añadir sidebar desktop expandido/colapsado con preferencia persistente y tooltips accesibles.
- [x] Mantener el drawer móvil independiente del estado colapsado de escritorio.
- [x] Mejorar jerarquía tipográfica, áreas de interacción y espaciado del shell, Leads y formulario lateral.
- [x] Mantener compatibilidad visual con Light, Dark y System y preparar el componente Brand para el logo oficial.
- [x] Documentar la visión futura de automatizaciones, integraciones y MCP/WebMCP sin implementarla.

Visión futura: las automatizaciones, webhooks, integraciones externas, WhatsApp, email, tareas automáticas y agentes IA deberán pasar por NestJS como capa central de negocio. MCP/WebMCP solo expondrá herramientas controladas; ninguna integración escribirá directamente en PostgreSQL.

## Fase 4.1.1 - Estabilidad runtime

Estado: completada.

- [x] Manejar indisponibilidad temporal de la API sin convertirla en una pantalla 500 ni confundirla con una sesión no autenticada.
- [x] Sustituir `next-themes` por un provider propio compatible con React 19/Next.js 16, conservando Light, Dark, System y persistencia.
- [x] Completar prueba runtime con backend disponible, detenido y reiniciado.

La autenticación Supabase histórica fue sustituida por sesión local NestJS. La prueba runtime autenticada de navegador pasó con cookie persistente y logout revocado.

## Fase 4.1.2 - Hotfix final de procesos y branding

Estado: completada.

- [x] Integrar el logo oficial local con `next/image` y eliminar el monograma provisional.
- [x] Corregir alineación del branding expandido y centrarlo en sidebar colapsado.
- [x] Mantener expand/collapse, persistencia, drawer móvil y compatibilidad Light/Dark/System.
- [x] Añadir `npm run dev:clean` para liberar únicamente 3000/3001 de forma explícita.
- [x] Eliminar el script inline que provocaba el warning de `script tag` y mantener el provider propio de temas.
- [x] Verificar validaciones estáticas, builds, Prisma y runtime sin dejar procesos de esta ejecución.

## Fase 5 - Detalle del lead y actividades

Estado: completada.

- [x] Crear `/leads/[id]` con información principal, contacto, responsable y seguimiento.
- [x] Mostrar timeline descendente de `LeadActivity` con estados vacíos y errores recuperables.
- [x] Registrar notas, llamadas, WhatsApp, email, reuniones y seguimientos mediante `POST /api/leads/:id/activities`; `GET` lista recientes primero.
- [x] Tomar el usuario autenticado desde `CurrentUser`; no aceptar `userId` del cliente. `CALL`, `WHATSAPP`, `EMAIL` y `MEETING` actualizan `lastContactAt`; `FOLLOW_UP` se considera actividad interna y no lo cambia automáticamente.
- [x] Generar `STATUS_CHANGE` en la misma transacción del `PATCH` cuando el estado cambia, sin duplicarlo si permanece igual.
- [x] Editar `nextFollowUpAt` reutilizando el formulario de lead e invalidar detalle, actividades y listado con TanStack Query.
- [x] Evitar loading indefinido con timeout de sesión/API, reintentos finitos y estados explícitos de ID inválido, 404, error recuperable y actividades independientes.
- [x] Eliminar Supabase Auth, proxy, Bearer y espera remota; usar sesión HttpOnly propia validada por NestJS/PostgreSQL.
- [x] Evitar destello de contenido privado con una pantalla neutral mientras `/api/auth/me` valida la sesión.
- [x] Validar con sesión real el login, `/dashboard`, `/leads` y la carga de `/leads/[id]` con tiempos finitos.
- [x] Cerrar la validación funcional de actividades, cambios de estado y persistencia de seguimiento de FASE 5.

Siguiente fase prevista: Fase 6 - Formulario público de interesados / Captación de Leads, después de completar la validación manual autenticada.

## Fase 6 - Formulario público

Estado: completada.

- [x] Crear `/contacto` con formulario profesional y responsive.
- [x] Exponer `POST /api/public/leads` sin autenticación.
- [x] Validar y normalizar payload; crear lead `NEW` con origen `WEBSITE`.
- [x] Añadir rate limiting y honeypot si aporta valor.
- [x] Mostrar confirmación y errores sin revelar información interna.

Siguiente fase prevista: Fase 7 - Conversión a cliente.

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
