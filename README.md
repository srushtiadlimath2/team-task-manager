# Team Task Manager

A full-stack web application for team project and task management with role-based access control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MySQL via Sequelize ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Railway |

## Features

- **Authentication** — Signup / Login with JWT, token refresh via `/auth/me`
- **Role-Based Access** — Global roles (Admin / Member) + per-project roles
- **Projects** — Create, view, update, delete projects; manage members
- **Tasks** — Create tasks with priority, status, due date, assignee; kanban-style status board
- **Dashboard** — Stats summary, my tasks, overdue detection

## Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Sequelize MySQL connection
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   ├── Task.js
│   │   │   ├── ProjectMember.js
│   │   │   └── index.js           # Associations
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify, requireAdmin
│   │   │   └── projectAuth.js     # Project-level role checks
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /api/auth/signup|login, GET /me
│   │   │   ├── projects.js        # CRUD + members
│   │   │   ├── tasks.js           # CRUD + status update
│   │   │   └── users.js           # List users, update role
│   │   └── index.js               # Express app entry
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── services/api.js         # Axios instance + API calls
    │   ├── context/AuthContext.jsx # Auth state
    │   ├── components/
    │   │   ├── Auth/              # Login, Signup
    │   │   ├── Dashboard/         # Stats + overview
    │   │   ├── Layout/            # AppLayout with sidebar
    │   │   └── Projects/          # List + Detail with Kanban
    │   ├── index.jsx              # Router + app entry
    │   └── index.css
    └── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally or via Railway

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev
```

The server starts on `http://localhost:5000`. Sequelize auto-creates tables on first run (development mode).

### Frontend

```bash
cd frontend
npm install
npm start
```

React dev server starts on `http://localhost:3000` and proxies `/api` to `:5000`.

## API Reference

### Auth
| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | /api/auth/signup | name, email, password, role | — |
| POST | /api/auth/login | email, password | — |
| GET | /api/auth/me | — | Bearer token |

### Projects
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/projects | Member |
| POST | /api/projects | Member |
| GET | /api/projects/:id | Project member |
| PATCH | /api/projects/:id | Project admin |
| DELETE | /api/projects/:id | Project admin |
| POST | /api/projects/:id/members | Project admin |
| DELETE | /api/projects/:id/members/:userId | Project admin |

### Tasks
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | /api/tasks?projectId=X | Filter by project, status, assignee |
| GET | /api/tasks/my | Tasks assigned to current user |
| POST | /api/tasks | title, projectId required |
| PATCH | /api/tasks/:id | Update any field |
| DELETE | /api/tasks/:id | Project owner or global admin |

## Role-Based Access

| Action | Member | Project Admin | Global Admin |
|--------|--------|---------------|--------------|
| View projects they belong to | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ✅ |
| Edit/delete own project | — | ✅ | ✅ |
| Add/remove members | — | ✅ | ✅ |
| Create tasks in project | ✅ | ✅ | ✅ |
| Delete any task | — | ✅ | ✅ |
| Change user roles | — | — | ✅ |

## Deployment on Railway

1. Push code to GitHub
2. Create a Railway project → **New Service from GitHub repo**
3. Add a **MySQL** plugin in Railway
4. Set environment variables for both backend and frontend services:
   - Backend: copy from `.env.example`, Railway auto-fills `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`
   - Frontend: set `REACT_APP_API_URL=https://your-backend.railway.app/api`
5. Both services deploy automatically on push

### Railway Environment Variable Mapping

```
DB_HOST     = $MYSQLHOST
DB_USER     = $MYSQLUSER
DB_PASSWORD = $MYSQLPASSWORD
DB_NAME     = $MYSQLDATABASE
DB_PORT     = $MYSQLPORT
```

## Demo Video Checklist
- [ ] Sign up as Admin and as Member
- [ ] Create a project
- [ ] Add member to project
- [ ] Create tasks with different priorities
- [ ] Assign tasks to members
- [ ] Change task status (To Do → In Progress → Done)
- [ ] Show dashboard stats
- [ ] Show Admin cannot be replicated by Member

## License
MIT
