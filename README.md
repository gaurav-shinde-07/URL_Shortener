# URL_Shortener

TinyLink is a small, self-contained URL shortener and link stats project built with Node.js, Express and SQLite. It provides a lightweight API for creating short codes, redirecting to the original URL, and a minimal stats UI.

**Features**
- Create short links with auto-generated or custom codes (6–8 alphanumeric chars).
- Redirect short codes to original URLs with click counting and last-click timestamp.
- List and inspect links, and soft-delete links.
- Small, zero-conf SQLite DB stored under `data/tinylink.db`.
- Ready to run locally or deploy to Vercel (serverless + static routes included).

## Quick Start

Prerequisites:
- Node.js (14+ recommended)

Clone, install dependencies and run locally:

```powershell
cd path\to\tinylink
npm install
npm run dev    # start with nodemon for development
# or
npm start      # production
```

Open `http://localhost:3000` (or set `PORT` env var).

## Environment

You can configure the following environment variables (via `.env`):

- `PORT` — port for local server (default: `3000`).
- `BASE_URL` — base URL used in API responses for the `shortUrl` (default: `http://localhost:3000`).
- `DB_FILE` — override the SQLite file path (default: `./data/tinylink.db`).

## Files and Structure

- `server.js` — Express server and main API routes.
- `db.js` — SQLite helper (init, create/get/list/delete, increment clicks).
- `public/` — static frontend (`index.html`, `code.html`, `app.js`, `style.css`).
- `api/redirect.js` and `vercel.json` — Vercel-friendly redirect routing for serverless deployment.
- `data/` — stores `tinylink.db` (created automatically).

## API Endpoints

Base path: `/api/links`

- `POST /api/links` — create a short link
  - Body: `{ "url": "https://example.com", "code": "abc123" }` (code optional)
  - Valid code format: 6–8 alphanumeric characters. Auto-generated codes are 7 chars.
  - Response: `{ code, shortUrl, url }`

- `GET /api/links` — list links (non-deleted)
  - Response: array of `{ code, url, clicks, created_at, last_clicked }`

- `GET /api/links/:code` — get details for a code

- `DELETE /api/links/:code` — soft-delete a link (sets `deleted = 1`)

Redirects and stats:
- `GET /:code` — redirect to the original URL and increment click count.
- `GET /code?c=<code>` or open `/code` — small UI (`public/code.html`) to view link stats.

## Database

The project uses SQLite via `sqlite` and `sqlite3`. The DB file path is `data/tinylink.db` by default. The schema (created automatically) is:

- `links(code PRIMARY KEY, url, clicks INTEGER DEFAULT 0, created_at TEXT, last_clicked TEXT, deleted INTEGER DEFAULT 0)`

## Example Usage (curl)

Create link (auto-generated code):

```powershell
curl -X POST http://localhost:3000/api/links -H "Content-Type: application/json" -d '{"url":"https://example.com"}'
```

Create link (custom code):

```powershell
curl -X POST http://localhost:3000/api/links -H "Content-Type: application/json" -d '{"url":"https://example.com", "code":"myCode1"}'
```

Get list:

```powershell
curl http://localhost:3000/api/links
```

Get details:

```powershell
curl http://localhost:3000/api/links/<code>
```

Delete (soft-delete):

```powershell
curl -X DELETE http://localhost:3000/api/links/<code>
```

Visit a short URL in the browser: `http://localhost:3000/<code>` — it will redirect and increment clicks.

## Deployment (Vercel)

The project includes `vercel.json` for easy deployment:
- `api/**/*.js` handled as serverless functions.
- Static assets served from `public/`.
- A route maps `/:code` serverless redirect to `api/redirect.js`.

To deploy, install the Vercel CLI or use the Vercel dashboard and push this repo.

## Development Notes

- The server uses `helmet`, `cors`, `body-parser`, and stores DB in `data/`.
- DB initialization runs at server start.
- Tests are not included in this repository.

## Contributing

Contributions and bug reports are welcome — open an issue or a pull request. Keep changes focused and add clear testing steps.

## License

This repository has no license file. Add one if you intend to publish or share under a specific license.

# End of README
