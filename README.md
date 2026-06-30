# Neurobridge Platform Analytics

Analytics dashboard for the Neurobridge platform. Two parts:

- **`backend/`** — Python data pipeline and API. Extracts data from the application Postgres database and the GA4 BigQuery export, builds analytics views in BigQuery, and serves them over a FastAPI service.
- **`frontend/`** — TanStack Start (React) dashboard. Two tabs: Product Overview (clinicians, content, tickets) and Traffic Overview (GA4 web analytics). Reads from the backend API.

## Backend
Create a `.env` file with:
Pipeline scripts (run in order to load data and build views):
Run the API:
## Frontend
The API base URL is set in `src/lib/api.ts`. Build for production with `npm run build`.
