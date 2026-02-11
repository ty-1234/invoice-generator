## Invoice Generator for Freelancers

Invoice Generator for Freelancers is a full‑stack web application that lets independent contractors and small agencies create, manage, and send professional invoices to their clients. It is designed with **security**, **clean UI**, and **scalability** in mind, and includes production‑grade features like JWT authentication, role‑based access, validation, and deployment.

---

## Features



- **Authentication (JWT)**: Secure login and registration using JSON Web Tokens, issued by the backend and stored in **HTTP‑only cookies** (or Bearer tokens for API clients).
- **Role‑based Access Control (RBAC)**:
  - **User (Freelancer)**: Manages their own profile, clients, and invoices.
  - **Admin**: Manages all users, system‑wide settings, and has full read/write access.
- **Proper Database Design**:
  - Normalized relational schema with `users`, `clients`, `invoices`, `line_items`, and support tables (e.g., `payments`, `attachments`).
  - Referential integrity via foreign keys and indexed columns on frequent queries (e.g., `email`, `status`, `due_date`).
- **Form Validation**:
  - **Client‑side**: Schema‑based validation for all forms (registration, invoice creation, client details).
  - **Server‑side**: Full validation of all incoming payloads before hitting the database.
- **Error Handling**:
  - Centralized error middleware on the backend.
  - Consistent error response format (status code, message, optional field errors).
  - User‑friendly error messages and toasts on the frontend.
- **Pagination**:
  - Paginated lists for invoices, clients, and users.
  - Support for `page` / `limit` query parameters, with metadata in API responses.
- **Deployment Ready**:
  - Containerized backend and frontend.
  - Reverse proxy (e.g., Nginx) in front of the API and static assets.
  - Environment‑based configuration for production.
- **Clean UI**:
  - Responsive layout with a modern, minimal design.
  - Accessible components (keyboard navigation, ARIA attributes).
  - Clear visual hierarchy for invoices, clients, and actions.
- **README with Architecture Explanation**:
  - This document explains how the system is structured and how each piece fits together.

### Bonus (Optional) Features

- **Stripe Test Payments**: Invoices can include a secure “Pay Now” link powered by Stripe (test mode).
- **Email Notifications**: Automatic emails for invoice creation, reminders, and payment confirmation.
- **File Uploads**: Attach files (e.g., logo, contracts, receipts) to invoices via object storage.
- **Logging**: Structured application logs for debugging and audit trails.
- **Unit Tests**: Coverage for critical backend services, APIs, and key frontend components.

---

## Tech Stack

- **Frontend**
  - **React** (with TypeScript) + **Vite** for SPA UI.
  - **React Router** for client‑side routing.
  - **TanStack React Query** for data fetching and caching.
  - **React Hook Form** + **Zod** for forms and validation.
  - **Tailwind CSS** for a clean, responsive interface.

- **Backend**
  - **Node.js** + **Express** (with TypeScript) for REST APIs.
  - **MongoDB** as the primary database.
  - **Mongoose** for schema modeling and queries.

- **Authentication & Security**
  - **JWT** for stateless authentication.
  - **BCrypt** for password hashing.
  - **Role‑based middleware** and resource‑ownership checks.

- **Infrastructure**
  - **Docker** and **Docker Compose** for local and production deployment.
  - **Nginx** as reverse proxy and static asset server (in production).
  - Optional: **Redis** for rate limiting, caching, or session‑related tasks.

- **Integrations (Bonus)**
  - **Stripe** SDK for payments (test mode).
  - **Email provider** (Nodemailer with SMTP, or a service like SendGrid/SES).
  - **S3‑compatible storage** (e.g., AWS S3, MinIO) for file uploads.
  - **Winston** / **Pino** for logging.

---

## Architecture Overview

### High‑Level View

The system follows a standard **three‑tier architecture**:

- **Presentation Layer (Frontend)**: React SPA that communicates with the backend REST API.
- **Application Layer (Backend)**: Express server handling authentication, business logic, and validation.
- **Data Layer (Database & Storage)**: MongoDB for transactional data, local/S3 for file uploads.

Conceptually:

```text
Client (Browser)
   |
   |  HTTPS (REST, JSON)
   v
API Gateway / Reverse Proxy (Nginx)
   |
   v
Backend (Node.js + Express)
   |
   +--> MongoDB (documents)
   +--> S3 / Object Storage (invoice files, logos)
   +--> Stripe API (payments)
   +--> Email Provider (notifications)
   +--> Logging / Monitoring (log aggregator)
```

### Backend Module Structure

- **Auth Module**
  - Handles registration, login, logout.
  - Issues access/refresh tokens.
  - Provides middleware to protect routes.

- **User Module**
  - Manages user profiles, roles, and settings.
  - Admin‑only routes for user management.

- **Client Module**
  - CRUD APIs for client records (name, contact info, billing details).
  - Enforces ownership (users only see their own clients).

