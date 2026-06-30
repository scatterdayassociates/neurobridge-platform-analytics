import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import PlotlyChart from "@/components/PlotlyChart";
import { fetchProductOverview, fetchTrafficOverview, fetchDetail, type ProductOverview, type TrafficOverview, type DetailData } from "@/lib/api";

function DateRangeFilter() {
  const [range, setRange] = React.useState<DateRange | undefined>();
  return (
    <Card className="p-4 shadow-none border-border/70">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 min-w-[240px]">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Date range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("h-9 justify-start text-left font-normal bg-background", !range && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? (
                  range.to ? `${format(range.from, "LLL d, y")} – ${format(range.to, "LLL d, y")}` : format(range.from, "LLL d, y")
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
}

function TrafficFilters() {
  const [range, setRange] = React.useState<DateRange | undefined>();
  const FilterSelect = ({ label, placeholder, options }: { label: string; placeholder: string; options: string[] }) => (
    <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</Label>
      <Select>
        <SelectTrigger className="h-9 bg-background"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <Card className="p-4 shadow-none border-border/70">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 min-w-[240px] flex-1">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Date range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("h-9 justify-start text-left font-normal bg-background", !range && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? (
                  range.to ? `${format(range.from, "LLL d, y")} – ${format(range.to, "LLL d, y")}` : format(range.from, "LLL d, y")
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
        <FilterSelect label="User role" placeholder="All roles" options={["Clinician", "Parent", "Admin"]} />
        <FilterSelect label="Clinician type" placeholder="All types" options={["SLP", "OT", "PT", "BCBA", "Psychologist"]} />
        <FilterSelect label="Source / medium" placeholder="All sources" options={["google / organic", "direct / none", "facebook / social", "newsletter / email", "referral"]} />
        <FilterSelect label="State" placeholder="All states" options={["California", "Texas", "New York", "Florida", "Illinois", "Washington"]} />
      </div>
    </Card>
  );
}

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Neurobridge Analytics" }] }),
});

// Bluescale palette derived from the logo
const C = {
  navy: "#0b2545",
  deep: "#13315c",
  blue: "#1d4e89",
  mid: "#3a7ca5",
  sky: "#81c3d7",
  pale: "#cfe2f3",
  grid: "#e6edf5",
  axis: "#7a8aa3",
  text: "#0f1f3a",
};

const baseAxis = {
  showline: true,
  linecolor: C.grid,
  linewidth: 1,
  tickfont: { color: C.axis, size: 11 },
  titlefont: { color: C.axis, size: 11 },
  gridcolor: C.grid,
  zeroline: false,
};

function KpiCard({ label, value, sub, badge, badgeTone }: {
  label: string; value: string; sub: string;
  badge?: string; badgeTone?: "now" | "partial" | "needs";
}) {
  const tones: Record<string, string> = {
    now: "bg-[oklch(0.92_0.05_235)] text-[var(--brand-blue)]",
    partial: "bg-[oklch(0.93_0.07_85)] text-[oklch(0.45_0.12_70)]",
    needs: "bg-[oklch(0.93_0.06_25)] text-[oklch(0.5_0.18_25)]",
  };
  return (
    <Card className="p-5 gap-3 flex flex-col justify-between min-h-[140px] shadow-none border-border/70">
      <div className="text-sm font-semibold text-foreground tracking-tight">{label}</div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{sub}</span>
        {badge && <Badge className={`uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded ${tones[badgeTone ?? "now"]}`}>{badge}</Badge>}
      </div>
    </Card>
  );
}

