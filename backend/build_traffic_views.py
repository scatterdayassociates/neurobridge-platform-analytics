import os
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()
P = os.environ["GCP_PROJECT"]
DS = os.environ.get("BQ_RAW_DATASET", "NB_analytics_dashboard")
GA4 = f"`{P}.analytics_527347928.events_*`"
client = bigquery.Client(project=P)

SESSION_KEY = ("CONCAT(user_pseudo_id, '-', CAST((SELECT value.int_value "
               "FROM UNNEST(event_params) WHERE key='ga_session_id') AS STRING))")

views = {
  "metric_t_daily": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_t_daily` AS
    SELECT
      PARSE_DATE('%Y%m%d', event_date) AS day,
      COUNT(DISTINCT user_pseudo_id) AS users,
      COUNT(DISTINCT {SESSION_KEY}) AS sessions,
      COUNTIF(event_name='page_view') AS pageviews
    FROM {GA4}
    GROUP BY day ORDER BY day
  """,
  "metric_t_sources": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_t_sources` AS
    SELECT
      COALESCE(traffic_source.source, '(direct)') AS source,
      COALESCE(traffic_source.medium, '(none)') AS medium,
      COUNT(DISTINCT user_pseudo_id) AS users,
      COUNT(DISTINCT {SESSION_KEY}) AS sessions
    FROM {GA4}
    GROUP BY source, medium ORDER BY sessions DESC
  """,
  "metric_t_geography": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_t_geography` AS
    SELECT geo.region AS state, COUNT(DISTINCT user_pseudo_id) AS users
    FROM {GA4}
    WHERE geo.country = 'United States' AND geo.region IS NOT NULL AND geo.region != ''
    GROUP BY state ORDER BY users DESC
  """,
  "metric_t_devices": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_t_devices` AS
    SELECT device.category AS device, COUNT(DISTINCT user_pseudo_id) AS users
    FROM {GA4}
    WHERE device.category IS NOT NULL AND device.category != ''
    GROUP BY device ORDER BY users DESC
  """,
  "metric_t_landing_pages": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_t_landing_pages` AS
    WITH pv AS (
      SELECT {SESSION_KEY} AS session_key,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key='page_location') AS page_location,
        event_timestamp
      FROM {GA4}
      WHERE event_name = 'page_view'
    ),
    ranked AS (
      SELECT session_key, page_location,
        ROW_NUMBER() OVER (PARTITION BY session_key ORDER BY event_timestamp) AS rn
      FROM pv
    )
    SELECT page_location AS landing_page, COUNT(*) AS sessions
    FROM ranked WHERE rn = 1
    GROUP BY landing_page ORDER BY sessions DESC
  """,
}

for name, ddl in views.items():
    client.query(ddl).result()
    print("created", name)
print("\nDone. Traffic views built. Numbers fill in as traffic accumulates.")
