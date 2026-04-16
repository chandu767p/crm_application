# Do Systems CRM

A full-stack CRM web application built with React, Node.js, Express, and MongoDB.

## Features

- **Authentication**: JWT-based login/register with bcrypt password hashing
- **Leads**: Full CRUD, status pipeline, deal value tracking, notes
- **Contacts**: Full CRUD, tags, addresses, company association
- **Users**: Role-based (admin/manager/sales/support), active/inactive
- **Bulk Upload**: CSV/XLSX import for all modules with error reporting
- **CSV Export**: Filtered data export with column selection
- **Table View**: Sort, filter, column toggle, column reorder (drag & drop), pagination
- **Grid/Card View**: Toggleable responsive card layout
- **Responsive**: Desktop, tablet, mobile with collapsible sidebar

---

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- npm

---

## Setup & Run

### 1. Clone and navigate
```bash
cd crm2
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
```

### 3. Seed the database
```bash
npm run seed
```
This creates sample users, leads, and contacts.

**Demo credentials:**
| Role    | Email                      | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@dosystems.io        | password123 |
| Manager | sarah@dosystems.io        | password123 |
| Sales   | john@dosystems.io         | password123 |

### 4. Start backend
```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```
Backend runs on **http://localhost:5000**

### 5. Frontend setup
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

---

## Environment Variables

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```
> Note: If using Vite's proxy (default), you can leave `VITE_API_URL` as `/api`.

---

## API Endpoints

| Method | Endpoint                  | Description          |
|--------|--------------------------|----------------------|
| POST   | /api/auth/register        | Register user        |
| POST   | /api/auth/login           | Login                |
| GET    | /api/auth/me              | Get current user     |
| GET    | /api/users                | List users           |
| POST   | /api/users                | Create user (admin)  |
| PUT    | /api/users/:id            | Update user (admin)  |
| DELETE | /api/users/:id            | Delete user (admin)  |
| GET    | /api/leads                | List leads           |
| POST   | /api/leads                | Create lead          |
| PUT    | /api/leads/:id            | Update lead          |
| DELETE | /api/leads/:id            | Delete lead          |
| POST   | /api/leads/:id/notes      | Add note             |
| GET    | /api/contacts             | List contacts        |
| POST   | /api/contacts             | Create contact       |
| PUT    | /api/contacts/:id         | Update contact       |
| DELETE | /api/contacts/:id         | Delete contact       |
| POST   | /api/bulk-upload/:module  | Bulk upload CSV/XLSX |
| GET    | /api/export/:module       | Export CSV           |

### Query Parameters (list endpoints)
- `page`, `limit` — pagination
- `sortField`, `sortOrder` — sorting
- `search` — text search
- `status`, `source`, `role`, `active` — filters

### Bulk Upload
POST `/api/bulk-upload/{users|leads|contacts}`
Form-data: `file` (CSV or XLSX)

### Export
GET `/api/export/{users|leads|contacts}?columns=name,email,phone&status=new`

---

## CSV Template Headers

**Users:** `name,email,password,role`

**Leads:** `name,email,phone,company,status,source,value`

**Contacts:** `name,email,phone,company,jobTitle,tags,address.street,address.city,address.state,address.zip,address.country`

---

## Project Structure

```
crm2/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── leadController.js
│   │   ├── contactController.js
│   │   ├── bulkUploadController.js
│   │   └── exportController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Lead.js
│   │   └── Contact.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── leads.js
│   │   ├── contacts.js
│   │   ├── bulkUpload.js
│   │   └── export.js
│   ├── seeds/seed.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   ├── DataTable.jsx     ← sort, filter, column toggle/reorder, pagination
    │   │   │   ├── DataGrid.jsx      ← card/grid view
    │   │   │   ├── Modal.jsx
    │   │   │   ├── ConfirmDialog.jsx
    │   │   │   ├── Pagination.jsx
    │   │   │   ├── BulkUpload.jsx
    │   │   │   ├── ExportButton.jsx
    │   │   │   ├── LoadingSpinner.jsx
    │   │   │   └── PrivateRoute.jsx
    │   │   ├── filters/FilterBar.jsx
    │   │   └── forms/
    │   │       ├── UserForm.jsx
    │   │       ├── LeadForm.jsx
    │   │       └── ContactForm.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ToastContext.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Users.jsx
    │   │   ├── Leads.jsx
    │   │   ├── Contacts.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── services/api.js
    │   └── utils/helpers.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```