- **Invoice Module**
  - CRUD APIs for invoices.
  - Handles invoice numbering, statuses, totals, and line items.
  - Supports listing with pagination, filters, and sorting.

- **Payment Module (Bonus)**
  - Integrates with Stripe to create payment intents.
  - Exposes public endpoints for clients to pay invoices via a link.
  - Handles webhooks to update invoice status after payment.

- **Notification Module (Bonus)**
  - Sends emails on invoice events (created, due soon, paid).
  - Schedules recurring reminders via cron/queue (optional).

- **File Module (Bonus)**
  - Handles file uploads and secure access to attachments.

Each module is layered into **controllers**, **services**, and **repositories**, keeping concerns isolated and testable.

---

## Database Design

The schema is modeled around **users**, **clients**, and **invoices**, with support tables for items, payments, attachments, and logs.

### Core Tables

- **`users`**
  - `id` (PK)
  - `email` (unique, indexed)
  - `password_hash`
  - `name`
  - `role` (`'user' | 'admin'`)
  - Timestamps (`created_at`, `updated_at`)

- **`clients`**
  - `id` (PK)
  - `user_id` (FK → `users.id`)
  - `name`
  - `email`
  - `phone`
  - `billing_address`
  - Timestamps

- **`invoices`**
  - `id` (PK)
  - `user_id` (FK → `users.id`)
  - `client_id` (FK → `clients.id`)
  - `number` (e.g., `INV-2026-0001`, unique per user)
  - `status` (`draft`, `sent`, `paid`, `overdue`, `cancelled`)
  - `issue_date`
  - `due_date`
  - `currency`
  - `subtotal`, `tax`, `total`
  - Optional: `notes`, `terms`
  - Timestamps

- **`invoice_line_items`**
  - `id` (PK)
  - `invoice_id` (FK → `invoices.id`)
  - `description`
  - `quantity`
  - `unit_price`
  - `total` (derived or stored for performance)

### Support Tables (Bonus)

- **`payments`**
  - `id` (PK)
  - `invoice_id` (FK)
  - `provider` (e.g., `stripe`)
  - `provider_payment_id`
  - `amount`
  - `currency`
  - `status`
  - `paid_at`

- **`attachments`**
  - `id` (PK)
  - `invoice_id` (FK)
  - `file_name`
  - `file_size`
  - `mime_type`
  - `storage_key` (path in S3 or disk)

- **`activity_logs`** (for logging/auditing)
  - `id` (PK)
  - `user_id` (FK, nullable)
  - `action` (e.g., `INVOICE_CREATED`)
  - `metadata` (JSONB)
  - `created_at`

Indexes are created on common query fields such as `users.email`, `invoices.user_id`, `invoices.client_id`, `invoices.status`, and `invoices.due_date`.

---

## Authentication & Authorization

### JWT Flow

1. User registers or logs in with email and password.
2. Backend verifies credentials and issues:
   - **Access token** (short‑lived, e.g., 15 minutes).
   - **Refresh token** (longer‑lived, e.g., 7–30 days).
3. Tokens are:
   - Sent in **HTTP‑only cookies** (recommended) or as Bearer tokens in the `Authorization` header.
4. Protected routes use an **auth middleware** to:
   - Parse and verify the access token.
   - Attach `req.user` (id, role, and other claims).
5. When an access token expires:
   - Frontend calls `/auth/refresh`.
   - Backend verifies the refresh token and issues a new pair of tokens.

### Role‑based Access Control (RBAC)

- **User (Freelancer)**:
  - Can only access and modify resources they own (their profile, their clients, their invoices).
- **Admin**:
  - Can access all users and all invoices.
  - Can manage roles and perform admin operations.

RBAC is enforced by:

- Route‑level middleware (e.g., `requireRole('admin')`).
- Ownership checks in services and repositories (e.g., invoice’s `user_id` must match `req.user.id` unless admin).

---

## API Overview

Base path: `/api/v1`

### Auth

- **POST** `/auth/register` – Register a new user.
- **POST** `/auth/login` – Log in and receive tokens.
- **POST** `/auth/refresh` – Refresh access/refresh tokens.
- **POST** `/auth/logout` – Invalidate tokens and clear cookies.

### Users

- **GET** `/users/me` – Get current user profile.
- **PATCH** `/users/me` – Update current user profile.
- **GET** `/users` – (Admin) List users (paginated).

### Clients

- **GET** `/clients` – List clients (paginated, filtered by current user).
- **POST** `/clients` – Create client.
- **GET** `/clients/:id` – Get client details (owned or admin).
- **PATCH** `/clients/:id` – Update client.
- **DELETE** `/clients/:id` – Delete client.

### Invoices

- **GET** `/invoices` – List invoices (paginated, filter by status, client, date).
- **POST** `/invoices` – Create invoice with line items.
- **GET** `/invoices/:id` – Get invoice details (owner or admin).
- **PATCH** `/invoices/:id` – Update invoice.
- **DELETE** `/invoices/:id` – Delete invoice.

### Payments 

