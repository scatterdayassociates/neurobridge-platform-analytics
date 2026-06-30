import os, json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from google.cloud import bigquery
from google.oauth2 import service_account
from dotenv import load_dotenv

load_dotenv()
P = os.environ["GCP_PROJECT"]
DS = os.environ.get("BQ_DATASET", "NB_analytics_dashboard")
HERE = os.path.dirname(os.path.abspath(__file__))

creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
if creds_json:
    creds = service_account.Credentials.from_service_account_info(json.loads(creds_json))
    client = bigquery.Client(project=P, credentials=creds)
else:
    client = bigquery.Client(project=P)

app = FastAPI(title="Neurobridge Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

PRODUCT_OVERVIEW = {
    "p1_verified_clinicians":      "metric_p1_verified_clinicians",
    "p4_content_assets_live":      "metric_p4_content_assets_live",
    "p6_issue_tickets":            "metric_p6_issue_tickets",
    "p8_clinicians_by_type":       "metric_p8_clinicians_by_type",
    "p12_clinician_geography":     "metric_p12_clinician_geography",
    "p13_issue_resolution_weekly": "metric_p13_issue_resolution_weekly",
}

EVENT_PANELS = {
    "onboarding_funnel":  "metric_onboarding_funnel",
    "ariadne_ctr":        "metric_ariadne_ctr",
    "ariadne_ctr_funnel": "metric_ariadne_ctr_funnel",
    "wac":                "metric_wac",
    "wap":                "metric_wap",
}

TRAFFIC_OVERVIEW = {
    "t_daily":         "metric_t_daily",
    "t_sources":       "metric_t_sources",
    "t_geography":     "metric_t_geography",
    "t_devices":       "metric_t_devices",
    "t_landing_pages": "metric_t_landing_pages",
}

DETAIL = {
    "clinicians": "detail_clinicians",
    "traffic":    "detail_traffic",
    "tickets":    "detail_tickets",
}

ALL_ZONES = {**PRODUCT_OVERVIEW, **EVENT_PANELS, **TRAFFIC_OVERVIEW, **DETAIL}

def run_view(view: str):
    rows = client.query(f"SELECT * FROM `{P}.{DS}.{view}`").result()
    return [dict(r) for r in rows]

@app.get("/")
def index():
    return FileResponse(os.path.join(HERE, "dashboard.html"))

@app.get("/api")
def api_info():
    return {"service": "neurobridge-dashboard-api",
            "product_overview": list(PRODUCT_OVERVIEW.keys()),
            "event_panels": list(EVENT_PANELS.keys()),
            "traffic_overview": list(TRAFFIC_OVERVIEW.keys()),
            "detail": list(DETAIL.keys())}

@app.get("/api/product-overview")
def product_overview():
    return {zone: run_view(view) for zone, view in PRODUCT_OVERVIEW.items()}

@app.get("/api/event-panels")
def event_panels():
    return {zone: run_view(view) for zone, view in EVENT_PANELS.items()}

@app.get("/api/traffic-overview")
def traffic_overview():
    return {zone: run_view(view) for zone, view in TRAFFIC_OVERVIEW.items()}

@app.get("/api/detail")
def detail():
    return {zone: run_view(view) for zone, view in DETAIL.items()}

@app.get("/api/metric/{zone}")
def metric(zone: str):
    view = ALL_ZONES.get(zone)
    if view is None:
        raise HTTPException(status_code=404, detail=f"unknown zone: {zone}")
    return run_view(view)
