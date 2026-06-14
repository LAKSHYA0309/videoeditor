# Swift Video Editor

A professional video editing web application built with React (Vite) frontend and Express.js backend, with Neon PostgreSQL database.

## Architecture

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API + Hooks
- **Port**: 5173

### Backend
- **Framework**: Express.js
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Port**: 5000

## Project Structure

```
video-editor-app/
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components (SignIn, SignUp, Dashboard, VideoEditor, Demo)
│   │   ├── components/      # Reusable components (ProtectedRoute)
│   │   ├── hooks/           # Custom hooks (useAuth)
│   │   ├── context/         # React Context (AuthContext)
│   │   ├── App.jsx          # Main app component with routing
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── routes/          # API routes (auth, projects, clips, media, effects, export)
    │   ├── db/
    │   │   └── schema.js    # Drizzle ORM schema
    │   └── index.js         # Express server entry point
    ├── package.json
    └── .env.example
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Neon PostgreSQL database

### 1. Set Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://user:password@host:5432/video_editor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Install Dependencies

**Backend**:
```bash
cd backend
pnpm install
```

**Frontend**:
```bash
cd frontend
pnpm install
```

### 3. Initialize Database

The database tables will be created when the backend starts. Make sure your DATABASE_URL is correct.

### 4. Start Development Servers

**Backend** (Terminal 1):
```bash
cd backend
pnpm dev
# Server running on http://localhost:5000
```

**Frontend** (Terminal 2):
```bash
cd frontend
pnpm dev
# App running on http://localhost:5173
```

### 5. Access the Application

- **Sign Up**: http://localhost:5173/sign-up
- **Sign In**: http://localhost:5173/sign-in
- **Dashboard**: http://localhost:5173/ (requires login)
- **Demo Editor** (no auth): http://localhost:5173/demo

## Features

### Authentication
- Email/password registration
- Email/password login
- Session token-based authentication
- Secure token storage in localStorage

### Project Management
- Create new video projects
- View all projects in dashboard
- Edit project titles
- Delete projects

### Video Editor
- Multi-panel interface:
  - Media Assets panel (left)
  - Video preview with playback controls (center)
  - Timeline for clip arrangement (bottom)
  - Properties panel for clip editing (right)
- Playback controls (play, pause, timeline scrubbing)
- Zoom controls for timeline
- Clip properties (opacity, scale, rotation)

### API Routes

**Authentication** (`/api/auth`):
- `POST /sign-up` - Register new user
- `POST /sign-in` - Login user
- `GET /session` - Get current session
- `POST /sign-out` - Logout user

**Projects** (`/api/projects`):
- `GET /` - Get all user projects
- `GET /:projectId` - Get specific project
- `POST /` - Create new project
- `PUT /:projectId` - Update project
- `DELETE /:projectId` - Delete project

**Clips** (`/api/clips`):
- `GET /project/:projectId` - Get clips for project
- `POST /` - Create clip
- `PUT /:clipId` - Update clip
- `DELETE /:clipId` - Delete clip

**Media** (`/api/media`):
- `GET /` - Get media assets
- `POST /` - Upload media
- `DELETE /:id` - Delete media

**Effects** (`/api/effects`):
- `GET /` - Get effects
- `POST /` - Create effect
- `DELETE /:id` - Delete effect

**Export** (`/api/export`):
- `POST /video` - Start video export
- `GET /:id/status` - Check export status

## Database Schema

### Better Auth Tables
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

### Video Editor Tables
- `projects` - Video projects
- `clips` - Video/audio/image clips
- `media_assets` - Uploaded media files
- `transitions` - Clip transitions
- `effects` - Video effects

## Development Notes

### Adding New Routes
1. Create a new file in `backend/src/routes/`
2. Import and mount it in `backend/src/index.js`
3. Use the `requireAuth` middleware for protected routes

### Adding New Pages
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Use `ProtectedRoute` wrapper for authenticated pages

### Styling
- Uses Tailwind CSS v4 with custom theme colors
- Dark theme by default (`background: #0f0f0f`)
- Primary color: Blue (`#3b82f6`)
- Customizable via `frontend/tailwind.config.js`

## Building for Production

**Frontend**:
```bash
cd frontend
pnpm build
# Output in dist/
```

**Backend**:
```bash
cd backend
pnpm start
```

## Troubleshooting

**CORS errors**: Ensure backend `FRONTEND_URL` env var matches your frontend domain

**Database connection errors**: Verify `DATABASE_URL` is correct and database is accessible

**Session issues**: Clear localStorage and cookies if experiencing auth problems

## Future Enhancements

- FFmpeg.wasm integration for video encoding
- Vercel Blob for media storage
- Real-time collaboration
- Advanced timeline features
- Effect templates
- Export presets
