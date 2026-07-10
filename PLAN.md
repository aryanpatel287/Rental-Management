# ERP Hackathon Starter Kit — Implementation Plan

## Architecture Philosophy

Every feature is a **self-contained, copy-pasteable module** following the existing `auth/` pattern:

```
server/src/modules/{feature}/     ← can be copied to a new repo as-is
  index.js                         exports router
  schema/                          Drizzle table definitions
  routes/                          Express routes
  controllers/                     Request handlers
  services/                        Business logic
  middleware/                      Auth, permissions
  validators/                      Input validation
  seed/                            Pre-built entity data

client/src/features/{feature}/    ← can be copied to a new repo as-is
  pages/                           Route-level page components
  components/                      Reusable UI components
  hooks/                           Custom React hooks
  services/{feature}.api.js        Axios API layer
  {Feature}Context.jsx             State management
  styles/                          SCSS modules
```

Modules register in **2 lines of glue** — one on the server (`app.use(...)`) and one on the client (route import).

---

## Module 1: CRUD Engine (`crud`)

### Purpose

A single generic engine that handles **all entity CRUD** (Product, Order, Lead, Employee, etc.) by reading metadata from config tables. Adding a new entity = writing one config block.

### DB Schema (Dynamic Tables)

```sql
entity_definitions
  id            UUID [PK]
  name          TEXT           -- 'Product', 'Order', 'Lead'
  slug          TEXT [UNIQUE]  -- 'product', 'order', 'lead'
  table_name    TEXT [UNIQUE]  -- actual PG table name
  description   TEXT
  is_active     BOOLEAN
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

field_definitions
  id              UUID [PK]
  entity_id       UUID [FK -> entity_definitions]
  name            TEXT                 -- 'Name', 'Price', 'Status'
  column_name     TEXT                 -- 'name', 'price', 'status'
  field_type      TEXT                 -- text, number, select, date, boolean, email, textarea
  required        BOOLEAN
  unique          BOOLEAN
  default_value   TEXT
  options         JSONB                -- [{ label: 'Active', value: 'active' }]
  validation      JSONB                -- { min: 0, max: 10000 }
  ui_config       JSONB                -- { showInList: true, showInForm: true }
  sort_order      INTEGER
```

### Dynamic Table Creation (`table-manager.service.js`)

When an entity is defined, the engine runs:
```sql
CREATE TABLE crud_{slug} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  {column_name} {mapped_pg_type} {constraints},
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Column types are mapped from `field_type` → PostgreSQL types:
- `text` → `TEXT`
- `number` → `NUMERIC`
- `select` → `TEXT`
- `boolean` → `BOOLEAN`
- `date` → `TIMESTAMP`
- `email` → `TEXT`

### Server Structure

```
server/src/modules/crud/
  index.js                          # exports crudRouter
  schema/
    entity.schema.js                # entity_definitions table
    field.schema.js                 # field_definitions table
  routes/
    definitions.routes.js           # Manage entity/field definitions (admin)
    data.routes.js                  # CRUD on entity data: /api/crud/:slug
  controllers/
    definitions.controller.js
    data.controller.js
  services/
    table-manager.service.js        # CREATE TABLE / ALTER TABLE via raw SQL
    crud.service.js                 # Generic SELECT/INSERT/UPDATE/DELETE via raw SQL
    definition.service.js           # Entity + field CRUD
  middleware/
    crud-access.middleware.js       # Role-based per-entity access
  validators/
    crud.validator.js
  seed/
    inventory.js                    # Product, Category, StockMovement
    crm.js                          # Lead, Customer, Deal
    hr.js                           # Employee, Department, LeaveRequest
