# Apex Academy — Coaching Institute ERP

A complete, production-grade **Coaching Institute Management ERP** built with **Next.js 15+ App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Prisma ORM**, **PostgreSQL / SQLite**, and **Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features & Modules

1. **Role-Based Access Control (RBAC)**
   - **Super Admin**: Full unrestricted institute & financial control, audit logs, and settings.
   - **Admin**: Day-to-day operations, student admissions, batch scheduling, faculty assignments.
   - **Accountant**: Fee plans, installment management, payment collections, receipts, and financial ledgers.
   - **Teacher / Faculty**: Assigned batch timetable, classroom attendance register, exam marks entry.
   - **Student / Parent Portal**: Personal attendance percentage, fee receipts, performance analytics, and report cards. Student accounts are linked to student records automatically; existing students can be provisioned from the Users directory. The first-time password is the Student ID. Permanently deleting a linked student account as Super Admin also deletes its student record and related history.

2. **Executive & Operational Dashboards**
   - Live KPI cards: Total students, active batches, today's collections (₹), outstanding dues (₹).
   - Monthly realized fee collection graph (past 6 months).
   - Real-time batch capacity utilization progress bars.
   - Today's aggregate attendance rate.

3. **Student Directory & Admissions**
   - Automated Student ID (`STU-2026-xxxx`) and Admission Number (`ADM-2026-xxxx`) generator.
   - Step-by-step admission workflow with course and batch assignment.
   - Student profile with tabbed breakdown: Overview, Personal Info, Parent/Guardian, Attendance, Fees, Exams, Documents.
   - Printable 86mm x 54mm Student ID Card.

4. **Fee Management & Installments**
   - Fee plans supporting Tuition, Admission, Material, and Exam fee components.
   - Automated installment scheduling with due dates and status tracking (`Upcoming`, `Due`, `Partial`, `Paid`, `Overdue`).
   - One-click payment collection with atomic balance recalculations.
   - **Printable Receipts & 3-Part Bank Challan** (Student Copy, Institute Copy, Bank Copy).
   - 1-Click WhatsApp payment reminders.

5. **Daily Attendance Register**
   - USB/Bluetooth QR card scanner terminal with automatic submission and a live campus entry log.
   - Arrival and departure times, a 30-second repeat-scan guard, and ordered processing of rapid scans.
   - Batch-wise and date-wise attendance roster.
   - 1-Click "Mark All Present" rapid classroom attendance.
   - Toggles for `Present`, `Absent`, `Late`, `Excused`.
   - Automated Defaulters Report (<75% attendance threshold).

6. **Academic Batches, Courses & Subjects**
   - Course catalog (IIT-JEE Target PCM, NEET Champions PCB, CBSE Foundation, Repeaters).
   - Batch seat capacity management and room allocation.
   - Timetable conflict detection (prevents overlapping teacher, room, or batch slots).

7. **Exams, Marks & Report Cards**
   - Test scheduling with max marks and passing marks.
   - Spreadsheet-style bulk marks entry with automated percentage and grade calculation (`A+`, `A`, `B+`, `B`, `C`, `F`).
   - Formal Printable A4 Student Progress Report Card.

8. **Security & Audit Logs**
   - Immutable audit logging tracking all administrative, financial, and academic actions.
   - Server-side permission enforcement on all database queries and server actions.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Production) / SQLite (Zero-Setup Local Dev)
- **ORM**: Prisma ORM v5
- **Styling**: Tailwind CSS + shadcn/ui design tokens
- **Auth**: Cookie-based JWT sessions with `jose` + `bcryptjs`
- **Validation**: Zod + React Hook Form
- **Icons**: Lucide React
- **Date Handling**: date-fns (Asia/Kolkata timezone, `DD/MM/YYYY`)
- **Currency**: INR (₹)

---

## 📁 Project Structure

```text
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Protected ERP modules
│   │   │   ├── dashboard/      # Executive KPIs & Analytics
│   │   │   ├── students/       # Directory & Student Profiles
│   │   │   ├── admissions/     # Admission Workflow
│   │   │   ├── courses/        # Course Catalog
│   │   │   ├── batches/        # Batch Management
│   │   │   ├── attendance/     # Daily Attendance Register
│   │   │   ├── timetable/      # Weekly Timetable
│   │   │   ├── finance/        # Fee Plans, Payments, Challans
│   │   │   ├── exams/          # Tests & Marks Grading
│   │   │   ├── results/        # Performance Analytics
│   │   │   ├── materials/      # Study Materials
│   │   │   ├── announcements/  # Notice Board
│   │   │   ├── reports/        # Reports & CSV Export
│   │   │   ├── settings/       # Institute Settings
│   │   │   └── audit/          # Security Audit Trail
│   │   ├── globals.css         # Tailwind directives & print styles
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Reusable UI components (Button, Input, Card, Badge, Tabs)
│   │   └── layout/             # Sidebar, Header, RBAC Switcher
│   ├── lib/
│   │   ├── db.ts               # Prisma Client Singleton
│   │   ├── auth.ts             # JWT Session & Password Hashing
│   │   ├── permissions.ts      # Role-Based Permissions Matrix
│   │   └── utils.ts            # Formatting (₹ INR, DD/MM/YYYY, Grades)
│   └── server/
│       └── actions/            # Server Actions with RBAC & Audit Logging
├── prisma/
│   ├── schema.prisma           # 26 Relational Models & Integrity Rules
│   ├── seed.js                 # Realistic Indian Coaching Seed Data
│   └── dev.db                  # Local SQLite Database
├── .env.example
├── package.json
└── tsconfig.json
```

