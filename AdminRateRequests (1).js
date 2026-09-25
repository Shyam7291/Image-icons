import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminRateRequests } from "../api/adminApi";

/* ===========================================================================
 * StoneRate — Admin · Rate Requests
 * High-tech operations console. Theme: white surface + signal orange.
 * Self-contained: all styles live in the STYLES constant at the bottom.
 * ========================================================================= */

const DEMO_NOW = Date.now();

const minutesAgo = (minutes) =>
  new Date(
    DEMO_NOW - minutes * 60 * 1000
  ).toISOString();

const minutesFromNow = (minutes) =>
  new Date(
    DEMO_NOW + minutes * 60 * 1000
  ).toISOString();

const DEMO_REQUESTS = [
  {
    requestId: "SR-260802-012",
    status: "NEW",
    materials: [
      { materialName: "40mm Crushed Stone", totalTons: 30 },
      { materialName: "20mm Crushed Stone", totalTons: 15 },
      { materialName: "GSB", totalTons: 17 }
    ],
    deliveryArea: "Hoskote",
    buyer: "Sri Venkateshwara Infra",
    createdAt: minutesAgo(18),
    quotePublishedAt: null,
    validUntil: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    updatedAt: minutesAgo(18),
  },
  {
    requestId: "SR-260802-011",
    status: "RATE PROVIDED",
    materials: [{ materialName: "M-Sand", totalTons: 42 }],
    deliveryArea: "Whitefield",
    buyer: "Prestige Buildtech",
    createdAt: "2026-08-02T13:35:00.000Z",
    quotePublishedAt: "2026-08-02T17:08:00.000Z",
    validUntil: "2026-08-02T21:08:00.000Z",
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    updatedAt: "2026-08-02T17:08:00.000Z"
  },
  {
    requestId: "SR-260802-010",
    status: "NEW",
    materials: [{ materialName: "River Sand", totalTons: 18 }],
    deliveryArea: "Sarjapur",
    buyer: "Anand Constructions",
    createdAt: "2026-08-02T14:52:00.000Z",
    quotePublishedAt: null,
    validUntil: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    updatedAt: "2026-08-02T14:52:00.000Z"
  },
  {
    requestId: "SR-260802-009",
    status: "ACCEPTED",
    materials: [
      { materialName: "20mm Aggregate", totalTons: 24 },
      { materialName: "Manufactured Sand", totalTons: 28 }
    ],
    deliveryArea: "KR Puram",
    buyer: "Nakshatra Developers",
    createdAt: "2026-08-02T11:20:00.000Z",
    quotePublishedAt: "2026-08-02T14:10:00.000Z",
    validUntil: "2026-08-02T18:10:00.000Z",
    acceptedAt: "2026-08-02T16:55:00.000Z",
    rejectedAt: null,
    expiredAt: null,
    updatedAt: "2026-08-02T16:55:00.000Z"
  },
  {
    requestId: "SR-260802-008",
    status: "REJECTED",
    materials: [
      { materialName: "Red Soil", totalTons: 50 },
      { materialName: "Quarry Dust", totalTons: 12 }
    ],
    deliveryArea: "Devanahalli",
    buyer: "GreenField Estates",
    createdAt: "2026-08-02T10:05:00.000Z",
    quotePublishedAt: "2026-08-02T13:22:00.000Z",
    validUntil: "2026-08-02T17:22:00.000Z",
    acceptedAt: null,
    rejectedAt: "2026-08-02T17:06:00.000Z",
    expiredAt: null,
    updatedAt: "2026-08-02T17:06:00.000Z"
  },
  {
    requestId: "SR-260802-007",
    status: "EXPIRED",
    materials: [{ materialName: "WMM", totalTons: 65 }],
    deliveryArea: "Yelahanka",
    buyer: "Highway Works Div. 4",
    createdAt: "2026-08-02T09:02:00.000Z",
    quotePublishedAt: null,
    validUntil: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: "2026-08-02T15:02:00.000Z",
    updatedAt: "2026-08-02T15:02:00.000Z"
  },
  {
    requestId: "SR-260802-006",
    status: "RATE PROVIDED",
    materials: [
      { materialName: "6mm Chips", totalTons: 10 },
      { materialName: "12mm Aggregate", totalTons: 16 },
      { materialName: "Plastering Sand", totalTons: 22 }
    ],
    deliveryArea: "Electronic City",
    buyer: "Urbanline Projects",
    createdAt: "2026-08-02T12:18:00.000Z",
    quotePublishedAt: "2026-08-02T16:35:00.000Z",
    validUntil: "2026-08-02T20:35:00.000Z",
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    updatedAt: "2026-08-02T16:35:00.000Z"
  }
];

const FILTERS = ["ALL", "NEW", "RATE PROVIDED", "ACCEPTED", "REJECTED", "EXPIRED"];

const FILTER_LABELS = {
  ALL: "All",
  NEW: "New",
  "RATE PROVIDED": "Rate Provided",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired"
};

const STATUS_CLASS = {
  NEW: "new",
  "RATE PROVIDED": "provided",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired"
};

const NEW_WINDOW_MS = 6 * 60 * 60 * 1000;
const QUOTE_WINDOW_MS = 4 * 60 * 60 * 1000;

/* ---------------------------------------------------------------- Icons -- */

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
    "aria-hidden": true
  };
  const paths = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 9" /><path d="m4 15 2.3 2.6A7 7 0 0 0 18 15" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    close: <><path d="m7 7 10 10" /><path d="m17 7-10 10" /></>,
    sort: <><path d="M8 6h12" /><path d="M8 12h9" /><path d="M8 18h6" /><path d="m3 8 2-2 2 2" /><path d="M5 6v12" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    orders: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    samples: <><path d="m9 3 6 0" /><path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" /><path d="M8 15h8" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    inbox: <><path d="M4 5h16v14H4z" /><path d="M4 14h4l2 2h4l2-2h4" /></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v9" /></>,
    bolt: <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>,
    pulse: <><path d="M3 12h4l2.5-7 4 14L16 12h5" /></>,
    scale: <><path d="M12 4v16" /><path d="M6 8h12" /><path d="m6 8-3 6h6l-3-6Z" /><path d="m18 8-3 6h6l-3-6Z" /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" /></>,
    rows: <><rect x="3.5" y="5" width="17" height="5" rx="1.6" /><rect x="3.5" y="14" width="17" height="5" rx="1.6" /></>,
    check: <><path d="m5 13 4.5 4.5L19 7" /></>,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" /></>,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.4 6.4 2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 5h11l-2 3.5L16 12H5" /></>,
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
    </>,
    truck: <>
      <path d="M2.8 6.5h10.4v9.8H2.8z" />
      <path d="M13.2 9.6h3.9l3.1 3.6v3.1h-7" />
      <circle cx="7" cy="17.6" r="1.9" />
      <circle cx="17" cy="17.6" r="1.9" />
    </>,
    x: <><path d="m6.5 6.5 11 11" /><path d="m17.5 6.5-11 11" /></>,
    doc: <>
      <path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z" />
      <path d="M14 3v5h5" />
      <path d="M8.6 13h6.4M8.6 16.5h4.2" />
    </>,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}

/* ------------------------------------------------------------ Utilities -- */

function getDeadline(request) {
  if (request.status === "NEW") return new Date(request.createdAt).getTime() + NEW_WINDOW_MS;
  if (request.status === "RATE PROVIDED" && request.validUntil) return new Date(request.validUntil).getTime();
  return null;
}

function getWindow(status) {
  return status === "NEW" ? NEW_WINDOW_MS : QUOTE_WINDOW_MS;
}

function effectiveStatus(request, now) {
  const deadline = getDeadline(request);
  if ((request.status === "NEW" || request.status === "RATE PROVIDED") && deadline && deadline <= now) return "EXPIRED";
  return request.status;
}

function relativeTime(iso, now) {
  if (!iso) return "";
  const delta = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h " + (mins % 60) + "m ago";
  return Math.floor(hours / 24) + "d ago";
}

function countdown(deadline, now) {
  const ms = deadline - now;
  if (ms <= 0) return "00:00";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

function clockTime(iso) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusTimestamp(request, status) {
  if (status === "ACCEPTED") return request.acceptedAt;
  if (status === "REJECTED") return request.rejectedAt;
  if (status === "EXPIRED") return request.expiredAt || new Date(getDeadline(request) || Date.now()).toISOString();
  if (status === "RATE PROVIDED") return request.quotePublishedAt;
  return request.createdAt;
}

function totalTons(request) {
  return request.materials.reduce((sum, item) => sum + item.totalTons, 0);
}

function urgencyLevel(status, remaining) {
  if (status !== "NEW" && status !== "RATE PROVIDED") return "idle";
  const redLimit = status === "NEW" ? 30 * 60000 : 15 * 60000;
  const amberLimit = status === "NEW" ? 2 * 60 * 60000 : 60 * 60000;
  if (remaining < redLimit) return "critical";
  if (remaining <= amberLimit) return "warning";
  return "steady";
}

/* --------------------------------------------------------- Sub-elements -- */

function Corners() {
  return (
    <span className="rq-corners" aria-hidden="true">
      <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
    </span>
  );
}

function CountdownRing({ ratio, level, label, value }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(1, ratio));
  const dash = safe * circumference;
  return (
    <div className={"rq-ring level-" + level}>
      <div className="rq-ring-dial">
        <svg viewBox="0 0 40 40" width="40" height="40" role="img" aria-label={label + " " + value}>
          <title>{label}</title>
          <circle className="rq-ring-track" cx="20" cy="20" r={radius} />
          <circle
            className="rq-ring-bar"
            cx="20"
            cy="20"
            r={radius}
            strokeDasharray={dash + " " + circumference}
            transform="rotate(-90 20 20)"
          />
        </svg>
        <span className="rq-ring-core" />
      </div>
      <div className="rq-ring-text">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, unit, hint, bars, tone }) {
  return (
    <article className={"rq-metric tone-" + tone}>
      <Corners />
      <div className="rq-metric-head">
        <span className="rq-metric-icon"><Icon name={icon} size={15} /></span>
        <span className="rq-metric-label">{label}</span>
      </div>
      <div className="rq-metric-value">
        {value}
        {unit ? <em>{unit}</em> : null}
      </div>
      <div className="rq-metric-foot">
        <span className="rq-metric-hint">{hint}</span>
        <span className="rq-spark" aria-hidden="true">
          {bars.map((height, index) => (
            <i key={index} style={{ height: Math.max(14, height) + "%" }} />
          ))}
        </span>
      </div>
    </article>
  );
}

function RequestCard({ request, now, onOpen, index, dense }) {
  const status = effectiveStatus(request, now);
  const deadline = getDeadline(request);
  const remaining = deadline ? deadline - now : 0;
  const level = urgencyLevel(status, remaining);
  const ratio = deadline ? remaining / getWindow(request.status) : 0;
  const timeLabel =
    status === "NEW" ? "Submitted"
      : status === "RATE PROVIDED" ? "Rate sent"
        : status === "ACCEPTED" ? "Accepted"
          : status === "REJECTED" ? "Rejected"
            : "Expired";
  const timestamp = statusTimestamp(request, status);
  const tons = totalTons(request);

  const handleKeyDown = event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(request);
    }
  };

  return (
    <article
      className={"rq-card status-" + STATUS_CLASS[status] + " urg-" + level + (dense ? " dense" : "")}
      style={{ animationDelay: index * 55 + "ms" }}
      role="button"
      tabIndex="0"
      onClick={() => onOpen(request)}
      onKeyDown={handleKeyDown}
      aria-label={"Open request " + request.requestId}
    >
      <span className="rq-card-rail" aria-hidden="true" />
      <span className="rq-card-sheen" aria-hidden="true" />
      <span className="rq-card-mesh" aria-hidden="true" />
      <Corners />

      <header className="rq-card-head">
        <span className="rq-id">
          <span className="rq-id-dot" />
          <span className="rq-id-text">{request.requestId}</span>
        </span>
        <span className={"rq-badge " + STATUS_CLASS[status]}>
          <i className="rq-badge-pip" />
          {status}
        </span>
      </header>

      <div className="rq-buyer">
        <Icon name="user" size={13} />
        <span>{request.buyer}</span>
      </div>

      <div className="rq-materials" aria-label="Materials and quantities">
        {request.materials.map((material, i) => (
          <span className="rq-chip" key={material.materialName + "-" + i}>
            <i className="rq-chip-icon"><Icon name="cube" size={12} /></i>
            <span className="rq-chip-name">{material.materialName}</span>
            <b>{material.totalTons}t</b>
          </span>
        ))}
        <span className="rq-chip total">
          <i className="rq-chip-icon"><Icon name="scale" size={12} /></i>
          <span className="rq-chip-name">Total load</span>
          <b>{tons}t</b>
        </span>
      </div>

      <div className="rq-meta">
        <div className="rq-meta-cell">
          <Icon name="pin" size={13} />
          <span>Delivery</span>
          <strong>{request.deliveryArea}</strong>
        </div>
        <div className="rq-meta-cell">
          <Icon name="clock" size={13} />
          <span>{timeLabel}</span>
          <strong>{relativeTime(timestamp, now)}</strong>
        </div>
      </div>

      <footer className="rq-card-foot">
        {deadline ? (
          <CountdownRing
            ratio={ratio}
            level={level}
            label={status === "NEW" ? "Rate window" : "Buyer window"}
            value={countdown(deadline, now)}
          />
        ) : (
          <div className={"rq-closed " + STATUS_CLASS[status]}>
            <Icon name="flag" size={13} />
            <span>Closed at</span>
            <strong>{clockTime(timestamp)}</strong>
          </div>
        )}
        <span className="rq-open">
          {status === "NEW" ? "Provide rate" : "View request"}
          <Icon name="arrow" size={14} />
        </span>
      </footer>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rq-card rq-skeleton" aria-hidden="true">
      <span className="rq-card-rail" />
      <div className="sk sk-id" />
      <div className="sk sk-badge" />
      <div className="sk sk-line" />
      <div className="sk sk-chips" />
      <div className="sk sk-meta" />
      <div className="sk sk-foot" />
    </div>
  );
}
function matchesDateFilter(request, dateFilter, now) {
  if (dateFilter === "ALL") {
    return true;
  }

  const createdTime = new Date(
    request.createdAt
  ).getTime();

  if (!Number.isFinite(createdTime)) {
    return false;
  }

  const currentDate = new Date(now);

  if (dateFilter === "TODAY") {
    const requestDate = new Date(createdTime);

    return (
      requestDate.getFullYear() ===
        currentDate.getFullYear() &&
      requestDate.getMonth() ===
        currentDate.getMonth() &&
      requestDate.getDate() ===
        currentDate.getDate()
    );
  }

  const dateRanges = {
    "7_DAYS": 7,
    "30_DAYS": 30,
    "90_DAYS": 90,
  };

  const days = dateRanges[dateFilter];

  if (!days) {
    return true;
  }

  const rangeStart =
    now -
    days * 24 * 60 * 60 * 1000;

  return (
    createdTime >= rangeStart &&
    createdTime <= now
  );
}

