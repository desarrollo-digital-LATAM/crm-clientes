# CRM Clientes - Contexto

## Objetivo del proyecto

CRM interno minimalista para registrar, contactar, seguir y convertir leads de una agencia de desarrollo web, ERP, CRM, SaaS, automatizaciones, IA y software personalizado. El MVP prioriza eficiencia operativa y no busca replicar Salesforce o HubSpot.

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, React Hook Form, Zod, TanStack Query, TanStack Table y Lucide React.
- Backend: NestJS, TypeScript y Prisma ORM.
- Datos: PostgreSQL alojado en Supabase. Autenticación, sesiones y autorización: NestJS + Prisma.

## Arquitectura

Monorepo simple con dos aplicaciones independientes. El backend es un monolito modular NestJS y expone una API REST bajo `/api`. El frontend consume esa API. No hay microservicios, GraphQL ni Docker inicialmente.

## Estructura importante

- `frontend/src/app/`: rutas y layout del frontend.
- `frontend/src/components/`, `hooks/`, `lib/`, `types/`: se crearán cuando una fase los necesite.
- `backend/src/`: módulos por dominio; incluye autenticación, Prisma y Leads.
- `backend/src/prisma/`: módulo global y servicio reutilizable de Prisma.
- `backend/src/auth/`: login local, sesiones HttpOnly, guard, usuario actual, rate limit y endpoints de autenticación.
- `backend/src/leads/`: DTOs, controlador y servicio de la API autenticada de leads.
- `backend/prisma/schema.prisma`: modelo de datos inicial y datasource PostgreSQL.
- `frontend/src/lib/api/`: cliente HTTP con cookies y contratos para auth y leads.
- `frontend/src/components/`: shell, navegación, tema y componentes de leads.
- `frontend/src/types/leads.ts`: contrato frontend alineado con la API de Leads.
- `docs/roadmap.md`: fases y tareas comprobables.
- `backend/.env.example`: variables requeridas, sin credenciales reales.

## Modelo de dominio

- `User`: usuario interno con email único, hash Argon2id, estado activo y roles `ADMIN`/`MEMBER`.
- `Session`: sesión revocable de siete días; PostgreSQL almacena solo SHA-256 del token aleatorio.
- `Lead`: prospecto con contacto, servicio e `source` como string normalizado extensible, estado de pipeline, seguimiento y responsable opcional.
- `LeadActivity`: historial de acciones de un lead, asociado a usuario y fecha.
- `Client`: cliente creado desde un lead ganado; `sourceLeadId` es único y evita duplicar la conversión.

