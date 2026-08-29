# CRM Clientes - Contexto

## Objetivo del proyecto

CRM interno minimalista para registrar, contactar, seguir y convertir leads de una agencia de desarrollo web, ERP, CRM, SaaS, automatizaciones, IA y software personalizado. El MVP prioriza eficiencia operativa y no busca replicar Salesforce o HubSpot.

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, React Hook Form, Zod, TanStack Query, TanStack Table y Lucide React.
- Backend: NestJS, TypeScript y Prisma ORM.
- Datos y autenticación: PostgreSQL y Supabase Auth.

## Arquitectura

Monorepo simple con dos aplicaciones independientes. El backend es un monolito modular NestJS y expone una API REST bajo `/api`. El frontend consume esa API. No hay microservicios, GraphQL ni Docker inicialmente.

## Estructura importante

- `frontend/src/app/`: rutas y layout del frontend.
- `frontend/src/components/`, `hooks/`, `lib/`, `types/`: se crearán cuando una fase los necesite.
- `backend/src/`: módulos por dominio; actualmente solo está el bootstrap y `AppModule`.
- `backend/src/prisma/`: módulo global y servicio reutilizable de Prisma.
- `backend/src/auth/`: guard Supabase, sincronización de usuarios y endpoint `auth/me`.
- `backend/prisma/schema.prisma`: modelo de datos inicial y datasource PostgreSQL.
- `frontend/src/lib/supabase/`: clientes browser/server de Supabase SSR.
- `frontend/src/proxy.ts`: refresco y protección optimista de rutas de sesión.
- `docs/roadmap.md`: fases y tareas comprobables.
- `backend/.env.example`: variables requeridas, sin credenciales reales.

## Modelo de dominio

- `User`: usuario interno vinculado a Supabase Auth por `authUserId`; roles `ADMIN` y `MEMBER`.
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
- Supabase Auth gestiona credenciales, sesiones y tokens; no se almacenan contraseñas en Prisma.
- El frontend usa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_API_URL`. El backend usa `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (con fallback legado a `SUPABASE_ANON_KEY`).
- No hay signup, proveedores sociales ni panel de usuarios. Los dos usuarios internos deben crearse manualmente en Supabase Dashboard > Authentication > Users; la sincronización local ocurre en el primer acceso autenticado.
- El backend verifica el token con `supabase.auth.getUser(token)` y nunca confía en la decodificación sin firma.
- La primera migración debe ejecutarse contra la base real; no se ejecutaron operaciones destructivas ni `prisma db push`.
- El script raíz `npm run dev` conserva el arranque simultáneo de backend y frontend.

## Estado actual

Fase 0 y Fase 1 completadas. Fase 2 implementada parcialmente y bloqueada para validación end-to-end: existe login, logout, protección de rutas, guard NestJS, sincronización `User` y `GET /api/auth/me`, pero faltan las variables públicas del frontend y la prueba con usuarios reales. No existe todavía CRUD de leads, clientes, dashboard definitivo ni formulario público completo.

## Último trabajo realizado

Se implementó la Fase 2: clientes Supabase SSR browser/server, `proxy.ts`, `/login`, shell autenticado `/dashboard`, logout, guard NestJS, `GET /api/auth/me`, sincronización idempotente de `User` y pruebas unitarias. Las validaciones de código pasan.

## Próximo paso

Configurar las variables públicas de Supabase en `frontend/.env`, crear los dos usuarios internos en Supabase Dashboard > Authentication > Users y verificar manualmente login, persistencia, `/api/auth/me`, logout y redirecciones. Después cerrar la Fase 2.

## Problemas conocidos

- Migración existente: `backend/prisma/migrations/20260829041608_init_crm/migration.sql`.
- `npx prisma migrate status` confirma: 1 migración encontrada y esquema de base de datos actualizado.
- La conexión usa `DATABASE_URL` para el pooler de Supabase y `DIRECT_URL` para operaciones directas/migraciones.
- Fase 2 está bloqueada porque `frontend/.env` no contiene `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; el flujo real de navegador no puede iniciar.
- Añadir en `frontend/.env` las variables del archivo `frontend/.env.example`. Obtener URL y publishable key desde Supabase Dashboard > Project Settings > API.
- Crear manualmente los dos usuarios internos desde Supabase Dashboard > Authentication > Users; no habilitar signup público.
- El endpoint `/api/auth/me` no se pudo verificar manualmente porque el backend no se inicia sin configuración de Supabase Auth válida y el frontend no tiene sus variables públicas.
- El backend usa `SUPABASE_PUBLISHABLE_KEY`; mantiene fallback a `SUPABASE_ANON_KEY` para proyectos Supabase con la nomenclatura anterior. El frontend solo acepta la clave pública mediante `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Node actual: `v24.19.0`; npm: `11.17.0`. El proyecto compila con Node 24, pero se recomienda Node 22 LTS para reducir riesgos con dependencias nativas. No se hizo downgrade automático.
- Next.js muestra una advertencia no bloqueante por lockfiles separados del monorepo (`package-lock.json` raíz y de `frontend`).
- En este entorno Windows/Node 24, el primer `npm run install:all` falló durante el postinstall nativo de `unrs-resolver`; la instalación del frontend terminó con `npm install --ignore-scripts`. Conviene repetir la instalación estándar en un entorno limpio antes de producción.
- `npm audit` del backend reporta 3 vulnerabilidades altas transitivas; no se aplicó `npm audit fix --force` para evitar actualizaciones mayores no revisadas.

## Comandos importantes

- `npm run install:all`: instala dependencias de ambas aplicaciones.
- `npm run dev`: inicia backend y frontend simultáneamente.
- `npm run typecheck`: comprueba TypeScript en ambas aplicaciones.
- `npm run build`: construye backend y frontend.
- `npm run lint --prefix frontend`: ejecuta lint del frontend.
- `npm run lint --prefix backend`: ejecuta lint del backend.
- `npm run prisma:validate --prefix backend`: valida el esquema Prisma.
