
You are building a production-grade business management system for **Interior Villa BD**, a Dhaka-based interior design and execution company. This is your complete specification. Build exactly what is described. Do not add extra abstraction layers or features not listed. Proceed module by module following the phase order at the end.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project Name | Interior Villa Management System (IVMS) |
| Client | Interior Villa BD, Dhaka, Bangladesh |
| Architecture | Laravel 11 monolith + Inertia.js + React |
| Database | MYSQL |
| Currency | BDT (৳), format as `৳1,23,456` (lakh format) |
| Timezone | Asia/Dhaka (UTC+6) |
| Language | English UI |

---

## 2. Tech Stack

### Backend
- **Laravel 11**, PHP 8.3
- **MYSQL** — primary database
- **Laravel Horizon** — queue worker management
- **Laravel Scheduler** — cron jobs
- **Spatie Laravel Permission** — roles and permissions
- **Spatie Laravel Media Library** — file attachments (disk: Cloudflare R2)
- **Laravel Sanctum** — session auth
- **Barryvdh DomPDF** — PDF generation
- **Maatwebsite Excel** — Excel import/export
- **Laravel Pint** — code formatting
- **Pest** — testing

### Frontend
- **React 19** via **Inertia.js v2** — NOT a separate SPA
- **TailwindCSS v4**
- **Zustand** — global UI state (auth user, sidebar, flash messages)
- **React Hook Form + Zod** — form validation
- **Recharts** — charts and graphs
- **Headless UI** — accessible UI primitives (modals, dropdowns)
- **dayjs** — date formatting and manipulation
- **Pusher JS + Laravel Echo** — real-time (optional, wire up but not required for initial release)


---

## 3. Architecture & Conventions

### Folder Structure
```
app/
  Http/
    Controllers/          # One controller per module
    Middleware/
    Requests/             # FormRequest per action
  Models/
  Services/               # Business logic classes
  Policies/               # One Policy per model
  Observers/              # Side effects on model events
  Jobs/                   # Queued jobs
resources/
  js/
    Pages/
      Auth/
      CRM/
      Projects/
      Clients/
      Procurement/
      Inventory/
      Accounts/
      HR/
      Settings/
    Components/           # Shared UI components
    Layouts/              # AppLayout
    Stores/               # Zustand stores
    Hooks/                # Custom React hooks
  views/
    pdf/                  # Blade PDF templates
database/
  migrations/
  seeders/
routes/
  web.php
  auth.php
```

### Core Rules
- All routes use `Route::middleware(['auth'])` 
- All controller actions call `$this->authorize()` using Policy classes
- No business logic in controllers — use Service classes
- All form submissions via Inertia `useForm` — return `Inertia::render()` or `back()->with()`, not JSON
- Use `FormRequest` classes for all validation — never `$request->validate()` inline
- Use database transactions for all multi-table writes
- Soft deletes (`deleted_at`) on all major models
- All primary keys are `uuid` (`uuid_generate_v4()`)
- All timestamps in UTC, display in Asia/Dhaka
- Auto-generated codes: use `YYYY-###` sequences with model-specific prefix

---

## 4. Authentication & Role-Based Access