/* ===========================================================================
 * Transporter Requests — frontend-only view (presentation + local UI state).
 * Data arrives exclusively through the `transporterRequests` prop.
 * No API calls are made here; ready for future backend integration.
 * ========================================================================= */

const REQUEST_SOURCES = [
  { value: "buyer", label: "By Buyer", icon: "user" },
  { value: "transporter", label: "By Transporter", icon: "truck" }
];

const TR_STATUS_FILTERS = [
  { value: "all", label: "All", cls: "all" },
  { value: "new", label: "New", cls: "new" },
  { value: "accepted", label: "Accepted", cls: "accepted" },
  { value: "rejected", label: "Rejected", cls: "rejected" }
];

const TR_SORTS = [
  { value: "newest", label: "Newest requested" },
  { value: "oldest", label: "Oldest requested" },
  { value: "ending", label: "Ending soon" },
  { value: "name", label: "Transporter name" }
];

const TR_KNOWN_STATUSES = ["new", "accepted", "rejected"];

const TR_DATE_FORMAT = (() => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch (formatError) {
    return null;
  }
})();

function trPick(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return null;
}

function trText(value) {
  const picked = trPick(value);
  if (picked === null) return null;
  if (typeof picked === "string" || typeof picked === "number") return String(picked).trim();
  return null;
}

function trNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function trTime(value) {
  if (value === undefined || value === null || value === "") return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function trObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/* Maps a raw Transporter Request (with reasonable alternate field names) into
 * a render-safe shape. Never fabricates values — missing data stays null. */
function normalizeTransporterRequest(raw, receivedAt, index) {
  const r = trObject(raw);
  const transporter = trObject(r.transporter);
  const seller = trObject(r.seller);
  const material = trObject(r.material);

  const id = trText(trPick(r.id, r.requestId, r.transporterRequestId, r.request_id, r.transporter_request_id));
  const rawStatus = String(trPick(r.status, r.requestStatus, r.request_status, "") || "").trim().toLowerCase();
  const status = TR_KNOWN_STATUSES.includes(rawStatus) ? rawStatus : rawStatus ? "unknown" : "unknown";

  const expiresAt = trTime(trPick(r.responseExpiresAt, r.response_expires_at, r.expiresAt, r.expires_at, r.responseDeadline));
  const secondsLeft = trNumber(trPick(r.secondsLeft, r.seconds_left, r.remainingSeconds));
  let deadline = null;
  if (expiresAt !== null) deadline = expiresAt;
  else if (secondsLeft !== null && secondsLeft >= 0) deadline = receivedAt + secondsLeft * 1000;

  return {
    key: id ? "tr-" + id + "-" + index : "tr-idx-" + index,
    raw,
    id,
    status,
    statusLabel: status === "unknown" ? (rawStatus ? rawStatus.toUpperCase() : "STATUS N/A") : status.toUpperCase(),
    transporterId: trText(trPick(r.transporterId, r.transporter_id, transporter.id, transporter.transporterId)),
    transporterName: trText(trPick(r.transporterName, r.transporter_name, r.agencyName, transporter.name, transporter.agencyName, typeof r.transporter === "string" ? r.transporter : null)),
    ownerName: trText(trPick(r.ownerName, r.owner_name, transporter.ownerName, transporter.owner)),
    materialName: trText(trPick(r.materialName, r.material_name, material.name, material.materialName, typeof r.material === "string" ? r.material : null)),
    quantity: trNumber(trPick(r.quantity, r.qty, material.quantity)),
    quantityUnit: trText(trPick(r.quantityUnit, r.quantity_unit, r.unit, material.unit, material.quantityUnit)),
    sellerId: trText(trPick(r.sellerId, r.seller_id, seller.id, seller.sellerId)),
    sellerName: trText(trPick(r.sellerName, r.seller_name, seller.name, seller.sellerName, typeof r.seller === "string" ? r.seller : null)),
    pickupLocation: trText(trPick(r.pickupLocation, r.pickup_location, r.pickupAddress, r.pickup_address, r.pickup)),
    requestedAt: trTime(trPick(r.requestedAt, r.requested_at, r.createdAt, r.created_at)),
    deadline
  };
}

function formatIndianDateTime(time) {
  if (time === null) return null;
  const date = new Date(time);
  if (TR_DATE_FORMAT) {
    try {
      const parts = {};
      TR_DATE_FORMAT.formatToParts(date).forEach(part => {
        parts[part.type] = part.value;
      });
      const period = String(parts.dayPeriod || "").toUpperCase();
      const month = String(parts.month || "").replace(/\.$/, "").slice(0, 3);
      return parts.day + " " + month + " " + parts.year + ", " + parts.hour + ":" + parts.minute + (period ? " " + period : "");
    } catch (formatError) {
      return TR_DATE_FORMAT.format(date);
    }
  }
  return date.toLocaleString();
}

function formatQuantity(value) {
  try {
    return value.toLocaleString("en-IN");
  } catch (formatError) {
    return String(value);
  }
}

function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    hh: String(hours).padStart(2, "0"),
    mm: String(minutes).padStart(2, "0"),
    ss: String(seconds).padStart(2, "0"),
    hours,
    minutes,
    seconds
  };
}

function responseLevel(remaining) {
  if (remaining <= 0) return "closed";
  if (remaining < 15 * 60000) return "critical";
  if (remaining < 60 * 60000) return "urgent";
  return "steady";
}

function safeInvoke(callback, ...args) {
  if (typeof callback !== "function") return;
  try {
    callback(...args);
  } catch (callbackError) {
    // eslint-disable-next-line no-console
    console.error("[AdminRateRequests] Transporter callback failed:", callbackError);
  }
}

/* --------------------------------------------------- Source switcher -- */

