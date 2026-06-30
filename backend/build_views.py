import os
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv()
P = os.environ["GCP_PROJECT"]
client = bigquery.Client(project=P)

views = {
    "vw_content_assets": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.vw_content_assets` AS
        SELECT
          id AS content_id,
          user_id AS clinician_id,
          date_published,
          CASE WHEN video_url IS NOT NULL AND video_url != '' THEN 'video'
               WHEN has_attachments THEN 'pdf'
               ELSE 'article' END AS content_type,
          CASE WHEN price > 0 THEN 'paid' ELSE 'free' END AS content_tier
        FROM `{P}.NB_analytics_dashboard.posts`
        WHERE date_published IS NOT NULL
    """,
    "vw_verified_clinicians": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.vw_verified_clinicians` AS
        SELECT
          c.*,
          CASE
            WHEN UPPER(TRIM(c.clinician_type)) IN ('CCC-SLP', 'SLP') THEN 'SLP'
            WHEN UPPER(TRIM(c.clinician_type)) IN ('BCBA', 'BCBA/LBA', 'LBA') THEN 'BCBA'
            WHEN UPPER(TRIM(c.clinician_type)) IN ('OTR', 'OTR/L') THEN 'OT'
            WHEN UPPER(TRIM(c.clinician_type)) IN ('DPT', 'PT') THEN 'PT'
            ELSE 'Other'
          END AS clinician_type_clean,
          CASE
            WHEN TRIM(c.state) IN ('BC', 'British Columbia') THEN 'BC'
            WHEN TRIM(c.state) IN ('QC', 'Quebec') THEN 'QC'
            WHEN TRIM(c.state) = '' THEN NULL
            ELSE TRIM(c.state)
          END AS state_clean,
          CASE
            WHEN TRIM(c.state) IN ('BC', 'British Columbia', 'QC', 'Quebec', 'ON', 'Ontario', 'AB', 'Alberta') THEN 'Canada'
            WHEN TRIM(c.state) = '' THEN 'Unknown'
            ELSE 'US'
          END AS country_region
        FROM `{P}.NB_analytics_dashboard.clinicians` c
        WHERE c.user_id IN (
          SELECT user_id FROM `{P}.NB_analytics_dashboard.license_review_issues`
          WHERE last_notified_state = 'accepted'
        )
    """,
    "metric_p1_verified_clinicians": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.metric_p1_verified_clinicians` AS
        SELECT COUNT(*) AS verified_clinicians
        FROM `{P}.NB_analytics_dashboard.vw_verified_clinicians`
    """,
    "metric_p8_clinicians_by_type": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.metric_p8_clinicians_by_type` AS
        SELECT clinician_type_clean AS clinician_type, COUNT(*) AS clinicians
        FROM `{P}.NB_analytics_dashboard.vw_verified_clinicians`
        GROUP BY clinician_type_clean
        ORDER BY clinicians DESC
    """,
    "metric_p12_clinician_geography": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.metric_p12_clinician_geography` AS
        SELECT state_clean AS state, COUNT(*) AS clinicians
        FROM `{P}.NB_analytics_dashboard.vw_verified_clinicians`
        WHERE country_region = 'US'
        GROUP BY state_clean
        ORDER BY clinicians DESC
    """,
    "metric_p4_content_assets_live": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.metric_p4_content_assets_live` AS
        SELECT COUNT(*) AS content_assets_live
        FROM `{P}.NB_analytics_dashboard.vw_content_assets`
    """,
    "metric_p6_issue_tickets": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.metric_p6_issue_tickets` AS
        SELECT
          COUNTIF(closed_at IS NULL) AS open_tickets,
          COUNT(*) AS total_tickets
        FROM `{P}.NB_analytics_dashboard.tickets`
    """,
    "metric_p13_issue_resolution_weekly": f"""
        CREATE OR REPLACE VIEW `{P}.NB_analytics_dashboard.metric_p13_issue_resolution_weekly` AS
        SELECT
          DATE_TRUNC(DATE(created_at), WEEK(MONDAY)) AS week,
          COUNT(*) AS tickets_opened,
          APPROX_QUANTILES(TIMESTAMP_DIFF(closed_at, created_at, HOUR), 2)[OFFSET(1)] AS median_resolution_hours
        FROM `{P}.NB_analytics_dashboard.tickets`
        WHERE created_at IS NOT NULL
        GROUP BY week
        ORDER BY week
    """,
}

for name, ddl in views.items():
    client.query(ddl).result()
    print("created", name)

print("\n========== REAL NUMBERS ==========")

def show(label, view):
    print(f"\n{label}")
    rows = list(client.query(f"SELECT * FROM `{P}.NB_analytics_dashboard.{view}`").result())
    if not rows:
        print("  (no rows)")
    for r in rows:
        print("  ", dict(r))

show("P1  Verified clinicians (accepted)", "metric_p1_verified_clinicians")
show("P8  Clinicians by type", "metric_p8_clinicians_by_type")
show("P12 Clinician geography (US)", "metric_p12_clinician_geography")
show("P4  Content assets live", "metric_p4_content_assets_live")
show("P6  Issue tickets", "metric_p6_issue_tickets")
show("P13 Issue resolution weekly", "metric_p13_issue_resolution_weekly")
