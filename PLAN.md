# WooLoader — Plan de arquitectura

> Importador visual masivo de productos para WooCommerce.
> Fork generalizado y open-source de FocusFormProducts.

## 1. Visión

Una herramienta que cualquiera pueda **autohospedar gratis** para cargar su catálogo de
productos con una interfaz visual simple y exportar un CSV compatible con el importador
nativo de WooCommerce — sin tocar planillas a mano.

Dos formas de correrlo:

- **Self-host (open source):** el usuario clona el repo, crea su propio proyecto Supabase
  gratuito, y lo despliega como sitio estático. Es *su* instalación, con *sus* datos.
- **Demo online (hospedada por vos):** una instancia pública con límites (tope de productos,
  datos efímeros) para que la gente pruebe sin instalar nada. Aquí va la publicidad.

## 2. Cambio de modelo respecto a FocusForm

| FocusForm (hoy)                              | WooBulk (nuevo)                                    |
| -------------------------------------------- | -------------------------------------------------- |
| Equipo interno crea *links* para clientes    | **Single-user**: el que entra carga sus productos  |
| Wizard público anónimo por `access_token`    | Editor tras login (no hay acceso anónimo)          |
| RPCs `*_by_token` (SECURITY DEFINER)         | Acceso directo a tablas vía RLS por `user_id`      |
| "Planes" con tope de productos               | Sin planes; tope **solo** en modo demo (env flag)  |
| Branding Focus Team (logos, fuentes, tema)   | White-label neutro + tema configurable             |
| Credenciales Supabase por deploy             | Igual, pero documentado para self-host             |

## 3. Stack (se mantiene)

Vite + React 19 + TS · Tailwind v4 · React Router · Supabase (Postgres + Storage + Auth) ·
Zustand · Zod · PapaParse · react-dropzone · Vitest. Sin servidor Node propio: SPA estática.

## 4. Qué se reutiliza / reescribe / elimina

### Reutilizar casi tal cual (el núcleo de valor, ya está aislado y testeado)
- `src/lib/csv/*` — mapeo producto→filas WooCommerce, `buildCsv`, `generateSku`,
  `mapProductToRows` (+ tests), `mapPriceTiersToCsvRepresentation`.
- `src/lib/variantCombinations.ts` (+ test)
- `src/lib/productValidation.ts` (+ test)
- `src/lib/imageValidation.ts`
- `src/lib/priceFormat.ts`, `weightFormat.ts` (+ tests)
- `src/lib/types.ts` (+ test) — quitar campos Focus-específicos si los hay
- Componentes UI genéricos: `Field`, `PriceInput`, `WeightInput`, `DimensionsInput`,
  `WooProductPreview`, `StatusBadge`, `ConfirmButton`, `ConfirmDialog*`.
- Los steps del wizard (`BasicInfoStep`, `PricingStep`, `AttributesStep`, `ImagesStep`,
  `ReviewStep`, `VariantGrid`) — pasan a ser el editor del usuario logueado.

### Reescribir
- **Esquema Supabase** (`supabase/migrations/`): tabla `products` ligada a `auth.uid()`
  directamente, RLS por dueño. Eliminar `submission_sessions` / `exports` / RPCs por token
  (o simplificar `sessions` a "proyectos de importación" opcionales del mismo usuario).
- **Storage**: rutas `{user_id}/{product_id}/...` con policies por `auth.uid()` en vez de token.
- **Rutas**: `/wizard/:token` → `/app` (editor del usuario). `/admin` → se funde con `/app`
  o desaparece. `/login` con Supabase Auth. Landing pública para la demo.
- **Branding**: `Logo`, tema Tailwind, `index.css`, textos → neutro / configurable por env.

### Eliminar
- `src/lib/plans.ts`, `PlanSelector.tsx`, migración de planes.
- Flujo de creación de links / `CreateUser` / edge function `create-team-user`
  (en single-user no hace falta crear usuarios de equipo).
- RPCs `*_by_token` y sus políticas.

## 5. Modo demo (para tu instancia hospedada)

Controlado por variables de entorno, **sin reintroducir el sistema de planes**:

```
VITE_DEMO_MODE=true
VITE_DEMO_MAX_PRODUCTS=15
```

- Tope duro de productos (enforced en UI **y** en una RLS/trigger del lado Postgres).
- Datos efímeros: o bien login anónimo de Supabase con limpieza periódica, o un botón
  "Probar con datos de ejemplo" que vive solo en memoria/localStorage.
- Slot de publicidad condicional (`<AdSlot>`), renderizado solo si `VITE_DEMO_MODE`.
- En self-host, `VITE_DEMO_MODE=false` → sin límite, sin ads.

## 6. Estructura de repo propuesta

```
FormWoocommerce/
├─ README.md              # setup self-host + explicación demo
├─ PLAN.md                # este archivo
├─ .env.example           # VITE_SUPABASE_* + VITE_DEMO_MODE
├─ LICENSE                # MIT (open source)
├─ src/
│  ├─ lib/                # núcleo reutilizado (csv, validation, format, types)
│  ├─ components/ui/       # componentes genéricos white-label
│  ├─ routes/
│  │  ├─ Landing.tsx      # pública (demo)
│  │  ├─ Login.tsx
│  │  └─ app/             # editor del usuario (ex-wizard)
│  ├─ store/
│  └─ lib/config.ts       # lee DEMO_MODE, branding, límites
└─ supabase/migrations/   # esquema nuevo single-user
```

## 7. Roadmap por fases

1. **Scaffolding + núcleo** — crear proyecto Vite limpio, copiar `src/lib/*` reutilizable
   con sus tests corriendo en verde. (Sin UI todavía; prueba que el core exporta CSV bien.)
2. **Esquema Supabase single-user** — migración nueva con RLS por `auth.uid()`, Storage por
   usuario. Cliente Supabase + Auth (login email).
3. **Editor** — portar los steps del wizard como editor del usuario logueado; autosave.
4. **Export** — botón exportar CSV (ya casi listo, reusa `buildCsv`).
5. **Branding neutro + landing** — tema configurable, landing pública.
6. **Modo demo** — env flags, tope duro, ads slot, datos efímeros.
7. **Docs + deploy** — README de self-host, deploy de tu demo, LICENSE MIT.

## 8. Decisiones cerradas

- **Nombre:** WooLoader.
- **Catálogos múltiples por usuario:** sí — tabla `catalogs` (ex-`sessions`) ligada a
  `auth.uid()`, y `products` ligada a un catálogo. Un usuario tiene N catálogos.
- **Datos efímeros de la demo:** **Supabase Anonymous Auth + TTL**. Cada visitante recibe un
  `auth.uid()` anónimo real → mismo código y mismas RLS que un usuario normal. Limpieza por
  cron (`pg_cron` o Edge Function programada) que borra usuarios anónimos y sus datos/objetos
  de Storage con > 24 h. Defensas: tope duro de productos (RLS/trigger), subida de imágenes
  desactivada o muy limitada en modo demo. **No** se usa una segunda ruta de datos
  (localStorage) — la demo ejercita el mismo camino real que el self-host.
- **Deploy de la demo:** Netlify (SPA estática; redirects para React Router en
  `netlify.toml`/`_redirects` en vez del `.htaccess` de Hostinger).
```
