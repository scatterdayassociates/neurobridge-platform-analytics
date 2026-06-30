import os
import pandas as pd
import pandas_gbq
from sqlalchemy import create_engine, URL
from dotenv import load_dotenv

load_dotenv()
pg_url = URL.create(
    "postgresql+psycopg2",
    username=os.environ["PG_USER"], password=os.environ["PG_PASSWORD"],
    host=os.environ["PG_HOST"], port=int(os.environ["PG_PORT"]),
    database=os.environ["PG_DB"],
)
engine = create_engine(pg_url, connect_args={"sslmode": "require"})
GCP_PROJECT = os.environ["GCP_PROJECT"]
BQ_DATASET = os.environ.get("BQ_RAW_DATASET", "NB_analytics_dashboard")

SQL = """
    SELECT event_id, event_name, occurred_at, user_id, user_role, session_id,
           event_source, module, screen_name, content_id, clinician_id,
           query_id, issue_id, transaction_id, params::text AS params
    FROM ariadne.analytics_events
"""
print("Reading ariadne.analytics_events ...")
df = pd.read_sql(SQL, engine)
if "occurred_at" in df.columns:
    df["occurred_at"] = pd.to_datetime(df["occurred_at"], errors="coerce", utc=True)
dest = f"{BQ_DATASET}.analytics_events"
print(f"  loading {len(df):,} rows -> {GCP_PROJECT}.{dest}")
pandas_gbq.to_gbq(df, dest, project_id=GCP_PROJECT, if_exists="replace", progress_bar=False)
print("Done.")