- **POST** `/invoices/:id/pay` – Create a Stripe PaymentIntent and return `client_secret`.
- **POST** `/webhooks/stripe` – Stripe webhook endpoint to update invoice/payment status.

### Attachments (Bonus)

- **POST** `/invoices/:id/attachments` – Upload invoice attachment.
- **GET** `/attachments/:id` – Secure download link or redirect.

---

## Validation & Error Handling

### Client‑Side Validation

- Forms use a **schema‑driven** approach:
  - Example: Zod schemas (`InvoiceFormSchema`, `ClientFormSchema`).
  - Real‑time feedback (inline error messages under fields).
  - Prevents impossible states before sending data to the server.

### Server‑Side Validation

- Incoming requests are validated in controllers using DTOs/schemas:
  - Required fields, types, ranges (e.g., quantity > 0, due date ≥ issue date).
  - Ensures that even if client‑side validation is bypassed, data remains consistent.
- Violations return standardized **400 Bad Request** responses with field‑level error details.

### Centralized Error Handling

- A global error middleware:
  - Catches thrown errors and rejected promises.
  - Distinguishes between known (validation, auth, not found) and unknown errors.
  - Logs full details in development and safe summaries in production.
- Frontend consumes error messages and shows:
  - Toast notifications for general errors.
  - Inline messages for field‑specific issues.

---

## Pagination

- **Request parameters**:
  - `page`: current page (default: 1).
  - `limit`: items per page (default: 20, max: e.g., 100).
- **Response format**:
  - `data`: array of records.
  - `meta`: object with `page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`.
- Applied to:
  - Invoice list.
  - Client list.
  - User list (admin).

Optionally, cursor‑based pagination can be added for infinite scroll and better performance on large datasets.

---

## Clean UI Principles

- **Layout**
  - Sidebar navigation for main sections (Dashboard, Invoices, Clients, Settings).
  - Top bar for user info and quick actions (create invoice, search).
- **Invoice List**
  - Table or card view with status badges (e.g., color‑coded).
  - Filters by client, status, date range.
  - Quick actions (view, edit, send, duplicate).
- **Invoice Editor**
  - Multi‑step or single page form.
  - Inline add/remove of line items.
  - Live preview of totals.
- **Accessibility**
  - Proper semantics and ARIA attributes.
  - High contrast themes and keyboard support.

---

## Deployment

### Containerization

- **Backend**:
  - Built with a production Node.js image.
  - Exposes port (e.g., 4000) for the API.
- **Frontend**:
  - Built into static assets (e.g., with Vite/React).
  - Served by Nginx (recommended) or a static host.
- **Database**:
  - PostgreSQL container with persisted volume.

Example services (conceptual):

- `frontend` – React build, served via Nginx.
- `backend` – Express API.
- `db` – PostgreSQL.
- Optional: `redis`, `worker` (for background jobs).

### Environment Configuration

Key environment variables for backend (example):

- `NODE_ENV`
- `PORT`
- `DATABASE_URL` (or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (bonus)
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` (bonus)
- `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` (bonus)

Frontend environment (example):

- `VITE_API_URL`
- `VITE_STRIPE_PUBLIC_KEY` (bonus)

---

## Testing & Logging

### Unit & Integration Tests (Bonus)

- **Backend**
  - Service‑level tests for invoices (totals, status changes).
  - Auth tests (login, token refresh, protected routes).
  - API integration tests using a test database.
- **Frontend**
  - Component tests for forms and lists.
  - Integration tests for flows like “create invoice → see in list”.

### Logging (Bonus)

- Structured logging using a library like **Winston** or **Pino**:
  - Log levels (`debug`, `info`, `warn`, `error`).
  - Contextual metadata (user id, request id).
- HTTP request logging (e.g., **Morgan** or a custom middleware).
- In production, logs can be shipped to a centralized service for analysis.

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Docker)
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Clone the repository** and install dependencies:

   ```bash
   cd "invoice generator"
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Configure environment**:

   - Copy `backend/.env.example` to `backend/.env`.
   - Ensure `MONGODB_URI` points to your MongoDB instance (e.g. `mongodb://localhost:27017/invoice-generator`).

3. **Start MongoDB** (if not running):

   ```bash
   docker run -d -p 27017:27017 --name mongo mongo:7
   ```

4. **Run the app**:

   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Docker Deployment

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- MongoDB: localhost:27017

### Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Creating an Admin User

After registering a user, update the role in MongoDB:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Once running, you can:

- Register/login as a freelancer
- Create clients and invoices
- Use the Users page (admin only) to manage users
- Configure Stripe for test payments (optional)

---

## How to Use This README

- **As a project blueprint**: Follow this as a guide to implement the full application.
- **As documentation**: Attach it to an existing implementation to explain its architecture and design decisions.

You can adapt the tech choices (e.g., swap Express for NestJS or Prisma for TypeORM), but the **architecture, features, and behaviors described here satisfy the original project requirements** for an invoice generator for freelancers.

