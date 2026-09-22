# Apex Academy — Coaching Institute ERP

A complete, production-grade **Coaching Institute Management ERP** built with **Next.js 15+ App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Prisma ORM**, **PostgreSQL / SQLite**, and **Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features & Modules

1. **Role-Based Access Control (RBAC)**
   - **Super Admin**: Full unrestricted institute & financial control, audit logs, and settings.
   - **Admin**: Day-to-day operations, student admissions, batch scheduling, faculty assignments.
   - **Accountant**: Fee plans, installment management, payment collections, receipts, and financial ledgers.
   - **Teacher / Faculty**: Assigned batch timetable, classroom attendance register, exam marks entry.
   - **Student / Parent Portal**: Personal attendance percentage, fee receipts, performance analytics, and report cards.

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
DATABASE_URL="file:./dev.db"
JWT_SECRET="coaching-erp-super-secure-jwt-secret-key-2026-production-grade"
NEXT_PUBLIC_APP_NAME="Apex Academy Coaching ERP"
NEXT_PUBLIC_APP_CURRENCY="INR"
NEXT_PUBLIC_APP_CURRENCY_SYMBOL="₹"
NEXT_PUBLIC_APP_TIMEZONE="Asia/Kolkata"
```

### 3. Initialize Database
```bash
npx prisma db push
```

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
