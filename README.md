# MediCare HMS — Hospital Management System
> **"Smart Hospital Management, Simplified."**

MediCare HMS is a full-stack, enterprise-grade Hospital Management System designed from scratch to streamline modern healthcare operations. Built with **Spring Boot 3 (Java 21)**, **MySQL 8**, and **React (Vite + Tailwind CSS)**, it delivers secure, role-based workflows for clinical staff, administrators, receptionists, and financial accountants.

---

## 🌟 Key System Capabilities

1. **Role-Based Access Control (RBAC):**
   - 4 discrete roles: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, and `BILLING_STAFF`.
   - Strict server-side authorization on every endpoint (`@PreAuthorize`) paired with client-side guarded routes (`<ProtectedRoute>`).
   - Clinical confidentiality safeguards: non-clinical staff (receptionists, billing personnel) are strictly restricted from viewing detailed clinical diagnoses and doctor notes.

2. **Conflict-Free Appointment Scheduling:**
   - Overlap detection preventing double-booking of doctors based on appointment start times and durations.
   - Doctor working hour and shift schedule verification.
   - Past date/time booking rejection and cancellation slot recovery.
   - Database transactions and validation preventing concurrent booking conflicts.

3. **Electronic Medical Records (EMR) & Prescription Builder:**
   - Chief complaints, vital clinical observations, diagnoses, and structured multi-drug prescription entries (drug name, dosage, frequency, duration, instructions).
   - Medical confidentiality: only attending doctors and system administrators can view and edit clinical notes.
   - Official hospital prescription layout with `@media print` styling for paper issuance.

