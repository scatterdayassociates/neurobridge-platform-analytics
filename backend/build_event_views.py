import os
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()
P = os.environ["GCP_PROJECT"]
DS = os.environ.get("BQ_RAW_DATASET", "NB_analytics_dashboard")
client = bigquery.Client(project=P)
AE = f"`{P}.{DS}.analytics_events`"
POSTS = f"`{P}.{DS}.posts`"

views = {
  "metric_onboarding_funnel": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_onboarding_funnel` AS
    SELECT stage, label, users FROM (
      SELECT 1 AS stage, 'Sign-up' AS label, COUNT(DISTINCT user_id) AS users
        FROM {AE} WHERE event_name='signup_completed'
      UNION ALL SELECT 2,'Verified',COUNT(DISTINCT user_id)
        FROM {AE} WHERE event_name='credentials_verified'
      UNION ALL SELECT 3,'First action',COUNT(DISTINCT user_id)
        FROM {AE} WHERE event_name='first_action_completed'
      UNION ALL SELECT 4,'Profile completed',COUNT(DISTINCT user_id)
        FROM {AE} WHERE event_name='profile_completed'
    ) ORDER BY stage
  """,
  "metric_ariadne_ctr": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_ariadne_ctr` AS
    WITH submitted AS (
      SELECT COUNT(DISTINCT query_id) AS queries FROM {AE}
      WHERE event_name='ariadne_query_submitted' AND query_id IS NOT NULL
    ),
    clicked AS (
      SELECT COUNT(DISTINCT query_id) AS clicked_queries FROM {AE}
      WHERE event_name='ariadne_recommendation_clicked' AND query_id IS NOT NULL
    )
    SELECT s.queries, c.clicked_queries,
           ROUND(SAFE_DIVIDE(c.clicked_queries, s.queries)*100, 1) AS ctr_percent
    FROM submitted s CROSS JOIN clicked c
  """,
  "metric_ariadne_ctr_funnel": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_ariadne_ctr_funnel` AS
    SELECT stage, label, n FROM (
      SELECT 1 AS stage, 'Query submitted' AS label, COUNT(DISTINCT query_id) AS n
        FROM {AE} WHERE event_name='ariadne_query_submitted' AND query_id IS NOT NULL
      UNION ALL SELECT 2,'Recommendation clicked',COUNT(DISTINCT query_id)
        FROM {AE} WHERE event_name='ariadne_recommendation_clicked' AND query_id IS NOT NULL
    ) ORDER BY stage
  """,
  "metric_wac": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_wac` AS
    WITH activity AS (
      SELECT DATE_TRUNC(DATE(occurred_at), WEEK(MONDAY)) AS wk, CAST(user_id AS STRING) AS user_id
        FROM {AE}
        WHERE user_role='clinician' AND user_id IS NOT NULL
          AND event_name IN ('ariadne_query_submitted','content_viewed','module_viewed','content_published')
      UNION DISTINCT
      SELECT DATE_TRUNC(DATE(date_published), WEEK(MONDAY)) AS wk, CAST(user_id AS STRING) AS user_id
        FROM {POSTS} WHERE date_published IS NOT NULL AND user_id IS NOT NULL
    ),
    weekly AS (SELECT wk, COUNT(DISTINCT user_id) AS active FROM activity GROUP BY wk)
    SELECT ROUND(AVG(active)) AS wac FROM weekly
  """,
  "metric_wap": f"""
    CREATE OR REPLACE VIEW `{P}.{DS}.metric_wap` AS
    WITH weekly AS (
      SELECT DATE_TRUNC(DATE(occurred_at), WEEK(MONDAY)) AS wk, COUNT(DISTINCT user_id) AS active
        FROM {AE}
        WHERE user_role='caregiver' AND user_id IS NOT NULL
          AND event_name IN ('ariadne_query_submitted','ariadne_recommendation_clicked','content_viewed')
        GROUP BY wk
    )
    SELECT ROUND(AVG(active)) AS wap FROM weekly
  """,
}

for name, ddl in views.items():
    client.query(ddl).result()
    print("created", name)
print("\nDone. Event views built. Validate numbers against real data.")
