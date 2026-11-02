# CIVORA Server

Express REST API for CIVORA community events platform.

## Stack
Express 4 · Mongoose (MongoDB Atlas) · `jose` JWT verification (Better Auth JWKS) · Zod validation

## Endpoints
| Method | Endpoint | Access |
|---|---|---|
| GET | `/health` | Public |
| GET | `/api/events?search=&category=&location=&sort=asc&desc&page=&limit=` | Public |
| GET | `/api/events/recent?limit=6` | Public |
| GET | `/api/events/:id` | Public (optional auth for `isJoined`) |
| POST | `/api/events` | JWT |
| GET | `/api/my-events` | JWT |
| PATCH | `/api/events/:id` | JWT + Owner |
| DELETE | `/api/events/:id` | JWT + Owner |
| POST | `/api/events/:id/join` | JWT |
| GET | `/api/my-joined-events` | JWT |
| GET | `/api/users/me` | JWT |
| PATCH | `/api/users/me` | JWT |
| POST | `/api/newsletter/subscribe` | Public |
| GET | `/api/stats/community` | Public |
| GET | `/api/stats/me` | JWT |

Ownership and duplicate-join checks are enforced in MongoDB + backend, not just frontend.
`{ eventId, userId }` has a unique compound index.

## Setup
```bash
cp .env.example .env
npm install
npm run dev
```

Required env:
- `MONGODB_URI` — Atlas connection string (same DB as Better Auth `user` collection)
- `CLIENT_URL` — comma-separated allowed origins
- `BETTER_AUTH_JWKS_URL` — e.g. `https://civora-client.vercel.app/api/auth/jwks` (production)
- `BETTER_AUTH_SECRET` — shared secret fallback for local HS256 dev tokens
- `JWT_ISSUER`, `JWT_AUDIENCE` — must match the Next.js Better Auth JWT config

## Deploy (Render)
- Build: `npm install`
- Start: `npm start`
- Env: set `MONGODB_URI`, `CLIENT_URL` (Vercel URL), `BETTER_AUTH_JWKS_URL`, `NODE_ENV=production`