Estados: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`. Orígenes sugeridos: `WEBSITE`, `REFERRAL`, `WHATSAPP`, `LINKEDIN`, `INSTAGRAM`, `FACEBOOK`, `PHONE`, `MANUAL`, `CAMPAIGN` y `OTHER`; se almacenan como string para no requerir migraciones al añadir canales. `serviceInterest` también es string por la misma razón. Los tipos de actividad permanecen como enum por ser un conjunto operativo más estable.

## Decisiones técnicas

- UUID para entidades principales y timestamps gestionados por Prisma.
- Índices iniciales para estado, próximos seguimientos, creación y actividad por lead.
- `estimatedBudget` usa `Decimal(12, 2)` y no `Float`.
- `LeadActivity` se ordenará por `createdAt`; no se mantiene un timestamp duplicado.
- `Client.sourceLeadId` es único y obligatorio: un lead puede originar como máximo un cliente.
- Validación global de NestJS con transformación y whitelist.
- `PrismaService` es global, extiende `PrismaClient`, conecta al iniciar el módulo y desconecta al destruirlo.
- `DATABASE_URL` queda destinada a la conexión pooler y `DIRECT_URL` a migraciones directas; ambas deben ser proporcionadas por Supabase.
- Supabase se usa exclusivamente como hosting PostgreSQL mediante `DATABASE_URL` y `DIRECT_URL`; Supabase Auth fue eliminado del CRM.
- NestJS verifica email y hash Argon2id, genera 32 bytes aleatorios por sesión y guarda únicamente su hash SHA-256.
- La cookie `crm_session` es HttpOnly, SameSite=Lax, Path=/, dura siete días y usa Secure en producción. CORS acepta el origen configurado y credenciales, nunca `*`.
- No hay signup público. Los usuarios se administran por CLI con `npm run user:set-password -- <email>` y `npm run user:create`; la contraseña se solicita sin eco y nunca se pasa por argumento.
- `SessionAuthGuard` valida cookie, expiración y `User.active`, y adjunta `CurrentUser`; módulos como Leads no conocen el mecanismo de sesión.
- Login usa un mensaje uniforme para email inexistente/password incorrecta/inactivo y un rate limit local de 5 intentos por minuto/IP.
- La primera migración debe ejecutarse contra la base real; no se ejecutaron operaciones destructivas ni `prisma db push`.
- El script raíz `npm run dev` conserva el arranque simultáneo de backend y frontend.
- `npm run dev` inicia normalmente sin matar procesos; `npm run dev:clean` ejecuta `kill-port 3000 3001` y luego inicia el stack. La limpieza solo afecta procesos que escuchan esos puertos del proyecto.
- Regla operativa para agentes: todo servidor dev iniciado para pruebas debe detenerse correctamente al finalizar; no usar `taskkill /IM node.exe /F`.
- La API de Leads no accede directamente a la Data API de Supabase: el flujo es Next.js -> NestJS -> Prisma -> PostgreSQL.
- La identidad visual usa el logo oficial local `frontend/public/Logo DesarrolloDigitalLatam.jpeg`, servido como `/Logo DesarrolloDigitalLatam.jpeg` mediante `next/image`.
- El shell privado usa sidebar desktop expandible/colapsable, drawer móvil independiente, header y temas Light/Dark/System mediante variables CSS y provider propio. Las preferencias de tema y sidebar se persisten en `localStorage`.
- La UI consume NestJS con un cliente `fetch` centralizado y `credentials: include`; no usa Bearer ni obtiene tokens desde JavaScript.
- Los formularios de leads usan React Hook Form + Zod y mantienen `estimatedBudget` como string en las respuestas de API.
- La validación definitiva de Leads vive en los DTO de NestJS y se replica en Zod para UX. Email se guarda con trim/minúsculas y teléfono como string canónico (`+` opcional y 7-15 dígitos), eliminando espacios, guiones y paréntesis; nunca se convierte a número.
- Límites de Lead: nombre 2-100, empresa 150, email 254, servicio 120, origen 80, notas/mensaje 5000 y presupuesto 0-999999999.99 con máximo dos decimales. Una creación solo programa seguimiento para hoy/futuro; PATCH permite conservar seguimientos vencidos para que puedan gestionarse y reprogramarse.
- El detalle `/leads/[id]` muestra datos operativos, contacto, seguimiento y timeline compacto; el nombre de la tabla enlaza al detalle sin hacer clickeable la fila completa.
- La tabla de Leads usa `@radix-ui/react-dropdown-menu` con `Portal` para que las acciones no queden recortadas por el overflow horizontal. La tabla crece verticalmente con la página y reserva scroll interno solo para el eje horizontal cuando el viewport lo requiere.
- FASE 5 usa `GET /api/leads/:id/activities` y `POST /api/leads/:id/activities`. El backend toma `userId` de `CurrentUser`, registra `LeadActivity` descendente y no ofrece edición/eliminación de actividades.
- `lastContactAt` se actualiza solo con `CALL`, `WHATSAPP`, `EMAIL` y `MEETING`. `FOLLOW_UP` permanece como actividad interna y no lo actualiza automáticamente.
- Un cambio real de estado en `PATCH /api/leads/:id` crea `STATUS_CHANGE` con descripción legible, usuario y lead dentro de una transacción; el mismo estado no genera actividad.

## Estado actual

Fase 0, Fase 1, Fase 2, Fase 3, Fase 4, Fase 4.1, Fase 4.1.1, Fase 4.1.2, Fase 5 y Fase 6 completadas. La migración definitiva de autenticación local NestJS está completada y validada. El desarrollo funcional está detenido y FASE 7 no se ha iniciado.

## Último trabajo realizado

Se implementó el CRM Shell y la UI de Leads: layout privado, sidebar/drawer, header, branding oficial, selector de tema, tabla con filtros/búsqueda/paginación, formulario create/edit, cambios rápidos de estado y acciones conectadas a la API. `npm run dev` inició Next.js y NestJS correctamente; `GET /api/leads` sin token devuelve `401`.
Fase 4.1 refinó jerarquía visual, espaciado y tamaños de interacción; añadió sidebar desktop de 248/72 px con persistencia, tooltips en estado colapsado y mantuvo el drawer móvil separado. La visión de automatizaciones, integraciones y MCP/WebMCP queda documentada para el futuro, sin implementación.
La estabilización 4.1.1 distingue `401` de errores de red del API: ante indisponibilidad temporal se conserva el shell, se muestra un aviso controlado y se ofrece reintento. El provider propio mantiene los tres temas y la persistencia sin usar `next-themes` ni scripts inline de tema.
Fase 4.1.2 integró el logo oficial sin filtros de color, corrigió el centrado del branding en sidebar colapsado y añadió `npm run dev:clean` para liberar únicamente los puertos 3000 y 3001 de forma voluntaria antes de iniciar el stack.
El refinamiento UX previo a Fase 5 mantiene el formulario de lead como panel controlado, con cierre por overlay, Escape, X y Cancelar, y usa un hover destructivo sutil para Cerrar sesión compatible con ambos temas.
FASE 5 añadió detalle de lead, formulario de actividad, timeline con iconos Lucide, enlaces de contacto y estados visuales para seguimiento vencido/hoy. No se modificó `schema.prisma` ni se creó migración: el modelo `LeadActivity` y sus enums/relaciones existentes eran suficientes.
FASE 5 validación funcional completada con lead real `593b713f-2ac0-4e16-823a-362834f555c7`:
- Detalle `/leads/[id]` carga nombre, empresa, email, teléfono, servicio, origen, estado, responsable, próximo seguimiento, último contacto.
- Actividad NOTE registrada y aparece en timeline.
- Actividad CALL registrada, aparece en timeline y actualiza `lastContactAt`.
- Actividad WHATSAPP registrada, aparece en timeline y actualiza `lastContactAt` correctamente.
- Cambio de estado NEW → CONTACTED crea automáticamente actividad STATUS_CHANGE con descripción `Estado cambiado de Nuevo a Contactado`.
- Guardar lead sin cambiar estado NO crea STATUS_CHANGE duplicado.
- `nextFollowUpAt` programado para mañana y mostrado en detalle.
- Recarga del navegador confirma persistencia de lead, actividades, status, `lastContactAt`, `nextFollowUpAt`.
- Tabla `/leads` muestra estado actualizado y seguimiento actualizado.
- Verificación PostgreSQL: NOTE, CALL, WHATSAPP, STATUS_CHANGE (uno solo) existen; todos pertenecen al lead correcto; `userId` corresponde al usuario autenticado; timestamps coherentes; `lastContactAt` coincide con actividad de contacto; `nextFollowUpAt` almacenado.
- Regla `lastContactAt`: NOTE y FOLLOW_UP no la actualizan; CALL, WHATSAPP, EMAIL, MEETING sí la actualizan.
- Prueba de error: GET `/api/leads/<uuid-inexistente>` y `/api/leads/<uuid-inexistente>/activities` devuelven 404; sin 500, loading infinito ni crash.
- Timeline: orden correcto descendente, sin duplicados, sin reload manual, iconos Lucide por tipo, funciona dark/light.
El hotfix de runtime de FASE 5 conserva `useParams` de Next.js 16 para el Client Component, distingue ID/404/error de red y limita a 7 segundos la espera de sesión o API. La sección de actividades falla de forma independiente sin bloquear el detalle.
La autenticación final elimina proxy, clientes Supabase y validaciones remotas. `/login` renderiza sin depender de auth; al enviar usa `POST /api/auth/login`. Las rutas CRM muestran una pantalla neutral mientras TanStack Query consulta `/api/auth/me`: `200` habilita el shell y los datos, `401` redirige a login sin destellar contenido privado y los errores de red ofrecen reintento. Logout revoca la fila `Session`, limpia la cookie y redirige.
El refinamiento puntual de la tabla de Leads sustituyó el menú absoluto interno por un dropdown Radix portaled, eliminó la duplicación del email en Contacto, ajustó anchos/altura de fila/responsable/fechas/seguimiento y unificó la paginación con el contenedor. Se validó con el Lead real en light/dark, 768 px y sidebar expandido/colapsado: sin overflow vertical, menú dentro del viewport y cierre por Escape/click externo/selección.
El refinamiento de calidad de datos centralizó transformaciones compartidas por Create/Update: strings con trim, vacíos opcionales a null/undefined, email en minúsculas y teléfono normalizado. Backend rechaza caracteres no telefónicos, menos de 7 o más de 15 dígitos, precisión/límites inválidos y textos excesivos; el formulario anticipa las mismas reglas con Zod, `tel`, `inputMode`, límites HTML y errores por campo. No requirió cambios de Prisma ni migración.

Refinamiento App Shell (post-Fase 5):
- AppShell restructurado a `flex h-dvh overflow-hidden` para viewport estable.
- Sidebar desktop: `h-dvh` con `flex-col`, navegación arriba, usuario anclado abajo con `mt-auto`.
- Header: `flex-shrink-0` fuera del contenedor scrollable, permanece visible.
- Main content: `flex-1 min-h-0 overflow-y-auto` única zona con scroll vertical.
- Body: clase `crm-shell-active` añade `overflow: hidden` solo en rutas autenticadas; `/login` y páginas públicas sin afectar.
- Mobile drawer preservado sin cambios.
- Validado en 1920x1080 y 1366x768: sidebar/usuario/header fijos, main scrollea, sin scrollbars anidados, dropdown Lead sigue funcionando, estado collapsed persiste.
- Archivos modificados: `frontend/src/components/layout/app-shell.tsx`, `frontend/src/components/layout/app-sidebar.tsx`, `frontend/src/app/globals.css`.

FASE 6 - Formulario público de interesados / Captación de Leads:
- Página pública `/contacto` sin AppShell, con branding Desarrollo Digital Latam y formulario profesional.
- Endpoint `POST /api/public/leads` sin autenticación, con rate limit (5 req/10 min/IP) y honeypot (`website`).
- DTO público `CreatePublicLeadDto` limitado: name, company, email, phone, serviceInterest, sourceDetail, estimatedBudget, message.
- Backend fuerza `status = NEW`, `source = "WEBSITE"`, `assignedUserId = null`; ignora status/source/assignedUserId enviados por cliente.
- Respuesta mínima `{ success: true, id }` sin filtrar estructura CRM interna.
- Validaciones: nombre 2-100, email formato, phone 7-15 dígitos, mensaje 10-5000, al menos email o phone.
- Servicios: Desarrollo web, Sistema web, ERP, CRM, SaaS, Automatización, IA, App móvil, Otro.
- Honeypot: si `website` tiene valor, responde 201 `{ success: true }` sin crear lead.
- Rate limit: 5 requests / 10 minutos / IP usando ThrottlerGuard.
- CORS restringido a FRONTEND_URL con credentials.
- Tabla Leads: muestra "Sin asignar" para assignedUserId null y "Sitio web" para source WEBSITE.
- Detalle Lead: muestra "Mensaje del interesado" con el message del formulario público.
- Prueba manual: formulario válido → 201, lead aparece en CRM con status Nuevo, origen Sitio web, responsable Sin asignar, mensaje visible.
- Validación error: nombre corto, email inválido, phone abc, sin contacto, mensaje corto → 400 con mensajes claros.
- Honeypot: request con website="bot" → 201 success true, lead NO creado.
- Auth: POST /api/public/leads funciona sin sesión; GET /api/leads sin cookie → 401.
- Archivos nuevos: `backend/src/leads/dto/public-lead.dto.ts`, `backend/src/leads/public-leads.controller.ts`, `backend/src/leads/public-leads.module.ts`, `frontend/src/lib/public-lead-validation.ts`, `frontend/src/components/public/public-lead-form.tsx`, `frontend/src/app/(public)/contacto/page.tsx`, `frontend/src/app/(public)/layout.tsx`.
- Archivos modificados: `backend/src/leads/leads.service.ts`, `backend/src/app.module.ts`, `frontend/src/lib/api/leads.ts`, `frontend/src/components/leads/lead-table.tsx`.

## Próximo paso

Desarrollo funcional pausado por decisión del equipo. No iniciar FASE 7. FASE 6 completada y validada funcionalmente.

## Problemas conocidos

- Migraciones existentes: esquema inicial y dos migraciones de auth local (`local_auth_sessions` y `require_user_password`).
- `npx prisma migrate status` confirma: 3 migraciones encontradas y esquema de base de datos actualizado.
- La conexión usa `DATABASE_URL` para el pooler de Supabase y `DIRECT_URL` para operaciones directas/migraciones.
- El frontend solo requiere `NEXT_PUBLIC_API_URL`. Las variables públicas de Supabase Auth se retiraron de código y `.env.example`; `DATABASE_URL`/`DIRECT_URL` se mantienen porque PostgreSQL continúa en Supabase.
- El antiguo loop SSR dejó de ser aplicable: no existe cliente Supabase ni `proxy.ts`; la única autoridad de sesión es NestJS mediante `/api/auth/me`.
- La migración conservó `User.id`, nombre, email, rol y relaciones del usuario existente; eliminó únicamente `authUserId`. La contraseña inicial se estableció por CLI antes de hacer `passwordHash` obligatorio.
- Endpoints protegidos implementados: `POST /api/leads`, `GET /api/leads`, `GET /api/leads/:id`, `PATCH /api/leads/:id` y `DELETE /api/leads/:id`.
- `CreateLeadDto` y `UpdateLeadDto` comparten normalización y límites para strings, email, teléfono, presupuesto y fechas; mantienen `LeadStatus` y UUID del responsable. Un lead requiere nombre de 2-100 caracteres y email o teléfono válido.
- `GET /api/leads` acepta `page`, `limit` (máximo 100), `search`, `status`, `source`, `serviceInterest`, `assignedUserId`, `sortBy` y `sortOrder`. La búsqueda usa `contains` insensible a mayúsculas en nombre, empresa, email y teléfono.
- Si no se envía `assignedUserId` al crear, se asigna el `User` autenticado. Un responsable indicado debe existir; no se aceptan asignaciones inválidas silenciosamente.
- Se mantiene `DELETE` en el MVP porque la operación es necesaria y está protegida; si una relación impide eliminar, responde `409`. Las actividades no se editan ni eliminan y el borrado de leads conserva el comportamiento existente.
- No fue necesario modificar `schema.prisma` ni crear una migración para Fase 3 ni Fase 5; `LeadActivity` ya soportaba NOTE, CALL, WHATSAPP, EMAIL, MEETING, STATUS_CHANGE y FOLLOW_UP.
- Fase 4 no modifica backend, Prisma ni migraciones. No implementa actividades, clientes funcionales, dashboard analítico ni formulario público.
- La API de Leads se consume exclusivamente a través de NestJS; el frontend no accede directamente a la Data API de Supabase. FASE 5 añade los endpoints autenticados de actividades bajo `/api/leads/:id/activities`.
- La verificación runtime confirmó login inválido uniforme, login válido, dashboard, leads, creación/apertura de detalle, refresh persistente, logout revocado y 401 sin cookie.
- La raíz y el layout CRM no dependen de Supabase remoto ni NestJS para emitir su primera respuesta. `/api/auth/me` se consulta después del montaje y distingue `401`, `403`, timeout, error HTTP y fallo de red; Reintentar ejecuta `refetch` sin recargar el documento.
- No quedan imports, paquetes ni llamadas de Supabase Auth en frontend o backend. PostgreSQL alojado en Supabase no cambia.
- Node actual: `v24.19.0`; npm: `11.17.0`. El proyecto compila con Node 24, pero se recomienda Node 22 LTS para reducir riesgos con dependencias nativas. No se hizo downgrade automático.
- Next.js muestra una advertencia no bloqueante por lockfiles separados del monorepo (`package-lock.json` raíz y de `frontend`).
- En este entorno Windows/Node 24, el primer `npm run install:all` falló durante el postinstall nativo de `unrs-resolver`; la instalación del frontend terminó con `npm install --ignore-scripts`. Conviene repetir la instalación estándar en un entorno limpio antes de producción.
- `npm audit` del backend reporta 3 vulnerabilidades altas transitivas; no se aplicó `npm audit fix --force` para evitar actualizaciones mayores no revisadas.

## Comandos importantes

- `npm run install:all`: instala dependencias de ambas aplicaciones.
- `npm run dev`: inicia backend y frontend simultáneamente.
- `npm run dev:clean`: libera voluntariamente 3000/3001 y luego inicia backend y frontend.
- `npm run typecheck`: comprueba TypeScript en ambas aplicaciones.
- `npm run build`: construye backend y frontend.
- `npm run lint --prefix frontend`: ejecuta lint del frontend.
- `npm run lint --prefix backend`: ejecuta lint del backend.
- `npm run prisma:validate --prefix backend`: valida el esquema Prisma.
- `npm run user:set-password --prefix backend -- <email>`: establece de forma interactiva la contraseña de un usuario existente.
- `npm run user:create --prefix backend`: crea interactivamente un usuario interno `MEMBER`.

## Regla del monorepo

La raíz `crm-clientes/` contiene su propio:

- package.json
- package-lock.json

Estos archivos NO deben eliminarse.

El package.json raíz orquesta frontend y backend mediante scripts como:

- npm run dev
- npm run dev:clean
- npm run install:all

Los package.json/package-lock.json de frontend y backend también se mantienen.

La advertencia de Next.js por múltiples lockfiles NO debe solucionarse
eliminando archivos de la raíz.