```

### Client Structure

```
client/src/features/crud/
  pages/
    CrudListPage.jsx                # Generic table view for any entity
    CrudFormPage.jsx                # Generic create/edit form
  components/
    AutoTable.jsx                   # Reads field_definitions → renders columns
    AutoForm.jsx                    # Reads field_definitions → renders inputs + validation
    DynamicField.jsx                # Renders single field by type (input, select, etc.)
  hooks/
    useCrud.js                      # useList, useItem, useCreate, useUpdate, useDelete
    useEntityDefinition.js          # Fetches entity + field definitions
  services/crud.api.js              # Axios client
  CrudContext.jsx                   # Optional — shared state if needed
  styles/
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/crud/definitions` | List all entities |
| `POST` | `/api/crud/definitions` | Create new entity (auto-creates table) |
| `GET` | `/api/crud/definitions/:slug` | Get entity + field definitions |
| `PUT` | `/api/crud/definitions/:slug` | Update entity definition |
| `DELETE` | `/api/crud/definitions/:slug` | Delete entity + drop table |
| `GET` | `/api/crud/:slug` | List records (paginated, filtered, sorted) |
| `GET` | `/api/crud/:slug/:id` | Get single record |
| `POST` | `/api/crud/:slug` | Create record |
| `PUT` | `/api/crud/:slug/:id` | Update record |
| `DELETE` | `/api/crud/:slug/:id` | Soft-delete record |

---

## Module 2: Dynamic Dashboard (`dashboard`)

### Purpose

A config-driven **UI orchestration layer** that renders role-specific dashboards. The dashboard itself holds **no data** — it's a pure layout engine. Each widget fetches data from the relevant feature API (CRUD, Auth, etc.) independently.

### Config Storage

No mandatory DB table. Dashboard configuration starts as a **JS config object** or a lightweight DB table if runtime editing is needed later.

Config shape:
```js
// server/src/modules/dashboard/config/dashboards.js
export const dashboardDefaults = {
  ADMIN: [
    { widgetType: 'stats-card',    w: 3, h: 1, settings: { title: 'Total Users',    endpoint: '/api/auth/stats/users' } },
    { widgetType: 'stats-card',    w: 3, h: 1, settings: { title: 'Total Products', endpoint: '/api/crud/product' } },
    { widgetType: 'chart',         w: 6, h: 3, settings: { type: 'line', endpoint: '/api/crud/order?group=monthly' } },
    { widgetType: 'recent-table',  w: 6, h: 3, settings: { entity: 'order', limit: 5 } },
    { widgetType: 'activity-feed', w: 4, h: 2, settings: {} },
  ],
  MANAGER: [ /* ... */ ],
  VENDOR: [ /* ... */ ],
  EMPLOYEE: [ /* ... */ ],
};
```

If runtime editing is desired, migrate to a DB table:
```sql
dashboard_configs
  id            UUID [PK]
  role          TEXT [UNIQUE]
  layout        JSONB       -- [{ widgetType, w, h, settings }, ...]
  is_active     BOOLEAN
```

### Server Structure

```
server/src/modules/dashboard/
  index.js                          # exports dashboardRouter
  config/
    dashboards.js                   # Per-role dashboard config (defaults)
  routes/
    dashboard.routes.js             # GET /api/dashboard/config
  controllers/
    dashboard.controller.js
  services/
    dashboard.service.js            # Reads config for current user role
  middleware/
    dashboard-access.middleware.js
```

### Client Structure

```
client/src/features/dashboard/
  pages/
    DashboardPage.jsx               # Main dashboard page (reads config → renders)
  components/
    DashboardRenderer.jsx           # CSS Grid layout from config
    WidgetRegistry.jsx              # Map: widgetType → React component
    GridLayout.jsx                  # CSS Grid with span support
    widgets/
      StatCardWidget.jsx            # KPI card — fetches its own data
      ChartWidget.jsx               # Chart.js / Recharts wrapper
      TableWidget.jsx               # Mini table (reuses AutoTable from crud)
      ActivityFeedWidget.jsx        # Timeline of recent actions
      TaskListWidget.jsx            # Pending tasks list
      ApprovalQueueWidget.jsx       # Pending approvals with action buttons
      CalendarWidget.jsx            # Upcoming events (mini calendar)
      QuickActionsWidget.jsx        # Shortcut buttons (+ User, + Order, etc.)
      AIPromptWidget.jsx            # Simple AI chat input (placeholder)
  hooks/
    useDashboard.js                 # Fetches dashboard config for current role
  services/
    dashboard.api.js                # Axios client (for config endpoint)
  DashboardContext.jsx
  styles/
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard/config` | Get dashboard layout config for current user's role |

Each widget self-fetches its own data from the relevant feature API directly on the client side — no dashboard-specific data endpoints needed.

### Widget Contract

Every widget receives the same props:
```jsx
<Widget
  config={{ w, h, settings }}     // from dashboard config
  onAction={(type, payload)}       // for interactive widgets (approve, navigate, etc.)
