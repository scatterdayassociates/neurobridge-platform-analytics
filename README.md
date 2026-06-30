# Neurobridge Platform Analytics

Analytics dashboard for the Neurobridge platform.

## Structure

- backend/  — Python data pipeline and FastAPI service. Extracts data from the
  application Postgres database and the GA4 BigQuery export, builds analytics
  views in BigQuery, and serves them over an API.
- frontend/ — TanStack Start (React) dashboard. Two tabs: Product Overview
  (clinicians, content, tickets) and Traffic Overview (GA4 web analytics).
  Reads from the backend API.

## Backend setup

  cd backend
  python3 -m venv venv && source venv/bin/activate
  pip install -r requirements.txt

Create a .env file in backend/ with these keys:

  PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD
  GCP_PROJECT=nb-analytics-dashboard
  BQ_DATASET=NB_analytics_dashboard
  GOOGLE_CREDENTIALS_JSON   (service account key JSON)

Pipeline scripts, run in order to load data and build the views:

  python extract_load.py            # load raw tables from Postgres
  python load_analytics_events.py   # load GA4 events
  python build_views.py             # product overview views
  python build_event_views.py       # event-based views
  python build_traffic_views.py     # GA4 traffic views
  python build_detail_views.py      # drill-down detail views

Run the API:

  uvicorn app:app --reload

## Frontend setup

  cd frontend
  npm install
  npm run dev

The API base URL is set in frontend/src/lib/api.ts.
Build for production with: npm run build
