# Internal Maps Frontend

React + Vite frontend for the Internal Maps platform.

## Features

- JWT login against backend `/api/auth/login`
- RBAC-aware UI (`admin`, `editor`, `viewer`)
- Business and POI list + create flows
- MapLibre map workspace with:
  - Business/POI GeoJSON layers
  - Layer visibility toggles
  - Status/type filters
  - Click popups
  - Fit-to-data and manual source reload

## Setup

# Internal Maps Frontend

React + Vite frontend for the Internal Maps platform.

## What This App Does

- Authenticates users with JWT (`/api/auth/login`, `/api/auth/me`)
- Applies role-aware behavior for `admin`, `editor`, and `viewer`
- Manages businesses and POIs through backend API endpoints (list, create, update, delete)
- Renders a MapLibre workspace with:
	- Business + POI GeoJSON layers
	- Backend page-aware GeoJSON loading for larger datasets
	- Layer visibility toggles
	- Business status filter
	- Feature popups on click
	- Source reload and fit-to-data controls
	- List-panel pagination and server-side filtering

## Tech Stack

- React 19
- Vite 7
- MapLibre GL
- ESLint 9 (flat config)

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Running backend API (default expected at `http://localhost:5000/api`)

## Getting Started

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Create local environment file:

	 ```bash
	 cp .env.example .env
	 ```

3. Start the dev server:

	 ```bash
	 npm run dev
	 ```

4. Open the URL printed by Vite (typically `http://localhost:5173`).

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:5000/api` | Base URL used by `src/shared/services/httpClient.js` |

Example `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` — start Vite development server
- `npm run build` — build production assets into `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint checks

## Authentication Notes

- Access token is persisted in `localStorage` under key `internalMaps.accessToken`.
- On startup, the app validates the stored token via `/auth/me`.
- Invalid/expired tokens are cleared automatically and user session resets.

## Backend Contract (Used by Frontend)

- `POST /auth/login`
- `GET /auth/me`
- `GET /businesses`
- `POST /businesses`
- `GET /businesses/geojson`
- `GET /pois`
- `POST /pois`
- `GET /pois/geojson`

## Local Test Credentials

If backend is running in memory/demo mode, use:

- `admin@internal-maps.local` / `change-me-admin`
- `editor@internal-maps.local` / `change-me-editor`
- `viewer@internal-maps.local` / `change-me-viewer`

## Project Structure

```text
src/
	app/                 # App shell and root providers
	modules/
		auth/              # Login/session + permissions
		business/          # Business UI workflows
		poi/               # POI UI workflows
		map/               # Map workspace, filters, map data hook
		dashboard/         # Main dashboard page
	shared/
		services/          # HTTP client + API modules
		layout/            # Main layout
		components/        # Reusable UI utilities
	styles/              # Global styles
```

## Build Output

- Production artifacts are emitted to `dist/`.
- Deploy `dist/` to any static hosting solution (Nginx, S3+CDN, Vercel, Netlify, etc.).
- Ensure `VITE_API_BASE_URL` points to the target backend environment at build time.

## Troubleshooting

### Blank Data or API Errors

- Confirm backend is up and reachable at `VITE_API_BASE_URL`.
- Confirm CORS is enabled on backend for frontend origin.
- Check browser devtools Network tab for failing requests.

### Login Fails Repeatedly

- Verify credentials and backend auth mode.
- Clear local storage token and retry:

	```js
	localStorage.removeItem('internalMaps.accessToken')
	```

### Map Not Rendering Properly

- Confirm internet access to the default public style URL used by MapLibre.
- Verify no JS errors in browser console.

## Development Guidelines

- Keep API access centralized under `src/shared/services/api/`.
- Reuse `httpClient` instead of raw `fetch` inside UI modules.
- Keep role checks in auth/permission utilities, not scattered in components.

## Status

This frontend is production-oriented for internal use and currently does not include an automated test suite in this package.