/>
```

Widgets are responsible for their own data fetching using the settings (e.g., `settings.endpoint`, `settings.entity`).

---

## Shared Components

These grow organically as widgets and CRUD pages are built. Shared components live in `client/src/features/shared/components/`:

| Component | Used By |
|-----------|---------|
| `AutoTable.jsx` (from crud) | CRUD list, TableWidget |
| `AutoForm.jsx` (from crud) | CRUD form, QuickActions |
| `Modal.jsx` | Confirmation dialogs, forms |
| `Toast/Notification.jsx` | Already partially exists via `showToast` in AuthContext |
| `Pagination.jsx` | CRUD list, TableWidget |
| `LoadingSpinner.jsx` | All async operations |
| `EmptyState.jsx` | Empty tables/lists |
| `Breadcrumbs.jsx` | Page navigation |

---

## Implementation Order

### Phase 1 — CRUD Engine Backend (Steps 1–4)

| Step | Module | What | Depends On |
|------|--------|------|------------|
| 1 | `crud` | Schema: `entity_definitions`, `field_definitions` tables | Nothing |
| 2 | `crud` | `table-manager.service.js` — dynamic `CREATE TABLE` via raw SQL | Step 1 |
| 3 | `crud` | `crud.service.js` — generic SELECT/INSERT/UPDATE/DELETE on dynamic tables | Step 2 |
| 4 | `crud` | `data.routes.js` + `data.controller.js` — auto-registered CRUD API routes | Step 3 |
| 4b | `crud` | `definitions.routes.js` + `definitions.controller.js` — entity management API | Step 1 |

### Phase 2 — CRUD Frontend (Steps 5–8)

| Step | Module | What | Depends On |
|------|--------|------|------------|
| 5 | `crud` | `DynamicField.jsx` — render input by type (text, select, number, etc.) | Nothing |
| 6 | `crud` | `AutoForm.jsx` — form from field definitions | Step 5 |
| 7 | `crud` | `AutoTable.jsx` — table from field definitions | Step 5 |
| 8 | `crud` | `CrudListPage.jsx`, `CrudFormPage.jsx`, `useCrud.js`, `crud.api.js` | Steps 6, 7, 4 |

### Phase 3 — Seed Entities (Step 9)

| Step | Module | What | Depends On |
|------|--------|------|------------|
| 9 | `crud` | Seed data — `inventory.js` (Product, Category), `crm.js` (Lead, Customer) | Step 4 |

### Phase 4 — Dashboard (Steps 10–14)

| Step | Module | What | Depends On |
|------|--------|------|------------|
| 10 | `dashboard` | `dashboards.js` config — per-role widget layout (JS object, no DB) | Nothing |
| 11 | `dashboard` | `dashboard.service.js` + `dashboard.routes.js` — config endpoint | Step 10 |
| 12 | `dashboard` | `WidgetRegistry.jsx` — type → component map | Nothing |
| 13 | `dashboard` | `DashboardRenderer.jsx` + `GridLayout.jsx` — CSS Grid layout engine | Step 12 |
| 14 | `dashboard` | `DashboardPage.jsx` + `useDashboard.js` + `dashboard.api.js` | Steps 11, 13 |

### Phase 5 — Dashboard Widgets (Steps 15–17)

| Step | Module | What | Depends On |
|------|--------|------|------------|
| 15 | `dashboard` | Core widgets: `StatCardWidget`, `ChartWidget`, `TableWidget` | Step 12, Step 7 |
| 16 | `dashboard` | `ActivityFeedWidget`, `TaskListWidget`, `ApprovalQueueWidget` | Step 12 |
| 17 | `dashboard` | `CalendarWidget`, `QuickActionsWidget`, `AIPromptWidget` | Step 12 |

### Phase 6 — Polish (Steps 18–19)

| Step | Module | What | Depends On |
|------|--------|------|------------|
| 18 | `shared` | Extract reusable patterns (Modal, Pagination, LoadingSpinner, EmptyState) | Phases 2–5 |
| 19 | `shared` | Ensure DESIGN.md tokens are consistently applied across all new components | All |

---

## Registration / Glue Code

### Server (`app.js`)

```js
import { crudRouter } from './modules/crud/index.js';
import { dashboardRouter } from './modules/dashboard/index.js';