function Legend({ items }: { items: { label: string; color: string; shape?: "line" | "dot" | "square" }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 pt-3 border-t border-border/60">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2 text-xs text-muted-foreground">
          {it.shape === "line" ? (
            <span className="w-4 h-[2px] rounded" style={{ background: it.color }} />
          ) : it.shape === "dot" ? (
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
          ) : (
            <span className="w-3 h-3 rounded-sm" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

type UserRow = Record<string, string | number>;

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportRows(headers: string[], rows: UserRow[], format: "csv" | "xls") {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  if (format === "csv") {
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    downloadFile(`user-detail-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  } else {
    const html = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${headers.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
    downloadFile(`user-detail-${Date.now()}.xls`, html, "application/vnd.ms-excel");
  }
}

function UserDrilldown({ headers, rows }: { headers: string[]; rows: UserRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border/60">
      <div className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/40 transition-colors">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex-1 flex items-center text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>User-level detail · {rows.length} records</span>
          </button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
              >
                Download
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              <button
                type="button"
                onClick={() => { exportRows(headers, rows, "csv"); setMenuOpen(false); }}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted"
              >
                Download .csv
              </button>
              <button
                type="button"
                onClick={() => { exportRows(headers, rows, "xls"); setMenuOpen(false); }}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted"
              >
                Download .xlsx
              </button>
            </PopoverContent>
          </Popover>
          <CollapsibleTrigger asChild>
            <button type="button" className="p-1 text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <div className="max-h-72 overflow-auto border-t border-border/60">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                {headers.map((h) => (
                  <TableHead key={h} className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length} className="text-xs py-3 text-center text-muted-foreground">
                    Fills in as data accrues
                  </TableCell>
                </TableRow>
              ) : rows.map((r, i) => (
                <TableRow key={i}>
                  {headers.map((h) => (
                    <TableCell key={h} className="text-xs py-2">{r[h]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Panel({ title, subtitle, children, height = 280, legend, drilldown, pending }: {
  title: string; subtitle?: string; children: React.ReactNode; height?: number;
  legend?: { label: string; color: string; shape?: "line" | "dot" | "square" }[];
  drilldown?: { headers: string[]; rows: UserRow[] };
  pending?: boolean;
}) {
  return (
    <Card className="shadow-none border-border/70 overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground tracking-tight">{title}</h3>
          {pending && (
            <Badge className="shrink-0 uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded bg-[oklch(0.93_0.06_25)] text-[oklch(0.5_0.18_25)]">
              Sample data
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        {pending && <p className="text-xs text-[oklch(0.5_0.18_25)] mt-0.5">Illustrative layout, awaiting in-app events</p>}
      </div>
      <div style={{ height }} className={cn("px-2", pending && "opacity-50")}>{children}</div>
      {legend && <Legend items={legend} />}
      {drilldown && <UserDrilldown headers={drilldown.headers} rows={drilldown.rows} />}
    </Card>
  );
}

// ---------- Data ----------
const weeks = Array.from({ length: 10 }, (_, i) => `W${i + 1}`);

const trafficSources = [
  { name: "google / organic", v: 4820 },
  { name: "direct / none", v: 3110 },
  { name: "newsletter", v: 1850 },
  { name: "referral", v: 1240 },
  { name: "paid / cpc", v: 720 },
  { name: "social", v: 410 },
];

const onboarding = [
  { name: "Sign-up", v: 1240 },
  { name: "Verified", v: 595 },
  { name: "First action", v: 347 },
];

const ariadneFunnel = [
  { name: "Query submitted", v: 2840 },
  { name: "Recommendation clicked", v: 1562 },
  { name: "Content / profile view", v: 624 },
];

const clinicianTypes = [
  { name: "SLP", v: 92 }, { name: "BCBA", v: 70 },
  { name: "OT", v: 55 }, { name: "PT", v: 42 },
  { name: "Psych", v: 28 },
];

const wacWap = weeks.map((w, i) => ({
  w,
  wac: 30 + i * 8 + (i % 2) * 6,
  wap: 18 + i * 5,
}));

const sessionEng = weeks.map((w, i) => ({
  w,
  dur: 90 + i * 14 + (i % 2) * 10,
  pps: 2.1 + i * 0.18,
}));

const issues = weeks.slice(0, 8).map((w, i) => ({
  w,
  issues: 28 + (i % 3) * 8 + i * 2,
  hrs: 22 - i * 1.1 + (i % 2) * 2,
}));

// US choropleth data (per state)
const stateCodes = ["CA","TX","NY","FL","IL","PA","WA","MA","CO","GA","NC","OH","MI","AZ","NJ","VA","MN","OR","TN","WI"];
const stateValues = [248,182,201,164,98,112,86,134,77,92,81,74,69,65,82,71,58,61,54,49];

// Cohort retention heatmap (rows = signup week, cols = weeks since signup)
const cohortRows = ["W0","W1","W2","W3","W4","W5","W6","W7"];
const cohortCols = ["0","1","2","3","4","5","6","7"];
const cohortZ = cohortRows.map((_, r) =>
  cohortCols.map((_, c) => {
    if (c < r) return null;
    const v = Math.max(8, 100 - (c - r) * 13 - r * 4);
    return Math.round(v);
  }),
);

const landing = [
  { p: "/", s: 4820, e: 64 },
  { p: "/clinicians", s: 2140, e: 72 },
  { p: "/ariadne", s: 1810, e: 81 },
  { p: "/content/:id", s: 1490, e: 58 },
  { p: "/signup", s: 980, e: 49 },
  { p: "/about", s: 612, e: 41 },
  { p: "/clinician/:id", s: 488, e: 67 },
];

// ---------- User-level drilldown data ----------
const onboardingUsers: UserRow[] = [
  { User: "dr.patel@…", Role: "Clinician (SLP)", Step: "First action", Status: "Active", "Signed up": "May 12" },
  { User: "m.johnson@…", Role: "Parent", Step: "Verified", Status: "Verified", "Signed up": "May 13" },
  { User: "k.lee@…", Role: "Clinician (BCBA)", Step: "Verified", Status: "Verified", "Signed up": "May 14" },
  { User: "r.gomez@…", Role: "Parent", Step: "Sign-up", Status: "New", "Signed up": "May 15" },
  { User: "s.nguyen@…", Role: "Clinician (OT)", Step: "First action", Status: "Active", "Signed up": "May 15" },
  { User: "a.brown@…", Role: "Clinician (PT)", Step: "Verified", Status: "Verified", "Signed up": "May 16" },
  { User: "j.kim@…", Role: "Parent", Step: "Verified", Status: "Verified", "Signed up": "May 17" },
];

const clinicianTypeUsers: UserRow[] = [
  { Clinician: "Dr. A. Patel", Type: "SLP", Status: "Verified", State: "CA", "Verified on": "Apr 02" },
  { Clinician: "Dr. M. Reyes", Type: "BCBA", Status: "Verified", State: "TX", "Verified on": "Apr 11" },
  { Clinician: "Dr. S. Nguyen", Type: "OT", Status: "Verified", State: "NY", "Verified on": "Apr 19" },
  { Clinician: "Dr. K. Brown", Type: "PT", Status: "Verified", State: "FL", "Verified on": "May 02" },
  { Clinician: "Dr. L. Singh", Type: "Psych", Status: "Verified", State: "WA", "Verified on": "May 08" },
  { Clinician: "Dr. R. Chen", Type: "SLP", Status: "Verified", State: "IL", "Verified on": "May 10" },
];

const wacWapUsers: UserRow[] = [
  { User: "dr.patel@…", Role: "Clinician", Week: "W10", Sessions: 6, "Last seen": "1h ago" },
  { User: "m.johnson@…", Role: "Parent", Week: "W10", Sessions: 3, "Last seen": "4h ago" },
  { User: "k.lee@…", Role: "Clinician", Week: "W10", Sessions: 5, "Last seen": "Today" },
  { User: "r.gomez@…", Role: "Parent", Week: "W9", Sessions: 2, "Last seen": "2d ago" },
  { User: "s.nguyen@…", Role: "Clinician", Week: "W10", Sessions: 4, "Last seen": "Today" },
  { User: "a.brown@…", Role: "Clinician", Week: "W9", Sessions: 7, "Last seen": "1d ago" },
];

const ariadneUsers: UserRow[] = [
  { User: "dr.patel@…", Query: "ABA therapist near 94110", Stage: "Profile view", Status: "Converted", When: "Today 10:42" },
  { User: "m.johnson@…", Query: "Speech delay 4yo", Stage: "Rec clicked", Status: "Engaged", When: "Today 09:11" },
  { User: "anon-2841", Query: "Sensory tools", Stage: "Query submitted", Status: "Dropped", When: "Yesterday" },
  { User: "k.lee@…", Query: "Autism screening Bay Area", Stage: "Profile view", Status: "Converted", When: "Yesterday" },
  { User: "r.gomez@…", Query: "OT for handwriting", Stage: "Rec clicked", Status: "Engaged", When: "2d ago" },
];

const geoUsers: UserRow[] = [
  { Clinician: "Dr. A. Patel", State: "CA", City: "San Francisco", Type: "SLP", Status: "Verified" },
  { Clinician: "Dr. M. Reyes", State: "TX", City: "Austin", Type: "BCBA", Status: "Verified" },
  { Clinician: "Dr. S. Nguyen", State: "NY", City: "Brooklyn", Type: "OT", Status: "Verified" },
  { Clinician: "Dr. K. Brown", State: "FL", City: "Miami", Type: "PT", Status: "Verified" },
  { Clinician: "Dr. L. Singh", State: "WA", City: "Seattle", Type: "Psych", Status: "Verified" },
  { Clinician: "Dr. R. Chen", State: "IL", City: "Chicago", Type: "SLP", Status: "Verified" },
  { Clinician: "Dr. T. Morales", State: "CA", City: "Los Angeles", Type: "BCBA", Status: "Verified" },
];

const issueUsers: UserRow[] = [
  { Ticket: "#4821", User: "dr.patel@…", Role: "Clinician", Issue: "Profile photo upload", Status: "Open", "Opened": "Today" },
  { Ticket: "#4818", User: "m.johnson@…", Role: "Parent", Issue: "Cannot book call", Status: "In progress", "Opened": "Today" },
  { Ticket: "#4810", User: "k.lee@…", Role: "Clinician", Issue: "Credential verification", Status: "Open", "Opened": "Yesterday" },
  { Ticket: "#4802", User: "r.gomez@…", Role: "Parent", Issue: "Search returns no results", Status: "Resolved", "Opened": "2d ago" },
  { Ticket: "#4795", User: "s.nguyen@…", Role: "Clinician", Issue: "Calendar sync", Status: "Open", "Opened": "3d ago" },
];

const trafficSourceUsers: UserRow[] = [
  { User: "anon-9821", Source: "google / organic", Landing: "/", Sessions: 3, State: "CA" },
  { User: "dr.patel@…", Source: "direct / none", Landing: "/clinicians", Sessions: 5, State: "CA" },
  { User: "m.johnson@…", Source: "newsletter", Landing: "/ariadne", Sessions: 2, State: "TX" },
  { User: "anon-4412", Source: "referral", Landing: "/content/:id", Sessions: 1, State: "NY" },
  { User: "k.lee@…", Source: "paid / cpc", Landing: "/signup", Sessions: 4, State: "IL" },
  { User: "anon-7102", Source: "social", Landing: "/", Sessions: 1, State: "FL" },
];

const cohortUsers: UserRow[] = [
  { User: "dr.patel@…", "Signup cohort": "W0", "Weeks active": 7, Status: "Retained", "Last seen": "Today" },
  { User: "m.johnson@…", "Signup cohort": "W1", "Weeks active": 5, Status: "Retained", "Last seen": "Yesterday" },
  { User: "k.lee@…", "Signup cohort": "W2", "Weeks active": 4, Status: "Retained", "Last seen": "Today" },
  { User: "r.gomez@…", "Signup cohort": "W3", "Weeks active": 1, Status: "Churned", "Last seen": "3w ago" },
  { User: "s.nguyen@…", "Signup cohort": "W4", "Weeks active": 3, Status: "Retained", "Last seen": "2d ago" },
  { User: "a.brown@…", "Signup cohort": "W5", "Weeks active": 2, Status: "At risk", "Last seen": "9d ago" },
];

const sessionUsers: UserRow[] = [
  { User: "dr.patel@…", Role: "Clinician", Duration: "4m 12s", Pages: 6, "Last visit": "Today" },
  { User: "m.johnson@…", Role: "Parent", Duration: "2m 41s", Pages: 4, "Last visit": "Today" },
  { User: "anon-9821", Role: "Anonymous", Duration: "0m 48s", Pages: 1, "Last visit": "Today" },
  { User: "k.lee@…", Role: "Clinician", Duration: "5m 03s", Pages: 8, "Last visit": "Yesterday" },
  { User: "r.gomez@…", Role: "Parent", Duration: "1m 22s", Pages: 2, "Last visit": "Yesterday" },
];

const landingUsers: UserRow[] = [
  { User: "anon-9821", "Landing page": "/", Source: "google / organic", Engaged: "Yes", State: "CA" },
  { User: "dr.patel@…", "Landing page": "/clinicians", Source: "direct / none", Engaged: "Yes", State: "CA" },
  { User: "m.johnson@…", "Landing page": "/ariadne", Source: "newsletter", Engaged: "Yes", State: "TX" },
  { User: "anon-4412", "Landing page": "/content/:id", Source: "referral", Engaged: "No", State: "NY" },
  { User: "k.lee@…", "Landing page": "/signup", Source: "paid / cpc", Engaged: "No", State: "IL" },
  { User: "anon-7102", "Landing page": "/about", Source: "social", Engaged: "No", State: "FL" },
];

function TrafficSources({ data = trafficSources }: { data?: { name: string; v: number }[] }) {
  const sorted = [...data].sort((a, b) => a.v - b.v);
  return (
    <PlotlyChart
      data={[{
        type: "bar",
        orientation: "h",
        x: sorted.map(d => d.v),
        y: sorted.map(d => d.name),
        marker: { color: sorted.map((_, i) => [C.pale, C.sky, C.mid, C.blue, C.deep, C.navy][i]) },
        hovertemplate: "<b>%{y}</b><br>Sessions: %{x:,}<extra></extra>",
      }]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Sessions" } },
        yaxis: { ...baseAxis, automargin: true },
        margin: { l: 130, r: 24, t: 8, b: 44 },
        bargap: 0.35,
      }}
    />
  );
}

function CohortHeatmap() {
  return (
    <PlotlyChart
      data={[{
        type: "heatmap",
        z: cohortZ,
        x: cohortCols,
        y: cohortRows,
        colorscale: [
          [0, C.pale], [0.25, C.sky], [0.5, C.mid],
          [0.75, C.blue], [1, C.navy],
        ],
        hoverongaps: false,
        hovertemplate: "Signup %{y} · week %{x}<br>Retention: %{z}%<extra></extra>",
        colorbar: {
          title: { text: "% retained", font: { size: 11, color: C.axis } },
          thickness: 10, len: 0.85, outlinewidth: 0,
          tickfont: { color: C.axis, size: 10 },
        },
      }]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Weeks since signup" }, type: "category" },
        yaxis: { ...baseAxis, title: { text: "Signup cohort" }, type: "category", autorange: "reversed" },
        margin: { l: 70, r: 60, t: 8, b: 44 },
      }}
    />
  );
}

function WacWap() {
  return (
    <PlotlyChart
      data={[
        {
          type: "scatter", mode: "lines+markers", name: "WAC",
          x: wacWap.map(d => d.w), y: wacWap.map(d => d.wac),
          line: { color: C.blue, width: 3 }, marker: { size: 6, color: C.blue },
          hovertemplate: "%{x} · WAC: <b>%{y}</b><extra></extra>",
        },
        {
          type: "scatter", mode: "lines+markers", name: "WAP",
          x: wacWap.map(d => d.w), y: wacWap.map(d => d.wap),
          line: { color: C.sky, width: 3, dash: "dot" }, marker: { size: 6, color: C.sky },
          hovertemplate: "%{x} · WAP: <b>%{y}</b><extra></extra>",
        },
      ]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Week" } },
        yaxis: { ...baseAxis, title: { text: "Active users" }, rangemode: "tozero" },
        hovermode: "x unified",
      }}
    />
  );
}

function ClinicianTypes({ data = clinicianTypes }: { data?: { name: string; v: number }[] }) {
  return (
    <PlotlyChart
      data={[{
        type: "bar",
        x: data.map(d => d.name),
        y: data.map(d => d.v),
        marker: { color: [C.navy, C.deep, C.blue, C.mid, C.sky] },
        hovertemplate: "<b>%{x}</b><br>Verified: %{y}<extra></extra>",
      }]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Clinician type" } },
        yaxis: { ...baseAxis, title: { text: "Verified clinicians" }, rangemode: "tozero" },
        bargap: 0.35,
      }}
    />
  );
}

function FunnelChart({ data }: { data: { name: string; v: number }[] }) {
  return (
    <PlotlyChart
      data={[{
        type: "funnel",
        y: data.map(d => d.name),
        x: data.map(d => d.v),
        textposition: "inside",
        textinfo: "value+percent initial",
        marker: { color: [C.navy, C.blue, C.mid, C.sky] },
        connector: { line: { color: C.grid, width: 1 } },
        hovertemplate: "<b>%{y}</b><br>Count: %{x:,}<br>%{percentInitial} of start<extra></extra>",
      }]}
      layout={{ margin: { l: 170, r: 24, t: 8, b: 24 }, yaxis: { ...baseAxis, automargin: true } }}
    />
  );
}

function IssueChart() {
  return (
    <PlotlyChart
      data={[
        {
          type: "bar", name: "Tickets opened",
          x: issues.map(d => d.w), y: issues.map(d => d.issues),
          marker: { color: C.sky },
          hovertemplate: "%{x} · tickets: <b>%{y}</b><extra></extra>",
        },
        {
          type: "scatter", mode: "lines+markers", name: "Median resolution (hrs)",
          x: issues.map(d => d.w), y: issues.map(d => d.hrs),
          yaxis: "y2",
          line: { color: C.navy, width: 3 }, marker: { size: 6, color: C.navy },
          hovertemplate: "%{x} · median: <b>%{y:.1f}h</b><extra></extra>",
        },
      ]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Week" } },
        yaxis: { ...baseAxis, title: { text: "Tickets" }, rangemode: "tozero" },
        yaxis2: { ...baseAxis, title: { text: "Hours" }, overlaying: "y", side: "right", rangemode: "tozero" },
        hovermode: "x unified",
        margin: { l: 56, r: 56, t: 8, b: 44 },
      }}
    />
  );
}

function SessionEngagement() {
  return (
    <PlotlyChart
      data={[
        {
          type: "scatter", mode: "lines+markers", name: "Avg session duration (s)",
          x: sessionEng.map(d => d.w), y: sessionEng.map(d => d.dur),
          line: { color: C.navy, width: 3 }, marker: { size: 6, color: C.navy },
          hovertemplate: "%{x} · duration: <b>%{y}s</b><extra></extra>",
        },
        {
          type: "scatter", mode: "lines+markers", name: "Pages / session",
          x: sessionEng.map(d => d.w), y: sessionEng.map(d => d.pps),
          yaxis: "y2",
          line: { color: C.sky, width: 3, dash: "dot" }, marker: { size: 6, color: C.sky },
          hovertemplate: "%{x} · pages: <b>%{y:.2f}</b><extra></extra>",
        },
      ]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Week" } },
        yaxis: { ...baseAxis, title: { text: "Seconds" }, rangemode: "tozero" },
        yaxis2: { ...baseAxis, title: { text: "Pages" }, overlaying: "y", side: "right", rangemode: "tozero" },
        hovermode: "x unified",
        margin: { l: 56, r: 56, t: 8, b: 44 },
      }}
    />
  );
}

function GeoChoropleth({ locations = stateCodes, values = stateValues }: { locations?: string[]; values?: number[] }) {
  return (
    <PlotlyChart
      data={[{
        type: "choropleth",
        locationmode: "USA-states",
        locations: locations,
        z: values,
        colorscale: [
          [0, C.pale], [0.25, C.sky], [0.5, C.mid],
          [0.75, C.blue], [1, C.navy],
        ],
        marker: { line: { color: "#fff", width: 0.6 } },
        hovertemplate: "<b>%{location}</b><br>Clinicians: %{z}<extra></extra>",
        colorbar: {
          title: { text: "Clinicians", font: { size: 11, color: C.axis } },
          thickness: 10, len: 0.85, outlinewidth: 0,
          tickfont: { color: C.axis, size: 10 },
        },
      }]}
      layout={{
        geo: {
          scope: "usa",
          showlakes: false,
          bgcolor: "rgba(0,0,0,0)",
          showframe: false,
          showcoastlines: false,
          landcolor: "#f4f7fb",
        },
        margin: { l: 0, r: 60, t: 8, b: 8 },
      }}
    />
  );
}

function LandingPagesBar({ data = landing }: { data?: { p: string; s: number; e: number }[] }) {
  const sorted = [...data].sort((a, b) => a.s - b.s);
  return (
    <PlotlyChart
      data={[{
        type: "bar",
        orientation: "h",
        x: sorted.map(d => d.s),
        y: sorted.map(d => d.p),
        marker: { color: C.blue },
        hovertemplate: "<b>%{y}</b><br>Sessions: %{x:,}<extra></extra>",
      }]}
      layout={{
        xaxis: { ...baseAxis, title: { text: "Sessions" } },
        yaxis: { ...baseAxis, automargin: true },
        margin: { l: 130, r: 24, t: 8, b: 44 },
        bargap: 0.3,
      }}
    />
  );
}

// ---------- Layout ----------

function shortPath(u: string) {
  try { return new URL(u).pathname || "/"; } catch { return u; }
}

function Dashboard() {
  const [po, setPo] = React.useState<ProductOverview | null>(null);
  React.useEffect(() => {
    let active = true;
    fetchProductOverview()
      .then((d) => { if (active) setPo(d); })
      .catch((e) => console.error("product-overview fetch failed", e));
    return () => { active = false; };
  }, []);
  const verifiedClinicians = po?.p1_verified_clinicians?.[0]?.verified_clinicians;
  const contentAssetsLive = po?.p4_content_assets_live?.[0]?.content_assets_live;
  const openTickets = po?.p6_issue_tickets?.[0]?.open_tickets;
  const clinicianTypeData = po?.p8_clinicians_by_type?.map((d) => ({ name: d.clinician_type, v: d.clinicians }));
  const geoLocations = po?.p12_clinician_geography?.map((d) => d.state);
  const geoValues = po?.p12_clinician_geography?.map((d) => d.clinicians);
  const [traffic, setTraffic] = React.useState<TrafficOverview | null>(null);
  React.useEffect(() => {
    let active = true;
    fetchTrafficOverview()
      .then((d) => { if (active) setTraffic(d); })
      .catch((e) => console.error("traffic fetch failed", e));
    return () => { active = false; };
  }, []);
  const trafficSourceData = traffic?.t_sources?.slice(0, 6).map((d) => ({ name: d.source === "(direct)" ? "direct" : d.source, v: d.sessions }));
  const landingData = traffic?.t_landing_pages?.slice(0, 8).map((d) => ({ p: shortPath(d.landing_page), s: d.sessions, e: 60 }));
  const totalPv = traffic?.t_daily?.reduce((acc, d) => acc + d.pageviews, 0);
  const totalSess = traffic?.t_daily?.reduce((acc, d) => acc + d.sessions, 0);
  const pagesPerSession = totalSess ? (totalPv! / totalSess).toFixed(1) : undefined;
  const topSource = traffic?.t_sources?.[0]?.source;
  const [detail, setDetail] = React.useState<DetailData | null>(null);
  React.useEffect(() => {
    let active = true;
    fetchDetail()
      .then((d) => { if (active) setDetail(d); })
      .catch((e) => console.error("detail fetch failed", e));
    return () => { active = false; };
  }, []);
  const clinicianDetailByType = detail?.clinicians?.map((r) => ({ Clinician: r.clinician, Type: r.type, Status: r.status, State: r.state, "Verified on": r.verified_on })) ?? [];
  const clinicianDetailGeo = detail?.clinicians?.map((r) => ({ Clinician: r.clinician, State: r.state, City: r.city, Type: r.type, Status: r.status })) ?? [];
  const trafficDetailSource = detail?.traffic?.map((r) => ({ User: r.user, Source: r.source, Landing: r.landing, Sessions: r.sessions, State: r.state })) ?? [];
  const trafficDetailLanding = detail?.traffic?.map((r) => ({ User: r.user, "Landing page": r.landing, Source: r.source, Engaged: "—", State: r.state })) ?? [];
  const ticketDetail = detail?.tickets?.map((r) => ({ Ticket: r.ticket, User: r.user, Status: r.status, Opened: r.opened, Resolved: r.resolved })) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--brand-navy)] tracking-tight">neuro</span>
            <span className="w-3 h-3 rounded-full bg-[var(--brand-sky)] inline-block" />
            <span className="text-2xl font-bold text-[var(--brand-navy)] tracking-tight">bridge</span>
            <span className="ml-3 text-sm text-muted-foreground">analytics</span>
          </div>
          <div className="text-sm text-muted-foreground">Last 28 days</div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <Tabs defaultValue="product" className="space-y-6">
          <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-border w-full justify-start rounded-none">
            <TabsTrigger value="product" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand-blue)] data-[state=active]:text-[var(--brand-blue)] rounded-none px-0 pb-3 text-base font-bold tracking-wide uppercase text-muted-foreground">
              Product Overview
            </TabsTrigger>
            <TabsTrigger value="traffic" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--brand-blue)] data-[state=active]:text-[var(--brand-blue)] rounded-none px-0 pb-3 text-base font-bold tracking-wide uppercase text-muted-foreground">
              Traffic Overview (GA4)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-6 mt-0">
            <div>
              <p className="text-xs font-bold text-[var(--brand-blue)] tracking-[0.2em] mb-2">PRODUCT OVERVIEW · TRACKED METRICS</p>
              <p className="text-muted-foreground mt-2 text-sm">Hover any chart for exact values.</p>
            </div>

            <DateRangeFilter />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard label="Verified Clinicians" value={verifiedClinicians != null ? String(verifiedClinicians) : "—"} sub="accepted reviews" badge="Live" badgeTone="now" />
              <KpiCard label="Weekly Avg Clinician" value="—" sub="WAC" badge="Pending" badgeTone="needs" />
              <KpiCard label="Weekly Avg Parents" value="—" sub="WAP" badge="Pending" badgeTone="needs" />
              <KpiCard label="Content Assets Live" value={contentAssetsLive != null ? String(contentAssetsLive) : "—"} sub="published posts" badge="Live" badgeTone="now" />
              <KpiCard label="Ariadne → CC CTR" value="—" sub="recs clicked" badge="Pending" badgeTone="needs" />
              <KpiCard label="Issue Tickets" value={openTickets != null ? String(openTickets) : "—"} sub="open" badge="Live" badgeTone="now" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Panel title="Onboarding funnel" subtitle="Sign-up → first action" drilldown={{ headers: ["User", "Role", "Step", "Status", "Signed up"], rows: [] }} pending>
                <FunnelChart data={onboarding} />
              </Panel>
              <Panel title="Verified clinicians by type" subtitle="Current totals" drilldown={{ headers: ["Clinician", "Type", "Status", "State", "Verified on"], rows: clinicianDetailByType }}>
                <ClinicianTypes data={clinicianTypeData} />
              </Panel>
              <Panel
                title="WAC / WAP — weekly trend"
                subtitle="Active users per week"
                legend={[
                  { label: "WAC (clinicians)", color: C.blue, shape: "line" },
                  { label: "WAP (parents)", color: C.sky, shape: "line" },
                ]}
                drilldown={{ headers: ["User", "Role", "Week", "Sessions", "Last seen"], rows: [] }}
                pending
              >
                <WacWap />
              </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Panel title="Ariadne → CC CTR funnel" subtitle="Query → click → view" drilldown={{ headers: ["User", "Query", "Stage", "Status", "When"], rows: [] }} pending>
                <FunnelChart data={ariadneFunnel} />
              </Panel>
              <Panel title="Clinician geography" subtitle="Verified clinicians by US state" height={300} drilldown={{ headers: ["Clinician", "State", "City", "Type", "Status"], rows: clinicianDetailGeo }}>
                <GeoChoropleth locations={geoLocations} values={geoValues} />
              </Panel>
              <Panel
                title="Issue resolution — weekly"
                subtitle="Tickets opened vs median time-to-resolve"
                legend={[
                  { label: "Tickets opened", color: C.sky, shape: "square" },
                  { label: "Median resolution (hrs)", color: C.navy, shape: "line" },
                ]}
                drilldown={{ headers: ["Ticket", "User", "Status", "Opened", "Resolved"], rows: ticketDetail }}
                pending
              >
                <IssueChart />
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6 mt-0">
            <div>
              <p className="text-xs font-bold text-[var(--brand-blue)] tracking-[0.2em] mb-2">TRAFFIC OVERVIEW (GA4)</p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">GA4 export is live, limited history</p>
              <p className="text-xs text-muted-foreground mt-0.5">Source, landing pages, and pages per session read live from GA4. Engagement and retention metrics fill in as more days of data accumulate. Panels marked Sample await additional GA4 signals.</p>
            </div>

            <TrafficFilters />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard label="Users" value="—" sub="distinct users" badge="Pending" badgeTone="needs" />
              <KpiCard label="Avg session duration" value="—" sub="needs engagement events" badge="Pending" badgeTone="needs" />
              <KpiCard label="Pages / session" value={pagesPerSession ?? "—"} sub="page_view ÷ sessions" badge="Live" badgeTone="now" />
              <KpiCard label="Returning user rate" value="—" sub="needs returning flag" badge="Pending" badgeTone="needs" />
              <KpiCard label="Top source" value={topSource ?? "—"} sub="by sessions" badge="Live" badgeTone="now" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title="Traffic by source / referrer" subtitle="Sessions, last 28 days" drilldown={{ headers: ["User", "Source", "Landing", "Sessions", "State"], rows: trafficDetailSource }}>
                <TrafficSources data={trafficSourceData} />
              </Panel>
              <Panel title="User retention cohort" subtitle="% of cohort returning each week" height={300} pending drilldown={{ headers: ["User", "Signup cohort", "Weeks active", "Status", "Last seen"], rows: [] }}>
                <CohortHeatmap />
              </Panel>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel
                title="Session engagement — weekly"
                subtitle="Duration and depth"
                legend={[
                  { label: "Avg session duration (s)", color: C.navy, shape: "line" },
                  { label: "Pages / session", color: C.sky, shape: "line" },
                ]}
                drilldown={{ headers: ["User", "Role", "Duration", "Pages", "Last visit"], rows: [] }}
                pending
              >
                <SessionEngagement />
              </Panel>
              <Panel title="Traffic by geography" subtitle="Sessions by US state" height={300} pending drilldown={{ headers: ["Clinician", "State", "City", "Type", "Status"], rows: [] }}>
                <GeoChoropleth />
              </Panel>
            </div>

            <Panel title="Landing pages — top by sessions" subtitle="By sessions, last 28 days" height={320} drilldown={{ headers: ["User", "Landing page", "Source", "Engaged", "State"], rows: trafficDetailLanding }}>
              <LandingPagesBar data={landingData} />
            </Panel>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