4. **Financial Billing & Ledger System:**
   - Strict `BigDecimal` arithmetic for all monetary values (subtotals, tax rates, discounts, balance dues) ensuring zero floating-point calculation errors.
   - Itemized hospital charge builder (consultations, lab diagnostics, bed charges, medicines).
   - Multi-method payment collection (`CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `UPI`, `BANK_TRANSFER`, `INSURANCE`).
   - Partial payment tracking, real-time balance calculations, and print-ready official tax invoices.

5. **Operational Analytics & CSV Export:**
   - Dynamic executive dashboard with live KPIs, Recharts appointment trends, status breakdown donuts, and doctor workload bars.
   - Filterable appointment and billing reports with one-click direct CSV spreadsheet export.

6. **System Audit Trail:**
   - Administrative audit log capturing user actions, timestamps, target entities, and client IP addresses for accountability.

---

## 🏗️ Architecture & Tech Stack

```
                          ┌──────────────────────────┐
                          │   React 18 SPA (Vite)    │
                          │  Tailwind CSS + Recharts │
                          │     Port: 5173 / 3000    │
                          └─────────────┬────────────┘
                                        │ REST APIs (JWT Bearer)
                                        ▼
                          ┌──────────────────────────┐
                          │    Spring Boot 3.3.4     │
                          │        (Java 21)         │
                          │     Spring Security      │
                          │   Controller → Service   │
                          │        Port: 8080        │
                          └─────────────┬────────────┘
                                        │ Spring Data JPA / Hibernate
                                        ▼
                          ┌──────────────────────────┐
                          │         MySQL 8          │
                          │  12 Relational Tables    │
                          │    Flyway Migrations     │
                          │        Port: 3306        │
                          └──────────────────────────┘
```

### Backend
- **Language:** Java 21 LTS
- **Framework:** Spring Boot 3.3.4
- **Security:** Spring Security 6 with stateless JWT authentication (`jjwt 0.12.6`) & BCrypt password hashing
- **Persistence:** Spring Data JPA with Hibernate ORM
- **Database Migrations:** Flyway (`V1__init_schema.sql`)
- **API Documentation:** Springdoc OpenAPI 3 / Swagger UI
- **Testing:** JUnit 5, Mockito, Spring Boot Test

### Frontend
- **Framework:** React 18 (Vite bundler)
- **Styling:** Tailwind CSS with custom healthcare color palette
- **Routing:** React Router v6
- **Data Fetching:** Axios with JWT request interceptors and 401 response handling
- **Charts:** Recharts (Area charts, Bar charts, Pie/Donut charts)
- **Icons:** Lucide React
- **Notifications:** Custom animated React toast context

### Database
- **Engine:** MySQL 8.0
- **Tables (12):** `users`, `departments`, `doctors`, `doctor_schedules`, `patients`, `appointments`, `medical_records`, `prescribed_medicines`, `bills`, `bill_items`, `payments`, `audit_logs`

---

## 👥 Role Permissions Matrix

| Feature / Module | ADMIN | DOCTOR | RECEPTIONIST | BILLING_STAFF |
| :--- | :---: | :---: | :---: | :---: |
| **Executive Dashboard & KPIs** | ✅ | ✅ (Personal) | ✅ (Front Desk) | ✅ (Financials) |
| **Patient Registration & Updates** | ✅ | View Only | ✅ | View Demographics |
| **Doctor Directory & Schedules** | ✅ | Self Only | View Availability | View Directory |
| **Book / Reschedule Appointments** | ✅ | ✅ | ✅ | View Only |
| **Clinical EMR & Prescriptions** | ✅ | ✅ | ❌ Restricted | ❌ Restricted |
| **Generate Invoices & Bills** | ✅ | ❌ | View Status | ✅ |
| **Record Payments & Receipts** | ✅ | ❌ | ❌ | ✅ |
| **Financial & Visit CSV Reports** | ✅ | ❌ | ❌ | ✅ (Billing Only) |
| **User Management & Audit Logs** | ✅ | ❌ | ❌ | ❌ |

---

## 🔑 Demo Login Credentials

The application includes a **1-click quick login selector** on the login page for effortless portfolio demonstration:

| Role | Username | Password | Intended Workflow / Demo Focus |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Full system governance — Dr. Sunita Sharma |
| **Attending Doctor** | `dr.robert` | `Doctor@123` | Patient visit roster, clinical diagnoses, Rx prescriptions — Dr. Rajesh Verma |
| **Front Desk Receptionist** | `receptionist` | `Staff@123` | Patient intake registration, doctor schedule lookup, booking — Meena Iyer |
| **Hospital Billing Officer** | `billing` | `Staff@123` | Itemized invoice generation (₹ INR), payment receipts — Suresh Pillai |

---

## 🚀 Getting Started

### Prerequisites
- **Java 21 JDK** installed (`java -version`)
- **Maven 3.8+** installed (`mvn -version`)
- **Node.js 18+** & npm installed (`node -v`)
- **MySQL 8.0** server running locally (or via Docker)

---

### Option A: Local Development Setup

#### 1. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE medicare_hms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update your database credentials in `backend/src/main/resources/application.yml` if different from default (`root` / `niharika@123`).

#### 2. Start the Backend (Spring Boot)
```bash
cd backend
mvn clean spring-boot:run
```
- Flyway will automatically run database schema migrations (`V1__init_schema.sql`).
- `DataInitializer` will automatically seed synthetic departments, doctors, patients, appointments, medical records, and bills.
- API is available at: `http://localhost:8080/api/v1`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui/index.html`

#### 3. Start the Frontend (Vite React)
```bash
cd frontend
npm install
npm run dev
```
- Access the web application at: `http://localhost:5173`
- Vite is preconfigured with an API proxy routing `/api` calls directly to `http://localhost:8080`.

---

### Option B: Docker Compose Deployment

Run the complete stack (MySQL + Backend + Frontend/Nginx) with a single command:
```bash
docker compose up --build
```
- Frontend application: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- MySQL Database: `localhost:3306`

---

## 🧪 Automated Testing

The backend includes a comprehensive JUnit 5 and Mockito test suite verifying security, appointment booking rules, conflict detection, monetary math, and patient management.

Run tests using Maven:
```bash
cd backend
mvn test
```
Result: `18 tests run, 0 failures, 0 errors, 0 skipped, BUILD SUCCESS`.

---

## 📋 REST API Endpoints Overview

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT token | Public |
| `POST` | `/api/v1/auth/register` | Register new user account & return JWT token | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Authenticated |
| `GET` | `/api/v1/patients` | Search & paginate patient directory | All Roles |
| `POST` | `/api/v1/patients` | Register new hospital patient | `ADMIN`, `RECEPTIONIST` |
| `GET` | `/api/v1/doctors` | List doctors with specialization filter | All Roles |
| `POST` | `/api/v1/appointments` | Book appointment with conflict checking | `ADMIN`, `RECEPTIONIST`, `DOCTOR` |
| `PATCH` | `/api/v1/appointments/{id}/cancel` | Cancel appointment with reason | `ADMIN`, `RECEPTIONIST`, `DOCTOR` |
| `GET` | `/api/v1/medical-records` | List medical visits & clinical notes | `ADMIN`, `DOCTOR` |
| `POST` | `/api/v1/medical-records` | Create medical record with medicines | `ADMIN`, `DOCTOR` |
| `GET` | `/api/v1/bills` | List bills & filter by payment status | `ADMIN`, `BILLING_STAFF`, `RECEPTIONIST` |
| `POST` | `/api/v1/bills` | Generate invoice with itemized charges | `ADMIN`, `BILLING_STAFF` |
| `POST` | `/api/v1/bills/{id}/payments` | Record payment against an invoice | `ADMIN`, `BILLING_STAFF` |
| `GET` | `/api/v1/reports/dashboard` | Fetch aggregated dashboard analytics | Authenticated |
| `GET` | `/api/v1/reports/appointments/export` | Download appointments report as CSV | `ADMIN`, `BILLING_STAFF` |
| `GET` | `/api/v1/reports/billing/export` | Download billing revenue as CSV | `ADMIN`, `BILLING_STAFF` |
| `GET` | `/api/v1/users` | List staff accounts | `ADMIN` |
| `GET` | `/api/v1/audit-logs` | Fetch system audit trail entries | `ADMIN` |

---

## 💡 Technical Interview Highlights & Talking Points

When presenting this project in engineering placement interviews:

1. **Layered Architecture & Separation of Concerns:**
   Strict four-tier architecture (`Controller -> Service -> Repository -> MySQL`). Controllers validate DTOs (`@Valid`), services enforce business invariants and transactional boundaries (`@Transactional`), and JPA repositories handle database access. JPA entities are never leaked to client views.

2. **Race Condition & Double-Booking Prevention:**
   Doctor schedules are verified before booking. Overlap detection runs inside a transactional query:
   $$\text{Existing Appointment} \cap \text{New Appointment} \neq \emptyset \iff (T_{\text{start}} < E_{\text{end}}) \land (T_{\text{end}} > E_{\text{start}})$$
   If an overlapping active visit exists for that doctor, the system throws a `ConflictException` (HTTP 409).

3. **Financial Math with `BigDecimal`:**
   Why `float` and `double` are unacceptable in healthcare billing: binary IEEE 754 floating-point representations cause catastrophic cumulative rounding errors. All invoice items, taxes, discounts, and payments strictly use `java.math.BigDecimal` with explicit scale and rounding modes.

4. **Zero-Trust Clinical Data Privacy:**
   Security is not delegated to frontend UI toggles. Even if a non-clinical user attempts to issue a direct API request to `/api/v1/medical-records`, Spring Security intercepts the request at the servlet filter level and responds with HTTP 403 Forbidden.

5. **Idempotent Database Migrations:**
   Using Flyway migrations ensures that database state is version-controlled in Git, reproducible across developer environments, and automated during CI/CD.

---

## 📄 License & Attribution
Developed for Computer Science Engineering Portfolio and Software Engineering placements. Uses synthetic demonstration records only.