---

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file (copied from `.env.example`):
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
JWT_SECRET="coaching-erp-super-secure-jwt-secret-key-2026-production-grade"
NEXT_PUBLIC_APP_NAME="Apex Academy Coaching ERP"
NEXT_PUBLIC_APP_CURRENCY="INR"
NEXT_PUBLIC_APP_CURRENCY_SYMBOL="₹"
NEXT_PUBLIC_APP_TIMEZONE="Asia/Kolkata"
```

### 3. Initialize Database
```bash
# Fresh local database only: create the current schema, then baseline it.
npx prisma db push
npx prisma migrate resolve --applied 20260926040000_preserve_student_relations
npx prisma generate
```

Existing deployed databases should use `npm run prisma:migrate:deploy` instead.

### 4. Seed Realistic Indian Institute Data
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## QR Attendance Scanner Setup

1. Connect a QR-capable USB scanner or pair a Bluetooth scanner in keyboard/HID mode.
2. Configure the scanner to send **Enter** or **Tab** after each scan.
3. Sign in as authorised campus staff, select the correct campus, and open **Attendance → Card Scanner**.
4. Keep the scan field focused. Scan on arrival for **check-in**, then scan on departure for **check-out**. Both times save automatically.
5. Check the confirmation and live entries. If a scan fails, use **Retry** or scan the card again. Keep the page open until pending scans finish.

The printed student code is used to find an active student and batch at the selected campus. Scans within 30 seconds of check-in are ignored. One check-in/check-out pair is recorded per day; further scans after checkout preserve both times. A new day starts a new entry, without inventing a checkout for an unfinished previous day. Network retries reuse a request ID so a retried check-in cannot become an accidental checkout. Attendance day boundaries use Asia/Kolkata time. This workflow uses a hardware QR scanner; it does not use GPS, a webcam, or an RFID/NFC reader.

For an existing database, apply the additive schema patch before deploying this version:

```bash
npm run prisma:attendance-checkout
npm run prisma:generate
```

The patch adds nullable timestamps and scan IDs without deleting records. Historical attendance without recorded gate times displays a dash. New databases created with `prisma db push` already include these fields.

## 👤 Default Seed Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@apexacademy.edu` | `Admin@123` | Full Institute, Finance & Audit |
| **Admin** | `admin@apexacademy.edu` | `Admin@123` | Academic Operations & Admissions |
| **Accountant** | `accounts@apexacademy.edu` | `Admin@123` | Fees, Payments, Vouchers & Ledgers |
| **Faculty / Teacher** | `rajesh.verma@apexacademy.edu` | `Admin@123` | Assigned Batches, Attendance & Exams |
| **Student** | `aarav.sharma@example.com` | `Admin@123` | Personal Attendance, Fees & Results |

---

## 🔒 Database Integrity Rules

- **Foreign Key Constraints**: Batch must belong to a valid course; enrollments must reference valid batch and student.
- **Audit Logging**: All sensitive mutations (admissions, attendance edits, payments, refunds) are logged to `AuditLog`.
- **Financial Immutability**: Payments are never deleted; cancellations are handled via `RefundAdjustment` records.
- **Conflict Prevention**: Timetable engine validates against overlapping teacher, room, and batch schedules.

### Private study-material files

New uploads are stored in `.data/uploads/materials`, outside `public`. Back up this directory along with the database. Docker Compose persists it in the `private_uploads` volume; do not remove that volume when redeploying. Multi-instance or ephemeral deployments need shared persistent storage.

Only administrators and teachers may upload. Supported files: PDF, DOC/DOCX, PPT/PPTX, TXT, PNG, JPEG and WebP, up to 50 MB, with extension/content checks. Teachers must publish to an assigned batch. Uploaded files are private until published; their uploader can preview them. Download access follows material enrollment/campus rules. Legacy `/uploads/materials/...` links are rewritten through the authenticated download endpoint; unsupported legacy formats are rejected. The Next.js middleware must handle these paths rather than a public static proxy.

Finance collection totals are net of refunds; report gross totals and refund totals remain separate. Date-based cash flow records refunds on their refund date using India calendar boundaries. Empty-campus deletion preserves linked records by rejecting populated campuses.

### Module permissions

Server actions check effective permissions (database role grants plus direct user grants/revocations). Removing a grant in an existing role does not fall back to hardcoded defaults. Student/parent permissions apply to their own portal and owned records, not staff management actions. Super Admin retains its explicit bypass. Profile/password changes, personal notifications, and public admission enquiries retain their separate ownership/public rules.

New module controls cover dashboard, materials, CRM, announcements, test series, exports and audit. Opening the permission catalog or user-permission editor registers missing controls. Only newly introduced controls and newly created standard roles receive defaults; existing removed grants are preserved. Until a new control is registered, its documented default role access applies. Configuration failures deny access.

Navigation uses the same effective grants. Composite dashboard views require their included modules; nested fees, results, materials and timetable data in detail responses are redacted when unavailable. Export permissions must be combined with permissions for the exported modules. Self-registration in a test series records payment as pending until Accounts confirms it.

See `docs/action-permission-map.json` for the primary permission of each protected action. Regression tests cover 111 protected actions with revoked grants, catalog preservation, custom-role direct grants, file permissions, and redaction.
