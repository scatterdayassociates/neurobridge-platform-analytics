import os
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()
P = os.environ["GCP_PROJECT"]
DS = os.environ.get("BQ_DATASET") or os.environ.get("BQ_RAW_DATASET", "NB_analytics_dashboard")
GA4 = f"`{P}.analytics_527347928.events_*`"
client = bigquery.Client(project=P)

views = {
  "detail_clinicians": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.detail_clinicians` AS
    SELECT
      CONCAT('User ', CAST(c.user_id AS STRING)) AS clinician,
      c.clinician_type AS type,
      COALESCE(NULLIF(c.state, ''), '—') AS state,
      COALESCE(NULLIF(c.city, ''), '—') AS city,
      'Verified' AS status,
      CAST(DATE(v.verified_on) AS STRING) AS verified_on
    FROM `{P}.{DS}.clinicians` c
    JOIN (
      SELECT user_id, MIN(created_at) AS verified_on
      FROM `{P}.{DS}.license_review_issues`
      WHERE last_notified_state = 'accepted'
      GROUP BY user_id
    ) v ON c.user_id = v.user_id
    ORDER BY c.clinician_type, c.state
  """,
  "detail_traffic": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.detail_traffic` AS
    WITH base AS (
      SELECT
        user_pseudo_id,
        CONCAT(user_pseudo_id, '-', CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key='ga_session_id') AS STRING)) AS session_key,
        event_timestamp, event_name,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key='page_location') AS page_location,
        traffic_source.source AS source,
        geo.region AS state
      FROM {GA4}
    ),
    agg AS (
      SELECT user_pseudo_id, MAX(source) AS source,
             COUNT(DISTINCT session_key) AS sessions, MAX(state) AS state
      FROM base GROUP BY user_pseudo_id
    ),
    landing AS (
      SELECT user_pseudo_id,
        ARRAY_AGG(page_location ORDER BY event_timestamp LIMIT 1)[OFFSET(0)] AS landing
      FROM base WHERE event_name='page_view' AND page_location IS NOT NULL
      GROUP BY user_pseudo_id
    )
    SELECT
      CONCAT('Visitor ', SUBSTR(a.user_pseudo_id, 1, 8)) AS user,
      COALESCE(a.source, '(direct)') AS source,
      REGEXP_REPLACE(COALESCE(l.landing, '—'), r'\\?.*$', '') AS landing,
      a.sessions,
      COALESCE(NULLIF(a.state, ''), '—') AS state
    FROM agg a LEFT JOIN landing l USING (user_pseudo_id)
    ORDER BY a.sessions DESC
  """,
  "detail_tickets": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.detail_tickets` AS
    SELECT
      issue_id AS ticket,
      CONCAT('User ', CAST(user_id AS STRING)) AS user,
      IF(closed_at IS NULL, 'Open', 'Resolved') AS status,
      CAST(DATE(created_at) AS STRING) AS opened,
      IF(closed_at IS NULL, '—', CAST(DATE(closed_at) AS STRING)) AS resolved
    FROM `{P}.{DS}.tickets`
    ORDER BY created_at DESC
  """,
}

for name, ddl in views.items():
    client.query(ddl).result()
    rows = [dict(r) for r in client.query(f"SELECT * FROM `{P}.{DS}.{name}`").result()]
    print(f"\ncreated {name}  ({len(rows)} rows)")
    for r in rows[:2]:
        print("   sample:", r)
print("\nDone. Detail views built.")
