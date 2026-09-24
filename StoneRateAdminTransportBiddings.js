import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ===========================================================================
 * StoneRate — Admin · Transport Biddings
 * Same design language as AdminRateRequests (white canvas + signal orange).
 * Self-contained: all styles are scoped under .tb-root in the STYLES constant.
 *
 * Data flow
 * ---------
 * The default export is a presentational page driven entirely by props
 * (biddings / loading / error / callbacks). It never fabricates records,
 * application counts or lowest bids.
 *
 * The named export `useAdminTransportBiddings(fetchFn)` is the separated
 * data-loading layer. Pass it the Admin API function
 * (e.g. getAdminTransportBiddings from ../api/adminApi) once it exists.
 * ========================================================================= */

/* ------------------------------------------------------------- Constants -- */

const NEW_WINDOW_MS = 2 * 60 * 60 * 1000; // published within the last 2h → NEW
const URGENT_WINDOW_MS = 60 * 60 * 1000; // live with ≤ 60 min left → URGENT
const CRITICAL_WINDOW_MS = 15 * 60 * 1000; // ≤ 15 min → pulsing red timer
const INDIA_TZ = "Asia/Kolkata";

const LIVE_STATUSES = new Set(["open", "live", "active", "published", "running", "ongoing"]);
const CLOSED_STATUSES = new Set([
  "closed", "ended", "completed", "complete", "expired", "finished", "cancelled", "canceled"
]);
const AWARDED_STATUSES = new Set(["awarded", "assigned", "allotted", "allocated"]);

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "endingSoon", label: "Ending soon" },
  { value: "completed", label: "Completed" },
  { value: "awarded", label: "Awarded" },
  { value: "noBids", label: "No bids" }
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "urgent", label: "Urgent first" },
  { value: "applications", label: "Most applications" },
  { value: "lowestBid", label: "Lowest bid" },
  { value: "distance", label: "Highest distance" }
];

const QUICK_FILTERS = [
  { value: "all", label: "All", tone: "all" },
  { value: "new", label: "New", tone: "new" },
  { value: "urgent", label: "Urgent", tone: "urgent" },
  { value: "endingToday", label: "Ending today", tone: "today" },
  { value: "noApplications", label: "No applications", tone: "nobids" },
  { value: "completed", label: "Completed", tone: "ended" }
];

const BADGE_CLASS = {
  LIVE: "live",
  NEW: "new",
  URGENT: "urgent",
  ENDED: "ended",
  AWARDED: "awarded",
  "NO BIDS": "nobids"
};

/* ------------------------------------------------------------ Formatters -- */

const INR_FORMAT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});
const NUMBER_FORMAT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const DISTANCE_FORMAT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: INDIA_TZ
});
const SHORT_DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: INDIA_TZ
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: INDIA_TZ
});
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: INDIA_TZ
});

function formatINR(amount) {
  return INR_FORMAT.format(amount);
}

function formatDateTime(ms) {
  return ms === null ? "Not available" : DATE_TIME_FORMAT.format(new Date(ms));
}

function formatShortDateTime(ms) {
  return ms === null ? "—" : SHORT_DATE_TIME_FORMAT.format(new Date(ms));
}

function formatTime(ms) {
  return ms === null ? "--:--" : TIME_FORMAT.format(new Date(ms));
}

function dayKey(ms) {
  return DAY_KEY_FORMAT.format(new Date(ms));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function splitDuration(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60
  };
}

function durationWords(ms) {
  const { h, m } = splitDuration(ms);
  if (h === 0 && m === 0) return "Less than a minute";
  const parts = [];
  if (h) parts.push(h + (h === 1 ? " hour" : " hours"));
  if (m) parts.push(m + (m === 1 ? " minute" : " minutes"));
  return parts.join(" ");
}

function relativeTime(ms, now) {
  if (ms === null) return "";
  const mins = Math.floor(Math.max(0, now - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h " + (mins % 60) + "m ago";
  return Math.floor(hours / 24) + "d ago";
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/* ------------------------------------------------------ Safe value parsing -- */

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toTime(value) {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/* -------------------------------------------------------- Normalisation -- */

/**
 * Converts one backend bidding object into a render-safe view model.
 * Backend IDs, applicant counts and lowest bids are preserved as-is;
 * missing values become null (never 0) so the UI can show "Not available".
 *
 * Deadline: `closesAt` (absolute) is preferred. If only `secondsLeft` is
 * sent, it is anchored to the moment that value was first received so the
 * countdown stays stable across unrelated re-renders.
 */
function normalizeBid(raw, index, receivedAt, prevAnchors, nextAnchors) {
  const source = raw && typeof raw === "object" ? raw : {};
  const id = toText(source.id);
  const requestId = toText(source.requestId);
  const key = id ? "bid:" + id : "row:" + index;

  const createdAtMs = toTime(source.createdAt) ?? toTime(source.publishedAt);
  const closesAtMs = toTime(source.closesAt);
  const secondsLeft = toNumber(source.secondsLeft);

  let deadline = closesAtMs;
  if (deadline === null && secondsLeft !== null) {
    const previous = prevAnchors.get(key);
    const anchor = previous && previous.secondsLeft === secondsLeft ? previous.anchor : receivedAt;
    nextAnchors.set(key, { secondsLeft, anchor });
    deadline = anchor + Math.max(0, secondsLeft) * 1000;
  }

  const materials = (Array.isArray(source.materials) ? source.materials : [])
    .filter(item => item && typeof item === "object")
    .map((item, materialIndex) => ({
      key: toText(item.id) || "material-" + materialIndex,
      name: toText(item.name ?? item.materialName) || "Unnamed material",
      quantity: toNumber(item.quantity),
      unit: toText(item.quantityUnit ?? item.unit)
    }));

  const pickup = toText(source.pickup);
  const drop = toText(source.drop);
  const distanceKm = toNumber(source.distanceKm);
  const applicants = toNumber(source.applicants);
  const lowestBid = toNumber(source.lowestBid);

  return {
    key,
    raw: source,
    id,
    requestId,
    rawStatus: toText(source.status).toLowerCase(),
    createdAtMs,
    deadline,
    deadlineDay: deadline !== null ? dayKey(deadline) : "",
    windowMs: createdAtMs !== null && deadline !== null && deadline > createdAtMs ? deadline - createdAtMs : null,
    pickup,
    drop,
    distanceKm: distanceKm !== null && distanceKm >= 0 ? distanceKm : null,
    applicants: applicants !== null && applicants >= 0 ? Math.floor(applicants) : null,
    lowestBid: lowestBid !== null && lowestBid > 0 ? lowestBid : null,
    materials,
    searchText: [id, requestId, pickup, drop]
      .concat(materials.map(item => item.name))
      .join(" ")
      .toLowerCase()
  };
}

/** Live, time-dependent state for a bid. Priority: AWARDED › ENDED › URGENT › NEW › NO BIDS › LIVE */
function deriveState(bid, now, todayKey) {
  const status = bid.rawStatus;
  const remaining = bid.deadline !== null ? bid.deadline - now : null;
  const age = bid.createdAtMs !== null ? now - bid.createdAtMs : null;
  const isNew = age !== null && age >= 0 && age <= NEW_WINDOW_MS;
  const noBids = bid.applicants === 0;

  if (AWARDED_STATUSES.has(status)) {
    return { phase: "awarded", badge: "AWARDED", remaining: null, isNew, isUrgent: false, noBids, endsToday: false, closedByBackend: true };
  }

  const closedByBackend = CLOSED_STATUSES.has(status);
  const timeUp = remaining !== null && remaining <= 0;
  const liveCapable = !closedByBackend && (LIVE_STATUSES.has(status) || remaining !== null);

  if (closedByBackend || timeUp || !liveCapable) {
    return { phase: "ended", badge: "ENDED", remaining: 0, isNew, isUrgent: false, noBids, endsToday: false, closedByBackend };
  }

  const isUrgent = remaining !== null && remaining <= URGENT_WINDOW_MS;
  const endsToday = remaining !== null && bid.deadlineDay === todayKey;
  const badge = isUrgent ? "URGENT" : isNew ? "NEW" : noBids ? "NO BIDS" : "LIVE";

  return { phase: "live", badge, remaining, isNew, isUrgent, noBids, endsToday, closedByBackend: false };
}

function matchesStatusFilter(state, filter) {
  switch (filter) {
    case "live": return state.phase === "live";
    case "endingSoon": return state.phase === "live" && state.isUrgent;
    case "completed": return state.phase !== "live";
    case "awarded": return state.phase === "awarded";
    case "noBids": return state.noBids && state.phase !== "awarded";
    default: return true;
  }
}

function matchesQuickFilter(state, quick) {
  switch (quick) {
    case "new": return state.isNew;
    case "urgent": return state.phase === "live" && state.isUrgent;
    case "endingToday": return state.phase === "live" && state.endsToday;
    case "noApplications": return state.noBids;
    case "completed": return state.phase !== "live";
    default: return true;
  }
}

/** Nullable comparator — nulls always sort last. dir: 1 = ascending, -1 = descending. */
function compareNullable(a, b, dir) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir * (a - b);
}

function sortItems(items, sort) {
  const newest = (a, b) => compareNullable(a.bid.createdAtMs, b.bid.createdAtMs, -1);
  const comparators = {
    newest,
    urgent: (a, b) => {
      const aLive = a.state.phase === "live";
      const bLive = b.state.phase === "live";
      if (aLive !== bLive) return aLive ? -1 : 1;
      if (aLive) return compareNullable(a.state.remaining, b.state.remaining, 1);
      return compareNullable(a.bid.deadline, b.bid.deadline, -1);
    },
    applications: (a, b) => compareNullable(a.bid.applicants, b.bid.applicants, -1),
    lowestBid: (a, b) => compareNullable(a.bid.lowestBid, b.bid.lowestBid, 1),
    distance: (a, b) => compareNullable(a.bid.distanceKm, b.bid.distanceKm, -1)
  };
  const primary = comparators[sort] || newest;
  return [...items].sort((a, b) => primary(a, b) || newest(a, b));
}

function extractBiddingList(response) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.biddings)) return response.biddings;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && response.data && Array.isArray(response.data.biddings)) return response.data.biddings;
  return [];
}

