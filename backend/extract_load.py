import os
import pandas as pd
import pandas_gbq
from sqlalchemy import create_engine, URL
from dotenv import load_dotenv

load_dotenv()

pg_url = URL.create(
    "postgresql+psycopg2",
    username=os.environ["PG_USER"],
    password=os.environ["PG_PASSWORD"],
    host=os.environ["PG_HOST"],
    port=int(os.environ["PG_PORT"]),
    database=os.environ["PG_DB"],
)
engine = create_engine(pg_url, connect_args={"sslmode": "require"})

GCP_PROJECT = os.environ["GCP_PROJECT"]
BQ_DATASET  = os.environ["BQ_RAW_DATASET"]

QUERIES = {
    "clinicians": """
        SELECT user_id, clinician_type, country, state, city, zip_code
        FROM ariadne.clinicians
    """,
    "posts": """
        SELECT id, user_id, video_url,
               COALESCE(array_length(attachments, 1) > 0, false) AS has_attachments,
               price, tier, date_published
        FROM ariadne.posts
    """,
    "tickets": """
        SELECT issue_id, user_id, created_at, closed_at
        FROM ariadne.tickets
    """,
    "license_review_issues": """
        SELECT user_id, last_notified_state, created_at
        FROM ariadne.license_review_issues
    """,
}

# Force these to load as real TIMESTAMPs even when some values are empty,
# so date math and NULL checks work correctly in BigQuery.
TS_COLS = {"created_at", "closed_at", "date_published"}

for table, sql in QUERIES.items():
    print(f"Reading ariadne.{table} ...")
    df = pd.read_sql(sql, engine)
    for c in df.columns:
        if c in TS_COLS:
            df[c] = pd.to_datetime(df[c], errors="coerce", utc=True)
    dest = f"{BQ_DATASET}.{table}"
    print(f"  loading {len(df):,} rows -> {GCP_PROJECT}.{dest}")
    pandas_gbq.to_gbq(df, dest, project_id=GCP_PROJECT,
                      if_exists="replace", progress_bar=False)

print("Done.")