app.use('/api/crud', crudRouter);
app.use('/api/dashboard', dashboardRouter);
```

### Client Routes (`app.routes.jsx`)

```jsx
import CrudListPage from '../features/crud/pages/CrudListPage.jsx';
import CrudFormPage from '../features/crud/pages/CrudFormPage.jsx';
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx';

// Inside DashboardLayout children:
{ path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
{ path: 'crud/:entity', element: <ProtectedRoute><CrudListPage /></ProtectedRoute> },
{ path: 'crud/:entity/new', element: <ProtectedRoute><CrudFormPage /></ProtectedRoute> },
{ path: 'crud/:entity/:id', element: <ProtectedRoute><CrudListPage /></ProtectedRoute> },     // detail
{ path: 'crud/:entity/:id/edit', element: <ProtectedRoute><CrudFormPage /></ProtectedRoute> },
```

### DB Schema Registration (`server/src/db/schema/schema.js`)

```js
import { users } from './users.schema.js';
import { entityDefinitions, fieldDefinitions } from '../../modules/crud/schema/crud.schema.js';

export { users, entityDefinitions, fieldDefinitions };
```

---

## Design System Notes

- Use **DESIGN.md** tokens as-is (colors, typography, spacing, rounded corners)
- For ERP-specific components (DataTable, Form, Dashboard), follow existing SCSS patterns in `features/shared/styles/` and `features/auth/styles/`
- The primary color `#000000` can be changed later via the `_variables.scss` file
- Dynamic forms and tables should use existing `button-primary`, `button-secondary`, `text-input`, `badge-pill` component tokens from DESIGN.md

---

## Comments & Questions

<!--
  SECTION FOR DISCUSSION — review these points and leave comments inline.

  [RESOLVED] Dashboard data storage:
  Dashboard does NOT need its own DB tables for data. It's a UI orchestration layer.
  Each widget self-fetches from feature APIs. Config starts as a JS file, optionally
  migrates to a DB table if runtime editing is needed.

  1. Dynamic tables use raw SQL (pg query). Drizzle won't know about them at schema level.
     Is this acceptable, or should I mirror them in Drizzle schemas after creation?

  2. The CRUD engine admin endpoints (create entity, add fields) — should these be
     protected by ADMIN role only, or configurable per entity?

  3. Seed entities — which domains to prioritize first?
     - Inventory (Product, Category, Stock)
     - CRM (Lead, Customer, Deal)
     - HR (Employee, Department, Leave)

  4. For the AIPromptWidget — OpenAI integration placeholder. Should this be a
     dedicated `ai` module later, or live inside dashboard for now?

  5. Soft delete vs hard delete for CRUD data — existing auth module uses soft delete.
     Should CRUD follow the same pattern (isDeleted, deletedAt columns in every dynamic table)?

  6. The DynamicForm should support field-level conditional logic?
     (e.g., show "Discount" field only when "Has Discount" is true)
     This adds complexity — defer to Phase 2 or skip for hackathon speed?

  7. Sidebar navigation in Sidebar.jsx is currently hardcoded.
     Should navigation items be driven by registered CRUD entities + static routes?
     (So adding a new entity auto-adds it to the sidebar)
-->
