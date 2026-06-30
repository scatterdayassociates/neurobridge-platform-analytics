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

COLS_ONLY = ["purchases", "post_purchases", "chat_sessions", "messages"]
WITH_SAMPLE = ["user_tracking", "login_recognized_contexts"]

with engine.connect() as conn:
    for t in COLS_ONLY + WITH_SAMPLE:
        print(f"\n===== ariadne.{t} =====")
        cols = pd.read_sql(text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'ariadne' AND table_name = :t
            ORDER BY ordinal_position
        """), conn, params={"t": t})
        for _, r in cols.iterrows():
            print(f"  {r['column_name']:28s} {r['data_type']}")
        if t in WITH_SAMPLE:
            try:
                s = pd.read_sql(text(f'SELECT * FROM ariadne."{t}" LIMIT 1'), conn)
                if len(s):
                    print("  sample:", dict(s.iloc[0]))
            except Exception as e:
                print("  sample error:", e)
