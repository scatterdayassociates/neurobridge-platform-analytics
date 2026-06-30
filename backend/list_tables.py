import os
import pandas as pd
from sqlalchemy import create_engine, URL, text
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

with engine.connect() as conn:
    tables = pd.read_sql(text("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'ariadne'
        ORDER BY table_name
    """), conn)["table_name"].tolist()
    print(f"{len(tables)} tables in ariadne:\n")
    for t in tables:
        try:
            n = pd.read_sql(text(f'SELECT COUNT(*) AS n FROM ariadne."{t}"'), conn)["n"][0]
        except Exception as e:
            n = f"error: {e}"
        keys = ["event", "analytic", "activit", "track", "session", "view", "visit", "log"]
        flag = "   <-- event-like" if any(k in t.lower() for k in keys) else ""
        print(f"  {t:38s} {n}{flag}")