/* ------------------------------------------------------ Data-loading hook -- */

/**
 * Separated data layer. Usage:
 *   const data = useAdminTransportBiddings(getAdminTransportBiddings);
 *   <StoneRateAdminTransportBiddings {...data} onRefresh={data.refresh} onRetry={data.refresh} />
 *
 * `fetchBiddings` must be a stable function reference (module-level import).
 */
export function useAdminTransportBiddings(fetchBiddings) {
  const [biddings, setBiddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (typeof fetchBiddings !== "function") {
      setLoading(false);
      setError("Transport biddings API is not connected.");
      return;
    }
    const seq = ++requestSeq.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetchBiddings();
      if (mountedRef.current && seq === requestSeq.current) {
        setBiddings(extractBiddingList(response));
      }
    } catch (loadError) {
      if (mountedRef.current && seq === requestSeq.current) {
        setError((loadError && loadError.message) || "Unable to load transportation biddings");
      }
    } finally {
      if (mountedRef.current && seq === requestSeq.current) {
        setLoading(false);
      }
    }
  }, [fetchBiddings]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return { biddings, loading, error, refresh };
}

/* ------------------------------------------------------------------ Icons -- */

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: "false"
  };
  const paths = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 9" /><path d="m4 15 2.3 2.6A7 7 0 0 0 18 15" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    close: <><path d="m7 7 10 10" /><path d="m17 7-10 10" /></>,
    sort: <><path d="M8 6h12" /><path d="M8 12h9" /><path d="M8 18h6" /><path d="m3 8 2-2 2 2" /><path d="M5 6v12" /></>,
    filter: <><path d="M4 5h16l-6 7.5V19l-4 1.5v-8Z" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    hourglass: <><path d="M6 3h12M6 21h12" /><path d="M7 3c0 4 5 5.5 5 9s-5 5-5 9" /><path d="M17 3c0 4-5 5.5-5 9s5 5 5 9" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    inbox: <><path d="M4 5h16v14H4z" /><path d="M4 14h4l2 2h4l2-2h4" /></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v9" /></>,
    bolt: <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>,
    pulse: <><path d="M3 12h4l2.5-7 4 14L16 12h5" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 5h11l-2 3.5L16 12H5" /></>,
    check: <><path d="m5 13 4.5 4.5L19 7" /></>,
    users: <><circle cx="9" cy="8" r="3.4" /><path d="M2.8 20a6.4 6.4 0 0 1 12.4 0" /><path d="M16 4.6a3.4 3.4 0 0 1 0 6.6" /><path d="M18.4 14a6.4 6.4 0 0 1 2.8 6" /></>,
    rupee: <><path d="M7 4h11" /><path d="M7 9h11" /><path d="M9 4h1.5a4.5 4.5 0 0 1 0 9H7l8 7" /></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H5a3 3 0 0 0 3 4" /><path d="M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4" /><path d="M8.5 20h7" /><path d="M10 17h4v3h-4z" /></>,
    route: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" /></>,
    gavel: <><path d="m14 4 6 6" /><path d="m11 7 6 6" /><path d="m12.5 5.5-5 5 6 6 5-5" /><path d="M9.5 12.5 3 19l2 2 6.5-6.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /></>,
    doc: <><path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z" /><path d="M14 3v5h5" /></>,
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.4 6.4 2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    cubes: <>
      <path d="M12 2.6 8.4 4.6v4.1L12 10.7l3.6-2V4.6z" />
      <path d="m8.4 4.6 3.6 2 3.6-2M12 6.6v4.1" />
      <path d="M7.2 12.3 3.6 14.3v4.1l3.6 2 3.6-2v-4.1z" />
      <path d="m3.6 14.3 3.6 2 3.6-2M7.2 16.3v4.1" />
      <path d="M16.8 12.3l-3.6 2v4.1l3.6 2 3.6-2v-4.1z" />
      <path d="m13.2 14.3 3.6 2 3.6-2M16.8 16.3v4.1" />
    </>,
    truckNav: <>
      <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>,
    docNav: <>
      <path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z" />
      <path d="M14 3v5h5" />
      <path d="M8.6 12h6.4M8.6 15.2h6.4M8.6 18.4h3.8" />
    </>,
    clipboardCheck: <>
      <path d="M9 4.4H7.4A2.4 2.4 0 0 0 5 6.8v11.8A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V6.8a2.4 2.4 0 0 0-2.4-2.4H15" />
      <rect x="9" y="2.6" width="6" height="3.9" rx="1.4" />
      <path d="m9.4 13.6 2.1 2.1 3.9-3.9" />
    </>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

/* ------------------------------------------------------------ Sub-parts -- */

function SummaryTile({ icon, tone, label, value, hint, ratio, index }) {
  return (
    <article className={"tb-metric tone-" + tone} style={{ animationDelay: index * 70 + "ms" }}>
      <div className="tb-metric-head">
        <span className="tb-metric-icon"><Icon name={icon} size={15} /></span>
        <span className="tb-metric-label">{label}</span>
      </div>
      <div className="tb-metric-value">{value}</div>
      <div className="tb-metric-foot">
        <span className="tb-metric-hint">{hint}</span>
        <span className="tb-meter" aria-hidden="true">
          <i style={{ transform: "scaleX(" + clamp01(ratio) + ")" }} />
        </span>
      </div>
    </article>
  );
}

function HeroArt() {
  return (
    <div className="tb-hero-art" aria-hidden="true">
      <svg viewBox="0 0 240 132" width="240" height="132">
        <defs>
          <linearGradient id="tbRouteGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#f97316" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <path className="tb-art-track" d="M22 104 C 78 104, 70 38, 128 42 S 200 26, 216 24" />
        <path className="tb-art-flow" d="M22 104 C 78 104, 70 38, 128 42 S 200 26, 216 24" />
        <circle className="tb-art-halo" cx="22" cy="104" r="11" />
        <circle className="tb-art-start" cx="22" cy="104" r="5" />
        <circle className="tb-art-halo end" cx="216" cy="24" r="11" />
        <circle className="tb-art-end" cx="216" cy="24" r="5" />
      </svg>
      <span className="tb-art-tag one"><Icon name="truck" size={12} /> Live lanes</span>
      <span className="tb-art-tag two"><Icon name="gavel" size={12} /> Reverse auction</span>
    </div>
  );
}

function BidTimer({ bid, state }) {
  if (state.phase === "live") {
    if (state.remaining === null) {
      return (
        <div className="tb-timer tone-steady">
          <span className="tb-timer-icon"><Icon name="clock" size={15} /></span>
          <div className="tb-timer-body">
            <span className="tb-timer-label">Time remaining</span>
            <strong className="tb-timer-note">Closing time not provided</strong>
          </div>
        </div>
      );
    }
    const { h, m, s } = splitDuration(state.remaining);
    const tone = !state.isUrgent ? "steady" : state.remaining <= CRITICAL_WINDOW_MS ? "critical" : "urgent";
    const ratio = bid.windowMs ? clamp01(state.remaining / bid.windowMs) : null;
    return (
      <div className={"tb-timer tone-" + tone}>
        <span className="tb-timer-icon"><Icon name={state.isUrgent ? "bolt" : "hourglass"} size={15} /></span>
        <div className="tb-timer-body">
          <span className="tb-timer-label">{state.isUrgent ? "Ending soon" : "Time remaining"}</span>
          <span
            className="tb-timer-value"
            role="timer"
            aria-live="off"
            aria-label={durationWords(state.remaining) + " remaining"}
          >
            <b>{pad(h)}</b><i>:</i><b>{pad(m)}</b><i>:</i><b>{pad(s)}</b>
          </span>
        </div>
        <div className="tb-timer-side">
          <span>Closes</span>
          <strong>{formatShortDateTime(bid.deadline)}</strong>
        </div>
        {ratio !== null ? (
          <span className="tb-timer-bar" aria-hidden="true">
            <i style={{ transform: "scaleX(" + ratio + ")" }} />
          </span>
        ) : null}
      </div>
    );
  }

  const awarded = state.phase === "awarded";
  const note = awarded
    ? "Transporter awarded"
    : state.closedByBackend
      ? "Final ranking available"
      : bid.deadline !== null
        ? "Closed at " + formatTime(bid.deadline)
        : "Final ranking pending";

  return (
    <div className={"tb-timer tone-" + (awarded ? "awarded" : "ended")} role="status">
      <span className="tb-timer-icon"><Icon name={awarded ? "trophy" : "flag"} size={15} /></span>
      <div className="tb-timer-body">
        <span className="tb-timer-label">Status</span>
        <strong className="tb-timer-note">Bidding ended</strong>
      </div>
      <div className="tb-timer-side final">
        <Icon name="check" size={12} />
        <strong>{note}</strong>
      </div>
    </div>
  );
}

function RouteTrack({ bid, live }) {
  return (
    <ol className={"tb-route" + (live ? " is-live" : "")} aria-label="Route">
      <li className="tb-stop pickup">
        <span className="tb-stop-mark"><i /></span>
        <div className="tb-stop-text">
          <span>Pickup</span>
          <strong>{bid.pickup || "Pickup location not provided"}</strong>
        </div>
      </li>
      <li className="tb-leg">
        <span className="tb-leg-line" aria-hidden="true"><i /></span>
        <span className="tb-distance">
          <Icon name="truck" size={13} />
          {bid.distanceKm !== null ? (
            <><b>{DISTANCE_FORMAT.format(bid.distanceKm)}</b> km route</>
          ) : (
            "Distance not available"
          )}
        </span>
      </li>
      <li className="tb-stop drop">
        <span className="tb-stop-mark"><Icon name="pin" size={13} /></span>
        <div className="tb-stop-text">
          <span>Drop</span>
          <strong>{bid.drop || "Drop location not provided"}</strong>
        </div>
      </li>
    </ol>
  );
}

