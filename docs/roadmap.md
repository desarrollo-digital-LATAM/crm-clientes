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

Estado: completada.

- [x] Implementar `POST /api/leads/:id/convert` protegido para leads `WON`.
- [x] Garantizar conversión única mediante `Client.sourceLeadId` y convertir conflictos `P2002` en `409`.
- [x] Crear `GET /api/clients`, `GET /api/clients/:id` y `PATCH /api/clients/:id`; no se implementan POST ni DELETE manuales.
- [x] Crear listado paginado/buscable, detalle y edición de clientes.
- [x] Integrar conversión confirmada desde detalle de Lead y enlace al Lead origen.
- [x] Registrar una actividad `NOTE` automática sin modificar el enum de actividades.
- [x] Validar en runtime contra PostgreSQL la conversión, persistencia, edición, búsquedas, reglas negativas y concurrencia con datos QA temporales.

FASE 8: completada funcionalmente. La validación de infraestructura queda pendiente por la conectividad de `DIRECT_URL` y el stress test autenticado.

## Fase 8 - Dashboard

Estado: completada.

- [x] Implementar `GET /api/dashboard/summary` protegido por sesión con agregaciones Prisma paralelas.
- [x] Mostrar métricas reales, pipeline, agrupaciones, actividad reciente y próximos seguimientos.
- [x] Integrar `/dashboard` con loading, error recuperable, vacío y enlaces operativos.
- [x] Validar tests y builds sin modificar Prisma.

Definición: conversión = `Client.count / Lead.count * 100`, con 0% cuando no existen leads. Los seguimientos excluyen `WON` y `LOST`; “hoy” usa `America/Lima` y próximos son posteriores al día local. Orígenes y servicios se agrupan en backend y la UI limita la presentación a cinco elementos.

Siguiente fase prevista: Fase 9 - Pipeline visual / Kanban de Leads.

## Fase 9 - Pipeline visual / Kanban de Leads

Estado: completada.

- [x] Conservar Tabla y añadir selector Tabla/Pipeline persistido en `localStorage`.
- [x] Añadir `GET /api/leads/pipeline` protegido, con una consulta `findMany`, selección mínima, límite de 1000 y agrupación por estado.
- [x] Implementar Kanban responsive horizontal con los siete estados reales, tarjetas de seguimiento y responsable.
- [x] Implementar drag/drop con `@dnd-kit/core`, `PATCH` existente, actualización optimista y rollback ante error.
- [x] Mantener filtros de búsqueda, origen y servicio compartidos entre Tabla y Pipeline.
- [x] Mantener `STATUS_CHANGE` transaccional; no cambiar el estado al arrastrar dentro de la misma columna.
- [x] Mantener `WON` sin conversión automática a Client y `LOST` sin borrar el Lead.
- [x] Añadir tests de agrupación, selección y límite del pipeline; validaciones estáticas completadas.

No se persiste orden manual ni se inicia FASE 11.

## Fase 10 - Automatizaciones comerciales base

- [x] Añadir endpoint protegido `GET /api/automation/recommendations` con cálculo dinámico en una consulta.
- [x] Implementar recomendaciones de seguimiento, contacto estancado, asignación y conversión pendiente.
- [x] Integrar acciones sugeridas en Dashboard y recomendaciones contextuales en Lead detail.
- [x] Añadir cache TanStack Query e invalidaciones específicas tras mutaciones relevantes.
- [x] Cubrir reglas, prioridades, exclusiones, consulta única y protección de sesión con tests.
- [x] Mantener recomendaciones no ejecutables, sin jobs, cron ni integraciones externas.

Estado: completada.

No se modifica Prisma ni el negocio automáticamente. No se inicia FASE 11.

## FASE 11 - Recordatorios y automatizaciones ejecutables

Estado: completada. La QA autenticada final quedó limitada por la ausencia de credenciales QA; se validaron listeners, rutas públicas/protegidas y el cierre controlado del runtime.

- [x] Implementar CRUD autenticado de reminders con ownership, estados y rangos temporales `America/Lima`.
- [x] Integrar `/recordatorios`, Dashboard y Lead detail.
- [x] Añadir usuarios activos mínimos para asignación.
- [x] Conectar CTAs `SCHEDULE_FOLLOW_UP`, `RESCHEDULE_FOLLOW_UP`, `ASSIGN_OWNER` y `CONVERT_CLIENT` en Dashboard y Lead detail.
- [x] Mantener invalidaciones TanStack Query específicas por dominio.
- [x] Cubrir tests de Reminder, Users y mappings de Automation.
- [x] Completar lint, typecheck, build, tests backend y validaciones Prisma.
- [x] Ejecutar validación final disponible y cerrar el runtime temporal sin dejar procesos.
- [x] Marcar FASE 11 completada con la limitación de credenciales QA documentada.

No hay ejecución automática ni notificaciones externas.

## FASE 12 - Notificaciones internas y centro de actividad

Estado: completada.

- [x] Añadir `Notification` con UUID, ownership estricto, `dedupeKey` nullable único e índices de consulta.
- [x] Crear y aplicar migración Prisma revisada usando la configuración de migraciones existente; no se usó `db push` ni `reset`.
- [x] Exponer API protegida para listado paginado, filtros `all/unread/read`, conteo no leído, marcar una y marcar todas; no se añade DELETE.
- [x] Notificar nuevo Lead asignado, asignación real, Lead `WON` y conversión a Client, sin abortar la mutación crítica si falla la notificación.
- [x] Añadir campana accesible en el header y centro `/notificaciones` responsive con estados loading/error/empty, filtros, paginación y acciones de lectura.
- [x] Integrar TanStack Query con claves por dominio, stale times moderados, invalidaciones y actualización optimista al marcar leída.
- [x] Cubrir ownership, filtros, conteo, idempotencia y deduplicación con tests backend.
- [x] Mantener el alcance sin WhatsApp/email/browser push/IA/MCP/Redis/BullMQ/scheduler/cron/workflow engine.

No se inicia FASE 13.

## Fase 10 - Preparación para producción

- [ ] Documentar despliegue, variables y migraciones.
- [ ] Configurar observabilidad mínima y health checks.
- [ ] Ejecutar build de producción y checklist de lanzamiento.
- [ ] Revisar backups, políticas de Supabase y control de acceso.
