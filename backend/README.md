# LCMS Backend

## Run locally

```bash
npm install
# Copy .env.example → .env and set MONGO_URI, JWT_SECRET, etc.
npm start
```

After start you should see **both** lines:

- `LCMS API listening on port …`
- `API prefixes: /api/auth … /api/contributions …`

## Layout

| Area | Purpose |
|------|---------|
| `server.js` | Loads `.env`, connects MongoDB, listens |
| `src/app.js` | Express app — CORS, JSON, mounts routes |
| `src/controllers/` | Request handlers (business logic); e.g. `contributions.controller.js` |
| `src/routes/` | Thin routers that wire URLs + middleware to controllers |
| `src/models/` | Mongoose schemas |
| `src/middleware/` | JWT / admin guards |

Admin-only ledger helpers include `GET /api/contributions/count` (total rows), `GET /api/contributions/stats/top-club` (`{ clubName, rowCount }`), `GET /api/contributions/stats/clubs?limit=` (sorted club leaderboard), and `GET /api/contributions/stats/districts?limit=` (sorted district leaderboard). Row counts mirror the contributors table — duplicate rows each count once.

If `POST http://localhost:5000/api/contributions` returns **404 Not found**, Node is usually running **old code** without that mount. Stop the backend (`Ctrl+C`) and run `npm start` again from **`backend`** (this folder).

Confirm the route exists: open `GET http://localhost:5000/health` → `{"ok":true}`, then reload the admin page as a logged-in **admin**.