function RequestSourceSwitcher({ value, onChange, counts }) {
  const refs = useRef([]);
  const activeIndex = Math.max(0, REQUEST_SOURCES.findIndex(item => item.value === value));

  const handleKeyDown = (event, index) => {
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % REQUEST_SOURCES.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + REQUEST_SOURCES.length) % REQUEST_SOURCES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = REQUEST_SOURCES.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(REQUEST_SOURCES[next].value);
    if (refs.current[next]) refs.current[next].focus();
  };

  return (
    <div className="rq-src" role="tablist" aria-label="Request source">
      <span
        className="rq-src-glider"
        style={{ transform: "translateX(" + activeIndex * 100 + "%)" }}
        aria-hidden="true"
      />
      {REQUEST_SOURCES.map((item, index) => {
        const active = item.value === value;
        const count = counts[item.value];
        return (
          <button
            key={item.value}
            ref={node => {
              refs.current[index] = node;
            }}
            id={"rq-src-tab-" + item.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="rq-src-panel"
            tabIndex={active ? 0 : -1}
            className={"rq-src-opt" + (active ? " active" : "")}
            onClick={() => onChange(item.value)}
            onKeyDown={event => handleKeyDown(event, index)}
          >
            <span className="rq-src-icon">
              <Icon name={item.icon} size={16} strokeWidth={1.9} />
            </span>
            <span className="rq-src-label">{item.label}</span>
            {typeof count === "number" ? (
              <span className="rq-src-count" aria-label={count + " requests"}>{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------ Transporter pieces -- */

function TransporterStatusBadge({ request }) {
  const icon = request.status === "accepted" ? "check" : request.status === "rejected" ? "x" : null;
  return (
    <span className={"rq-tr-badge s-" + request.status}>
      {request.status === "new" ? (
        <i className="rq-tr-live" aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={11} strokeWidth={2.6} />
      ) : null}
      <span>{request.statusLabel}</span>
    </span>
  );
}

function ResponseWindow({ request, now }) {
  if (request.status === "accepted") {
    return (
      <div className="rq-tr-window done s-accepted">
        <span className="rq-tr-window-label">Response window</span>
        <strong><Icon name="check" size={13} strokeWidth={2.4} />Request accepted</strong>
      </div>
    );
  }
  if (request.status === "rejected") {
    return (
      <div className="rq-tr-window done s-rejected">
        <span className="rq-tr-window-label">Response window</span>
        <strong><Icon name="x" size={13} strokeWidth={2.4} />Request rejected</strong>
      </div>
    );
  }
  if (request.status !== "new") {
    return (
      <div className="rq-tr-window done">
        <span className="rq-tr-window-label">Response window</span>
        <strong>Status not recognised</strong>
      </div>
    );
  }
  if (request.deadline === null) {
    return (
      <div className="rq-tr-window done muted">
        <span className="rq-tr-window-label">Response window</span>
        <strong><Icon name="clock" size={13} />Response deadline not provided</strong>
      </div>
    );
  }

  const remaining = request.deadline - now;
  const level = responseLevel(remaining);
  if (level === "closed") {
    return (
      <div className="rq-tr-window done lvl-closed">
        <span className="rq-tr-window-label">Response window</span>
        <strong><Icon name="flag" size={13} />Response window closed</strong>
      </div>
    );
  }

  const parts = splitDuration(remaining);
  const spoken =
    parts.hours + " hours " + parts.minutes + " minutes " + parts.seconds + " seconds remaining";
  return (
    <div className={"rq-tr-window live lvl-" + level}>
      <span className="rq-tr-window-label">
        <i className="rq-tr-window-pip" aria-hidden="true" />
        Response window
        {level === "critical" ? <em>Critical</em> : level === "urgent" ? <em>Urgent</em> : null}
      </span>
      <span className="rq-tr-timer" role="timer" aria-live="off" aria-label={spoken}>
        <b>{parts.hh}</b><i>:</i><b>{parts.mm}</b><i>:</i><b>{parts.ss}</b>
      </span>
    </div>
  );
}

function TransporterRequestCard({ request, now, index, onView }) {
  const hasQuantity = request.quantity !== null;
  const hasSeller = Boolean(request.sellerName || request.sellerId);
  const requestedLabel = formatIndianDateTime(request.requestedAt);
  const initials = (request.transporterName || "T")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join("");
  const liveLevel =
    request.status === "new" && request.deadline !== null ? responseLevel(request.deadline - now) : "idle";

  return (
    <article
      className={"rq-tr-card s-" + request.status + " lvl-" + liveLevel}
      style={{ animationDelay: Math.min(index, 12) * 55 + "ms" }}
      aria-label={"Transporter request " + (request.id || "without ID")}
    >
      <span className="rq-tr-rail" aria-hidden="true" />
      <span className="rq-tr-mesh" aria-hidden="true" />
      <span className="rq-tr-glow" aria-hidden="true" />

      {/* Header */}
      <header className="rq-tr-head">
        <div className="rq-tr-idblock">
          <span className="rq-tr-kicker">Transporter Request ID</span>
          <span className={"rq-tr-id" + (request.id ? "" : " rq-missing")}>
            {request.id || "Request ID unavailable"}
          </span>
        </div>
        <TransporterStatusBadge request={request} />
      </header>

      {/* Identity */}
      <section className="rq-tr-identity" aria-label="Transporter">
        <span className="rq-tr-avatar" aria-hidden="true">
          <Icon name="truck" size={18} strokeWidth={1.8} />
          <em>{initials}</em>
        </span>
        <div className="rq-tr-identity-text">
          <span className="rq-tr-kicker">Transporter</span>
          <strong className={request.transporterName ? "" : "rq-missing"}>
            {request.transporterName || "Transporter name not provided"}
          </strong>
          <span className="rq-tr-subline">
            {request.transporterId ? <span className="rq-tr-tag mono">{request.transporterId}</span> : null}
            {request.ownerName ? (
              <span className="rq-tr-owner"><Icon name="user" size={11} />{request.ownerName}</span>
            ) : null}
          </span>
        </div>
      </section>

      {/* Request */}
      <section className="rq-tr-grid" aria-label="Request details">
        <div className="rq-tr-cell material">
          <span className="rq-tr-cell-icon"><Icon name="cube" size={14} /></span>
          <div className="rq-tr-cell-body">
            <span className="rq-tr-kicker">Material</span>
            <strong className={request.materialName ? "" : "rq-missing"}>
              {request.materialName || "Material not provided"}
            </strong>
            <span className={"rq-tr-qty" + (hasQuantity ? "" : " rq-missing")}>
              {hasQuantity ? (
                <>
                  <b>{formatQuantity(request.quantity)}</b>
                  {request.quantityUnit ? " " + request.quantityUnit : ""}
                </>
              ) : (
                "Quantity not provided"
              )}
            </span>
          </div>
        </div>
        <div className="rq-tr-cell seller">
          <span className="rq-tr-cell-icon"><Icon name="scale" size={14} /></span>
          <div className="rq-tr-cell-body">
            <span className="rq-tr-kicker">Seller</span>
            {hasSeller ? (
              <>
                <strong className={request.sellerName ? "" : "rq-missing"}>
                  {request.sellerName || "Seller name not provided"}
                </strong>
                {request.sellerId ? <span className="rq-tr-tag mono">{request.sellerId}</span> : null}
              </>
            ) : (
              <strong className="rq-missing">Seller not assigned</strong>
            )}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="rq-tr-location" aria-label="Pickup location">
        <span className="rq-tr-pin" aria-hidden="true"><Icon name="pin" size={14} /></span>
        <div>
          <span className="rq-tr-kicker">Pickup location</span>
          <p className={request.pickupLocation ? "" : "rq-missing"}>
            {request.pickupLocation || "Pickup location not provided"}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="rq-tr-foot">
        <div className="rq-tr-foot-row">
          <div className="rq-tr-requested">
            <span className="rq-tr-window-label"><Icon name="calendar" size={12} />Requested at</span>
            <strong className={requestedLabel ? "" : "rq-missing"}>
              {requestedLabel || "Requested time not available"}
            </strong>
          </div>
          <ResponseWindow request={request} now={now} />
        </div>
        <button type="button" className="rq-tr-view" onClick={() => onView(request)}>
          <Icon name="doc" size={15} />
          <span>View Request</span>
          <span className="rq-tr-view-arrow"><Icon name="arrow" size={14} strokeWidth={2.1} /></span>
        </button>
      </footer>
    </article>
  );
}

function TransporterSkeletonCard() {
  return (
    <div className="rq-tr-card rq-tr-skeleton" aria-hidden="true">
      <span className="rq-tr-rail" />
      <div className="rq-tr-sk-row">
        <div className="sk tr-sk-id" />
        <div className="sk tr-sk-badge" />
      </div>
      <div className="rq-tr-sk-row start">
        <div className="sk tr-sk-avatar" />
        <div className="tr-sk-stack">
          <div className="sk tr-sk-line w60" />
          <div className="sk tr-sk-line w35" />
        </div>
      </div>
      <div className="sk tr-sk-block" />
      <div className="sk tr-sk-line w90" />
      <div className="rq-tr-sk-row">
        <div className="sk tr-sk-timer" />
        <div className="sk tr-sk-timer" />
      </div>
      <div className="sk tr-sk-button" />
    </div>
  );
}

function TransporterSummary({ items }) {
  const total = items.length;
  const tally = { new: 0, accepted: 0, rejected: 0 };
  items.forEach(item => {
    if (tally[item.status] !== undefined) tally[item.status] += 1;
  });
  const tiles = [
    { key: "total", label: "Total", value: total, icon: "truck", hint: "Transporter requests" },
    { key: "new", label: "New", value: tally.new, icon: "pulse", hint: "Awaiting response" },
    { key: "accepted", label: "Accepted", value: tally.accepted, icon: "check", hint: "Approved" },
    { key: "rejected", label: "Rejected", value: tally.rejected, icon: "x", hint: "Declined" }
  ];
  return (
    <div className="rq-tr-summary" aria-label="Transporter request summary">
      {tiles.map(tile => {
        const share = total ? Math.round((tile.value / total) * 100) : 0;
        return (
          <article key={tile.key} className={"rq-tr-stat t-" + tile.key}>
            <div className="rq-tr-stat-head">
              <span className="rq-tr-stat-icon"><Icon name={tile.icon} size={14} strokeWidth={2} /></span>
              <span>{tile.label}</span>
            </div>
            <strong>{tile.value}</strong>
            <span className="rq-tr-stat-hint">
              {tile.key === "total" ? tile.hint : share + "% · " + tile.hint}
            </span>
            <span className="rq-tr-stat-bar" aria-hidden="true">
              <i style={{ width: (tile.key === "total" ? (total ? 100 : 0) : share) + "%" }} />
            </span>
          </article>
        );
      })}
    </div>
  );
}

function TransporterRequestsView({
  items,
  loading,
  error,
  query,
  setQuery,
  status,
  setStatus,
  sort,
  setSort,
  onRefresh,
  onView,
  onSwitchToBuyer
}) {
  const [now, setNow] = useState(() => Date.now());
  const searchRef = useRef(null);

  const hasLiveTimers = useMemo(
    () => items.some(item => item.status === "new" && item.deadline !== null),
    [items]
  );

  useEffect(() => {
    if (!hasLiveTimers) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasLiveTimers]);

  const statusCounts = useMemo(() => {
    const result = { all: items.length, new: 0, accepted: 0, rejected: 0 };
    items.forEach(item => {
      if (result[item.status] !== undefined) result[item.status] += 1;
    });
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = items.filter(item => {
      if (status !== "all" && item.status !== status) return false;
      if (!needle) return true;
      return [item.id, item.transporterName, item.transporterId, item.ownerName, item.sellerName, item.sellerId, item.materialName, item.pickupLocation]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(needle));
    });
    const byTime = (a, b, dir) => {
      if (a.requestedAt === null && b.requestedAt === null) return 0;
      if (a.requestedAt === null) return 1;
      if (b.requestedAt === null) return -1;
      return dir * (a.requestedAt - b.requestedAt);
    };
    return [...matched].sort((a, b) => {
      if (sort === "oldest") return byTime(a, b, 1);
      if (sort === "name") {
        const an = a.transporterName || "";
        const bn = b.transporterName || "";
        if (!an && bn) return 1;
        if (an && !bn) return -1;
        return an.localeCompare(bn, "en-IN", { sensitivity: "base" });
      }
      if (sort === "ending") {
        const aLive = a.status === "new" && a.deadline !== null;
        const bLive = b.status === "new" && b.deadline !== null;
        if (aLive && bLive) return a.deadline - b.deadline;
        if (aLive !== bLive) return aLive ? -1 : 1;
        return byTime(a, b, -1);
      }
      return byTime(a, b, -1);
    });
  }, [items, query, status, sort]);

  const filtersActive = query.trim() !== "" || status !== "all";
  const sortLabel = (TR_SORTS.find(item => item.value === sort) || TR_SORTS[0]).label;

  let content;
  if (error) {
    content = (
      <section className="rq-state error rq-tr-state" role="alert" aria-live="assertive">
        <span className="rq-state-icon"><Icon name="alert" size={21} /></span>
        <h2>Unable to load Transporter requests</h2>
        <p>{String(error)}</p>
        <div className="rq-tr-state-actions">
          <button type="button" className="rq-btn" onClick={onRefresh}>
            <Icon name="refresh" size={14} />Retry
          </button>
          <button type="button" className="rq-btn ghost" onClick={onSwitchToBuyer}>
            <Icon name="user" size={14} />Switch to By Buyer
          </button>
        </div>
      </section>
    );
  } else if (loading) {
    content = (
      <section className="rq-tr-list" role="status" aria-live="polite" aria-label="Loading Transporter requests">
        <span className="rq-sr-only">Loading Transporter requests…</span>
        <TransporterSkeletonCard />
        <TransporterSkeletonCard />
        <TransporterSkeletonCard />
      </section>
    );
  } else if (items.length === 0) {
    content = (
      <section className="rq-state rq-tr-state rq-tr-empty">
        <span className="rq-tr-empty-art" aria-hidden="true">
          <span className="ring one" />
          <span className="ring two" />
          <span className="core"><Icon name="truck" size={24} strokeWidth={1.7} /></span>
        </span>
        <h2>No Transporter requests available</h2>
        <p>Requests submitted by Transporters will appear here when Transporter Request integration is connected.</p>
        <div className="rq-tr-state-actions">
          <button type="button" className="rq-btn" onClick={onRefresh}>
            <Icon name="refresh" size={14} />Refresh
          </button>
          <button type="button" className="rq-btn ghost" onClick={onSwitchToBuyer}>
            <Icon name="user" size={14} />Switch to By Buyer
          </button>
        </div>
      </section>
    );
  } else if (visible.length === 0) {
    content = (
      <section className="rq-state rq-tr-state">
        <span className="rq-state-icon"><Icon name="search" size={21} /></span>
        <h2>No Transporter requests match the selected filters</h2>
        <p>Try another Request ID, Transporter, Seller, material or pickup location.</p>
        <div className="rq-tr-state-actions">
          {query.trim() ? (
            <button type="button" className="rq-btn ghost" onClick={() => setQuery("")}>
              <Icon name="close" size={13} />Clear search
            </button>
          ) : null}
          <button
            type="button"
            className="rq-btn"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setSort("newest");
            }}
          >
            Reset filters
          </button>
        </div>
      </section>
    );
  } else {
    content = (
      <section className="rq-tr-list" aria-label="Transporter requests">
        {visible.map((item, index) => (
          <TransporterRequestCard key={item.key} request={item} now={now} index={index} onView={onView} />
        ))}
      </section>
    );
  }

  return (
    <div className="rq-tr-view-root">
      {!loading && !error && items.length > 0 ? <TransporterSummary items={items} /> : null}

      <section className="rq-toolbar rq-tr-toolbar" aria-label="Search, filter and sort Transporter requests">
        <div className="rq-toolbar-top">
          <label className="rq-search">
            <Icon name="search" size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by Request ID, Transporter, Seller, material, or pickup location"
              aria-label="Search Transporter requests"
            />
            {query ? (
              <button
                className="rq-search-clear"
                type="button"
                onClick={() => {
                  setQuery("");
                  if (searchRef.current) searchRef.current.focus();
                }}
                aria-label="Clear Transporter search"
              >
                <Icon name="close" size={13} />
              </button>
            ) : null}
          </label>
          <div className="rq-toolbar-actions">
            <label className="rq-select-wrap" aria-label="Sort Transporter requests">
              <Icon name="sort" size={14} />
              <select className="rq-select" value={sort} onChange={event => setSort(event.target.value)}>
                {TR_SORTS.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="rq-filters" role="group" aria-label="Transporter request status">
          {TR_STATUS_FILTERS.map(item => (
            <button
              key={item.value}
              type="button"
              aria-pressed={status === item.value}
              className={"rq-filter s-" + item.cls + (status === item.value ? " active" : "")}
              onClick={() => setStatus(item.value)}
            >
              <i className="rq-filter-pip" />
              {item.label}
              {!loading && !error ? <span>{statusCounts[item.value]}</span> : null}
            </button>
          ))}
        </div>
      </section>

      <div className="rq-resultbar">
        <span className="rq-result-count">
          <Icon name="truck" size={13} />
          {loading
            ? "Loading Transporter requests"
            : error
              ? "Transporter requests unavailable"
              : visible.length + " Transporter request" + (visible.length === 1 ? "" : "s")}
        </span>
        <span className="rq-result-scope">
          {status === "all" ? "All statuses" : (TR_STATUS_FILTERS.find(item => item.value === status) || {}).label}
          <em>·</em>
          {sortLabel}
          {filtersActive && !loading && !error ? <em>·</em> : null}
          {filtersActive && !loading && !error ? "Filtered" : null}
        </span>
      </div>

      {content}
    </div>
  );
}

/* ------------------------------------------------------- Page component -- */

export default function AdminRateRequests({
  onBack,
  onOpenRequest,
  onHome,
  onOrders,
  onSamples,
  onTransporterBidding,
  onRateRequests,
  onConfirmedOrders,
  /* Transporter Requests — frontend-only, ready for future integration */
  transporterRequests = [],
  transporterLoading = false,
  transporterError = "",
  onRefreshTransporterRequests = () => {},
  onViewTransporterRequest = () => {}
}) {
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [activeNav, setActiveNav] = useState("Requests");
  
  const [sort, setSort] = useState("urgent");
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(() => Date.now());
  const toastTimer = useRef(null);
  const searchRef = useRef(null);

  /* ---- Transporter view state (kept separate from Buyer state) ---- */
  const [requestSource, setRequestSource] = useState("buyer");
  const [transporterQuery, setTransporterQuery] = useState("");
  const [transporterStatus, setTransporterStatus] = useState("all");
  const [transporterSort, setTransporterSort] = useState("newest");

  const transporterItems = useMemo(() => {
    const list = Array.isArray(transporterRequests) ? transporterRequests : [];
    const receivedAt = Date.now();
    return list.map((item, index) => normalizeTransporterRequest(item, receivedAt, index));
  }, [transporterRequests]);

  const sourceCounts = {
    buyer: loading || error ? undefined : requests.length,
    transporter:
      transporterLoading || transporterError || !Array.isArray(transporterRequests)
        ? undefined
        : transporterItems.length
  };

  const handleRefreshTransporter = () => safeInvoke(onRefreshTransporterRequests);
  const handleViewTransporter = item => safeInvoke(onViewTransporterRequest, item.raw);
  const isTransporterView = requestSource === "transporter";

  useEffect(() => {
  let isActive = true;

  async function loadRateRequests() {
    setLoading(true);
    setError("");

    try {
      const liveRequests =
        await getAdminRateRequests();

      if (isActive) {
        setRequests(liveRequests);
        setRefreshedAt(Date.now());
      }
    } catch (loadError) {
      if (isActive) {
        setError(
          loadError.message ||
            "Unable to load rate requests."
        );
      }
    } finally {
      if (isActive) {
        setLoading(false);
      }
    }
  }

  loadRateRequests();

  return () => {
    isActive = false;
  };
}, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const handleVisibility = () => {
      if (!document.hidden) setNow(Date.now());
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback(message => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const counts = useMemo(() => {
    const result = {
      ALL: 0,
      NEW: 0,
      "RATE PROVIDED": 0,
      ACCEPTED: 0,
      REJECTED: 0,
      EXPIRED: 0,
    };
  
    requests.forEach(request => {
      const passesDate =
        matchesDateFilter(
          request,
          dateFilter,
          now
        );
  
      if (!passesDate) {
        return;
      }
  
      const status =
        effectiveStatus(
          request,
          now
        );
  
      result.ALL += 1;
      result[status] += 1;
    });
  
    return result;
  }, [
    requests,
    dateFilter,
    now,
  ]);

  const stats = useMemo(() => {
    const live = requests.filter(request => {
      const status = effectiveStatus(request, now);
      return status === "NEW" || status === "RATE PROVIDED";
    });
    const critical = live.filter(request => {
      const deadline = getDeadline(request);
      return deadline && urgencyLevel(effectiveStatus(request, now), deadline - now) === "critical";
    }).length;
    const tons = requests.reduce((sum, request) => sum + totalTons(request), 0);
    const decided = requests.filter(request => {
      const status = effectiveStatus(request, now);
      return status === "ACCEPTED" || status === "REJECTED";
    });
    const accepted = decided.filter(request => effectiveStatus(request, now) === "ACCEPTED").length;
    const winRate = decided.length ? Math.round((accepted / decided.length) * 100) : 0;
    return { live: live.length, critical, tons, winRate };
  }, [requests, now]);

  const visibleRequests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = requests.filter(request => {
      const status = effectiveStatus(request, now);
      const passesFilter = filter === "ALL" || status === filter;
      const passesDate =
  matchesDateFilter(
    request,
    dateFilter,
    now
  );
      const materialText = request.materials.map(item => item.materialName).join(" ").toLowerCase();
      const passesSearch =
        !normalized ||
        request.requestId.toLowerCase().includes(normalized) ||
        request.deliveryArea.toLowerCase().includes(normalized) ||
        request.buyer.toLowerCase().includes(normalized) ||
        materialText.includes(normalized);
        return (
          passesFilter &&
          passesDate &&
          passesSearch
        );
    });

    return [...matched].sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "quantity") return totalTons(b) - totalTons(a);
      const aStatus = effectiveStatus(a, now);
      const bStatus = effectiveStatus(b, now);
      const aActive = aStatus === "NEW" || aStatus === "RATE PROVIDED";
      const bActive = bStatus === "NEW" || bStatus === "RATE PROVIDED";
      if (aActive && bActive) return getDeadline(a) - getDeadline(b);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return new Date(statusTimestamp(b, bStatus)) - new Date(statusTimestamp(a, aStatus));
    });
  }, [
    requests,
    query,
    filter,
    dateFilter,
    sort,
    now,
  ]);

  const handleRefresh = async () => {
  setLoading(true);
  setError("");

  try {
    const liveRequests =
      await getAdminRateRequests();

    const refreshed = Date.now();

    setRequests(liveRequests);
    setNow(refreshed);
    setRefreshedAt(refreshed);
    showToast("Rate requests synced");
  } catch (refreshError) {
    setError(
      refreshError.message ||
        "Unable to refresh rate requests."
    );
  } finally {
    setLoading(false);
  }
};

  const handleOpen = request => {
    if (onOpenRequest) onOpenRequest(request);
    else showToast("Opening " + request.requestId);
  };

  const handleNav = (key, callback, fallbackLabel) => {
    setActiveNav(key);
    if (callback) callback();
    else showToast(fallbackLabel + " selected");
  };

  const navItems = [
    { key: "Samples", label: "Samples", icon: "cubes", action: onSamples },
    {
      key: "Bidding",
      label: "Transport",
      icon: "truckNav",
      action: onTransporterBidding,
      dot: true
    },
    { key: "Home", label: "Home", icon: "home", action: onHome },
    {
      key: "Requests",
      label: "Rates",
      icon: "docNav",
      action: onRateRequests || onOrders,
      dot: true
    },
    {
      key: "Orders",
      label: "Orders",
      icon: "clipboardCheck",
      action: onConfirmedOrders
    }
  ];

  const activeNavIndex = Math.max(
    0,
    navItems.findIndex(item => item.key === activeNav)
  );

  const retry = async () => {
  setError("");
  setLoading(true);

  try {
    const liveRequests =
      await getAdminRateRequests();

    const refreshed = Date.now();

    setRequests(liveRequests);
    setNow(refreshed);
    setRefreshedAt(refreshed);
  } catch (retryError) {
    setError(
      retryError.message ||
        "Unable to load rate requests."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="rq-root">
      <style>{STYLES}</style>

      <div className="rq-bg" aria-hidden="true">
        <span className="rq-bg-grid" />
        <span className="rq-bg-orb one" />
        <span className="rq-bg-orb two" />
        <span className="rq-bg-scan" />
      </div>

      {/* ============================ HEADER ============================ */}
      <header className="rq-header">
        <div className="rq-header-inner">
          <div className="rq-header-row">
            <button
              className="rq-iconbtn"
              type="button"
              onClick={() => (onBack ? onBack() : showToast("Back navigation"))}
              aria-label="Go back"
            >
              <Icon name="back" size={18} />
            </button>

            <div className="rq-brand">
              <span className="rq-brand-mark">
                <Icon name="samples" size={17} strokeWidth={1.9} />
                <i className="rq-brand-ping" />
              </span>
              <span className="rq-brand-text">
                <span className="rq-brand-name">StoneRate</span>
                <span className="rq-brand-role">Rate Desk</span>
              </span>
            </div>

            <span className="rq-livechip">
              <i className="rq-livepip" />
              LIVE
            </span>

            <button
              className={
                "rq-iconbtn rq-refresh" +
                ((isTransporterView ? transporterLoading : loading) ? " spinning" : "")
              }
              type="button"
              onClick={isTransporterView ? handleRefreshTransporter : handleRefresh}
              disabled={isTransporterView ? transporterLoading : loading}
              aria-label={isTransporterView ? "Refresh Transporter requests" : "Refresh rate requests"}
            >
              <Icon name="refresh" size={18} />
            </button>
          </div>

          <div className="rq-hero">
            <h1 className="rq-hero-title">
              Rate <span>Requests</span>
            </h1>
            <p className="rq-hero-sub">
              Review buyer demand and publish material-wise rates before the window closes.
            </p>
            <span className="rq-hero-meta">
              <span className="rq-hero-pip" />
              {loading ? "Syncing request queue…" : "Synced " + relativeTime(new Date(refreshedAt).toISOString(), now)}
              <em>·</em>
              {clockTime(new Date(refreshedAt).toISOString())}
            </span>
          </div>

          {/* ------------------- Request source switcher ------------------- */}
          <RequestSourceSwitcher
            value={requestSource}
            onChange={setRequestSource}
            counts={sourceCounts}
          />

          {!isTransporterView ? (
          <div className="rq-metrics">
            <Metric
              icon="pulse"
              tone="orange"
              label="Live queue"
              value={stats.live}
              unit=" open"
              hint="Awaiting action"
              bars={[38, 62, 44, 80, 55, 92]}
            />
            <Metric
              icon="bolt"
              tone="red"
              label="Critical"
              value={stats.critical}
              unit=" urgent"
              hint="Closing in <30m"
              bars={[20, 34, 26, 58, 40, 74]}
            />
            <Metric
              icon="scale"
              tone="slate"
              label="Volume"
              value={stats.tons}
              unit=" t"
              hint="Across all requests"
              bars={[46, 30, 68, 52, 84, 60]}
            />
            <Metric
              icon="target"
              tone="green"
              label="Win rate"
              value={stats.winRate}
              unit="%"
              hint="Accepted vs decided"
              bars={[30, 48, 40, 66, 58, 88]}
            />
          </div>
          ) : null}
        </div>
      </header>

      {/* ============================= SHELL ============================ */}
      <main
        className="rq-shell"
        id="rq-src-panel"
        role="tabpanel"
        aria-labelledby={"rq-src-tab-" + requestSource}
      >
        {isTransporterView ? (
          <TransporterRequestsView
            items={transporterItems}
            loading={transporterLoading}
            error={transporterError}
            query={transporterQuery}
            setQuery={setTransporterQuery}
            status={transporterStatus}
            setStatus={setTransporterStatus}
            sort={transporterSort}
            setSort={setTransporterSort}
            onRefresh={handleRefreshTransporter}
            onView={handleViewTransporter}
            onSwitchToBuyer={() => setRequestSource("buyer")}
          />
        ) : (
        <>
        {/* ---------------------- Command toolbar ---------------------- */}
        <section className="rq-toolbar" aria-label="Search, filter and sort rate requests">
          <Corners />
          <div className="rq-toolbar-top">
            <label className="rq-search">
              <Icon name="search" size={16} />
              <input
                ref={searchRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search request ID, buyer, material or area"
                aria-label="Search requests"
              />
              {query ? (
                <button
                  className="rq-search-clear"
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
                <kbd className="rq-kbd">⌘K</kbd>
              )}
            </label>

            <div className="rq-toolbar-actions">
              <label className="rq-select-wrap" aria-label="Sort requests">
                <Icon name="sort" size={14} />
                <select
                  className="rq-select"
                  value={sort}
                  onChange={event => setSort(event.target.value)}
                >
                  <option value="urgent">Urgent first</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="quantity">Highest quantity</option>
                </select>
              </label>

              
            </div>
          </div>

          <div className="rq-filters" role="tablist" aria-label="Request status">
            {FILTERS.map(item => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={filter === item}
                className={"rq-filter s-" + (STATUS_CLASS[item] || "all") + (filter === item ? " active" : "")}
                onClick={() => setFilter(item)}
              >
                <i className="rq-filter-pip" />
                {FILTER_LABELS[item]}
                <span>{counts[item]}</span>
              </button>
            ))}
            <label
  className={
    "rq-date-filter" +
    (dateFilter !== "ALL" ? " active" : "")
  }
  aria-label="Filter by request date"
>
  <Icon name="calendar" size={14} />

  <select
    value={dateFilter}
    onChange={event =>
      setDateFilter(event.target.value)
    }
  >
    <option value="ALL">Any date</option>
    <option value="TODAY">Today</option>
    <option value="7_DAYS">Last 7 days</option>
    <option value="30_DAYS">Last 30 days</option>
    <option value="90_DAYS">Last 3 months</option>
  </select>
</label>
          </div>
        </section>

        {/* ------------------------- Result bar ------------------------ */}
        <div className="rq-resultbar">
          <span className="rq-result-count">
            <Icon name="spark" size={13} />
            {loading
              ? "Loading queue"
              : visibleRequests.length + " request" + (visibleRequests.length === 1 ? "" : "s")}
          </span>
          <span className="rq-result-scope">
            {filter === "ALL" ? "All statuses" : FILTER_LABELS[filter]}
            <em>·</em>
            {sort === "urgent" ? "Urgent first" : sort === "newest" ? "Newest" : sort === "oldest" ? "Oldest" : "By tonnage"}
          </span>
        </div>

        {/* --------------------------- Content ------------------------- */}
        {error ? (
          <section className="rq-state error">
            <Corners />
            <span className="rq-state-icon"><Icon name="alert" size={21} /></span>
            <h2>Could not load rate requests</h2>
            <p>{error}</p>
            <button type="button" className="rq-btn" onClick={retry}>
              Retry sync
            </button>
          </section>
        ) : loading ? (
          <section className={"rq-list"} aria-label="Loading requests">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </section>
        ) : visibleRequests.length === 0 ? (
          <section className="rq-state">
            <Corners />
            <span className="rq-state-icon"><Icon name="inbox" size={21} /></span>
            <h2>{query.trim() ? "No matches for “" + query.trim() + "”" : "No requests in this view"}</h2>
            <p>
              {query.trim()
                ? "Try a different request ID, buyer, material or delivery area."
                : "Switch to another status filter to review available requests."}
            </p>
            {query.trim() ? (
              <button type="button" className="rq-btn" onClick={() => setQuery("")}>
                Clear search
              </button>
            ) : null}
          </section>
        ) : (
          <section className={"rq-list"} aria-label="Rate requests">
            {visibleRequests.map((request, index) => (
              <RequestCard
                key={request.requestId}
                request={request}
                now={now}
                onOpen={handleOpen}
                index={index}
                
              />
            ))}
          </section>
        )}
        </>
        )}
      </main>

      {/* ======================== FLAT BOTTOM NAV ======================== */}
      <nav className="rq-bottomnav" aria-label="Admin primary navigation">
        <span
          className="rq-nav-selection"
          style={{ transform: `translateX(${activeNavIndex * 100}%)` }}
          aria-hidden="true"
        />

        {navItems.map(item => {
          const isActive = activeNav === item.key;

          return (
            <button
              key={item.key}
              className={"rq-navitem" + (isActive ? " active" : "")}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleNav(item.key, item.action, item.label)}
            >
              <span className="rq-nav-icon">
                <Icon name={item.icon} size={17} strokeWidth={1.8} />
                {item.dot ? <i className="rq-nav-notice" aria-hidden="true" /> : null}
              </span>
              <span className="rq-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={"rq-toast" + (toast ? " show" : "")} role="status" aria-live="polite">
        <span className="rq-toast-pip" />
        {toast}
      </div>
    </div>
  );
}

/* ===========================================================================
 * Styles — white canvas + signal orange, matching AdminDashboard tokens.
 * ========================================================================= */

const STYLES = `
.rq-root{
  --rq-orange:#f97316;
  --rq-orange-600:#ea6a0a;
  --rq-orange-700:#c2560b;
  --rq-orange-ink:#9a4408;
  --rq-orange-soft:rgba(249,115,22,.10);
  --rq-orange-soft2:rgba(249,115,22,.18);
  --rq-amber:#e08b1e;
  --rq-amber-ink:#a15c07;
  --rq-amber-soft:rgba(224,139,30,.12);
  --rq-green:#1f9463;
  --rq-green-ink:#0f7a4c;
  --rq-green-soft:rgba(31,148,99,.12);
  --rq-red:#d64545;
  --rq-red-ink:#b42318;
  --rq-red-soft:rgba(214,69,69,.10);
  --rq-ink:#141a24;
  --rq-ink-2:#3b4658;
  --rq-muted:#6b7687;
  --rq-faint:#96a0af;
  --rq-line:#e9edf3;
  --rq-line-2:#dbe2ec;
  --rq-white:#ffffff;
  --rq-glass:rgba(255,255,255,.78);
  --rq-glass-2:rgba(255,255,255,.92);
  --rq-mono:"SF Mono",ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace;
  position:relative;
  isolation:isolate;
  min-height:100dvh;
  padding-bottom:86px;
  color:var(--rq-ink);
  background:#f4f7fb;
  font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
.rq-root *{box-sizing:border-box}
.rq-root button{font-family:inherit}

/* ---------------------------------------------------------- background -- */
.rq-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;background:#f4f7fb}
.rq-bg-grid{position:absolute;inset:0;
  background:
    linear-gradient(transparent 0 31px,rgba(24,42,72,.035) 31px 32px),
    linear-gradient(90deg,transparent 0 31px,rgba(24,42,72,.035) 31px 32px);
  background-size:32px 32px;
  -webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%);
  mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%)}
.rq-bg-orb{position:absolute;border-radius:50%;filter:blur(58px);opacity:.5}
.rq-bg-orb.one{width:44vw;height:44vw;max-width:520px;max-height:520px;left:-9vw;right:auto;top:-16vw;
  background:radial-gradient(circle,rgba(255,168,74,.55),transparent 66%)}
.rq-bg-orb.two{width:40vw;height:40vw;max-width:470px;max-height:470px;left:auto;right:-10vw;top:-6vw;
  background:radial-gradient(circle,rgba(80,140,255,.42),transparent 66%)}
.rq-bg-scan{position:absolute;width:36vw;height:36vw;max-width:420px;max-height:420px;left:34vw;top:26vw;
  border-radius:50%;filter:blur(58px);opacity:.5;
  background:radial-gradient(circle,rgba(13,148,136,.26),transparent 68%);
  -webkit-mask-image:none;mask-image:none}

  .rq-corners {
    display: none;
  }
/* --------------------------------------------------------------- header -- */
.rq-header{position:relative;border-bottom:1px solid rgba(16,28,50,.06);
  background:linear-gradient(180deg,rgba(244,247,251,.24),rgba(244,247,251,.05));
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.rq-header:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(80,140,255,.16),transparent);opacity:1}
.rq-header-inner{width:min(100%,1080px);margin:0 auto;padding:12px 14px 16px;position:relative;z-index:1}
.rq-header-row{display:flex;align-items:center;gap:10px}

.rq-iconbtn{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;cursor:pointer;
  border:1px solid var(--rq-line-2);border-radius:11px;color:var(--rq-ink-2);
  background:var(--rq-glass-2);
  box-shadow:0 2px 8px rgba(20,26,36,.05),inset 0 1px 0 #fff;
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,color .18s ease}
.rq-iconbtn:hover{transform:translateY(-1px);color:var(--rq-orange-700);
  border-color:rgba(249,115,22,.45);box-shadow:0 6px 18px rgba(249,115,22,.18)}
.rq-iconbtn:active{transform:translateY(0)}
.rq-iconbtn:disabled{opacity:.6;cursor:default;transform:none}
.rq-refresh svg{transition:transform .4s ease}
.rq-refresh:hover svg{transform:rotate(120deg)}
.rq-refresh.spinning svg{animation:rqSpin .9s linear infinite}
@keyframes rqSpin{to{transform:rotate(360deg)}}

.rq-brand{display:flex;align-items:center;gap:9px;min-width:0;flex:1}
.rq-brand-mark{position:relative;width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;
  border-radius:11px;color:#fff;
  background:linear-gradient(135deg,var(--rq-orange),var(--rq-orange-700));
  box-shadow:0 6px 16px rgba(249,115,22,.32),inset 0 1px 0 rgba(255,255,255,.35)}
.rq-brand-ping{position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;
  background:#22c55e;border:2px solid #fff;animation:rqPing 2.4s ease-in-out infinite}
@keyframes rqPing{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}
.rq-brand-text{display:flex;flex-direction:column;min-width:0}
.rq-brand-name{font-size:14px;font-weight:700;letter-spacing:-.01em;line-height:1.15;color:var(--rq-ink)}
.rq-brand-role{font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--rq-orange-700)}

.rq-livechip{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;
  padding:5px 9px;border-radius:999px;font-size:9.5px;font-weight:800;letter-spacing:.12em;
  color:var(--rq-green-ink);background:var(--rq-green-soft);border:1px solid rgba(31,148,99,.28)}
.rq-livepip{width:5px;height:5px;border-radius:50%;background:var(--rq-green);
  animation:rqBlink 1.8s ease-in-out infinite}
@keyframes rqBlink{0%,100%{opacity:1}50%{opacity:.25}}

.rq-hero{padding:16px 2px 0}
.rq-hero-title{margin:0;font-size:28px;line-height:1.08;letter-spacing:-.035em;font-weight:700;color:var(--rq-ink)}
.rq-hero-title span{background:linear-gradient(100deg,var(--rq-orange),#fbbf24 55%,var(--rq-orange-700));
  -webkit-background-clip:text;background-clip:text;color:transparent}
.rq-hero-sub{margin:7px 0 0;font-size:12.5px;line-height:1.5;color:var(--rq-muted);max-width:54ch}
.rq-hero-meta{display:inline-flex;align-items:center;gap:6px;margin-top:11px;
  padding:5px 10px;border-radius:999px;font-size:10.5px;font-weight:650;letter-spacing:.01em;
  color:var(--rq-orange-ink);background:var(--rq-orange-soft);border:1px solid rgba(249,115,22,.24)}
.rq-hero-meta em{font-style:normal;opacity:.45}
.rq-hero-pip{width:5px;height:5px;border-radius:50%;background:var(--rq-orange);
  box-shadow:0 0 0 3px rgba(249,115,22,.16)}

/* -------------------------------------------------------------- metrics -- */
.rq-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:16px}
.rq-metric{position:relative;overflow:hidden;padding:11px 12px 10px;border-radius:14px;
  border:1px solid var(--rq-line);background:var(--rq-glass-2);
  box-shadow:0 4px 14px rgba(20,26,36,.05),inset 0 1px 0 #fff;
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
  animation:rqRise .45s cubic-bezier(.2,.7,.3,1) both}
.rq-metric:hover{transform:translateY(-2px);border-color:rgba(249,115,22,.32);
  box-shadow:0 12px 26px rgba(20,26,36,.09)}
.rq-metric:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--rq-mtone,var(--rq-orange));opacity:.9}
.rq-metric.tone-orange{--rq-mtone:var(--rq-orange);--rq-mink:var(--rq-orange-ink);--rq-msoft:var(--rq-orange-soft)}
.rq-metric.tone-red{--rq-mtone:var(--rq-red);--rq-mink:var(--rq-red-ink);--rq-msoft:var(--rq-red-soft)}
.rq-metric.tone-green{--rq-mtone:var(--rq-green);--rq-mink:var(--rq-green-ink);--rq-msoft:var(--rq-green-soft)}
.rq-metric.tone-slate{--rq-mtone:#64748b;--rq-mink:#475569;--rq-msoft:rgba(100,116,139,.12)}
.rq-metric-head{display:flex;align-items:center;gap:6px}
.rq-metric-icon{width:22px;height:22px;flex:0 0 auto;display:grid;place-items:center;border-radius:7px;
  color:var(--rq-mink);background:var(--rq-msoft)}
.rq-metric-label{font-size:10px;font-weight:750;letter-spacing:.09em;text-transform:uppercase;color:var(--rq-muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rq-metric-value{margin-top:8px;font-size:23px;font-weight:700;letter-spacing:-.03em;line-height:1;
  color:var(--rq-ink);font-variant-numeric:tabular-nums}
.rq-metric-value em{font-style:normal;font-size:11px;font-weight:650;letter-spacing:0;color:var(--rq-muted);margin-left:2px}
.rq-metric-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:8px}
.rq-metric-hint{font-size:10px;color:var(--rq-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rq-spark{display:flex;align-items:flex-end;gap:2px;height:18px;flex:0 0 auto}
.rq-spark i{width:3px;border-radius:2px;background:var(--rq-mtone);opacity:.35}
.rq-spark i:last-child{opacity:.95}

/* ---------------------------------------------------------------- shell -- */
.rq-shell{width:min(100%,1080px);margin:0 auto;padding:16px 14px 24px;position:relative;z-index:1}

/* -------------------------------------------------------------- toolbar -- */
.rq-toolbar{position:relative;padding:11px;border-radius:16px;border:1px solid var(--rq-line);
  background:var(--rq-glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  box-shadow:0 8px 26px rgba(20,26,36,.06),inset 0 1px 0 #fff}
.rq-toolbar:before{content:"";position:absolute;inset:0;border-radius:16px;padding:1px;pointer-events:none;
  background:linear-gradient(120deg,rgba(249,115,22,.42),transparent 34%,transparent 66%,rgba(251,191,36,.34));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude}
  .rq-toolbar-top {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(95px, 1fr);    gap: 8px;
    align-items: center;
    min-width: 0;
  }

.rq-search{position:relative;flex:1;min-width:0;height:42px;display:flex;align-items:center;gap:8px;
  padding:0 10px;border-radius:12px;border:1px solid var(--rq-line-2);background:#fff;color:var(--rq-faint);
  transition:border-color .18s,box-shadow .18s,color .18s}
.rq-search:focus-within{border-color:rgba(249,115,22,.55);color:var(--rq-orange-700);
  box-shadow:0 0 0 3px rgba(249,115,22,.14)}
.rq-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:13px;color:var(--rq-ink)}
.rq-search input::placeholder{color:#a6b0bd}
.rq-search-clear{width:23px;height:23px;flex:0 0 auto;display:grid;place-items:center;padding:0;cursor:pointer;
  border:0;border-radius:7px;background:#eef1f6;color:#5c6878}
.rq-search-clear:hover{background:var(--rq-orange-soft);color:var(--rq-orange-700)}
.rq-kbd{flex:0 0 auto;padding:3px 6px;border-radius:6px;font-family:var(--rq-mono);font-size:9.5px;font-weight:600;
  color:var(--rq-faint);background:#f4f6f9;border:1px solid var(--rq-line-2)}

  .rq-toolbar-actions {
    display: block;
    width: 100%;
    min-width: 0;
  }
  .rq-select-wrap {
    position: relative;
    display: block;
    width: 100%;
    min-width: 0;
  }
.rq-select-wrap svg{position:absolute;left:9px;top:14px;pointer-events:none;color:var(--rq-muted)}
.rq-select {
  width: 100%;
  max-width: none;
  height: 42px;
  padding: 0 10px 0 29px;
  cursor: pointer;
  outline: none;
  border: 1px solid var(--rq-line-2);
  border-radius: 12px;
  background: #fff;
  color: var(--rq-ink);
  font-size: 11px;
  font-weight: 700;
  appearance: none;
  -webkit-appearance: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rq-select:focus {
  border-color: rgba(249, 115, 22, 0.5);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.13);
}
.rq-density{display:flex;gap:3px;padding:3px;border-radius:12px;border:1px solid var(--rq-line-2);background:#f6f8fb}
.rq-density-btn{width:32px;height:34px;display:grid;place-items:center;cursor:pointer;padding:0;
  border:0;border-radius:9px;background:transparent;color:var(--rq-faint);transition:.16s}
.rq-density-btn:hover{color:var(--rq-ink-2)}
.rq-density-btn.active{color:var(--rq-orange-700);background:#fff;
  box-shadow:0 2px 7px rgba(20,26,36,.10)}

.rq-filters{display:flex;gap:6px;margin-top:9px;padding:2px;overflow-x:auto;scrollbar-width:none}
.rq-filters::-webkit-scrollbar{display:none}
.rq-filter{position:relative;display:inline-flex;align-items:center;gap:6px;height:33px;flex:0 0 auto;
  padding:0 11px;cursor:pointer;white-space:nowrap;
  border:1px solid var(--rq-line-2);border-radius:10px;background:#fff;color:var(--rq-muted);
  font-size:11.5px;font-weight:700;letter-spacing:-.005em;transition:.18s}
.rq-filter:hover{color:var(--rq-ink);border-color:rgba(249,115,22,.35)}
.rq-filter span{padding:1px 5px;border-radius:5px;font-size:10px;font-weight:800;
  background:#f1f4f8;color:var(--rq-faint);font-variant-numeric:tabular-nums}
.rq-filter-pip{width:5px;height:5px;border-radius:50%;background:#c3cbd6}
.rq-filter.s-new .rq-filter-pip{background:var(--rq-orange)}
.rq-filter.s-provided .rq-filter-pip{background:var(--rq-amber)}
.rq-filter.s-accepted .rq-filter-pip{background:var(--rq-green)}
.rq-filter.s-rejected .rq-filter-pip{background:var(--rq-red)}
.rq-filter.s-expired .rq-filter-pip{background:#98a2b3}
.rq-filter.active{color:var(--rq-orange-ink);border-color:rgba(249,115,22,.5);
  background:linear-gradient(135deg,rgba(249,115,22,.14),rgba(251,191,36,.10));
  box-shadow:0 3px 12px rgba(249,115,22,.18),inset 0 -2px 0 var(--rq-orange)}
.rq-filter.active span{background:rgba(249,115,22,.18);color:var(--rq-orange-ink)}
.rq-date-filter {
  position: relative;
  height: 33px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid var(--rq-line-2);
  border-radius: 10px;
  background: #fff;
  color: var(--rq-muted);
  transition: 0.18s;
}

.rq-date-filter:hover {
  color: var(--rq-ink);
  border-color: rgba(249, 115, 22, 0.35);
}

.rq-date-filter svg {
  flex: 0 0 auto;
  color: var(--rq-faint);
}

.rq-date-filter select {
  height: 30px;
  min-width: 72px;
  max-width: 110px;
  padding: 0 2px;
  border: 0;
  outline: 0;
  cursor: pointer;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.rq-date-filter.active {
  color: var(--rq-orange-ink);
  border-color: rgba(249, 115, 22, 0.5);
  background: linear-gradient(
    135deg,
    rgba(249, 115, 22, 0.14),
    rgba(251, 191, 36, 0.1)
  );
  box-shadow:
    0 3px 12px rgba(249, 115, 22, 0.16),
    inset 0 -2px 0 var(--rq-orange);
}

.rq-date-filter.active svg {
  color: var(--rq-orange-700);
}

/* ------------------------------------------------------------ resultbar -- */
.rq-resultbar{display:flex;align-items:center;justify-content:space-between;gap:10px;
  margin:14px 3px 10px;font-size:11px;color:var(--rq-muted)}
.rq-result-count{display:inline-flex;align-items:center;gap:6px;font-weight:750;color:var(--rq-ink)}
.rq-result-count svg{color:var(--rq-orange)}
.rq-result-scope{display:inline-flex;align-items:center;gap:5px;font-weight:600;color:var(--rq-faint);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rq-result-scope em{font-style:normal;opacity:.5}

/* ----------------------------------------------------------------- list -- */
.rq-list{display:grid;gap:11px}
@keyframes rqRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

.rq-card{position:relative;overflow:hidden;cursor:pointer;padding:13px 13px 11px 16px;
  border:1px solid var(--rq-line);border-radius:16px;background:var(--rq-glass-2);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 4px 16px rgba(20,26,36,.055),inset 0 1px 0 #fff;
  transition:transform .22s cubic-bezier(.2,.7,.3,1),box-shadow .22s,border-color .22s;
  animation:rqRise .5s cubic-bezier(.2,.7,.3,1) both}
.rq-card:hover{transform:translateY(-3px);border-color:rgba(249,115,22,.34);
  box-shadow:0 18px 38px rgba(20,26,36,.11),0 0 0 1px rgba(249,115,22,.06)}
.rq-card:focus-visible,.rq-iconbtn:focus-visible,.rq-filter:focus-visible,
.rq-density-btn:focus-visible,.rq-btn:focus-visible,.rq-navitem:focus-visible{
  outline:2px solid rgba(249,115,22,.55);outline-offset:2px}

.rq-card-rail{position:absolute;left:0;top:0;bottom:0;width:4px;
  background:linear-gradient(180deg,var(--rq-orange),#fbbf24)}
.rq-card.status-provided .rq-card-rail{background:linear-gradient(180deg,#fbbf24,var(--rq-amber))}
.rq-card.status-accepted .rq-card-rail{background:linear-gradient(180deg,#34d399,var(--rq-green))}
.rq-card.status-rejected .rq-card-rail{background:linear-gradient(180deg,#f87171,var(--rq-red))}
.rq-card.status-expired .rq-card-rail{background:linear-gradient(180deg,#cbd5e1,#94a3b8)}

.rq-card-sheen{position:absolute;top:-60%;right:-30%;width:62%;height:150%;pointer-events:none;opacity:0;
  background:radial-gradient(circle,rgba(249,115,22,.16),transparent 68%);transition:opacity .3s}
.rq-card:hover .rq-card-sheen{opacity:1}
.rq-card-mesh{position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:linear-gradient(rgba(20,26,36,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(20,26,36,.035) 1px,transparent 1px);
  background-size:22px 22px;
  -webkit-mask-image:radial-gradient(ellipse 70% 90% at 100% 0%,#000,transparent 72%);
  mask-image:radial-gradient(ellipse 70% 90% at 100% 0%,#000,transparent 72%)}

.rq-card-head{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px}
.rq-id{display:inline-flex;align-items:center;gap:7px;min-width:0}
.rq-id-dot{width:6px;height:6px;flex:0 0 auto;border-radius:50%;background:var(--rq-orange);
  box-shadow:0 0 0 3px var(--rq-orange-soft)}
.rq-id-text{font-family:var(--rq-mono);font-size:12.5px;font-weight:600;letter-spacing:.02em;color:var(--rq-ink);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rq-badge{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:4px 8px;border-radius:7px;
  font-size:9px;line-height:1;font-weight:850;letter-spacing:.08em;border:1px solid}
.rq-badge-pip{width:4px;height:4px;border-radius:50%;background:currentColor}
.rq-badge.new{color:var(--rq-orange-ink);background:var(--rq-orange-soft);border-color:rgba(249,115,22,.34)}
.rq-badge.provided{color:var(--rq-amber-ink);background:var(--rq-amber-soft);border-color:rgba(224,139,30,.34)}
.rq-badge.accepted{color:var(--rq-green-ink);background:var(--rq-green-soft);border-color:rgba(31,148,99,.32)}
.rq-badge.rejected{color:var(--rq-red-ink);background:var(--rq-red-soft);border-color:rgba(214,69,69,.32)}
.rq-badge.expired{color:#64748b;background:#f1f4f8;border-color:var(--rq-line-2)}

.rq-buyer{position:relative;display:flex;align-items:center;gap:6px;margin-top:8px;
  font-size:11.5px;font-weight:600;color:var(--rq-muted);min-width:0}
.rq-buyer svg{color:var(--rq-faint);flex:0 0 auto}
.rq-buyer span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.rq-materials{position:relative;display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
.rq-chip{display:inline-flex;align-items:center;gap:5px;max-width:100%;min-width:0;
  padding:4px 8px 4px 4px;border-radius:9px;border:1px solid var(--rq-line);
  background:linear-gradient(135deg,#fbfcfe,#f4f7fa);font-size:11px;color:var(--rq-ink-2)}
.rq-chip-icon{width:20px;height:20px;flex:0 0 auto;display:grid;place-items:center;border-radius:6px;
  background:var(--rq-orange-soft);color:var(--rq-orange-700)}
.rq-chip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rq-chip b{font-family:var(--rq-mono);font-size:10.5px;font-weight:650;color:var(--rq-ink);white-space:nowrap}
.rq-chip.total{border-color:rgba(249,115,22,.3);
  background:linear-gradient(135deg,rgba(249,115,22,.10),rgba(251,191,36,.07))}
.rq-chip.total .rq-chip-name{color:var(--rq-orange-ink);font-weight:650}
.rq-chip.total b{color:var(--rq-orange-ink)}

.rq-meta{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;
  margin-top:11px;padding:9px 0;border-top:1px dashed var(--rq-line-2);border-bottom:1px dashed var(--rq-line-2)}
.rq-meta-cell{display:flex;align-items:center;gap:5px;min-width:0;font-size:11px;color:var(--rq-muted)}
.rq-meta-cell svg{color:var(--rq-faint);flex:0 0 auto}
.rq-meta-cell span{white-space:nowrap}
.rq-meta-cell strong{color:var(--rq-ink);font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.rq-card-foot{position:relative;display:flex;align-items:center;justify-content:space-between;gap:9px;
  margin-top:10px;min-height:40px}

.rq-ring{display:flex;align-items:center;gap:8px;min-width:0}
.rq-ring-dial{position:relative;width:40px;height:40px;flex:0 0 auto}
.rq-ring-track{fill:none;stroke:#eef1f6;stroke-width:3.4}
.rq-ring-bar{fill:none;stroke:var(--rq-rtone,var(--rq-orange));stroke-width:3.4;stroke-linecap:round;
  transition:stroke-dasharray .5s ease}
.rq-ring-core{position:absolute;inset:11px;border-radius:50%;background:var(--rq-rsoft,var(--rq-orange-soft))}
.rq-ring.level-steady{--rq-rtone:var(--rq-orange);--rq-rsoft:var(--rq-orange-soft);--rq-rink:var(--rq-orange-ink)}
.rq-ring.level-warning{--rq-rtone:var(--rq-amber);--rq-rsoft:var(--rq-amber-soft);--rq-rink:var(--rq-amber-ink)}
.rq-ring.level-critical{--rq-rtone:var(--rq-red);--rq-rsoft:var(--rq-red-soft);--rq-rink:var(--rq-red-ink)}
.rq-ring.level-critical .rq-ring-dial{animation:rqAlert 1.8s ease-in-out infinite;border-radius:50%}
@keyframes rqAlert{0%,100%{box-shadow:0 0 0 0 rgba(214,69,69,0)}50%{box-shadow:0 0 0 4px rgba(214,69,69,.14)}}
.rq-ring-text{display:flex;flex-direction:column;min-width:0;gap:2px}
.rq-ring-text span{font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  color:var(--rq-faint);white-space:nowrap}
.rq-ring-text strong{font-family:var(--rq-mono);font-size:14px;font-weight:650;letter-spacing:-.01em;
  color:var(--rq-rink,var(--rq-ink));font-variant-numeric:tabular-nums}

.rq-closed{display:flex;align-items:center;gap:6px;min-width:0;padding:7px 10px;border-radius:10px;
  font-size:10.5px;font-weight:650;color:var(--rq-muted);background:#f5f7fa;border:1px solid var(--rq-line)}
.rq-closed strong{font-family:var(--rq-mono);color:var(--rq-ink-2)}
.rq-closed.accepted{color:var(--rq-green-ink);background:var(--rq-green-soft);border-color:rgba(31,148,99,.24)}
.rq-closed.accepted strong{color:var(--rq-green-ink)}
.rq-closed.rejected{color:var(--rq-red-ink);background:var(--rq-red-soft);border-color:rgba(214,69,69,.24)}
.rq-closed.rejected strong{color:var(--rq-red-ink)}

.rq-open{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:8px 12px;border-radius:10px;
  font-size:11px;font-weight:800;letter-spacing:-.005em;white-space:nowrap;color:#fff;
  background:linear-gradient(135deg,var(--rq-orange),var(--rq-orange-700));
  box-shadow:0 4px 14px rgba(249,115,22,.30),inset 0 1px 0 rgba(255,255,255,.28);
  transition:box-shadow .2s,transform .2s}
.rq-open svg{transition:transform .2s}
.rq-card:hover .rq-open{box-shadow:0 8px 22px rgba(249,115,22,.42)}
.rq-card:hover .rq-open svg{transform:translateX(3px)}
.rq-card.status-accepted .rq-open,.rq-card.status-rejected .rq-open,.rq-card.status-expired .rq-open{
  color:var(--rq-ink-2);background:#fff;border:1px solid var(--rq-line-2);box-shadow:0 2px 8px rgba(20,26,36,.06)}
.rq-card.status-accepted:hover .rq-open,.rq-card.status-rejected:hover .rq-open,
.rq-card.status-expired:hover .rq-open{border-color:rgba(249,115,22,.4);color:var(--rq-orange-700);
  box-shadow:0 6px 16px rgba(249,115,22,.16)}
.rq-card.status-expired{opacity:.88}

/* dense variant */
.rq-list.dense{gap:8px}
.rq-card.dense{padding:11px 12px 10px 15px;border-radius:14px}
.rq-card.dense .rq-buyer,.rq-card.dense .rq-card-mesh{display:none}
.rq-card.dense .rq-materials{margin-top:9px}
.rq-card.dense .rq-meta{margin-top:9px;padding:7px 0}
.rq-card.dense .rq-card-foot{margin-top:8px;min-height:34px}
.rq-card.dense .rq-ring-dial{width:32px;height:32px}
.rq-card.dense .rq-ring-core{inset:9px}

/* ------------------------------------------------------------- skeleton -- */
.rq-skeleton{cursor:default;animation:none;pointer-events:none;min-height:172px}
.rq-skeleton:hover{transform:none;box-shadow:0 4px 16px rgba(20,26,36,.055)}
.rq-skeleton .rq-card-rail{background:linear-gradient(180deg,#f3d3b8,#e9e2d8)}
.sk{border-radius:7px;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);
  background-size:220% 100%;animation:rqShimmer 1.3s linear infinite}
.sk-id{width:38%;height:13px}
.sk-badge{position:absolute;top:13px;right:13px;width:74px;height:19px}
.sk-line{width:52%;height:10px;margin-top:12px}
.sk-chips{width:88%;height:26px;margin-top:12px}
.sk-meta{width:100%;height:16px;margin-top:14px}
.sk-foot{width:100%;height:32px;margin-top:14px}
@keyframes rqShimmer{to{background-position:-220% 0}}

/* ---------------------------------------------------------------- state -- */
.rq-state{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;min-height:248px;padding:28px 22px;border-radius:16px;
  border:1px dashed var(--rq-line-2);background:var(--rq-glass);color:var(--rq-muted);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.rq-state-icon{width:48px;height:48px;display:grid;place-items:center;margin-bottom:12px;border-radius:15px;
  color:var(--rq-orange-700);background:var(--rq-orange-soft);border:1px solid rgba(249,115,22,.24)}
.rq-state.error .rq-state-icon{color:var(--rq-red-ink);background:var(--rq-red-soft);border-color:rgba(214,69,69,.24)}
.rq-state h2{margin:0 0 6px;font-size:14.5px;font-weight:700;letter-spacing:-.015em;color:var(--rq-ink)}
.rq-state p{margin:0;font-size:12px;line-height:1.55;max-width:36ch}
.rq-btn{margin-top:14px;padding:9px 16px;cursor:pointer;border:0;border-radius:10px;
  font-size:12px;font-weight:750;color:#fff;
  background:linear-gradient(135deg,var(--rq-orange),var(--rq-orange-700));
  box-shadow:0 5px 16px rgba(249,115,22,.30);transition:transform .18s,box-shadow .18s}
.rq-btn:hover{transform:translateY(-1px);box-shadow:0 9px 22px rgba(249,115,22,.40)}

/* ----------------------------------------------------------- bottom nav -- */
.rq-bottomnav{
  position:fixed;z-index:30;left:50%;bottom:10px;transform:translateX(-50%);
  width:min(calc(100% - 18px),540px);height:62px;
  display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px;
  border:1px solid rgba(20,35,58,.11);border-radius:20px;
  background:rgba(255,255,255,.90);
  box-shadow:0 12px 30px rgba(16,29,49,.13),inset 0 1px 0 rgba(255,255,255,.96);
  -webkit-backdrop-filter:blur(19px) saturate(1.3);
  backdrop-filter:blur(19px) saturate(1.3);
  overflow:hidden;
}
.rq-nav-selection{
  position:absolute;z-index:0;left:5px;top:5px;
  width:calc((100% - 10px)/5);height:50px;
  border:1px solid rgba(249,115,22,.20);border-radius:15px;
  background:linear-gradient(150deg,rgba(255,247,237,.98),rgba(255,237,213,.82));
  box-shadow:0 4px 12px rgba(249,115,22,.10),inset 0 1px 0 #fff;
  transition:transform .32s cubic-bezier(.25,1.12,.45,1);
  will-change:transform;
}
.rq-navitem{
  position:relative;z-index:1;min-width:0;height:50px;padding:0 2px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  border:0;border-radius:15px;color:#69758a;background:transparent;
  cursor:pointer;transition:color .2s ease,transform .16s ease;
}
.rq-nav-icon{
  position:relative;width:24px;height:24px;display:grid;place-items:center;border-radius:8px;
  transition:color .2s ease,background .2s ease,transform .2s ease;
}
.rq-nav-label{
  width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
  color:inherit;font-size:8px;font-weight:750;line-height:1;text-align:center;
}
.rq-navitem:hover{color:#c85c08}
.rq-navitem:hover .rq-nav-icon{transform:translateY(-1px);background:rgba(249,115,22,.06)}
.rq-navitem.active{color:#c85c08}
.rq-navitem.active .rq-nav-icon{
  color:#fff;background:linear-gradient(145deg,#ff9b42,var(--rq-orange));
  box-shadow:0 3px 8px rgba(249,115,22,.18);
}
.rq-navitem:active{transform:scale(.95)}
.rq-navitem:focus-visible{outline:2px solid rgba(37,99,235,.45);outline-offset:-2px}
.rq-nav-notice{
  position:absolute;right:-2px;top:-2px;width:6px;height:6px;
  border:1.5px solid #fff;border-radius:50%;background:var(--rq-orange);
  box-shadow:0 1px 4px rgba(249,115,22,.25);
}
@media(max-width:390px){
  .rq-bottomnav{width:calc(100% - 12px);height:60px;bottom:7px;padding:4px;border-radius:18px}
  .rq-nav-selection{left:4px;top:4px;width:calc((100% - 8px)/5);height:50px;border-radius:14px}
  .rq-navitem{height:50px;gap:2px;padding:0 1px}
  .rq-nav-label{font-size:7.5px}
  .rq-nav-icon{width:23px;height:23px}
}

/* ---------------------------------------------------------------- toast -- */
.rq-toast{position:fixed;z-index:60;left:50%;bottom:80px;display:flex;align-items:center;gap:8px;
  transform:translate(-50%,12px);opacity:0;pointer-events:none;
  padding:10px 15px;border-radius:12px;white-space:nowrap;
  font-size:12px;font-weight:650;color:#fff;background:#161d29;
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 14px 34px rgba(20,26,36,.30);transition:.26s cubic-bezier(.2,.7,.3,1)}
.rq-toast.show{opacity:1;transform:translate(-50%,0)}
.rq-toast-pip{width:6px;height:6px;border-radius:50%;background:var(--rq-orange);
  box-shadow:0 0 0 3px rgba(249,115,22,.25)}

/* ----------------------------------------------------------- responsive -- */
@media(min-width:520px){
  .rq-header-inner,.rq-shell{padding-left:20px;padding-right:20px}
  .rq-hero-title{font-size:32px}
  .rq-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media(min-width:820px){
  .rq-header-inner{padding-top:16px;padding-bottom:20px}
  .rq-hero-title{font-size:36px}
  .rq-hero-sub{font-size:13px}
  .rq-list{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
  .rq-toolbar{padding:12px}
}
@media(min-width:1100px){
  .rq-list{grid-template-columns:repeat(3,minmax(0,1fr))}
  .rq-list.dense{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(prefers-reduced-motion:reduce){
  .rq-root *,.rq-root *:before,.rq-root *:after{animation:none!important;transition:none!important}
}

/* =================================================== request source -- */
.rq-src{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin-top:16px;
  width:100%;padding:5px;border-radius:16px;border:1px solid var(--rq-line);
  background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(246,248,251,.9));
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  box-shadow:0 8px 24px rgba(20,26,36,.06),inset 0 1px 0 #fff}
.rq-src-glider{position:absolute;top:5px;bottom:5px;left:5px;width:calc((100% - 10px) / 2);border-radius:12px;
  background:linear-gradient(135deg,#fff7ef,#ffe9d6 55%,#ffdcbf);
  border:1px solid rgba(249,115,22,.38);
  box-shadow:0 6px 18px rgba(249,115,22,.20),inset 0 1px 0 rgba(255,255,255,.9);
  transition:transform .38s cubic-bezier(.2,.8,.2,1)}
.rq-src-glider:after{content:"";position:absolute;left:18%;right:18%;bottom:-1px;height:3px;border-radius:3px 3px 0 0;
  background:linear-gradient(90deg,var(--rq-orange),#fbbf24)}
.rq-src-opt{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;
  height:46px;padding:0 10px;cursor:pointer;border:0;border-radius:12px;background:transparent;
  color:var(--rq-muted);font-size:13px;font-weight:650;letter-spacing:-.01em;transition:color .22s}
.rq-src-opt:hover{color:var(--rq-ink-2)}
.rq-src-opt.active{color:var(--rq-orange-ink);font-weight:800}
.rq-src-opt:focus-visible{outline:2px solid rgba(249,115,22,.6);outline-offset:1px}
.rq-src-icon{width:28px;height:28px;flex:0 0 auto;display:grid;place-items:center;border-radius:9px;
  background:#eef1f6;color:var(--rq-faint);transition:.25s}
.rq-src-opt.active .rq-src-icon{color:#fff;background:linear-gradient(135deg,var(--rq-orange),var(--rq-orange-700));
  box-shadow:0 4px 12px rgba(249,115,22,.36)}
.rq-src-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rq-src-count{flex:0 0 auto;min-width:22px;padding:2px 7px;border-radius:999px;font-family:var(--rq-mono);
  font-size:10.5px;font-weight:700;text-align:center;color:var(--rq-muted);background:#eef1f6;
  font-variant-numeric:tabular-nums;transition:.25s}
.rq-src-opt.active .rq-src-count{color:var(--rq-orange-ink);background:rgba(249,115,22,.16)}
.rq-sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* ========================================================= transporter -- */
.rq-tr-view-root{animation:rqRise .4s cubic-bezier(.2,.7,.3,1) both}
.rq-tr-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-bottom:12px}
.rq-tr-stat{position:relative;overflow:hidden;padding:11px 12px 12px;border-radius:15px;border:1px solid var(--rq-line);
  background:var(--rq-glass-2);box-shadow:0 4px 16px rgba(20,26,36,.05),inset 0 1px 0 #fff;
  --tone:var(--rq-orange);--tone-soft:var(--rq-orange-soft);--tone-ink:var(--rq-orange-ink)}
.rq-tr-stat:before{content:"";position:absolute;top:-40%;right:-25%;width:70%;height:120%;pointer-events:none;
  background:radial-gradient(circle,var(--tone-soft),transparent 70%)}
.rq-tr-stat.t-total{--tone:#475569;--tone-soft:rgba(71,85,105,.10);--tone-ink:var(--rq-ink-2)}
.rq-tr-stat.t-accepted{--tone:var(--rq-green);--tone-soft:var(--rq-green-soft);--tone-ink:var(--rq-green-ink)}
.rq-tr-stat.t-rejected{--tone:var(--rq-red);--tone-soft:var(--rq-red-soft);--tone-ink:var(--rq-red-ink)}
.rq-tr-stat-head{position:relative;display:flex;align-items:center;gap:7px;font-size:10px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;color:var(--rq-muted)}
.rq-tr-stat-icon{width:24px;height:24px;display:grid;place-items:center;border-radius:8px;color:var(--tone-ink);background:var(--tone-soft)}
.rq-tr-stat strong{position:relative;display:block;margin-top:8px;font-size:24px;line-height:1;font-weight:750;
  letter-spacing:-.03em;color:var(--rq-ink);font-variant-numeric:tabular-nums}
.rq-tr-stat-hint{position:relative;display:block;margin-top:5px;font-size:10.5px;color:var(--rq-faint);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rq-tr-stat-bar{position:relative;display:block;height:4px;margin-top:9px;border-radius:4px;background:#eef1f6;overflow:hidden}
.rq-tr-stat-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--tone),var(--tone-ink));
  transition:width .6s cubic-bezier(.2,.8,.2,1)}

.rq-tr-toolbar{margin-bottom:0}
.rq-tr-toolbar .rq-search input::placeholder{text-overflow:ellipsis}
.rq-filter.s-all .rq-filter-pip{background:#94a3b8}

.rq-tr-list{display:grid;gap:12px}

.rq-tr-card{position:relative;overflow:hidden;display:flex;flex-direction:column;min-width:0;
  padding:14px 14px 14px 18px;border-radius:18px;border:1px solid var(--rq-line);
  background:linear-gradient(160deg,#ffffff 0%,#fbfcfe 60%,#f8fafc 100%);
  box-shadow:0 4px 18px rgba(20,26,36,.06),inset 0 1px 0 #fff;
  transition:transform .24s cubic-bezier(.2,.7,.3,1),box-shadow .24s,border-color .24s;
  animation:rqRise .5s cubic-bezier(.2,.7,.3,1) both;
  --tr-tone:var(--rq-orange);--tr-tone-2:#fbbf24;--tr-soft:var(--rq-orange-soft);--tr-ink:var(--rq-orange-ink)}
.rq-tr-card.s-accepted{--tr-tone:var(--rq-green);--tr-tone-2:#34d399;--tr-soft:var(--rq-green-soft);--tr-ink:var(--rq-green-ink)}
.rq-tr-card.s-rejected{--tr-tone:var(--rq-red);--tr-tone-2:#f87171;--tr-soft:var(--rq-red-soft);--tr-ink:var(--rq-red-ink)}
.rq-tr-card.s-unknown{--tr-tone:#94a3b8;--tr-tone-2:#cbd5e1;--tr-soft:rgba(148,163,184,.14);--tr-ink:#475569}
.rq-tr-card:hover{transform:translateY(-3px);border-color:rgba(249,115,22,.32);
  box-shadow:0 20px 40px rgba(20,26,36,.11),0 0 0 1px rgba(249,115,22,.05)}
.rq-tr-rail{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--tr-tone-2),var(--tr-tone))}
.rq-tr-mesh{position:absolute;inset:0;pointer-events:none;opacity:.55;
  background-image:radial-gradient(rgba(20,26,36,.07) 1px,transparent 1.2px);background-size:14px 14px;
  -webkit-mask-image:radial-gradient(ellipse 65% 75% at 100% 0%,#000,transparent 72%);
  mask-image:radial-gradient(ellipse 65% 75% at 100% 0%,#000,transparent 72%)}
.rq-tr-glow{position:absolute;top:-45%;right:-30%;width:70%;height:120%;pointer-events:none;opacity:.7;
  background:radial-gradient(circle,var(--tr-soft),transparent 68%);transition:opacity .3s}
.rq-tr-card:hover .rq-tr-glow{opacity:1}
.rq-tr-card > *:not(.rq-tr-rail):not(.rq-tr-mesh):not(.rq-tr-glow){position:relative}

.rq-tr-kicker{display:block;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--rq-faint)}
.rq-missing{color:var(--rq-faint)!important;font-style:italic;font-weight:600!important}

.rq-tr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.rq-tr-idblock{min-width:0}
.rq-tr-id{display:block;margin-top:4px;font-family:var(--rq-mono);font-size:14px;font-weight:700;letter-spacing:.02em;
  color:var(--rq-ink);overflow-wrap:anywhere}
.rq-tr-id.rq-missing{font-family:inherit;font-size:12.5px}
.rq-tr-badge{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:5px 9px;border-radius:999px;
  font-size:9.5px;line-height:1;font-weight:850;letter-spacing:.09em;border:1px solid;white-space:nowrap}
.rq-tr-badge.s-new{color:var(--rq-orange-ink);background:linear-gradient(135deg,#fff4ea,#ffe6d1);border-color:rgba(249,115,22,.4)}
.rq-tr-badge.s-accepted{color:var(--rq-green-ink);background:var(--rq-green-soft);border-color:rgba(31,148,99,.34)}
.rq-tr-badge.s-rejected{color:var(--rq-red-ink);background:var(--rq-red-soft);border-color:rgba(214,69,69,.34)}
.rq-tr-badge.s-unknown{color:#475569;background:#f1f4f8;border-color:var(--rq-line-2)}
.rq-tr-live{position:relative;width:7px;height:7px;border-radius:50%;background:var(--rq-orange)}
.rq-tr-live:after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--rq-orange);
  opacity:0;animation:rqTrPing 1.8s cubic-bezier(0,0,.2,1) infinite}
@keyframes rqTrPing{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.9);opacity:0}}

.rq-tr-identity{display:flex;align-items:center;gap:11px;margin-top:13px;padding:11px;border-radius:14px;
  border:1px solid var(--rq-line);background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(246,248,251,.9))}
.rq-tr-avatar{position:relative;width:44px;height:44px;flex:0 0 auto;display:grid;place-items:center;border-radius:13px;
  color:#fff;background:linear-gradient(135deg,var(--rq-orange),var(--rq-orange-700));
  box-shadow:0 6px 16px rgba(249,115,22,.32),inset 0 1px 0 rgba(255,255,255,.3)}
.rq-tr-avatar em{position:absolute;right:-5px;bottom:-5px;min-width:20px;height:18px;padding:0 4px;display:grid;
  place-items:center;border-radius:6px;font-style:normal;font-size:8.5px;font-weight:850;letter-spacing:.04em;
  color:var(--rq-orange-ink);background:#fff;border:1px solid rgba(249,115,22,.35)}
.rq-tr-identity-text{min-width:0;flex:1}
.rq-tr-identity-text strong{display:block;margin-top:3px;font-size:15px;line-height:1.25;font-weight:750;
  letter-spacing:-.015em;color:var(--rq-ink);overflow-wrap:anywhere}
.rq-tr-subline{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:5px}
.rq-tr-subline:empty{display:none}
.rq-tr-tag{display:inline-block;max-width:100%;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:650;
  color:var(--rq-ink-2);background:#f1f4f8;border:1px solid var(--rq-line);overflow-wrap:anywhere}
.rq-tr-tag.mono{font-family:var(--rq-mono)}
.rq-tr-owner{display:inline-flex;align-items:center;gap:4px;min-width:0;font-size:11px;font-weight:600;color:var(--rq-muted);overflow-wrap:anywhere}
.rq-tr-owner svg{flex:0 0 auto;color:var(--rq-faint)}

.rq-tr-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:9px}
.rq-tr-cell{display:flex;gap:9px;min-width:0;padding:10px;border-radius:13px;border:1px solid var(--rq-line);background:#fff}
.rq-tr-cell-icon{width:28px;height:28px;flex:0 0 auto;display:grid;place-items:center;border-radius:9px;
  color:var(--rq-orange-700);background:var(--rq-orange-soft)}
.rq-tr-cell.seller .rq-tr-cell-icon{color:#475569;background:rgba(71,85,105,.09)}
.rq-tr-cell-body{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.rq-tr-cell-body strong{font-size:12.5px;line-height:1.3;font-weight:700;color:var(--rq-ink);overflow-wrap:anywhere}
.rq-tr-qty{font-size:11.5px;font-weight:600;color:var(--rq-muted)}
.rq-tr-qty b{font-family:var(--rq-mono);font-size:13px;font-weight:750;color:var(--rq-orange-ink);font-variant-numeric:tabular-nums}

.rq-tr-location{display:flex;gap:9px;margin-top:9px;padding:10px;border-radius:13px;
  border:1px dashed var(--rq-line-2);background:linear-gradient(135deg,rgba(249,115,22,.035),rgba(255,255,255,.6))}
.rq-tr-location > div{min-width:0}
.rq-tr-pin{width:28px;height:28px;flex:0 0 auto;display:grid;place-items:center;border-radius:9px;
  color:var(--rq-red-ink);background:var(--rq-red-soft)}
.rq-tr-location p{margin:3px 0 0;font-size:12px;line-height:1.45;font-weight:600;color:var(--rq-ink-2);
  overflow-wrap:anywhere;word-break:break-word}

.rq-tr-foot{margin-top:auto;padding-top:11px}
.rq-tr-foot-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;
  padding-top:11px;border-top:1px dashed var(--rq-line-2)}
.rq-tr-requested,.rq-tr-window{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:5px;
  min-height:58px;padding:9px 10px;border-radius:12px;border:1px solid var(--rq-line);background:#f8fafc}
.rq-tr-window-label{display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase;color:var(--rq-faint);white-space:nowrap}
.rq-tr-window-label svg{flex:0 0 auto}
.rq-tr-window-label em{margin-left:auto;padding:1px 6px;border-radius:5px;font-style:normal;font-size:8.5px;
  letter-spacing:.06em;color:#fff;background:var(--lvl-tone,var(--rq-amber))}
.rq-tr-requested strong{font-size:12px;line-height:1.3;font-weight:700;color:var(--rq-ink);font-variant-numeric:tabular-nums}
.rq-tr-window.done strong{display:flex;align-items:center;gap:5px;font-size:12px;line-height:1.3;font-weight:750;color:var(--rq-ink-2)}
.rq-tr-window.done strong svg{flex:0 0 auto}
.rq-tr-window.s-accepted{background:var(--rq-green-soft);border-color:rgba(31,148,99,.26)}
.rq-tr-window.s-accepted strong{color:var(--rq-green-ink)}
.rq-tr-window.s-rejected{background:var(--rq-red-soft);border-color:rgba(214,69,69,.26)}
.rq-tr-window.s-rejected strong{color:var(--rq-red-ink)}
.rq-tr-window.lvl-closed{background:#f1f4f8}
.rq-tr-window.lvl-closed strong{color:#64748b}
.rq-tr-window.muted strong{color:var(--rq-faint);font-style:italic;font-weight:650}
.rq-tr-window.live{--lvl-tone:var(--rq-orange);--lvl-soft:var(--rq-orange-soft);--lvl-ink:var(--rq-orange-ink);
  background:linear-gradient(135deg,#fff,var(--lvl-soft));border-color:rgba(249,115,22,.28)}
.rq-tr-window.live.lvl-urgent{--lvl-tone:var(--rq-amber);--lvl-soft:rgba(224,139,30,.16);--lvl-ink:var(--rq-amber-ink);
  border-color:rgba(224,139,30,.45)}
.rq-tr-window.live.lvl-critical{--lvl-tone:var(--rq-red);--lvl-soft:rgba(214,69,69,.13);--lvl-ink:var(--rq-red-ink);
  border-color:rgba(214,69,69,.48);animation:rqTrCritical 2.2s ease-in-out infinite}
@keyframes rqTrCritical{0%,100%{box-shadow:0 0 0 0 rgba(214,69,69,0)}50%{box-shadow:0 0 0 4px rgba(214,69,69,.13)}}
.rq-tr-window-pip{width:6px;height:6px;border-radius:50%;background:var(--lvl-tone);animation:rqBlink 1.4s ease-in-out infinite}
.rq-tr-timer{display:inline-flex;align-items:baseline;gap:3px;font-family:var(--rq-mono);font-variant-numeric:tabular-nums;
  color:var(--lvl-ink);white-space:nowrap}
.rq-tr-timer b{display:inline-block;min-width:2ch;text-align:center;font-size:16px;font-weight:750;letter-spacing:.01em}
.rq-tr-timer i{font-style:normal;font-size:13px;font-weight:600;opacity:.5}
.rq-tr-card.lvl-critical .rq-tr-rail{background:linear-gradient(180deg,#f87171,var(--rq-red))}
.rq-tr-card.lvl-urgent .rq-tr-rail{background:linear-gradient(180deg,#fbbf24,var(--rq-amber))}

.rq-tr-view{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  min-height:46px;margin-top:10px;padding:0 16px;cursor:pointer;border:0;border-radius:13px;
  font-size:13px;font-weight:800;letter-spacing:-.005em;color:#fff;overflow:hidden;
  background:linear-gradient(135deg,var(--rq-orange) 0%,var(--rq-orange-600) 50%,var(--rq-orange-700) 100%);
  box-shadow:0 8px 20px rgba(249,115,22,.32),inset 0 1px 0 rgba(255,255,255,.28);
  transition:transform .2s,box-shadow .2s}
.rq-tr-view:before{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-18deg);
  transition:left .6s ease}
.rq-tr-view:hover{transform:translateY(-1px);box-shadow:0 12px 26px rgba(249,115,22,.42)}
.rq-tr-view:hover:before{left:120%}
.rq-tr-view:active{transform:translateY(0)}
.rq-tr-view:focus-visible{outline:2px solid rgba(249,115,22,.6);outline-offset:3px}
.rq-tr-view-arrow{display:grid;place-items:center;width:24px;height:24px;margin-left:2px;border-radius:8px;
  background:rgba(255,255,255,.2);transition:transform .2s}
.rq-tr-view:hover .rq-tr-view-arrow{transform:translateX(3px)}

/* transporter skeleton */
.rq-tr-skeleton{pointer-events:none;animation:none;gap:12px;min-height:360px}
.rq-tr-skeleton .rq-tr-rail{background:linear-gradient(180deg,#f3d3b8,#e9e2d8)}
.rq-tr-sk-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.rq-tr-sk-row.start{justify-content:flex-start}
.tr-sk-stack{flex:1;display:flex;flex-direction:column;gap:7px}
.tr-sk-id{width:46%;height:16px}
.tr-sk-badge{width:66px;height:20px;border-radius:999px}
.tr-sk-avatar{width:44px;height:44px;border-radius:13px;flex:0 0 auto}
.tr-sk-line{height:11px}
.tr-sk-line.w60{width:60%}.tr-sk-line.w35{width:35%}.tr-sk-line.w90{width:90%}
.tr-sk-block{width:100%;height:64px;border-radius:13px}
.tr-sk-timer{flex:1;height:56px;border-radius:12px}
.tr-sk-button{width:100%;height:46px;border-radius:13px}

/* transporter states */
.rq-tr-state{min-height:280px}
.rq-tr-state h2{max-width:34ch}
.rq-tr-state-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:4px}
.rq-tr-state-actions .rq-btn{display:inline-flex;align-items:center;gap:6px}
.rq-btn.ghost{color:var(--rq-ink-2);background:#fff;border:1px solid var(--rq-line-2);box-shadow:0 2px 8px rgba(20,26,36,.06)}
.rq-btn.ghost:hover{color:var(--rq-orange-700);border-color:rgba(249,115,22,.4);box-shadow:0 6px 16px rgba(249,115,22,.16)}
.rq-tr-empty{border-style:solid;background:
  radial-gradient(120% 90% at 50% 0%,rgba(249,115,22,.07),transparent 60%),var(--rq-glass)}
.rq-tr-empty-art{position:relative;width:86px;height:86px;display:grid;place-items:center;margin-bottom:14px}
.rq-tr-empty-art .ring{position:absolute;border-radius:50%;border:1px dashed rgba(249,115,22,.35)}
.rq-tr-empty-art .ring.one{inset:0;animation:rqSpin 18s linear infinite}
.rq-tr-empty-art .ring.two{inset:12px;border-style:solid;border-color:rgba(249,115,22,.16);background:rgba(249,115,22,.05)}
.rq-tr-empty-art .core{position:relative;width:48px;height:48px;display:grid;place-items:center;border-radius:15px;color:#fff;
  background:linear-gradient(135deg,var(--rq-orange),var(--rq-orange-700));box-shadow:0 10px 24px rgba(249,115,22,.34)}

@media(max-width:390px){
  .rq-src-opt{font-size:12px;gap:6px;padding:0 6px}
  .rq-src-icon{width:24px;height:24px}
  .rq-tr-grid,.rq-tr-foot-row{grid-template-columns:minmax(0,1fr)}
}
@media(min-width:520px){
  .rq-src{width:auto;max-width:440px}
  .rq-tr-summary{grid-template-columns:repeat(4,minmax(0,1fr))}
  .rq-tr-state-actions .rq-btn{min-width:150px;justify-content:center}
}
@media(min-width:820px){
  .rq-tr-list{grid-template-columns:repeat(2,minmax(0,1fr))}
  .rq-tr-view{width:100%}
}
@media(min-width:1100px){
  .rq-tr-list{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(prefers-reduced-motion:reduce){
  .rq-src-glider,.rq-tr-card,.rq-tr-view,.rq-tr-view:before{transition:none!important}
}
`;