function MaterialList({ materials }) {
  return (
    <div className="tb-block">
      <div className="tb-block-head">
        <span><Icon name="cube" size={12} /> Materials</span>
        <em>{materials.length} item{materials.length === 1 ? "" : "s"}</em>
      </div>
      {materials.length ? (
        <ul className="tb-materials">
          {materials.map(material => (
            <li className="tb-material" key={material.key}>
              <span className="tb-material-icon"><Icon name="cube" size={12} /></span>
              <span className="tb-material-name">{material.name}</span>
              <b className="tb-material-qty">
                {material.quantity !== null
                  ? NUMBER_FORMAT.format(material.quantity) + (material.unit ? " " + material.unit : "")
                  : "Qty not specified"}
              </b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tb-empty-line">No materials listed for this bidding</p>
      )}
    </div>
  );
}

function CompetitionPanel({ bid, state }) {
  const { applicants, lowestBid } = bid;
  const hasBids = applicants !== 0 && lowestBid !== null;

  let activity = { tone: "idle", text: "Activity unavailable" };
  if (state.phase === "awarded") activity = { tone: "awarded", text: "Contract awarded" };
  else if (state.phase === "ended") activity = { tone: "ended", text: applicants === 0 ? "Closed without bids" : "Bidding closed" };
  else if (applicants === 0) activity = { tone: "waiting", text: "Awaiting first bid" };
  else if (applicants !== null) activity = { tone: "active", text: state.isUrgent ? "Final minutes — bids active" : "Bidding active" };

  return (
    <div className="tb-block">
      <div className="tb-block-head">
        <span><Icon name="gavel" size={12} /> Competition</span>
      </div>
      <div className="tb-compete">
        <div className={"tb-stat" + (applicants === 0 || applicants === null ? " muted" : "")}>
          <span className="tb-stat-label"><Icon name="users" size={12} /> Transporters</span>
          {applicants === null ? (
            <strong className="tb-stat-value">Not available</strong>
          ) : applicants === 0 ? (
            <strong className="tb-stat-value">No bids submitted yet</strong>
          ) : (
            <strong className="tb-stat-value">
              {NUMBER_FORMAT.format(applicants)}
              <small>Transporter{applicants === 1 ? "" : "s"} applied</small>
            </strong>
          )}
        </div>
        <div className={"tb-stat" + (hasBids ? " best" : " muted")}>
          <span className="tb-stat-label"><Icon name="rupee" size={12} /> Lowest bid</span>
          <strong className="tb-stat-value">{hasBids ? formatINR(lowestBid) : "Not available"}</strong>
        </div>
        <div className={"tb-activity tone-" + activity.tone}>
          <i className="tb-activity-pip" aria-hidden="true" />
          <span>{activity.text}</span>
        </div>
      </div>
    </div>
  );
}

function BidCard({ bid, state, index, onView }) {
  const titleId = "tb-card-" + bid.key.replace(/[^a-zA-Z0-9_-]/g, "-");
  const badgeClass = BADGE_CLASS[state.badge];

  return (
    <article
      className={"tb-card phase-" + state.phase + " badge-" + badgeClass}
      style={{ animationDelay: Math.min(index, 10) * 55 + "ms" }}
      aria-labelledby={titleId}
    >
      <span className="tb-card-rail" aria-hidden="true" />
      <span className="tb-card-sheen" aria-hidden="true" />
      <span className="tb-card-mesh" aria-hidden="true" />

      <header className="tb-card-head">
        <div className="tb-ids">
          <span className="tb-id">
            <span className="tb-id-dot" aria-hidden="true" />
            <h3 className="tb-id-text" id={titleId}>{bid.id || "Bid ID unavailable"}</h3>
          </span>
          <span className="tb-reqid">
            <Icon name="doc" size={12} />
            <span>Request</span>
            <b>{bid.requestId || "—"}</b>
          </span>
        </div>
        <span className={"tb-badge " + badgeClass}>
          <i className="tb-badge-pip" aria-hidden="true" />
          {state.badge}
        </span>
      </header>

      <BidTimer bid={bid} state={state} />
      <RouteTrack bid={bid} live={state.phase === "live"} />
      <MaterialList materials={bid.materials} />
      <CompetitionPanel bid={bid} state={state} />

      <footer className="tb-card-foot">
        <span className="tb-published">
          <Icon name="calendar" size={13} />
          <span>Published</span>
          <strong>{formatDateTime(bid.createdAtMs)}</strong>
        </span>
        <button
          type="button"
          className="tb-view"
          onClick={() => onView(bid.raw)}
          aria-label={"View details for bidding " + (bid.id || bid.requestId || "")}
        >
          View Details
          <Icon name="arrow" size={14} />
        </button>
      </footer>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="tb-card tb-skeleton" aria-hidden="true">
      <span className="tb-card-rail" />
      <div className="sk sk-id" />
      <div className="sk sk-badge" />
      <div className="sk sk-line" />
      <div className="sk sk-timer" />
      <div className="sk sk-route" />
      <div className="sk sk-rows" />
      <div className="sk sk-stats" />
      <div className="sk sk-foot" />
    </div>
  );
}

function StatePanel({ tone, icon, title, text, actionLabel, onAction }) {
  return (
    <section className={"tb-state" + (tone ? " " + tone : "")} role={tone === "error" ? "alert" : "status"}>
      <span className="tb-state-icon"><Icon name={icon} size={22} /></span>
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
      {actionLabel ? (
        <button type="button" className="tb-btn" onClick={onAction}>
          {tone === "error" ? <Icon name="refresh" size={14} /> : null}
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------- Page component -- */

const EMPTY_LIST = [];
const noop = () => {};

export default function StoneRateAdminTransportBiddings({
  biddings = EMPTY_LIST,
  loading = false,
  error = "",
  onBack = noop,
  onRefresh = noop,
  onRetry = noop,
  onViewBidDetails = noop,
  // Optional bottom-navigation callbacks (same as AdminRateRequests)
  onHome,
  onSamples,
  onTransporterBidding,
  onRateRequests,
  onConfirmedOrders
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [now, setNow] = useState(() => Date.now());
  const [syncedAt, setSyncedAt] = useState(null);
  const [toast, setToast] = useState("");
  const [activeNav, setActiveNav] = useState("Bidding");

  const searchRef = useRef(null);
  const toastTimer = useRef(null);
  const anchorsRef = useRef(new Map());
  const wasLoading = useRef(loading);
  const refreshRequested = useRef(false);

  /* one shared 1-second clock drives every countdown */
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    const handleVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /* Ctrl/⌘ + K focuses search */
  useEffect(() => {
    const handleKey = event => {
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "k") {
        event.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback(message => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  /* track successful syncs (drives "Synced x ago" + refresh toast) */
  useEffect(() => {
    if (wasLoading.current && !loading) {
      if (!error) {
        setSyncedAt(Date.now());
        if (refreshRequested.current) showToast("Transport biddings synced");
      }
      refreshRequested.current = false;
    }
    wasLoading.current = loading;
  }, [loading, error, showToast]);

  useEffect(() => {
    if (!loading && !error && syncedAt === null) setSyncedAt(Date.now());
  }, [loading, error, syncedAt]);

  /* normalise backend data once per response */
  const normalized = useMemo(() => {
    const list = Array.isArray(biddings) ? biddings : EMPTY_LIST;
    const receivedAt = Date.now();
    const nextAnchors = new Map();
    const result = list.map((raw, index) =>
      normalizeBid(raw, index, receivedAt, anchorsRef.current, nextAnchors)
    );
    anchorsRef.current = nextAnchors;
    return result;
  }, [biddings]);

  const todayKey = dayKey(now);

  const items = useMemo(
    () => normalized.map(bid => ({ bid, state: deriveState(bid, now, todayKey) })),
    [normalized, now, todayKey]
  );

  const summary = useMemo(() => {
    const result = { total: items.length, live: 0, endingSoon: 0, completed: 0 };
    items.forEach(({ state }) => {
      if (state.phase === "live") {
        result.live += 1;
        if (state.isUrgent) result.endingSoon += 1;
      } else {
        result.completed += 1;
      }
    });
    return result;
  }, [items]);

  const quickCounts = useMemo(() => {
    const counts = {};
    QUICK_FILTERS.forEach(item => {
      counts[item.value] = items.filter(({ state }) => matchesQuickFilter(state, item.value)).length;
    });
    return counts;
  }, [items]);

  const normalizedQuery = query.trim().toLowerCase();

  const searchMatched = useMemo(
    () => (normalizedQuery ? items.filter(({ bid }) => bid.searchText.includes(normalizedQuery)) : items),
    [items, normalizedQuery]
  );

  const visibleItems = useMemo(() => {
    const filtered = searchMatched.filter(
      ({ state }) => matchesStatusFilter(state, statusFilter) && matchesQuickFilter(state, quickFilter)
    );
    return sortItems(filtered, sort);
  }, [searchMatched, statusFilter, quickFilter, sort]);

  const filtersActive = statusFilter !== "all" || quickFilter !== "all";

  const resetFilters = () => {
    setStatusFilter("all");
    setQuickFilter("all");
  };

  const handleRefresh = () => {
    if (loading) return;
    refreshRequested.current = true;
    setNow(Date.now());
    onRefresh();
  };

  const handleRetry = () => {
    refreshRequested.current = true;
    onRetry();
  };

  const handleView = useCallback(bid => onViewBidDetails(bid), [onViewBidDetails]);

  const handleNav = (key, callback, label) => {
    setActiveNav(key);
    if (callback) callback();
    else showToast(label + " selected");
  };

  const navItems = [
    { key: "Samples", label: "Samples", icon: "cubes", action: onSamples },
    { key: "Bidding", label: "Transport", icon: "truckNav", action: onTransporterBidding, dot: true },
    { key: "Home", label: "Home", icon: "home", action: onHome },
    { key: "Requests", label: "Rates", icon: "docNav", action: onRateRequests, dot: true },
    { key: "Orders", label: "Orders", icon: "clipboardCheck", action: onConfirmedOrders }
  ];
  const activeNavIndex = Math.max(0, navItems.findIndex(item => item.key === activeNav));

  const statusLabel = (STATUS_OPTIONS.find(item => item.value === statusFilter) || STATUS_OPTIONS[0]).label;
  const sortLabel = (SORT_OPTIONS.find(item => item.value === sort) || SORT_OPTIONS[0]).label;
  const quickLabel = (QUICK_FILTERS.find(item => item.value === quickFilter) || QUICK_FILTERS[0]).label;
  const showSummaryNumbers = !loading || items.length > 0;
  const liveShare = summary.total ? summary.live / summary.total : 0;

  /* ------------------------------------------------------------ content -- */
  let content;
  if (error) {
    content = (
      <StatePanel
        tone="error"
        icon="alert"
        title="Unable to load transportation biddings"
        text={error}
        actionLabel="Retry"
        onAction={handleRetry}
      />
    );
  } else if (loading) {
    content = (
      <section className="tb-list" aria-label="Loading transport biddings" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  } else if (items.length === 0) {
    content = (
      <StatePanel
        icon="inbox"
        title="No transportation biddings available"
        text="Biddings forwarded from Admin Rate Requests will appear here once they are published."
        actionLabel="Refresh"
        onAction={handleRefresh}
      />
    );
  } else if (normalizedQuery && searchMatched.length === 0) {
    content = (
      <StatePanel
        icon="search"
        title="No biddings match your search"
        text={"Nothing found for “" + query.trim() + "”. Try a Bid ID, Request ID, location or material."}
        actionLabel="Clear search"
        onAction={() => setQuery("")}
      />
    );
  } else if (visibleItems.length === 0) {
    content = (
      <StatePanel
        icon="filter"
        title="No biddings are available under this filter"
        text="Try another status, quick filter or reset to see every bidding."
        actionLabel="Reset filters"
        onAction={resetFilters}
      />
    );
  } else {
    content = (
      <section className="tb-list" aria-label="Transport biddings">
        {visibleItems.map(({ bid, state }, index) => (
          <BidCard key={bid.key} bid={bid} state={state} index={index} onView={handleView} />
        ))}
      </section>
    );
  }

  return (
    <div className="tb-root">
      <style>{STYLES}</style>

      <div className="tb-bg" aria-hidden="true">
        <span className="tb-bg-grid" />
        <span className="tb-bg-orb one" />
        <span className="tb-bg-orb two" />
        <span className="tb-bg-orb three" />
      </div>

      {/* ============================ HEADER ============================ */}
      <header className="tb-header">
        <div className="tb-header-inner">
          <div className="tb-header-row">
            <button className="tb-iconbtn" type="button" onClick={onBack} aria-label="Go back">
              <Icon name="back" size={18} />
            </button>

            <div className="tb-brand">
              <span className="tb-brand-mark">
                <Icon name="truck" size={17} strokeWidth={1.9} />
                <i className="tb-brand-ping" />
              </span>
              <span className="tb-brand-text">
                <span className="tb-brand-name">StoneRate</span>
                <span className="tb-brand-role">Admin · Bidding Desk</span>
              </span>
            </div>

            <span className="tb-livechip" aria-label={summary.live + " live biddings"}>
              <i className="tb-livepip" />
              LIVE
            </span>

            <button
              className={"tb-iconbtn tb-refresh" + (loading ? " spinning" : "")}
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              aria-label={loading ? "Refreshing transport biddings" : "Refresh transport biddings"}
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>

          <div className="tb-hero">
            <div className="tb-hero-copy">
              <span className="tb-eyebrow"><Icon name="route" size={12} /> Transport marketplace</span>
              <h1 className="tb-hero-title">
                Transport <span>Biddings</span>
              </h1>
              <p className="tb-hero-sub">Monitor live transportation bids and review submitted offers</p>
              <span className="tb-hero-meta" role="status" aria-live="polite">
                <span className="tb-hero-pip" />
                {loading
                  ? "Syncing bidding board…"
                  : syncedAt
                    ? "Synced " + relativeTime(syncedAt, now)
                    : "Awaiting sync"}
                {!loading && syncedAt ? <><em>·</em>{formatTime(syncedAt)}</> : null}
              </span>
            </div>
            <HeroArt />
          </div>

          <div className="tb-metrics" aria-label="Bidding summary">
            <SummaryTile index={0} icon="gavel" tone="slate" label="Total biddings"
              value={showSummaryNumbers ? summary.total : "—"} hint="All forwarded requests" ratio={1} />
            <SummaryTile index={1} icon="pulse" tone="orange" label="Live biddings"
              value={showSummaryNumbers ? summary.live : "—"} hint="Accepting offers" ratio={liveShare} />
            <SummaryTile index={2} icon="bolt" tone="red" label="Ending soon"
              value={showSummaryNumbers ? summary.endingSoon : "—"} hint="Closing within 60 min"
              ratio={summary.live ? summary.endingSoon / summary.live : 0} />
            <SummaryTile index={3} icon="flag" tone="green" label="Completed"
              value={showSummaryNumbers ? summary.completed : "—"} hint="Ended or awarded"
              ratio={summary.total ? summary.completed / summary.total : 0} />
          </div>
        </div>
      </header>

      {/* ============================= SHELL ============================ */}
      <main className="tb-shell">
        <section className="tb-toolbar" aria-label="Search, filter and sort transport biddings">
          <div className="tb-toolbar-top">
            <label className="tb-search" htmlFor="tb-search-input">
              <Icon name="search" size={16} />
              <span className="tb-sr">Search biddings</span>
              <input
                id="tb-search-input"
                ref={searchRef}
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search by Bid ID, Request ID, location, or material"
                autoComplete="off"
                spellCheck="false"
              />
              {query ? (
                <button
                  className="tb-search-clear"
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (searchRef.current) searchRef.current.focus();
                  }}
                  aria-label="Clear search"
                >
                  <Icon name="close" size={13} />
                </button>
              ) : (
                <kbd className="tb-kbd" aria-hidden="true">⌘K</kbd>
              )}
            </label>

            <div className="tb-selects">
              <label className={"tb-select-wrap" + (statusFilter !== "all" ? " active" : "")}>
                <Icon name="filter" size={14} />
                <span className="tb-sr">Filter by status</span>
                <select className="tb-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.value === "all" ? "Status: All" : option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={"tb-select-wrap" + (sort !== "newest" ? " active" : "")}>
                <Icon name="sort" size={14} />
                <span className="tb-sr">Sort biddings</span>
                <select className="tb-select" value={sort} onChange={event => setSort(event.target.value)}>
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="tb-filters" role="group" aria-label="Quick filters">
            {QUICK_FILTERS.map(item => {
              const active = quickFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={active}
                  className={"tb-filter s-" + item.tone + (active ? " active" : "")}
                  onClick={() => setQuickFilter(item.value)}
                >
                  <i className="tb-filter-pip" aria-hidden="true" />
                  {item.label}
                  <span aria-label={quickCounts[item.value] + " biddings"}>
                    {loading && !items.length ? "·" : quickCounts[item.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="tb-resultbar">
          <span className="tb-result-count" role="status" aria-live="polite">
            <Icon name="spark" size={13} />
            {loading
              ? "Loading biddings"
              : error
                ? "Sync failed"
                : visibleItems.length + " bidding" + (visibleItems.length === 1 ? "" : "s")}
          </span>
          <span className="tb-result-scope">
            {statusLabel}
            {quickFilter !== "all" ? <><em>·</em>{quickLabel}</> : null}
            <em>·</em>
            {sortLabel}
            {filtersActive ? (
              <button type="button" className="tb-reset" onClick={resetFilters}>Reset</button>
            ) : null}
          </span>
        </div>

        {content}
      </main>

      {/* ======================== FLAT BOTTOM NAV ======================== */}
      <nav className="tb-bottomnav" aria-label="Admin primary navigation">
        <span
          className="tb-nav-selection"
          style={{ transform: "translateX(" + activeNavIndex * 100 + "%)" }}
          aria-hidden="true"
        />
        {navItems.map(item => {
          const isActive = activeNav === item.key;
          return (
            <button
              key={item.key}
              className={"tb-navitem" + (isActive ? " active" : "")}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleNav(item.key, item.action, item.label)}
            >
              <span className="tb-nav-icon">
                <Icon name={item.icon} size={17} strokeWidth={1.8} />
                {item.dot ? <i className="tb-nav-notice" aria-hidden="true" /> : null}
              </span>
              <span className="tb-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={"tb-toast" + (toast ? " show" : "")} role="status" aria-live="polite">
        <span className="tb-toast-pip" />
        {toast}
      </div>
    </div>
  );
}

/* ===========================================================================
 * Styles — white canvas + signal orange (same tokens as AdminRateRequests).
 * ========================================================================= */

const STYLES = `
.tb-root{
  --tb-orange:#f97316;
  --tb-orange-600:#ea6a0a;
  --tb-orange-700:#c2560b;
  --tb-orange-ink:#9a4408;
  --tb-orange-soft:rgba(249,115,22,.10);
  --tb-orange-soft2:rgba(249,115,22,.18);
  --tb-amber:#e08b1e;
  --tb-amber-ink:#a15c07;
  --tb-amber-soft:rgba(224,139,30,.12);
  --tb-green:#1f9463;
  --tb-green-ink:#0f7a4c;
  --tb-green-soft:rgba(31,148,99,.12);
  --tb-red:#d64545;
  --tb-red-ink:#b42318;
  --tb-red-soft:rgba(214,69,69,.10);
  --tb-blue:#3b6fd8;
  --tb-blue-ink:#2451a8;
  --tb-blue-soft:rgba(59,111,216,.10);
  --tb-violet:#7c5cd6;
  --tb-violet-ink:#5b3fb0;
  --tb-violet-soft:rgba(124,92,214,.11);
  --tb-ink:#141a24;
  --tb-ink-2:#3b4658;
  --tb-muted:#626d7e;
  --tb-faint:#8a94a3;
  --tb-line:#e9edf3;
  --tb-line-2:#dbe2ec;
  --tb-glass:rgba(255,255,255,.78);
  --tb-glass-2:rgba(255,255,255,.92);
  --tb-mono:"SF Mono",ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace;
  position:relative;isolation:isolate;min-height:100dvh;padding-bottom:92px;
  color:var(--tb-ink);background:#f4f7fb;
  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;overflow-x:hidden;
}
.tb-root *{box-sizing:border-box}
.tb-root button,.tb-root input,.tb-root select{font-family:inherit}
.tb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* ---------------------------------------------------------- background -- */
.tb-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;background:#f4f7fb}
.tb-bg-grid{position:absolute;inset:0;
  background:
    linear-gradient(transparent 0 31px,rgba(24,42,72,.035) 31px 32px),
    linear-gradient(90deg,transparent 0 31px,rgba(24,42,72,.035) 31px 32px);
  background-size:32px 32px;
  -webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%);
  mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%)}
.tb-bg-orb{position:absolute;border-radius:50%;filter:blur(58px);opacity:.5}
.tb-bg-orb.one{width:44vw;height:44vw;max-width:520px;max-height:520px;left:-9vw;top:-16vw;
  background:radial-gradient(circle,rgba(255,168,74,.55),transparent 66%);animation:tbFloat 16s ease-in-out infinite}
.tb-bg-orb.two{width:40vw;height:40vw;max-width:470px;max-height:470px;right:-10vw;top:-6vw;
  background:radial-gradient(circle,rgba(80,140,255,.42),transparent 66%);animation:tbFloat 19s ease-in-out infinite reverse}
.tb-bg-orb.three{width:36vw;height:36vw;max-width:420px;max-height:420px;left:34vw;top:30vw;
  background:radial-gradient(circle,rgba(13,148,136,.24),transparent 68%)}
@keyframes tbFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(2.5vw,1.8vw)}}

/* --------------------------------------------------------------- header -- */
.tb-header{position:relative;border-bottom:1px solid rgba(16,28,50,.06);
  background:linear-gradient(180deg,rgba(244,247,251,.24),rgba(244,247,251,.05))}
.tb-header:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(249,115,22,.28),rgba(80,140,255,.2),transparent)}
.tb-header-inner{width:min(100%,1180px);margin:0 auto;padding:12px 14px 18px;position:relative;z-index:1}
.tb-header-row{display:flex;align-items:center;gap:10px}

.tb-iconbtn{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;cursor:pointer;
  border:1px solid var(--tb-line-2);border-radius:11px;color:var(--tb-ink-2);background:var(--tb-glass-2);
  box-shadow:0 2px 8px rgba(20,26,36,.05),inset 0 1px 0 #fff;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,color .18s ease}
.tb-iconbtn:hover{transform:translateY(-1px);color:var(--tb-orange-700);
  border-color:rgba(249,115,22,.45);box-shadow:0 6px 18px rgba(249,115,22,.18)}
.tb-iconbtn:active{transform:translateY(0)}
.tb-iconbtn:disabled{opacity:.6;cursor:default;transform:none}
.tb-refresh svg{transition:transform .4s ease}
.tb-refresh:hover svg{transform:rotate(120deg)}
.tb-refresh.spinning svg{animation:tbSpin .9s linear infinite}
@keyframes tbSpin{to{transform:rotate(360deg)}}

.tb-brand{display:flex;align-items:center;gap:9px;min-width:0;flex:1}
.tb-brand-mark{position:relative;width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;
  border-radius:11px;color:#fff;background:linear-gradient(135deg,var(--tb-orange),var(--tb-orange-700));
  box-shadow:0 6px 16px rgba(249,115,22,.32),inset 0 1px 0 rgba(255,255,255,.35)}
.tb-brand-ping{position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;
  background:#22c55e;border:2px solid #fff;animation:tbPing 2.4s ease-in-out infinite}
@keyframes tbPing{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}
.tb-brand-text{display:flex;flex-direction:column;min-width:0}
.tb-brand-name{font-size:14px;font-weight:700;letter-spacing:-.01em;line-height:1.15}
.tb-brand-role{font-size:10.5px;font-weight:650;letter-spacing:.1em;text-transform:uppercase;color:var(--tb-orange-700);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.tb-livechip{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:5px 9px;border-radius:999px;
  font-size:9.5px;font-weight:800;letter-spacing:.12em;color:var(--tb-green-ink);background:var(--tb-green-soft);
  border:1px solid rgba(31,148,99,.28)}
.tb-livepip{width:5px;height:5px;border-radius:50%;background:var(--tb-green);animation:tbBlink 1.8s ease-in-out infinite}
@keyframes tbBlink{0%,100%{opacity:1}50%{opacity:.25}}

/* hero */
.tb-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:16px 2px 0}
.tb-hero-copy{min-width:0}
.tb-eyebrow{display:inline-flex;align-items:center;gap:5px;margin-bottom:8px;font-size:10px;font-weight:800;
  letter-spacing:.12em;text-transform:uppercase;color:var(--tb-muted)}
.tb-eyebrow svg{color:var(--tb-orange)}
.tb-hero-title{margin:0;font-size:29px;line-height:1.06;letter-spacing:-.035em;font-weight:750}
.tb-hero-title span{background:linear-gradient(100deg,var(--tb-orange),#fbbf24 50%,var(--tb-orange-700) 90%);
  background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
  animation:tbShine 6s ease-in-out infinite}
@keyframes tbShine{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.tb-hero-sub{margin:7px 0 0;font-size:12.5px;line-height:1.5;color:var(--tb-muted);max-width:52ch}
.tb-hero-meta{display:inline-flex;align-items:center;gap:6px;margin-top:11px;padding:5px 10px;border-radius:999px;
  font-size:10.5px;font-weight:650;color:var(--tb-orange-ink);background:var(--tb-orange-soft);border:1px solid rgba(249,115,22,.24)}
.tb-hero-meta em{font-style:normal;opacity:.45}
.tb-hero-pip{width:5px;height:5px;border-radius:50%;background:var(--tb-orange);box-shadow:0 0 0 3px rgba(249,115,22,.16)}

.tb-hero-art{position:relative;display:none;flex:0 0 auto;width:240px;height:132px}
.tb-art-track{fill:none;stroke:rgba(20,26,36,.10);stroke-width:5;stroke-linecap:round}
.tb-art-flow{fill:none;stroke:url(#tbRouteGrad);stroke-width:3;stroke-linecap:round;stroke-dasharray:6 9;
  animation:tbDash 1.4s linear infinite}
@keyframes tbDash{to{stroke-dashoffset:-30}}
.tb-art-start{fill:#fff;stroke:var(--tb-orange);stroke-width:3}
.tb-art-end{fill:var(--tb-orange)}
.tb-art-halo{fill:rgba(249,115,22,.14);transform-box:fill-box;transform-origin:center;animation:tbHalo 2.4s ease-out infinite}
.tb-art-halo.end{animation-delay:1.2s}
@keyframes tbHalo{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.9);opacity:0}}
.tb-art-tag{position:absolute;display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:9px;
  font-size:10px;font-weight:750;color:var(--tb-ink-2);background:var(--tb-glass-2);border:1px solid var(--tb-line);
  box-shadow:0 6px 18px rgba(20,26,36,.08)}
.tb-art-tag svg{color:var(--tb-orange-700)}
.tb-art-tag.one{left:30px;top:30px}
.tb-art-tag.two{right:0;bottom:6px}

/* summary metrics */
.tb-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:16px}
.tb-metric{position:relative;overflow:hidden;padding:11px 12px 11px;border-radius:14px;border:1px solid var(--tb-line);
  background:var(--tb-glass-2);box-shadow:0 4px 14px rgba(20,26,36,.05),inset 0 1px 0 #fff;
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;animation:tbRise .45s cubic-bezier(.2,.7,.3,1) both}
.tb-metric:hover{transform:translateY(-2px);border-color:rgba(249,115,22,.32);box-shadow:0 12px 26px rgba(20,26,36,.09)}
.tb-metric:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--tb-mtone);opacity:.9}
.tb-metric:after{content:"";position:absolute;right:-30px;top:-30px;width:90px;height:90px;border-radius:50%;
  background:radial-gradient(circle,var(--tb-msoft),transparent 70%);pointer-events:none}
.tb-metric.tone-orange{--tb-mtone:var(--tb-orange);--tb-mink:var(--tb-orange-ink);--tb-msoft:var(--tb-orange-soft)}
.tb-metric.tone-red{--tb-mtone:var(--tb-red);--tb-mink:var(--tb-red-ink);--tb-msoft:var(--tb-red-soft)}
.tb-metric.tone-green{--tb-mtone:var(--tb-green);--tb-mink:var(--tb-green-ink);--tb-msoft:var(--tb-green-soft)}
.tb-metric.tone-slate{--tb-mtone:#64748b;--tb-mink:#475569;--tb-msoft:rgba(100,116,139,.12)}
.tb-metric-head{display:flex;align-items:center;gap:6px}
.tb-metric-icon{width:22px;height:22px;flex:0 0 auto;display:grid;place-items:center;border-radius:7px;
  color:var(--tb-mink);background:var(--tb-msoft)}
.tb-metric-label{font-size:10px;font-weight:750;letter-spacing:.09em;text-transform:uppercase;color:var(--tb-muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tb-metric-value{margin-top:8px;font-size:25px;font-weight:750;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.tb-metric-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px}
.tb-metric-hint{font-size:10px;color:var(--tb-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.tb-meter{position:relative;flex:0 0 38px;height:4px;border-radius:4px;background:rgba(20,26,36,.07);overflow:hidden}
.tb-meter i{position:absolute;inset:0;border-radius:4px;background:var(--tb-mtone);transform-origin:left center;
  transition:transform .6s cubic-bezier(.2,.7,.3,1)}

/* ---------------------------------------------------------------- shell -- */
.tb-shell{width:min(100%,1180px);margin:0 auto;padding:16px 14px 24px;position:relative;z-index:1}

/* toolbar */
.tb-toolbar{position:relative;padding:11px;border-radius:16px;border:1px solid var(--tb-line);
  background:var(--tb-glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  box-shadow:0 8px 26px rgba(20,26,36,.06),inset 0 1px 0 #fff}
.tb-toolbar:before{content:"";position:absolute;inset:0;border-radius:16px;padding:1px;pointer-events:none;
  background:linear-gradient(120deg,rgba(249,115,22,.42),transparent 34%,transparent 66%,rgba(251,191,36,.34));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude}
.tb-toolbar-top{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:center}
.tb-search{position:relative;min-width:0;height:44px;display:flex;align-items:center;gap:8px;padding:0 10px;
  border-radius:12px;border:1px solid var(--tb-line-2);background:#fff;color:var(--tb-faint);cursor:text;
  transition:border-color .18s,box-shadow .18s,color .18s}
.tb-search:focus-within{border-color:rgba(249,115,22,.6);color:var(--tb-orange-700);box-shadow:0 0 0 3px rgba(249,115,22,.16)}
.tb-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font-size:13px;color:var(--tb-ink);
  -webkit-appearance:none;appearance:none}
.tb-search input::-webkit-search-cancel-button{display:none}
.tb-search input::placeholder{color:#9aa4b2;text-overflow:ellipsis}
.tb-search-clear{width:24px;height:24px;flex:0 0 auto;display:grid;place-items:center;padding:0;cursor:pointer;
  border:0;border-radius:7px;background:#eef1f6;color:#5c6878}
.tb-search-clear:hover{background:var(--tb-orange-soft);color:var(--tb-orange-700)}
.tb-kbd{flex:0 0 auto;padding:3px 6px;border-radius:6px;font-family:var(--tb-mono);font-size:9.5px;font-weight:600;
  color:var(--tb-faint);background:#f4f6f9;border:1px solid var(--tb-line-2)}

.tb-selects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;min-width:0}
.tb-select-wrap{position:relative;display:block;min-width:0;color:var(--tb-muted)}
.tb-select-wrap svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none}
.tb-select-wrap:after{content:"";position:absolute;right:12px;top:50%;width:6px;height:6px;margin-top:-5px;pointer-events:none;
  border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);opacity:.7}
.tb-select{width:100%;height:44px;padding:0 28px 0 31px;cursor:pointer;outline:none;border:1px solid var(--tb-line-2);
  border-radius:12px;background:#fff;color:var(--tb-ink);font-size:12px;font-weight:700;
  appearance:none;-webkit-appearance:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  transition:border-color .18s,box-shadow .18s,background .18s}
.tb-select:hover{border-color:rgba(249,115,22,.35)}
.tb-select:focus-visible{border-color:rgba(249,115,22,.6);box-shadow:0 0 0 3px rgba(249,115,22,.16)}
.tb-select-wrap.active{color:var(--tb-orange-700)}
.tb-select-wrap.active .tb-select{color:var(--tb-orange-ink);border-color:rgba(249,115,22,.5);
  background:linear-gradient(135deg,rgba(249,115,22,.10),rgba(251,191,36,.07)),#fff;box-shadow:inset 0 -2px 0 var(--tb-orange)}

.tb-filters{display:flex;gap:6px;margin-top:9px;padding:2px 2px 3px;overflow-x:auto;scrollbar-width:none;
  scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.tb-filters::-webkit-scrollbar{display:none}
.tb-filter{position:relative;display:inline-flex;align-items:center;gap:6px;height:34px;flex:0 0 auto;padding:0 11px;
  cursor:pointer;white-space:nowrap;scroll-snap-align:start;border:1px solid var(--tb-line-2);border-radius:10px;
  background:#fff;color:var(--tb-muted);font-size:11.5px;font-weight:700;transition:.18s}
.tb-filter:hover{color:var(--tb-ink);border-color:rgba(249,115,22,.35);transform:translateY(-1px)}
.tb-filter span{min-width:18px;padding:1px 5px;border-radius:5px;font-size:10px;font-weight:800;text-align:center;
  background:#f1f4f8;color:var(--tb-faint);font-variant-numeric:tabular-nums}
.tb-filter-pip{width:6px;height:6px;border-radius:50%;background:#c3cbd6}
.tb-filter.s-new .tb-filter-pip{background:var(--tb-blue)}
.tb-filter.s-urgent .tb-filter-pip{background:var(--tb-red);animation:tbBlink 1.4s ease-in-out infinite}
.tb-filter.s-today .tb-filter-pip{background:var(--tb-amber)}
.tb-filter.s-nobids .tb-filter-pip{background:var(--tb-violet)}
.tb-filter.s-ended .tb-filter-pip{background:#98a2b3}
.tb-filter.s-all .tb-filter-pip{background:var(--tb-orange)}
.tb-filter.active{color:var(--tb-orange-ink);border-color:rgba(249,115,22,.5);
  background:linear-gradient(135deg,rgba(249,115,22,.14),rgba(251,191,36,.10));
  box-shadow:0 3px 12px rgba(249,115,22,.18),inset 0 -2px 0 var(--tb-orange)}
.tb-filter.active span{background:rgba(249,115,22,.18);color:var(--tb-orange-ink)}

/* result bar */
.tb-resultbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 3px 10px;
  font-size:11px;color:var(--tb-muted);min-width:0}
.tb-result-count{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;font-weight:750;color:var(--tb-ink)}
.tb-result-count svg{color:var(--tb-orange)}
.tb-result-scope{display:inline-flex;align-items:center;gap:5px;min-width:0;font-weight:600;color:var(--tb-faint);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tb-result-scope em{font-style:normal;opacity:.5}
.tb-reset{margin-left:4px;padding:3px 8px;border:1px solid rgba(249,115,22,.35);border-radius:7px;cursor:pointer;
  background:var(--tb-orange-soft);color:var(--tb-orange-ink);font-size:10.5px;font-weight:750}
.tb-reset:hover{background:var(--tb-orange-soft2)}

/* ----------------------------------------------------------------- list -- */
.tb-list{display:grid;gap:12px}
@keyframes tbRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

.tb-card{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:11px;min-width:0;
  padding:14px 14px 13px 17px;border:1px solid var(--tb-line);border-radius:18px;background:var(--tb-glass-2);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 4px 16px rgba(20,26,36,.055),inset 0 1px 0 #fff;
  transition:transform .22s cubic-bezier(.2,.7,.3,1),box-shadow .22s,border-color .22s;
  animation:tbRise .5s cubic-bezier(.2,.7,.3,1) both}
.tb-card:hover,.tb-card:focus-within{transform:translateY(-3px);border-color:rgba(249,115,22,.34);
  box-shadow:0 18px 38px rgba(20,26,36,.11),0 0 0 1px rgba(249,115,22,.06)}
.tb-card > *:not(.tb-card-rail):not(.tb-card-sheen):not(.tb-card-mesh){position:relative}

.tb-card-rail{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--tb-orange),#fbbf24)}
.tb-card.badge-new .tb-card-rail{background:linear-gradient(180deg,#6d9bf1,var(--tb-blue))}
.tb-card.badge-urgent .tb-card-rail{background:linear-gradient(180deg,#f87171,var(--tb-red))}
.tb-card.badge-nobids .tb-card-rail{background:linear-gradient(180deg,#a78bfa,var(--tb-violet))}
.tb-card.badge-awarded .tb-card-rail{background:linear-gradient(180deg,#34d399,var(--tb-green))}
.tb-card.badge-ended .tb-card-rail{background:linear-gradient(180deg,#cbd5e1,#94a3b8)}
.tb-card.badge-urgent{border-color:rgba(214,69,69,.22)}

.tb-card-sheen{position:absolute;top:-60%;right:-30%;width:62%;height:150%;pointer-events:none;opacity:0;
  background:radial-gradient(circle,rgba(249,115,22,.16),transparent 68%);transition:opacity .3s}
.tb-card:hover .tb-card-sheen{opacity:1}
.tb-card-mesh{position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:linear-gradient(rgba(20,26,36,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(20,26,36,.035) 1px,transparent 1px);
  background-size:22px 22px;
  -webkit-mask-image:radial-gradient(ellipse 70% 60% at 100% 0%,#000,transparent 72%);
  mask-image:radial-gradient(ellipse 70% 60% at 100% 0%,#000,transparent 72%)}

/* card head */
.tb-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.tb-ids{display:flex;flex-direction:column;gap:5px;min-width:0}
.tb-id{display:inline-flex;align-items:center;gap:7px;min-width:0}
.tb-id-dot{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:var(--tb-orange);box-shadow:0 0 0 3px var(--tb-orange-soft)}
.tb-card.phase-live .tb-id-dot{animation:tbPing 2.2s ease-in-out infinite;background:#22c55e;box-shadow:none}
.tb-id-text{margin:0;font-family:var(--tb-mono);font-size:13.5px;font-weight:650;letter-spacing:.02em;color:var(--tb-ink);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tb-reqid{display:inline-flex;align-items:center;gap:5px;min-width:0;font-size:10.5px;color:var(--tb-muted)}
.tb-reqid svg{flex:0 0 auto;color:var(--tb-faint)}
.tb-reqid b{font-family:var(--tb-mono);font-weight:600;color:var(--tb-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.tb-badge{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:5px 9px;border-radius:8px;
  font-size:9.5px;line-height:1;font-weight:850;letter-spacing:.09em;border:1px solid;white-space:nowrap}
.tb-badge-pip{width:5px;height:5px;border-radius:50%;background:currentColor}
.tb-badge.live{color:var(--tb-orange-ink);background:var(--tb-orange-soft);border-color:rgba(249,115,22,.34)}
.tb-badge.live .tb-badge-pip{animation:tbBlink 1.6s ease-in-out infinite}
.tb-badge.new{color:var(--tb-blue-ink);background:var(--tb-blue-soft);border-color:rgba(59,111,216,.32)}
.tb-badge.urgent{color:#fff;background:linear-gradient(135deg,#ef5b5b,var(--tb-red-ink));border-color:transparent;
  box-shadow:0 4px 12px rgba(214,69,69,.28);animation:tbAlert 1.8s ease-in-out infinite}
.tb-badge.nobids{color:var(--tb-violet-ink);background:var(--tb-violet-soft);border-color:rgba(124,92,214,.3)}
.tb-badge.awarded{color:var(--tb-green-ink);background:var(--tb-green-soft);border-color:rgba(31,148,99,.32)}
.tb-badge.ended{color:#5b6576;background:#f1f4f8;border-color:var(--tb-line-2)}
@keyframes tbAlert{0%,100%{box-shadow:0 0 0 0 rgba(214,69,69,.3)}50%{box-shadow:0 0 0 5px rgba(214,69,69,0)}}

/* timer */
.tb-timer{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;
  padding:10px 11px 12px;border-radius:13px;border:1px solid var(--tb-tline,var(--tb-line));
  background:linear-gradient(135deg,var(--tb-tsoft,#f7f9fc),rgba(255,255,255,.6))}
.tb-timer.tone-steady{--tb-ttone:var(--tb-orange);--tb-tink:var(--tb-orange-ink);--tb-tsoft:rgba(249,115,22,.07);--tb-tline:rgba(249,115,22,.2)}
.tb-timer.tone-urgent{--tb-ttone:var(--tb-amber);--tb-tink:var(--tb-amber-ink);--tb-tsoft:rgba(224,139,30,.09);--tb-tline:rgba(224,139,30,.3)}
.tb-timer.tone-critical{--tb-ttone:var(--tb-red);--tb-tink:var(--tb-red-ink);--tb-tsoft:rgba(214,69,69,.08);--tb-tline:rgba(214,69,69,.3)}
.tb-timer.tone-ended{--tb-ttone:#94a3b8;--tb-tink:#475569;--tb-tsoft:#f4f6f9;--tb-tline:var(--tb-line-2)}
.tb-timer.tone-awarded{--tb-ttone:var(--tb-green);--tb-tink:var(--tb-green-ink);--tb-tsoft:rgba(31,148,99,.08);--tb-tline:rgba(31,148,99,.26)}
.tb-timer-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:#fff;
  background:var(--tb-ttone);box-shadow:0 4px 12px rgba(20,26,36,.12)}
.tb-timer.tone-critical .tb-timer-icon{animation:tbAlert 1.4s ease-in-out infinite}
.tb-timer-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.tb-timer-label{font-size:9.5px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--tb-muted)}
.tb-timer-value{display:inline-flex;align-items:baseline;gap:3px;font-family:var(--tb-mono);font-variant-numeric:tabular-nums;color:var(--tb-tink)}
.tb-timer-value b{display:inline-block;min-width:2ch;text-align:center;font-size:19px;font-weight:700;letter-spacing:-.01em}
.tb-timer-value i{font-style:normal;font-size:15px;opacity:.5;animation:tbBlink 1s steps(2,start) infinite}
.tb-timer-note{font-size:13.5px;font-weight:750;color:var(--tb-tink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tb-timer-side{display:flex;flex-direction:column;align-items:flex-end;gap:2px;min-width:0;text-align:right}
.tb-timer-side span{font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--tb-faint)}
.tb-timer-side strong{font-size:10.5px;font-weight:650;color:var(--tb-ink-2);white-space:nowrap}
.tb-timer-side.final{flex-direction:row;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;
  background:rgba(255,255,255,.8);border:1px solid var(--tb-tline);color:var(--tb-tink)}
.tb-timer-side.final strong{color:var(--tb-tink);white-space:normal;text-align:left;line-height:1.25}
.tb-timer-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(20,26,36,.06)}
.tb-timer-bar i{position:absolute;inset:0;background:linear-gradient(90deg,var(--tb-ttone),#fbbf24);
  transform-origin:left center;transition:transform 1s linear}

/* route */
.tb-route{list-style:none;margin:0;padding:11px 11px 10px;border-radius:13px;border:1px solid var(--tb-line);
  background:linear-gradient(180deg,#fbfcfe,#f5f7fa);display:flex;flex-direction:column;gap:0}
.tb-stop{display:flex;align-items:flex-start;gap:10px;min-width:0}
.tb-stop-mark{position:relative;width:22px;height:22px;flex:0 0 auto;display:grid;place-items:center;border-radius:50%}
.tb-stop.pickup .tb-stop-mark{border:2px solid var(--tb-orange);background:#fff}
.tb-stop.pickup .tb-stop-mark i{width:7px;height:7px;border-radius:50%;background:var(--tb-orange)}
.tb-stop.drop .tb-stop-mark{color:#fff;background:linear-gradient(135deg,var(--tb-orange),var(--tb-orange-700));
  box-shadow:0 3px 9px rgba(249,115,22,.3)}
.tb-stop-text{display:flex;flex-direction:column;gap:1px;min-width:0;padding-top:1px}
.tb-stop-text span{font-size:9.5px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--tb-faint)}
.tb-stop-text strong{font-size:12.5px;font-weight:650;line-height:1.35;color:var(--tb-ink);overflow-wrap:anywhere;word-break:break-word}
.tb-leg{display:flex;align-items:stretch;gap:10px;min-height:34px}
.tb-leg-line{position:relative;width:22px;flex:0 0 auto;display:flex;justify-content:center}
.tb-leg-line:before{content:"";width:2px;height:100%;border-radius:2px;
  background:repeating-linear-gradient(180deg,rgba(249,115,22,.55) 0 4px,transparent 4px 8px)}
.tb-route.is-live .tb-leg-line:before{animation:tbFlow 1s linear infinite;background-size:2px 8px}
@keyframes tbFlow{to{background-position:0 8px}}
.tb-leg-line i{position:absolute;left:50%;top:0;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--tb-orange);opacity:0}
.tb-route.is-live .tb-leg-line i{animation:tbTravel 2.2s ease-in-out infinite}
@keyframes tbTravel{0%{top:0;opacity:0}15%{opacity:1}85%{opacity:1}100%{top:calc(100% - 6px);opacity:0}}
.tb-distance{align-self:center;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;
  font-size:10.5px;font-weight:650;color:var(--tb-ink-2);background:#fff;border:1px solid var(--tb-line-2);
  box-shadow:0 2px 6px rgba(20,26,36,.05)}
.tb-distance svg{color:var(--tb-orange-700)}
.tb-distance b{font-family:var(--tb-mono);font-weight:700;color:var(--tb-orange-ink)}

/* blocks */
.tb-block{display:flex;flex-direction:column;gap:7px;min-width:0}
.tb-block-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tb-block-head span{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.09em;
  text-transform:uppercase;color:var(--tb-muted)}
.tb-block-head span svg{color:var(--tb-orange-700)}
.tb-block-head em{font-style:normal;font-size:10px;font-weight:700;color:var(--tb-faint)}

.tb-materials{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}
.tb-material{display:flex;align-items:flex-start;gap:8px;min-width:0;padding:6px 8px 6px 6px;border-radius:10px;
  border:1px solid var(--tb-line);background:linear-gradient(135deg,#fbfcfe,#f4f7fa);font-size:11.5px;color:var(--tb-ink-2)}
.tb-material-icon{width:22px;height:22px;flex:0 0 auto;display:grid;place-items:center;border-radius:7px;
  background:var(--tb-orange-soft);color:var(--tb-orange-700)}
.tb-material-name{flex:1 1 auto;min-width:0;padding-top:3px;font-weight:600;line-height:1.35;overflow-wrap:anywhere}
.tb-material-qty{flex:0 0 auto;max-width:48%;margin-top:1px;padding:3px 7px;border-radius:7px;font-family:var(--tb-mono);
  font-size:10.5px;font-weight:700;color:var(--tb-orange-ink);background:rgba(249,115,22,.09);text-align:right;overflow-wrap:anywhere}
.tb-empty-line{margin:0;padding:8px 10px;border-radius:10px;border:1px dashed var(--tb-line-2);font-size:11px;color:var(--tb-faint)}

/* competition */
.tb-compete{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.tb-stat{display:flex;flex-direction:column;gap:5px;min-width:0;padding:9px 10px;border-radius:12px;
  border:1px solid var(--tb-line);background:#fff}
.tb-stat-label{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:750;letter-spacing:.07em;
  text-transform:uppercase;color:var(--tb-faint)}
.tb-stat-value{display:flex;flex-direction:column;font-size:19px;font-weight:750;letter-spacing:-.02em;line-height:1.1;
  color:var(--tb-ink);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.tb-stat-value small{margin-top:2px;font-size:10.5px;font-weight:600;letter-spacing:0;color:var(--tb-muted)}
.tb-stat.muted .tb-stat-value{font-size:12.5px;font-weight:650;letter-spacing:0;color:var(--tb-muted);line-height:1.3}
.tb-stat.best{border-color:rgba(31,148,99,.28);background:linear-gradient(135deg,rgba(31,148,99,.09),rgba(255,255,255,.9))}
.tb-stat.best .tb-stat-label{color:var(--tb-green-ink)}
.tb-stat.best .tb-stat-value{color:var(--tb-green-ink)}
.tb-activity{grid-column:1 / -1;display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:10px;
  font-size:11px;font-weight:700;border:1px solid var(--tb-line);background:#f7f9fc;color:var(--tb-muted)}
.tb-activity-pip{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:#b6bfcc}
.tb-activity.tone-active{color:var(--tb-orange-ink);background:var(--tb-orange-soft);border-color:rgba(249,115,22,.24)}
.tb-activity.tone-active .tb-activity-pip{background:var(--tb-orange);animation:tbPingOrange 1.8s ease-in-out infinite}
@keyframes tbPingOrange{0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.5)}50%{box-shadow:0 0 0 5px rgba(249,115,22,0)}}
.tb-activity.tone-waiting{color:var(--tb-violet-ink);background:var(--tb-violet-soft);border-color:rgba(124,92,214,.24)}
.tb-activity.tone-waiting .tb-activity-pip{background:var(--tb-violet);animation:tbBlink 1.8s ease-in-out infinite}
.tb-activity.tone-awarded{color:var(--tb-green-ink);background:var(--tb-green-soft);border-color:rgba(31,148,99,.24)}
.tb-activity.tone-awarded .tb-activity-pip{background:var(--tb-green)}
.tb-activity.tone-ended .tb-activity-pip{background:#94a3b8}

/* card foot */
.tb-card-foot{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-top:auto;padding-top:11px;
  border-top:1px dashed var(--tb-line-2)}
.tb-published{display:flex;align-items:center;flex-wrap:wrap;gap:5px;min-width:0;font-size:11px;color:var(--tb-muted)}
.tb-published svg{color:var(--tb-faint);flex:0 0 auto}
.tb-published strong{font-weight:650;color:var(--tb-ink-2)}
.tb-view{display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:42px;padding:10px 16px;
  cursor:pointer;border:0;border-radius:12px;font-size:12.5px;font-weight:800;color:#fff;
  background:linear-gradient(135deg,var(--tb-orange),var(--tb-orange-700));
  box-shadow:0 5px 16px rgba(249,115,22,.30),inset 0 1px 0 rgba(255,255,255,.28);
  transition:box-shadow .2s,transform .2s,filter .2s}
.tb-view svg{transition:transform .2s}
.tb-view:hover{transform:translateY(-1px);box-shadow:0 9px 24px rgba(249,115,22,.42);filter:saturate(1.1)}
.tb-view:hover svg{transform:translateX(3px)}
.tb-view:active{transform:translateY(0)}
.tb-card.phase-ended .tb-view,.tb-card.phase-awarded .tb-view{color:var(--tb-ink-2);background:#fff;
  border:1px solid var(--tb-line-2);box-shadow:0 2px 8px rgba(20,26,36,.06)}
.tb-card.phase-ended .tb-view:hover,.tb-card.phase-awarded .tb-view:hover{color:var(--tb-orange-700);
  border-color:rgba(249,115,22,.45);box-shadow:0 6px 16px rgba(249,115,22,.16)}

/* focus */
.tb-iconbtn:focus-visible,.tb-filter:focus-visible,.tb-btn:focus-visible,.tb-view:focus-visible,
.tb-search-clear:focus-visible,.tb-reset:focus-visible{outline:2px solid rgba(249,115,22,.7);outline-offset:2px}
.tb-navitem:focus-visible{outline:2px solid rgba(37,99,235,.5);outline-offset:-2px}

/* ------------------------------------------------------------- skeleton -- */
.tb-skeleton{position:relative;gap:0;min-height:430px;pointer-events:none;animation:none}
.tb-skeleton:hover{transform:none;box-shadow:0 4px 16px rgba(20,26,36,.055)}
.tb-skeleton .tb-card-rail{background:linear-gradient(180deg,#f3d3b8,#e9e2d8)}
.sk{border-radius:9px;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);
  background-size:220% 100%;animation:tbShimmer 1.3s linear infinite}
.sk-id{width:44%;height:14px}
.sk-badge{position:absolute;top:14px;right:14px;width:62px;height:21px}
.sk-line{width:34%;height:10px;margin-top:9px}
.sk-timer{width:100%;height:56px;margin-top:14px;border-radius:13px}
.sk-route{width:100%;height:112px;margin-top:11px;border-radius:13px}
.sk-rows{width:100%;height:62px;margin-top:11px}
.sk-stats{width:100%;height:92px;margin-top:11px}
.sk-foot{width:100%;height:42px;margin-top:14px;border-radius:12px}
@keyframes tbShimmer{to{background-position:-220% 0}}

/* ---------------------------------------------------------------- state -- */
.tb-state{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  min-height:260px;padding:30px 22px;border-radius:18px;border:1px dashed var(--tb-line-2);background:var(--tb-glass);
  color:var(--tb-muted);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:tbRise .4s ease both}
.tb-state-icon{width:52px;height:52px;display:grid;place-items:center;margin-bottom:12px;border-radius:16px;
  color:var(--tb-orange-700);background:var(--tb-orange-soft);border:1px solid rgba(249,115,22,.24);
  box-shadow:0 8px 22px rgba(249,115,22,.14)}
.tb-state.error{border-color:rgba(214,69,69,.3)}
.tb-state.error .tb-state-icon{color:var(--tb-red-ink);background:var(--tb-red-soft);border-color:rgba(214,69,69,.24);
  box-shadow:0 8px 22px rgba(214,69,69,.12)}
.tb-state h2{margin:0 0 6px;font-size:15px;font-weight:750;letter-spacing:-.015em;color:var(--tb-ink)}
.tb-state p{margin:0;font-size:12px;line-height:1.55;max-width:42ch;overflow-wrap:anywhere}
.tb-btn{display:inline-flex;align-items:center;gap:6px;margin-top:15px;padding:10px 18px;cursor:pointer;border:0;border-radius:11px;
  font-size:12px;font-weight:750;color:#fff;background:linear-gradient(135deg,var(--tb-orange),var(--tb-orange-700));
  box-shadow:0 5px 16px rgba(249,115,22,.30);transition:transform .18s,box-shadow .18s}
.tb-btn:hover{transform:translateY(-1px);box-shadow:0 9px 22px rgba(249,115,22,.40)}

/* ----------------------------------------------------------- bottom nav -- */
.tb-bottomnav{position:fixed;z-index:30;left:50%;bottom:10px;transform:translateX(-50%);
  width:min(calc(100% - 18px),540px);height:62px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px;
  border:1px solid rgba(20,35,58,.11);border-radius:20px;background:rgba(255,255,255,.90);
  box-shadow:0 12px 30px rgba(16,29,49,.13),inset 0 1px 0 rgba(255,255,255,.96);
  -webkit-backdrop-filter:blur(19px) saturate(1.3);backdrop-filter:blur(19px) saturate(1.3);overflow:hidden}
.tb-nav-selection{position:absolute;z-index:0;left:5px;top:5px;width:calc((100% - 10px)/5);height:50px;
  border:1px solid rgba(249,115,22,.20);border-radius:15px;
  background:linear-gradient(150deg,rgba(255,247,237,.98),rgba(255,237,213,.82));
  box-shadow:0 4px 12px rgba(249,115,22,.10),inset 0 1px 0 #fff;
  transition:transform .32s cubic-bezier(.25,1.12,.45,1);will-change:transform}
.tb-navitem{position:relative;z-index:1;min-width:0;height:50px;padding:0 2px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:3px;border:0;border-radius:15px;color:#69758a;background:transparent;
  cursor:pointer;transition:color .2s ease,transform .16s ease}
.tb-nav-icon{position:relative;width:24px;height:24px;display:grid;place-items:center;border-radius:8px;
  transition:color .2s ease,background .2s ease,transform .2s ease}
.tb-nav-label{width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:inherit;font-size:8px;
  font-weight:750;line-height:1;text-align:center}
.tb-navitem:hover{color:#c85c08}
.tb-navitem:hover .tb-nav-icon{transform:translateY(-1px);background:rgba(249,115,22,.06)}
.tb-navitem.active{color:#c85c08}
.tb-navitem.active .tb-nav-icon{color:#fff;background:linear-gradient(145deg,#ff9b42,var(--tb-orange));
  box-shadow:0 3px 8px rgba(249,115,22,.18)}
.tb-navitem:active{transform:scale(.95)}
.tb-nav-notice{position:absolute;right:-2px;top:-2px;width:6px;height:6px;border:1.5px solid #fff;border-radius:50%;
  background:var(--tb-orange);box-shadow:0 1px 4px rgba(249,115,22,.25)}

/* ---------------------------------------------------------------- toast -- */
.tb-toast{position:fixed;z-index:60;left:50%;bottom:82px;display:flex;align-items:center;gap:8px;
  transform:translate(-50%,12px);opacity:0;pointer-events:none;padding:10px 15px;border-radius:12px;white-space:nowrap;
  font-size:12px;font-weight:650;color:#fff;background:#161d29;border:1px solid rgba(255,255,255,.10);
  box-shadow:0 14px 34px rgba(20,26,36,.30);transition:.26s cubic-bezier(.2,.7,.3,1)}
.tb-toast.show{opacity:1;transform:translate(-50%,0)}
.tb-toast-pip{width:6px;height:6px;border-radius:50%;background:var(--tb-orange);box-shadow:0 0 0 3px rgba(249,115,22,.25)}

/* ----------------------------------------------------------- responsive -- */
@media(max-width:390px){
  .tb-brand-role{letter-spacing:.06em}
  .tb-livechip{display:none}
  .tb-timer{grid-template-columns:auto minmax(0,1fr)}
  .tb-timer-side{grid-column:1 / -1;flex-direction:row;justify-content:space-between;align-items:center}
  .tb-timer-side.final{justify-content:flex-start}
  .tb-timer-value b{font-size:17px}
  .tb-bottomnav{width:calc(100% - 12px);height:60px;bottom:7px;padding:4px;border-radius:18px}
  .tb-nav-selection{left:4px;top:4px;width:calc((100% - 8px)/5);height:50px;border-radius:14px}
  .tb-navitem{height:50px;gap:2px;padding:0 1px}
  .tb-nav-label{font-size:7.5px}
  .tb-nav-icon{width:23px;height:23px}
}
@media(max-width:340px){
  .tb-compete{grid-template-columns:minmax(0,1fr)}
  .tb-selects{grid-template-columns:minmax(0,1fr)}
}
@media(min-width:520px){
  .tb-header-inner,.tb-shell{padding-left:20px;padding-right:20px}
  .tb-hero-title{font-size:33px}
  .tb-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media(min-width:720px){
  .tb-hero-art{display:block}
  .tb-list{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}
  .tb-card-foot{flex-direction:row;align-items:center;justify-content:space-between}
  .tb-view{width:auto;flex:0 0 auto}
  .tb-published{flex:1 1 auto}
}
@media(min-width:900px){
  .tb-header-inner{padding-top:16px;padding-bottom:22px}
  .tb-hero-title{font-size:38px}
  .tb-hero-sub{font-size:13.5px}
  .tb-toolbar{padding:12px}
  .tb-toolbar-top{grid-template-columns:minmax(0,1fr) minmax(360px,auto)}
  .tb-selects{grid-template-columns:repeat(2,180px)}
}
@media(min-width:1180px){
  .tb-list{grid-template-columns:repeat(3,minmax(0,1fr))}
  .tb-card-foot{flex-direction:column;align-items:stretch}
  .tb-view{width:100%}
}
@media(prefers-reduced-motion:reduce){
  .tb-root *,.tb-root *:before,.tb-root *:after{animation:none!important;transition:none!important}
}
`;
