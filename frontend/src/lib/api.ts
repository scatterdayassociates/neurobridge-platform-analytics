export const API_BASE = "https://neurobridge-dashboard.onrender.com";

export type ProductOverview = {
  p1_verified_clinicians: { verified_clinicians: number }[];
  p4_content_assets_live: { content_assets_live: number }[];
  p6_issue_tickets: { open_tickets: number; total_tickets: number }[];
  p8_clinicians_by_type: { clinician_type: string; clinicians: number }[];
  p12_clinician_geography: { state: string; clinicians: number }[];
  p13_issue_resolution_weekly: {
    week: string; tickets_opened: number; median_resolution_hours: number | null;
  }[];
};

export async function fetchProductOverview(): Promise<ProductOverview> {
  const res = await fetch(`${API_BASE}/api/product-overview`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export type TrafficOverview = {
  t_daily: { day: string; users: number; sessions: number; pageviews: number }[];
  t_sources: { source: string; medium: string; users: number; sessions: number }[];
  t_geography: { state: string; users: number }[];
  t_devices: { device: string; users: number }[];
  t_landing_pages: { landing_page: string; sessions: number }[];
};

export async function fetchTrafficOverview(): Promise<TrafficOverview> {
  const res = await fetch(`${API_BASE}/api/traffic-overview`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export type DetailData = {
  clinicians: { email: string; type: string; state: string; city: string; status: string; verified_on: string }[];
  traffic: { user: string; source: string; landing: string; sessions: number; state: string }[];
  tickets: { email: string; ticket: string; status: string; opened: string; resolved: string }[];
};

export async function fetchDetail(): Promise<DetailData> {
  const res = await fetch(`${API_BASE}/api/detail`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