### Auth
- Session-based via Laravel Sanctum
- Login: email + password
- Password reset via email (use Laravel's built-in reset, configure SMTP later)
- Remember me: 30-day persistent session
- Force password change on first login (`users.must_change_password` boolean)

### Roles (Spatie)
Define these roles. Seed them in `RoleSeeder`. Use `$this->authorize()` in every controller and `@can` in Blade/React props for conditional UI.

| Role | Description |
|---|---|
| `super_admin` | Full access to everything including system settings |
| `admin` | Full access except system settings |
| `project_manager` | Projects, tasks, procurement, inventory (own projects) |
| `accounts` | Full accounts module, view-only on projects and clients |
| `procurement_officer` | Procurement, inventory, vendors |
| `hr_manager` | Employee management, leave, attendance |
| `sales` | CRM, clients, view-only on projects |
| `employee` | Own profile, leave requests, assigned tasks only |

### Permissions (Spatie)
Generate permissions using the pattern `{action}.{resource}`:
```
view.clients, create.clients, edit.clients, delete.clients
view.leads, create.leads, edit.leads, delete.leads
view.projects, create.projects, edit.projects, delete.projects
manage.tasks (create/edit/delete tasks)
view.procurement, create.purchase_orders, approve.purchase_orders
view.inventory, manage.inventory
view.accounts, create.invoices, record.payments, view.reports
manage.employees, manage.leaves, manage.attendance
manage.users, manage.roles (super_admin only)
```
Assign permissions to roles in `RoleSeeder`. Roles can be customized via the UI by `super_admin`.

---

## 5. Database Schema

All tables: `uuid` PK, `created_at`, `updated_at`. Soft deletes (`deleted_at`) where noted. Use `snake_case` for all columns. Define all foreign keys explicitly.

---

### 5.1 Users & Auth

```sql
users
  id                    uuid PK
  name                  varchar(150)
  email                 varchar(150) UNIQUE
  password              varchar
  phone                 varchar(20) nullable
  avatar_path           varchar nullable
  must_change_password  boolean default true
  is_active             boolean default true
  last_login_at         timestamp nullable
  created_at, updated_at, deleted_at

-- Spatie tables: model_has_roles, model_has_permissions, role_has_permissions, roles, permissions
-- These are auto-created by Spatie migrations
```

---

### 5.2 Client Database

```sql
clients
  id                uuid PK
  code              varchar(20) UNIQUE          -- e.g. CL-2025-001
  type              enum('individual','corporate') default 'individual'
  name              varchar(150)
  company_name      varchar(150) nullable
  email             varchar(150) nullable
  phone             varchar(20) NOT NULL
  secondary_phone   varchar(20) nullable
  address           text nullable
  area              varchar(100) nullable        -- e.g. Gulshan, Dhanmondi
  city              varchar(100) default 'Dhaka'
  notes             text nullable
  is_active         boolean default true
  created_by        uuid FK -> users.id
  created_at, updated_at, deleted_at

client_contacts                                  -- additional contacts for corporate clients
  id                uuid PK
  client_id         uuid FK -> clients.id CASCADE
  name              varchar(150)
  designation       varchar(100) nullable
  email             varchar(150) nullable
  phone             varchar(20)
  is_primary        boolean default false
  created_at, updated_at
```

---

### 5.3 CRM

```sql
leads
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. LD-2025-001
  client_id       uuid FK -> clients.id nullable  -- set after qualification
  name            varchar(150)                    -- prospect name before client record
  email           varchar(150) nullable
  phone           varchar(20) NOT NULL
  source          enum('referral','facebook','instagram','website','walk_in','cold_call','exhibition','other')
  project_type    varchar(100) nullable            -- residential, commercial, etc.
  estimated_value decimal(15,2) nullable
  status          enum('new','contacted','qualified','proposal_sent','won','lost') default 'new'
  lost_reason     text nullable
  follow_up_at    datetime nullable
  assigned_to     uuid FK -> users.id nullable
  converted_at    timestamp nullable               -- when moved to won and project created
  notes           text nullable
  created_by      uuid FK -> users.id
  created_at, updated_at, deleted_at

lead_activities                                   -- communication log
  id              uuid PK
  lead_id         uuid FK -> leads.id CASCADE
  type            enum('call','email','whatsapp','site_visit','meeting','note')
  summary         text NOT NULL
  next_action     text nullable
  next_action_at  datetime nullable
  performed_by    uuid FK -> users.id
  performed_at    datetime
  created_at, updated_at
```

---

### 5.4 Projects

```sql
projects
  id                      uuid PK
  code                    varchar(20) UNIQUE      -- e.g. PR-2025-001
  name                    varchar(200)
  client_id               uuid FK -> clients.id
  lead_id                 uuid FK -> leads.id nullable
  type                    enum('residential','commercial','office','retail','restaurant','hospital','other')
  status                  enum('survey','planning','design','execution','finishing','handover','completed','on_hold','cancelled') default 'survey'
  site_address            text NOT NULL
  area_sqft               decimal(10,2) nullable
  start_date              date nullable
  expected_end_date       date nullable
  actual_end_date         date nullable
  contract_value          decimal(15,2) nullable  -- agreed project amount
  budget_limit            decimal(15,2) nullable  -- internal cost budget
  project_manager_id      uuid FK -> users.id nullable
  notes                   text nullable
  created_by              uuid FK -> users.id
  created_at, updated_at, deleted_at

project_members                                   -- team assigned to project
  id              uuid PK
  project_id      uuid FK -> projects.id CASCADE
  user_id         uuid FK -> users.id
  role            varchar(100)                    -- e.g. Site Supervisor, Designer
  assigned_at     date
  created_at, updated_at
  UNIQUE(project_id, user_id)

project_phases                                    -- customizable phase checklist per project
  id              uuid PK
  project_id      uuid FK -> projects.id CASCADE
  name            varchar(150)
  sequence        integer
  status          enum('pending','in_progress','completed') default 'pending'
  start_date      date nullable
  end_date        date nullable
  notes           text nullable
  created_at, updated_at

tasks
  id              uuid PK
  project_id      uuid FK -> projects.id CASCADE
  phase_id        uuid FK -> project_phases.id nullable
  parent_task_id  uuid FK -> tasks.id nullable
  title           varchar(250)
  description     text nullable
  status          enum('pending','in_progress','review','done','cancelled') default 'pending'
  priority        enum('low','medium','high','urgent') default 'medium'
  assigned_to     uuid FK -> users.id nullable
  start_date      date nullable
  due_date        date nullable
  completed_at    timestamp nullable
  delay_reason    text nullable
  created_by      uuid FK -> users.id
  created_at, updated_at, deleted_at

task_attachments
  id              uuid PK
  task_id         uuid FK -> tasks.id CASCADE
  file_path       varchar
  file_name       varchar
  uploaded_by     uuid FK -> users.id
  created_at

project_notes
  id              uuid PK
  project_id      uuid FK -> projects.id CASCADE
  note            text
  is_pinned       boolean default false
  created_by      uuid FK -> users.id
  created_at, updated_at
```

---

### 5.5 Procurement & Purchase

```sql
vendors
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. VN-2025-001
  name            varchar(150)
  type            enum('supplier','subcontractor','both')
  category        varchar(100) nullable            -- tiles, electrical, civil, furniture, etc.
  contact_person  varchar(150) nullable
  phone           varchar(20) NOT NULL
  email           varchar(150) nullable
  address         text nullable
  bank_name       varchar(150) nullable
  bank_account    varchar(50) nullable
  bank_routing    varchar(20) nullable
  opening_balance decimal(15,2) default 0         -- outstanding at system start
  is_active       boolean default true
  notes           text nullable
  created_by      uuid FK -> users.id
  created_at, updated_at, deleted_at

purchase_requisitions                             -- internal purchase request
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. PR-REQ-2025-001
  project_id      uuid FK -> projects.id nullable
  requested_by    uuid FK -> users.id
  priority        enum('low','normal','high','urgent') default 'normal'
  required_by     date nullable
  status          enum('pending','approved','rejected','po_raised') default 'pending'
  notes           text nullable
  approved_by     uuid FK -> users.id nullable
  approved_at     timestamp nullable
  rejection_note  text nullable
  created_at, updated_at

requisition_items
  id              uuid PK
  requisition_id  uuid FK -> purchase_requisitions.id CASCADE
  inventory_item_id uuid FK -> inventory_items.id nullable
  description     varchar(250) NOT NULL
  unit            varchar(50)
  quantity        decimal(10,2)
  estimated_rate  decimal(10,2) nullable
  notes           text nullable
  created_at, updated_at

purchase_orders
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. PO-2025-001
  vendor_id       uuid FK -> vendors.id
  project_id      uuid FK -> projects.id nullable
  requisition_id  uuid FK -> purchase_requisitions.id nullable
  status          enum('draft','sent','partially_received','received','cancelled') default 'draft'
  order_date      date NOT NULL
  expected_delivery_date date nullable
  delivery_address text nullable
  subtotal        decimal(15,2) default 0
  vat_amount      decimal(15,2) default 0
  other_charges   decimal(15,2) default 0
  grand_total     decimal(15,2) default 0
  notes           text nullable
  sent_at         timestamp nullable
  created_by      uuid FK -> users.id
  created_at, updated_at, deleted_at

purchase_order_items
  id              uuid PK
  po_id           uuid FK -> purchase_orders.id CASCADE
  inventory_item_id uuid FK -> inventory_items.id nullable
  description     varchar(250) NOT NULL
  unit            varchar(50)
  quantity_ordered decimal(10,2)
  quantity_received decimal(10,2) default 0
  unit_rate       decimal(10,2)
  vat_pct         decimal(5,2) default 0
  total           decimal(15,2)                  -- quantity_ordered * unit_rate
  created_at, updated_at

goods_receipt_notes                               -- GRN: what was actually received
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. GRN-2025-001
  po_id           uuid FK -> purchase_orders.id
  received_by     uuid FK -> users.id
  received_date   date NOT NULL
  warehouse_id    uuid FK -> warehouses.id nullable
  notes           text nullable
  created_at, updated_at

grn_items
  id              uuid PK
  grn_id          uuid FK -> goods_receipt_notes.id CASCADE
  po_item_id      uuid FK -> purchase_order_items.id
  quantity_received decimal(10,2)
  condition       enum('good','damaged','partial') default 'good'
  notes           text nullable
  created_at

-- Vendor ledger (payable tracking) is handled in Accounts module
```

---

### 5.6 Inventory

```sql
warehouses
  id              uuid PK
  name            varchar(150)
  location        varchar(200) nullable
  is_active       boolean default true
  created_at, updated_at

item_categories
  id              uuid PK
  name            varchar(100)
  parent_id       uuid FK -> item_categories.id nullable
  created_at, updated_at

inventory_items
  id              uuid PK
  code            varchar(50) UNIQUE              -- e.g. ITM-001
  name            varchar(200)
  category_id     uuid FK -> item_categories.id nullable
  unit            varchar(50)                     -- pcs, kg, ft, sqft, rft, bag, etc.
  reorder_level   decimal(10,2) default 0
  standard_rate   decimal(10,2) nullable           -- default purchase rate
  description     text nullable
  is_active       boolean default true
  created_at, updated_at, deleted_at

stock_transactions                                -- every movement recorded here
  id              uuid PK
  inventory_item_id uuid FK -> inventory_items.id
  warehouse_id    uuid FK -> warehouses.id
  project_id      uuid FK -> projects.id nullable
  type            enum('opening','purchase','project_issue','return_from_project','transfer_in','transfer_out','adjustment','damage','waste')
  quantity        decimal(10,2)                   -- positive = in, negative = out
  unit_rate       decimal(10,2) nullable
  total_value     decimal(15,2) nullable           -- quantity * unit_rate
  reference_type  varchar(50) nullable             -- 'grn', 'purchase_order', 'manual'
  reference_id    uuid nullable                    -- FK to GRN or PO
  batch_number    varchar(100) nullable
  notes           text nullable
  transaction_date date NOT NULL
  created_by      uuid FK -> users.id
  created_at

-- IMPORTANT: Create a PostgreSQL VIEW for current stock balance:
-- CREATE VIEW stock_balances AS
--   SELECT inventory_item_id, warehouse_id,
--          SUM(quantity) as balance,
--          SUM(total_value) as total_value
--   FROM stock_transactions
--   GROUP BY inventory_item_id, warehouse_id;

stock_adjustments                                 -- formal adjustment records
  id              uuid PK
  inventory_item_id uuid FK -> inventory_items.id
  warehouse_id    uuid FK -> warehouses.id
  physical_count  decimal(10,2)
  system_count    decimal(10,2)
  variance        decimal(10,2)                   -- physical_count - system_count
  adjustment_date date
  reason          text nullable
  adjusted_by     uuid FK -> users.id
  created_at
```

---

### 5.7 Accounts

```sql
-- CHART OF ACCOUNTS
account_groups
  id              uuid PK
  name            varchar(150)                    -- e.g. Assets, Liabilities, Income, Expense
  type            enum('asset','liability','equity','income','expense')
  created_at, updated_at

account_heads
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. 1001, 2001
  name            varchar(150)                    -- e.g. Cash, Bank, Accounts Receivable
  group_id        uuid FK -> account_groups.id
  parent_id       uuid FK -> account_heads.id nullable
  opening_balance decimal(15,2) default 0
  is_system       boolean default false            -- system accounts cannot be deleted
  is_active       boolean default true
  notes           text nullable
  created_at, updated_at

-- SEED these system account heads:
-- 1001 Cash in Hand (asset)
-- 1002 Bank Account (asset)
-- 1100 Accounts Receivable - Clients (asset)
-- 2100 Accounts Payable - Vendors (liability)
-- 4001 Project Revenue (income)
-- 5001 Material Purchase (expense)
-- 5002 Labour Cost (expense)
-- 5003 Office Rent (expense)
-- 5004 Utility Bills (expense)
-- 5005 Salaries (expense)
-- 5006 Transport (expense)
-- 5007 Miscellaneous Expense (expense)

-- CLIENT INVOICES
invoices
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. INV-2025-001
  client_id       uuid FK -> clients.id
  project_id      uuid FK -> projects.id nullable
  status          enum('draft','sent','partially_paid','paid','overdue','cancelled') default 'draft'
  invoice_date    date NOT NULL
  due_date        date NOT NULL
  subtotal        decimal(15,2) default 0
  vat_pct         decimal(5,2) default 0
  vat_amount      decimal(15,2) default 0
  discount_amount decimal(15,2) default 0
  grand_total     decimal(15,2) default 0
  paid_amount     decimal(15,2) default 0          -- computed: sum of linked receipts
  notes           text nullable
  terms           text nullable
  created_by      uuid FK -> users.id
  created_at, updated_at, deleted_at

invoice_line_items
  id              uuid PK
  invoice_id      uuid FK -> invoices.id CASCADE
  description     varchar(250)
  quantity        decimal(10,2) default 1
  unit_rate       decimal(10,2)
  total           decimal(15,2)
  sequence        integer default 0
  created_at, updated_at

-- CLIENT RECEIPTS (money received from clients)
client_receipts
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. RCP-2025-001
  client_id       uuid FK -> clients.id
  invoice_id      uuid FK -> invoices.id nullable  -- nullable: advance not linked to invoice yet
  project_id      uuid FK -> projects.id nullable
  amount          decimal(15,2) NOT NULL
  receipt_date    date NOT NULL
  payment_method  enum('cash','bank_transfer','cheque','bkash','nagad','rocket','other')
  reference       varchar(150) nullable            -- cheque no, txn ID, etc.
  account_head_id uuid FK -> account_heads.id     -- which bank/cash account received into
  notes           text nullable
  created_by      uuid FK -> users.id
  created_at, updated_at

-- VENDOR PAYMENTS (money paid to vendors/parties)
vendor_payments
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. PMT-2025-001
  vendor_id       uuid FK -> vendors.id
  po_id           uuid FK -> purchase_orders.id nullable
  amount          decimal(15,2) NOT NULL
  payment_date    date NOT NULL
  payment_method  enum('cash','bank_transfer','cheque','bkash','nagad','rocket','other')
  reference       varchar(150) nullable
  account_head_id uuid FK -> account_heads.id     -- paid from which bank/cash
  notes           text nullable
  created_by      uuid FK -> users.id
  created_at, updated_at

-- OFFICE EXPENSES (general operating expenses)
expenses
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. EXP-2025-001
  account_head_id uuid FK -> account_heads.id     -- expense category
  project_id      uuid FK -> projects.id nullable  -- if project-related
  amount          decimal(15,2) NOT NULL
  expense_date    date NOT NULL
  paid_from       uuid FK -> account_heads.id     -- cash or bank account
  description     varchar(250) NOT NULL
  reference       varchar(150) nullable
  receipt_path    varchar nullable                 -- scanned receipt
  created_by      uuid FK -> users.id
  created_at, updated_at

-- JOURNAL ENTRIES (double-entry ledger)
-- Every financial transaction posts journal entries automatically
journal_entries
  id              uuid PK
  code            varchar(20) UNIQUE              -- e.g. JE-2025-001
  reference_type  varchar(50)                     -- 'invoice','client_receipt','vendor_payment','expense','po'
  reference_id    uuid
  description     varchar(250)
  entry_date      date NOT NULL
  created_by      uuid FK -> users.id
  created_at

journal_lines                                     -- debit/credit per entry (double entry)
  id              uuid PK
  journal_id      uuid FK -> journal_entries.id CASCADE
  account_head_id uuid FK -> account_heads.id
  type            enum('debit','credit')
  amount          decimal(15,2)
  description     varchar(250) nullable
  created_at

-- DOUBLE-ENTRY RULES:
-- Client Invoice created:   DR Accounts Receivable  | CR Project Revenue
-- Client Receipt received:  DR Cash/Bank            | CR Accounts Receivable
-- Purchase Order approved:  DR Material Purchase     | CR Accounts Payable
-- Vendor Payment made:      DR Accounts Payable      | CR Cash/Bank
-- Office Expense:           DR Expense Account       | CR Cash/Bank
-- Use model Observers to auto-post journal entries on each transaction

-- VENDOR LEDGER VIEW
-- CREATE VIEW vendor_ledger AS
--   SELECT vendor_id,
--          SUM(CASE WHEN source='po' THEN amount ELSE 0 END) as total_purchases,
--          SUM(CASE WHEN source='payment' THEN amount ELSE 0 END) as total_paid,
--          (total_purchases - total_paid) as balance_due
--   FROM (
--     SELECT vendor_id, grand_total as amount, 'po' as source FROM purchase_orders WHERE status != 'cancelled'
--     UNION ALL
--     SELECT vendor_id, amount, 'payment' as source FROM vendor_payments
--   ) t GROUP BY vendor_id;
```

---

### 5.8 Employee & HR

```sql
employees
  id                      uuid PK
  user_id                 uuid FK -> users.id UNIQUE nullable  -- link to login user
  code                    varchar(20) UNIQUE                   -- e.g. EMP-001
  name                    varchar(150) NOT NULL
  email                   varchar(150) nullable
  phone                   varchar(20) NOT NULL
  department              varchar(100) nullable
  designation             varchar(100) nullable
  employment_type         enum('permanent','contract','part_time','intern','daily_labour')
  join_date               date NOT NULL
  contract_end_date       date nullable
  basic_salary            decimal(10,2) nullable               -- record only, no payroll processing
  nid_number              varchar(50) nullable
  address                 text nullable
  emergency_contact_name  varchar(150) nullable
  emergency_contact_phone varchar(20) nullable
  is_active               boolean default true
  notes                   text nullable
  created_by              uuid FK -> users.id
  created_at, updated_at, deleted_at

leave_types
  id              uuid PK
  name            varchar(100)                    -- Annual Leave, Sick Leave, Casual, Unpaid
  days_per_year   integer nullable
  is_paid         boolean default true
  created_at, updated_at

leave_requests
  id              uuid PK
  employee_id     uuid FK -> employees.id
  leave_type_id   uuid FK -> leave_types.id
  from_date       date NOT NULL
  to_date         date NOT NULL
  days            decimal(4,1)                    -- computed
  reason          text nullable
  status          enum('pending','approved','rejected','cancelled') default 'pending'
  reviewed_by     uuid FK -> users.id nullable
  reviewed_at     timestamp nullable
  review_note     text nullable
  created_at, updated_at

attendance
  id              uuid PK
  employee_id     uuid FK -> employees.id
  date            date NOT NULL
  status          enum('present','absent','half_day','on_leave','holiday','off')
  check_in        time nullable
  check_out       time nullable
  notes           text nullable
  recorded_by     uuid FK -> users.id
  created_at, updated_at
  UNIQUE(employee_id, date)

employee_documents
  id              uuid PK
  employee_id     uuid FK -> employees.id
  type            varchar(100)                    -- NID, CV, Contract, Certificate, etc.
  file_path       varchar
  file_name       varchar
  expiry_date     date nullable
  notes           text nullable
  uploaded_by     uuid FK -> users.id
  created_at, updated_at
```

---

## 6. Module Feature Specifications

---

### 6.1 Client Database Module

**Controller:** `ClientController`  
**Routes prefix:** `/clients`  
**Permission:** `view.clients`, `create.clients`, `edit.clients`, `delete.clients`

Build these features:

**Client list page** (`/clients`):
- Table with columns: Code, Name/Company, Type, Phone, Area, Active Projects count, Total Receivable, Actions
- Filters: type (individual/corporate), area, is_active
- Search: name, phone, email, company
- "New Client" button → slide-over form or `/clients/create`
- Export to Excel button

**Client create/edit form** (`/clients/create`, `/clients/{id}/edit`):
- Fields: type (toggle individual/corporate), name, company_name (show if corporate), email, phone, secondary_phone, address, area, city, notes
- For corporate: section to add/edit multiple `client_contacts`
- Auto-generate `code` on creation (CL-YYYY-###)

**Client profile page** (`/clients/{id}`):
- Header: name, code, phone, area, type badge
- Tabs:
  - **Overview**: contact details, notes, contacts list (corporate)
  - **Projects**: list of all projects with status badge, contract value, progress
  - **Invoices**: all invoices with status, amounts, balance due
  - **Payments**: all receipts received
  - **Leads**: linked leads history
  - **Activity**: timeline of all lead activities

---

### 6.2 CRM Module

**Controller:** `LeadController`, `LeadActivityController`  
**Routes prefix:** `/crm`  
**Permission:** `view.leads`, `create.leads`, `edit.leads`, `delete.leads`

Build these features:

**Lead pipeline page** (`/crm`):
- Kanban board with columns: New → Contacted → Qualified → Proposal Sent → Won / Lost
- Each card shows: name, phone, source badge, estimated value, follow-up date (red if past), assigned to avatar
- Drag-and-drop between columns (use `@dnd-kit/core`). On drop, `PATCH /crm/leads/{id}/status`
- When moving to **Won**: modal asks "Create project now?" with project name pre-filled. If yes, auto-creates project and links client
- When moving to **Lost**: modal requires loss reason text input before saving
- "New Lead" button → modal form

**Lead create/edit form**:
- Fields: name, phone, email, source, project_type, estimated_value, assigned_to (user select), follow_up_at, notes
- Auto-generate `code` (LD-YYYY-###)

**Lead detail page** (`/crm/leads/{id}`):
- Header: name, status badge, source, assigned to, estimated value
- Timeline of all `lead_activities` (calls, emails, visits, notes) — most recent first
- "Log Activity" button → inline form: type (call/email/whatsapp/visit/meeting/note), summary, next_action, next_action_at
- Edit lead details section
- "Convert to Client" button (if not already converted): creates `clients` record from lead data

**Follow-up list** (`/crm/follow-ups`):
- Table of all leads with `follow_up_at IS NOT NULL` ordered by date
- Highlight overdue in red
- Quick "Mark Done" button that clears `follow_up_at` and prompts to log an activity

---

### 6.3 Project Management Module

**Controller:** `ProjectController`, `TaskController`, `ProjectPhaseController`  
**Routes prefix:** `/projects`  
**Permission:** `view.projects`, `create.projects`, `edit.projects`, `delete.projects`, `manage.tasks`

Build these features:

**Projects list** (`/projects`):
- Cards layout (not table) showing: project code, name, client name, status badge, phase progress bar, PM name, contract value, days remaining (green/amber/red), budget spent %
- Filters: status, type, project_manager, date range
- "New Project" button

**Project create/edit form**:
- Fields: name, client (searchable select), lead (optional link), type, status, site_address, area_sqft, start_date, expected_end_date, contract_value, budget_limit, project_manager, notes
- Auto-generate `code` (PRJ-YYYY-###)

**Project detail page** (`/projects/{id}`):
- Sticky header: project name, code, client link, status badge, PM name, phase progress stepper
- Tabs:

  **Tasks tab**:
  - Kanban board with columns: Pending → In Progress → Review → Done
  - Card shows: title, assignee avatar, priority badge (color-coded), due date
  - Drag between columns saves status via `PATCH`
  - Add task: modal with title, description, assigned_to, priority, due_date, phase linkage, parent task
  - Sub-tasks: expandable list under parent task
  - Filter tasks by: assignee, priority, phase, status

  **Phases tab**:
  - Ordered list of project phases with status toggle (pending/in_progress/completed)
  - Add/edit/reorder phases
  - Phase dates shown as timeline bar

  **Team tab**:
  - List of project members with role
  - Add/remove members

  **Notes tab**:
  - List of notes, pin important ones
  - Quick add note textarea

  **Financials tab** (read-only summary):
  - Contract value vs total invoiced vs total received vs outstanding
  - Total purchase orders raised for this project
  - Total expenses logged against this project
  - Simple table layout, no charts needed

---

### 6.4 Procurement & Purchase Module

**Controller:** `VendorController`, `RequisitionController`, `PurchaseOrderController`, `GRNController`  
**Routes prefix:** `/procurement`  
**Permission:** `view.procurement`, `create.purchase_orders`, `approve.purchase_orders`

Build these features:

**Vendors** (`/procurement/vendors`):
- Table: Code, Name, Type, Category, Phone, Balance Due, Status
- Filters: type, category, is_active
- "New Vendor" button → form with all vendor fields
- **Vendor profile** (`/procurement/vendors/{id}`):
  - Details + tabs: Purchase Orders, Payments, Ledger (running balance)
  - Ledger tab: running balance = opening_balance + sum(PO amounts) - sum(payments)

**Purchase Requisitions** (`/procurement/requisitions`):
- Table: code, project, requested by, date, status badge, items count
- Filters: status, project, date range
- "New Requisition" button → form:
  - Project (optional), priority, required_by, notes
  - Line items: item (searchable from inventory), description, unit, quantity, estimated_rate
  - Submit for approval
- Approval action: accounts/admin user clicks "Approve" or "Reject" with note
- On approval: "Raise PO" button creates a PO pre-filled from requisition

**Purchase Orders** (`/procurement/purchase-orders`):
- Table: code, vendor, project, order_date, grand_total, status badge
- Filters: status, vendor, project, date range
- "New PO" button → form:
  - Vendor (searchable), project (optional), order_date, expected_delivery_date, delivery_address
  - Line items: inventory item (optional link), description, unit, qty, unit_rate, vat_pct → auto-calculate total
  - Subtotal, VAT, other charges, grand total auto-computed
  - Notes, save as draft or send directly
- **PO detail page** (`/procurement/purchase-orders/{id}`):
  - PO details and line items table
  - "Print/PDF" button → generates PO PDF with vendor details, items, totals
  - GRN history: list of all receipts against this PO with quantities
  - "Create GRN" button

**GRN** (`/procurement/grn`):
- Created from PO: shows PO items, enter `quantity_received` per item
- Select receiving warehouse
- On save: auto-posts `stock_transactions` records for each item received (type=purchase, links to GRN)
- Also creates `accounts payable` entry (if using journal auto-posting)

---

### 6.5 Inventory Module

**Controller:** `InventoryItemController`, `StockTransactionController`, `WarehouseController`  
**Routes prefix:** `/inventory`  
**Permission:** `view.inventory`, `manage.inventory`

Build these features:

**Items list** (`/inventory/items`):
- Table: code, name, category, unit, current stock (from stock_balances view), reorder level, status (OK/Low/Out)
- Color-code stock status: green = above reorder, amber = at reorder, red = below reorder
- Filters: category, warehouse, stock status
- "New Item" button → form: code (auto), name, category, unit, reorder_level, standard_rate, description
- Import items via Excel template

**Item detail** (`/inventory/items/{id}`):
- Current stock per warehouse (from stock_balances view)
- Stock transaction history: date, type, quantity (color + for in, red for out), unit_rate, reference, project, warehouse
- "Stock In" button → form: warehouse, quantity, unit_rate, reference (GRN/PO link or manual), notes
- "Issue to Project" button → form: project, warehouse, quantity, notes → posts negative transaction

**Stock Issue to Project** (`/inventory/issue`):
- Multi-item form: select project, then add multiple items with quantities
- Validates each item has sufficient stock in selected warehouse
- On save, posts `stock_transactions` for each item with `type=project_issue`

**Stock Adjustment** (`/inventory/adjustments`):
- Form: select item + warehouse → shows current system balance → enter physical count
- System computes variance → require reason if variance ≠ 0
- On save, posts adjustment transaction and saves to `stock_adjustments`

**Stock Report** (`/inventory/report`):
- Item-wise current stock across all warehouses
- Filter by category, warehouse
- Export to Excel

---

### 6.6 Accounts Module

**Controller:** `InvoiceController`, `ClientReceiptController`, `VendorPaymentController`, `ExpenseController`, `AccountHeadController`  
**Routes prefix:** `/accounts`  
**Permission:** `view.accounts`, `create.invoices`, `record.payments`, `view.reports`

Build these features:

**Dashboard** (`/accounts`):
- KPI cards: Total Receivable (outstanding client invoices), Total Payable (outstanding vendor payments), Cash Balance, Bank Balance
- Recent transactions table (last 20 across all types)
- Overdue invoices list (due_date < today AND status != paid)

**Invoices** (`/accounts/invoices`):
- Table: code, client, project, date, due_date, grand_total, paid_amount, balance, status badge
- Filters: status, client, project, date range
- "New Invoice" button → form:
  - Client (searchable), project (optional), invoice_date, due_date, vat_pct, discount
  - Line items: description, quantity, unit_rate → auto-calculate total
  - Grand total = subtotal + vat - discount
  - Save as Draft or mark as Sent
- **Invoice detail** (`/accounts/invoices/{id}`):
  - Invoice details and line items
  - Payment history: list of linked receipts
  - "Record Payment" button → modal: amount, date, method, reference, account_head (cash/bank)
  - On payment save: creates `client_receipts` record, updates `invoices.paid_amount`, changes status to `partially_paid` or `paid`
  - "Print Invoice" → PDF with Interior Villa branding, client details, line items, totals, bank details
  - **Auto-post journal entries via Observer**:
    - Invoice created: DR Accounts Receivable | CR Project Revenue
    - Payment recorded: DR Cash/Bank | CR Accounts Receivable

**Client Receipts** (`/accounts/receipts`):
- Table: code, client, invoice (or "Advance"), amount, date, method, account
- "New Receipt" button for advance payments not yet linked to invoice
- Advance receipts can later be applied to an invoice

**Vendor Payments** (`/accounts/vendor-payments`):
- Table: code, vendor, PO (optional), amount, date, method, account
- Filters: vendor, date range
- "New Payment" button → form: vendor, po (optional), amount, date, method, reference, account_head (cash/bank), notes
- Vendor balance shown in form header when vendor is selected
- **Auto-post journal**: DR Accounts Payable | CR Cash/Bank

**Expenses** (`/accounts/expenses`):
- Table: code, category (account_head), project, amount, date, description
- Filters: account_head (category), project, date range
- "New Expense" button → form: account_head (expense category), project (optional), amount, expense_date, paid_from (cash/bank), description, reference, receipt upload
- **Auto-post journal**: DR Expense Account | CR Cash/Bank

**Chart of Accounts** (`/accounts/chart`):
- Tree view of account groups → account heads
- Add/edit account heads (cannot delete system accounts)
- Show opening balance per account

**Reports** (`/accounts/reports`):

  *Trial Balance*: all account heads with debit/credit totals and closing balance. Date range filter.
  
  *Client Ledger*: per client, running ledger of invoices + receipts with running balance. Client + date range filter.
  
  *Vendor Ledger*: per vendor, running ledger of POs + payments with running balance.
  
  *Cash/Bank Statement*: per account_head (cash or bank), running statement of all transactions. Date range filter.
  
  *Project-wise P&L*: per project — revenue (invoices) vs costs (PO amounts + expenses). Summary table. Date range.
  
  *Outstanding Receivables*: all unpaid/partial invoices sorted by overdue days. Aging buckets: current, 1-30, 31-60, 61-90, 90+ days.
  
  *Outstanding Payables*: all vendors with balance due > 0.
  
  All reports: export to Excel and PDF.

---

### 6.7 Employee & User Management Module

**Controller:** `EmployeeController`, `LeaveController`, `AttendanceController`, `UserController`  
**Routes prefix:** `/hr` (employees, leave, attendance) and `/settings/users` (users)  
**Permission:** `manage.employees`, `manage.leaves`, `manage.attendance`, `manage.users`

Build these features:

**Employees list** (`/hr/employees`):
- Table: code, name, department, designation, type badge, join date, status
- Filters: department, employment_type, is_active
- "New Employee" button → form with all fields
- Export to Excel

**Employee profile** (`/hr/employees/{id}`):
- Header: name, code, designation, department, employment_type badge, phone
- Tabs:
  - **Details**: all personal and employment fields, edit button
  - **Documents**: list of uploaded docs with type, expiry. Upload button
  - **Leave History**: all leave requests with status
  - **Attendance**: monthly attendance grid (color-coded cells per status)
  - **Activity**: employment timeline (join date, contract changes, notes)

**Leave Management** (`/hr/leaves`):
- Two sub-views: "My Requests" (for employees) and "All Requests" (for hr_manager/admin)
- Table: employee, type, dates, days, status badge, requested date
- Filters: status, employee, leave_type, date range
- "New Leave Request" button → form: employee (admin selects, employees see only themselves), leave_type, from_date, to_date (auto-compute days), reason
- Approve/Reject actions with notes (hr_manager/admin only)
- Leave balance summary per employee per type

**Attendance** (`/hr/attendance`):
- Monthly view: rows = employees, columns = days 1-31
- Color code: P=green, A=red, H=yellow, L=blue, Off=gray
- Click a cell → modal to set status, check_in, check_out, notes
- Bulk mark attendance: select multiple employees → mark all present for a date
- Monthly summary: present/absent/leave counts per employee
- Export to Excel

**Users** (`/settings/users`):
- Table: name, email, roles, last login, status
- "New User" button → form: name, email, password, roles (multi-select), is_active
- Edit user: change roles, reset password, activate/deactivate
- Cannot delete a user if they have transactions. Deactivate instead.
- Role management page (`/settings/roles`): view roles and their permissions. `super_admin` can toggle permissions per role.

---

## 7. Global UI Conventions

**AppLayout**:
- Left sidebar (collapsible, state in Zustand/localStorage)
- Sidebar sections and links:
  ```
  Dashboard
  CRM
    - Pipeline
    - Follow-ups
  Clients
  Projects
  Procurement
    - Vendors
    - Requisitions
    - Purchase Orders
    - GRN
  Inventory
    - Items
    - Stock Issue
    - Adjustments
    - Report
  Accounts
    - Dashboard
    - Invoices
    - Receipts
    - Vendor Payments
    - Expenses
    - Chart of Accounts
    - Reports
  HR
    - Employees
    - Leave
    - Attendance
  Settings
    - Users
    - Roles
  ```
- Top bar: page title, breadcrumb, user menu (profile, change password, logout)

**Reusable components to build** (in `resources/js/Components/`):
- `<DataTable>` — sortable, filterable, paginated table. Props: columns, data, filters, actions
- `<FormField>` — label + input + error message wrapper
- `<Modal>` — via Headless UI Dialog
- `<SlideOver>` — side panel for create/edit forms
- `<Badge>` — status badge with color map prop
- `<StatCard>` — KPI card with label, value, optional delta
- `<PageHeader>` — title, breadcrumb, action buttons
- `<EmptyState>` — illustrated empty state with CTA
- `<ConfirmDialog>` — for delete/destructive actions (never use browser confirm())
- `<CurrencyInput>` — formats BDT on blur
- `<DatePicker>` — date input with dayjs formatting

**Status badge colors**:
- `pending/draft` → amber
- `active/approved/paid/completed` → green
- `in_progress/sent/partially_paid` → blue
- `overdue/cancelled/rejected/lost` → red
- `on_hold/won` → purple

**Forms**:
- All forms use `React Hook Form` + `Zod` schema validation
- Server-side errors from Inertia's `$page.props.errors` shown inline per field
- Loading state on submit button via `useForm.processing`

**Tables**:
- Default pagination: 25 per page
- Sort by clicking column header
- Filters in a collapsible filter bar above table
- Row actions: Edit (pencil), Delete (trash, shows ConfirmDialog)

**Currency**:
- All amounts formatted as `৳1,23,456.00` using a `formatBDT()` utility function
- Negative amounts in red

**Dates**:
- Display as `DD MMM YYYY` (e.g. 05 Apr 2025)
- Past due dates shown in red
- Use `dayjs` throughout

**PDF Generation (DomPDF)**:
- Common layout: Interior Villa logo (top-left), company address + phone (top-right), horizontal divider, document title, content, footer with page number
- Build Blade templates in `resources/views/pdf/`:
  - `invoice.blade.php`
  - `purchase-order.blade.php`
  - `client-ledger.blade.php`
  - `vendor-ledger.blade.php`

---

## 8. Auto-Generated Codes

Build a `CodeGeneratorService` used by all models:

```php
class CodeGeneratorService {
    public function generate(string $prefix, string $model): string
    // Format: {PREFIX}-{YYYY}-{###} e.g. CL-2025-001
    // Query MAX code for current year from model table, increment, zero-pad to 3 digits
    // Use DB transaction with row lock to prevent duplicates
}
```

Codes to auto-generate:
| Model | Prefix | Example |
|---|---|---|
| clients | CL | CL-2025-001 |
| leads | LD | LD-2025-001 |
| projects | PRJ | PRJ-2025-001 |
| vendors | VN | VN-2025-001 |
| purchase_requisitions | REQ | REQ-2025-001 |
| purchase_orders | PO | PO-2025-001 |
| goods_receipt_notes | GRN | GRN-2025-001 |
| inventory_items | ITM | ITM-001 (no year) |
| invoices | INV | INV-2025-001 |
| client_receipts | RCP | RCP-2025-001 |
| vendor_payments | PMT | PMT-2025-001 |
| expenses | EXP | EXP-2025-001 |
| employees | EMP | EMP-001 (no year) |

---

## 9. Journal Entry Auto-Posting Rules

Create an `AccountingService` class. Call it from model Observers. Never post journal entries from controllers.

```php
class AccountingService {
    public function postInvoiceCreated(Invoice $invoice): void
    // DR: Accounts Receivable (1100) = grand_total
    // CR: Project Revenue (4001) = grand_total

    public function postClientReceiptRecorded(ClientReceipt $receipt): void
    // DR: Cash/Bank (account_head_id from receipt) = amount
    // CR: Accounts Receivable (1100) = amount

    public function postPurchaseOrderApproved(PurchaseOrder $po): void
    // DR: Material Purchase (5001) = grand_total
    // CR: Accounts Payable - Vendors (2100) = grand_total

    public function postVendorPaymentMade(VendorPayment $payment): void
    // DR: Accounts Payable - Vendors (2100) = amount
    // CR: Cash/Bank (account_head_id from payment) = amount

    public function postExpenseRecorded(Expense $expense): void
    // DR: Expense Account (account_head_id) = amount
    // CR: Cash/Bank (paid_from account_head_id) = amount
}
```

All journal entries are stored in `journal_entries` and `journal_lines`. They are read-only once posted — never edit. Corrections via reversal + new entry.

---



## 11. Build Phases

### Phase 1 — Foundation
1. Laravel 11 project setup: Inertia.js + React + TailwindCSS v4
2. Spatie Permission installation and seeder (all roles + permissions)
3. AppLayout with sidebar, breadcrumbs, user menu
4. Auth: login, logout, password reset, force change password
5. Reusable UI components: DataTable, FormField, Modal, SlideOver, Badge, PageHeader, EmptyState, ConfirmDialog
6. CodeGeneratorService

### Phase 2 — Core Data
9. **Client Database** — full CRUD, profile page, all tabs
10. **CRM** — lead pipeline kanban, lead detail, activity log, follow-up list
11. **Project Management** — projects CRUD, project detail, task kanban, phases, team, notes

### Phase 3 — Operations
12. **Procurement** — vendors CRUD + profile, requisitions with approval, purchase orders, GRN
13. **Inventory** — items CRUD, stock transactions, issue to project, adjustments, stock report

### Phase 4 — Finance
14. **Accounts: Chart of Accounts + Seeder** (system accounts)
15. **Accounts: Invoices** — create, line items, PDF, status flow
16. **Accounts: Client Receipts** — record payment, link to invoice, journal posting
17. **Accounts: Vendor Payments** — record, link to PO, journal posting
18. **Accounts: Expenses** — record, categories, receipt upload, journal posting
19. **Accounts: Reports** — all 7 report types with Excel/PDF export

### Phase 5 — HR & Users
20. **Employee Management** — CRUD, profile, documents, tabs
21. **Leave Management** — requests, approvals, balance summary
22. **Attendance** — monthly grid, bulk mark, summary, export
23. **User Management** — users CRUD, role assignment, role permissions editor

### Phase 6 — Hardening
24. Fix all N+1 queries (use Laravel Debugbar in dev)
25. Add missing `@can` permission gates to all UI buttons
26. Write Pest feature tests for all controller actions
27. Query optimization: add indexes on all FK columns and frequently filtered columns
28. Remove Laravel Telescope from production build

---

## 12. Code Quality Rules

- Every Eloquent model has a corresponding `Policy` class
- Every controller action calls `$this->authorize()` as first line
- No raw SQL — Eloquent query builder only
- No business logic in controllers — delegate to Service classes
- `AccountingService` is the only class that writes to `journal_entries`
- `CodeGeneratorService` is the only class that generates codes
- All file uploads go through Spatie Media Library — never `$request->file()->store()` directly

- Model Observers handle all side effects (journal posting, stock updates on GRN save)
- Pest feature test for every controller action — run `php artisan test` before marking any phase done
- No `dd()`, `dump()`, or `var_dump()` in committed code

---

*End of specification. Start with Phase 1. Run `php artisan test` after each phase before moving forward.*
