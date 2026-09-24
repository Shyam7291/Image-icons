import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ===========================================================================
 * StoneRate — Admin · Transport Bidding Details
 * Same design language as AdminRateRequestDetails / AdminTransportBiddings
 * (white canvas + signal orange). Self-contained: styles scoped under .bd-root.
 *
 * The default export is presentational: it renders whatever `selectedBid`
 * the backend returns and delegates every mutation to async callbacks.
 * It never invents rankings, totals, Seller or Transporter details.
 *
 * `useAdminTransportBiddingDetails(bidId, api)` (named export) is the
 * separated data layer that App.js can use to wire the adminApi functions.
 * ========================================================================= */

/* ------------------------------------------------------------- Constants -- */

const URGENT_WINDOW_MS = 60 * 60 * 1000; // < 60 min → URGENT
const CRITICAL_WINDOW_MS = 15 * 60 * 1000; // < 15 min → pulsing red
const INDIA_TZ = "Asia/Kolkata";
const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 350;

export const DEFAULT_VEHICLE_TYPES = [
  "10 Tyre", "12 Tyre", "14 Tyre", "16 Tyre", "18 Tyre", "22 Tyre", "Hyva", "Trailer", "Other"
];

const AWARDED_STATUSES = new Set(["awarded", "assigned", "allotted", "allocated"]);
const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "void", "withdrawn_by_admin"]);
const CLOSED_STATUSES = new Set(["closed", "ended", "completed", "complete", "expired", "finished"]);
const INACTIVE_SUBMISSION_STATUSES = new Set([
  "deleted", "removed", "withdrawn", "cancelled", "canceled", "rejected", "inactive"
]);

const BADGE_CLASS = {
  OPEN: "open",
  URGENT: "urgent",
  CLOSED: "closed",
  AWARDED: "awarded",
  CANCELLED: "cancelled",
  "NO BIDS": "nobids"
};

const BIDDER_SORTS = [
  { value: "position", label: "Position" },
  { value: "lowest", label: "Lowest total" },
  { value: "highest", label: "Highest total" },
  { value: "submitted", label: "Recently submitted" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Transporter name" }
];

const CLOSE_REASONS = [
  "Enough bids received",
  "Bidding completed manually",
  "Route requirements changed",
  "Request cancelled",
  "Other"
];

/* ------------------------------------------------------------ Formatters -- */

const INR_FORMAT = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0
});
const INR_FORMAT_PAISE = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2
});
const NUMBER_FORMAT = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: INDIA_TZ
});
const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", timeZone: INDIA_TZ
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric", minute: "2-digit", hour12: true, timeZone: INDIA_TZ
});

const NA = "Not provided";

function inr(value) {
  if (value === null || value === undefined) return NA;
  return Number.isInteger(Math.round(value * 100) / 100) ? INR_FORMAT.format(value) : INR_FORMAT_PAISE.format(value);
}
function num(value) {
  return value === null || value === undefined ? NA : NUMBER_FORMAT.format(value);
}
function dateTime(ms) {
  return ms === null || ms === undefined ? NA : DATE_TIME_FORMAT.format(new Date(ms));
}
function dateOnly(ms) {
  return ms === null || ms === undefined ? NA : DATE_FORMAT.format(new Date(ms));
}
function timeOnly(ms) {
  return ms === null || ms === undefined ? "--:--" : TIME_FORMAT.format(new Date(ms));
}
function orNA(value) {
  return value ? value : NA;
}
function pad(value) {
  return String(value).padStart(2, "0");
}
function splitDuration(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}
function durationWords(ms) {
  const { h, m, s } = splitDuration(ms);
  const parts = [];
  if (h) parts.push(h + (h === 1 ? " hour" : " hours"));
  if (m) parts.push(m + (m === 1 ? " minute" : " minutes"));
  if (!h && !m) parts.push(s + (s === 1 ? " second" : " seconds"));
  return parts.join(" ");
}
function clockText(ms) {
  const { h, m, s } = splitDuration(ms);
  return pad(h) + " : " + pad(m) + " : " + pad(s);
}
function relativeTime(ms, now) {
  if (ms === null || ms === undefined) return "";
  const mins = Math.floor(Math.max(0, now - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h " + (mins % 60) + "m ago";
  return Math.floor(hours / 24) + "d ago";
}
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

/* ------------------------------------------------------ Safe value parsing -- */

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[,₹\s]/g, ""));
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
function lower(value) {
  return toText(value).toLowerCase();
}
function firstText(...values) {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return "";
}
function truthyFlag(value) {
  if (typeof value === "boolean") return value;
  const text = lower(value);
  return text === "true" || text === "yes" || text === "1" || text === "active" || text === "verified" || text === "approved";
}

/* Precise money maths: work in integer paise. */
function toPaise(value) {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.round(parsed * 100);
}
function fromPaise(paise) {
  return paise === null ? null : paise / 100;
}

/* -------------------------------------------------------- Normalisation -- */

function normalizeMethod(value) {
  const text = lower(value).replace(/[\s_-]/g, "");
  return text === "perkm" || text === "km" || text === "perkilometre" || text === "perkilometer" ? "perKm" : "total";
}

function normalizeSeller(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    id: firstText(s.id, s.publicId, s.sellerId),
    name: firstText(s.name, s.sellerName, s.businessName),
    phone: firstText(s.phone, s.mobile, s.mobileNumber),
    location: firstText(s.location, s.address),
    city: firstText(s.city),
    state: firstText(s.state),
    pincode: firstText(s.pincode, s.pinCode, s.zip),
    joinedAt: toTime(s.joinedAt || s.createdAt),
    sampleUploadedAt: toTime(s.sampleUploadedAt),
    sampleExpiresAt: toTime(s.sampleExpiresAt),
    raw: s
  };
}

function normalizeMaterial(raw, index) {
  const m = raw && typeof raw === "object" ? raw : {};
  const seller = normalizeSeller(m.seller);
  return {
    key: firstText(m.id, m.orderItemId) || "material-" + index,
    id: toText(m.id),
    orderItemId: toText(m.orderItemId),
    name: firstText(m.name, m.materialName) || "Unnamed material",
    materialType: firstText(m.materialType, m.type, m.category),
    quantity: toNumber(m.quantity),
    unit: firstText(m.quantityUnit, m.unit),
    sampleCode: firstText(m.sampleCode, m.referenceCode),
    sourceSampleId: firstText(m.sourceSampleId, m.sampleId, m.referenceId),
    imageUrl: firstText(m.imageUrl, m.thumbnailUrl, m.image),
    pickupArea: firstText(m.pickupArea, m.pickupLocation),
    rate: toNumber(m.materialRate ?? m.rate),
    rateUnit: firstText(m.materialRateUnit, m.rateUnit),
    convertedRate: toNumber(m.convertedMaterialRate),
    convertedRateUnit: firstText(m.convertedMaterialRateUnit, m.convertedRateUnit),
    feetPerTon: toNumber(m.feetPerTon),
    permitCost: toNumber(m.permitCost),
    availableQuantity: toNumber(m.availableQuantity),
    availableUnit: firstText(m.availableQuantityUnit, m.quantityUnit, m.unit),
    seller,
    raw: m
  };
}

function normalizeBidder(raw, index) {
  const b = raw && typeof raw === "object" ? raw : {};
  const vehicles = (Array.isArray(b.vehicleAllocation) ? b.vehicleAllocation : Array.isArray(b.vehicles) ? b.vehicles : [])
    .filter(v => v && typeof v === "object")
    .map(v => ({ type: firstText(v.type, v.vehicleType) || "Vehicle", number: toNumber(v.number ?? v.count ?? v.quantity) }));
  return {
    key: firstText(b.id) || "submission-" + index,
    id: toText(b.id),
    transporterId: firstText(b.transporterId, b.transporterPublicId),
    name: firstText(b.transporterName, b.agencyName, b.name),
    ownerName: firstText(b.ownerName),
    phone: firstText(b.phone, b.mobile),
    location: firstText(b.location),
    city: firstText(b.city),
    state: firstText(b.state),
    joinedAt: toTime(b.joinedAt),
    method: normalizeMethod(b.costMethod ?? b.method),
    perKmRate: toNumber(b.perKmRate ?? b.ratePerKm),
    transportationCost: toNumber(b.transportationCost),
    permitCost: toNumber(b.permitCost),
    totalBid: toNumber(b.totalBid),
    vehicleCount: toNumber(b.vehicleCount),
    vehicles,
    position: toNumber(b.position),
    status: lower(b.status) || "active",
    submittedAt: toTime(b.submittedAt || b.createdAt),
    updatedAt: toTime(b.updatedAt),
    adminNote: toText(b.adminNote),
    raw: b
  };
}

/**
 * Converts the backend object into a render-safe view model.
 * `receivedAt` anchors `secondsLeft` when `closesAt` is absent.
 */
function normalizeDetail(raw, receivedAt) {
  if (!raw || typeof raw !== "object") return null;
  const closesAt = toTime(raw.closesAt);
  const secondsLeft = toNumber(raw.secondsLeft);
  const deadline = closesAt !== null ? closesAt : secondsLeft !== null ? receivedAt + Math.max(0, secondsLeft) * 1000 : null;

  const bidders = (Array.isArray(raw.bidders) ? raw.bidders : Array.isArray(raw.submissions) ? raw.submissions : [])
    .map(normalizeBidder);
  const active = bidders.filter(b => !INACTIVE_SUBMISSION_STATUSES.has(b.status));
  const inactive = bidders.filter(b => INACTIVE_SUBMISSION_STATUSES.has(b.status));

  /* Ranking: backend `position` first, then backend `totalBid` (never invented). */
  const ranked = [...active].sort((a, b) => {
    const pa = a.position ?? Infinity;
    const pb = b.position ?? Infinity;
    if (pa !== pb) return pa - pb;
    const ta = a.totalBid ?? Infinity;
    const tb = b.totalBid ?? Infinity;
    if (ta !== tb) return ta - tb;
    return (a.submittedAt ?? Infinity) - (b.submittedAt ?? Infinity);
  }).map((bidder, index) => ({
    ...bidder,
    rank: bidder.position ?? index + 1,
    rankSource: bidder.position !== null ? "backend" : "total"
  }));

  const totals = ranked.map(b => b.totalBid).filter(v => v !== null && v > 0);
  const backendLowest = toNumber(raw.lowestBid);
  const lowestBid = backendLowest !== null && backendLowest > 0 ? backendLowest : totals.length ? Math.min(...totals) : null;
  const highestBid = totals.length ? Math.max(...totals) : null;
  const averageBid = totals.length
    ? Math.round(totals.reduce((sum, v) => sum + Math.round(v * 100), 0) / totals.length) / 100
    : null;
  const lastUpdate = ranked.reduce((latest, b) => {
    const t = b.updatedAt ?? b.submittedAt;
    return t !== null && (latest === null || t > latest) ? t : latest;
  }, null);

  const awardedSubmissionId = firstText(raw.awardedSubmissionId, raw.winnerSubmissionId);
  const backendApplicants = toNumber(raw.applicants);

  return {
    raw,
    id: toText(raw.id),
    internalId: toText(raw.internalId),
    requestId: toText(raw.requestId),
    rawStatus: lower(raw.status),
    createdAt: toTime(raw.createdAt || raw.publishedAt),
    updatedAt: toTime(raw.updatedAt),
    closesAt,
    deadline,
    windowMs: deadline !== null && toTime(raw.createdAt) !== null ? Math.max(1, deadline - toTime(raw.createdAt)) : null,
    pickup: toText(raw.pickup),
    drop: toText(raw.drop),
    distanceKm: (() => { const d = toNumber(raw.distanceKm); return d !== null && d >= 0 ? d : null; })(),
    materials: (Array.isArray(raw.materials) ? raw.materials : []).map(normalizeMaterial),
    bidders: ranked,
    inactiveBidders: inactive,
    applicants: ranked.length || (backendApplicants !== null ? backendApplicants : 0),
    lowestBid,
    highestBid,
    averageBid,
    lastUpdate,
    awardedSubmissionId,
    closedReason: firstText(raw.closeReason, raw.closedReason),
    cancellationReason: firstText(raw.cancellationReason, raw.cancelReason),
    closedAt: toTime(raw.closedAt),
    awardedAt: toTime(raw.awardedAt)
  };
}

function derivePhase(detail, now, closedLocally) {
  const status = detail.rawStatus;
  if (AWARDED_STATUSES.has(status)) return "awarded";
  if (CANCELLED_STATUSES.has(status)) return "cancelled";
  if (closedLocally || CLOSED_STATUSES.has(status)) return "closed";
  if (detail.deadline !== null && detail.deadline - now <= 0) return "expired";
  return "open";
}

function deriveBadge(phase, remaining, applicants) {
  if (phase === "awarded") return "AWARDED";
  if (phase === "cancelled") return "CANCELLED";
  if (phase === "closed" || phase === "expired") return "CLOSED";
  if (remaining !== null && remaining < URGENT_WINDOW_MS) return "URGENT";
  if (!applicants) return "NO BIDS";
  return "OPEN";
}

function isAwardedBidder(bidder, detail) {
  return bidder.status === "awarded" || (!!detail.awardedSubmissionId && detail.awardedSubmissionId === bidder.id);
}

function sortBidders(list, sort) {
  const byRank = (a, b) => a.rank - b.rank;
  const nullLast = (a, b, dir) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return dir * (a - b);
  };
  const cmp = {
    position: byRank,
    lowest: (a, b) => nullLast(a.totalBid, b.totalBid, 1),
    highest: (a, b) => nullLast(a.totalBid, b.totalBid, -1),
    submitted: (a, b) => nullLast(a.submittedAt, b.submittedAt, -1),
    updated: (a, b) => nullLast(a.updatedAt ?? a.submittedAt, b.updatedAt ?? b.submittedAt, -1),
    name: (a, b) => (a.name || "~").localeCompare(b.name || "~", "en-IN", { sensitivity: "base" })
  }[sort] || byRank;
  return [...list].sort((a, b) => cmp(a, b) || byRank(a, b));
}

function normalizeTransporterResult(raw, index) {
  const t = raw && typeof raw === "object" ? raw : {};
  const activeKnown = t.isActive !== undefined || t.active !== undefined || t.status !== undefined;
  const verifiedKnown = t.isVerified !== undefined || t.verified !== undefined || t.verificationStatus !== undefined;
  const isActive = t.isActive !== undefined ? truthyFlag(t.isActive) : t.active !== undefined ? truthyFlag(t.active) : truthyFlag(t.status);
  const isVerified = t.isVerified !== undefined ? truthyFlag(t.isVerified) : t.verified !== undefined ? truthyFlag(t.verified) : truthyFlag(t.verificationStatus);
  return {
    key: firstText(t.id, t.publicId, t.transporterId) || "transporter-" + index,
    id: firstText(t.id, t.publicId, t.transporterId),
    name: firstText(t.agencyName, t.transporterName, t.name),
    ownerName: firstText(t.ownerName),
    phone: firstText(t.phone, t.mobile),
    city: firstText(t.city),
    state: firstText(t.state),
    location: firstText(t.location, [t.city, t.state].filter(Boolean).join(", ")),
    statusLabel: firstText(t.status, t.verificationStatus),
    activeKnown,
    verifiedKnown,
    isActive,
    isVerified,
    raw: t
  };
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.transporters)) return response.transporters;
  if (response && Array.isArray(response.results)) return response.results;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

function extractBid(response) {
  if (!response || typeof response !== "object") return null;
  if (response.bid && typeof response.bid === "object") return response.bid;
  if (response.bidding && typeof response.bidding === "object") return response.bidding;
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data.bid || response.data.bidding || response.data;
  }
  return response;
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    /* fall through to legacy copy */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch (error) {
    return false;
  }
}

/* ------------------------------------------------------ Data-loading hook -- */

/**
 * Separated data layer for App.js.
 *   const details = useAdminTransportBiddingDetails(bidId, TRANSPORT_BID_API);
 *   <StoneRateAdminTransportBiddingDetails {...details} onRetry={details.onRefresh} ... />
 *
 * `api` must be a stable (module-level) object:
 *   { getDetails, searchTransporters, addBid, updateBid, deleteBid, closeBidding }
 */
export function useAdminTransportBiddingDetails(bidId, api) {
  const [selectedBid, setSelectedBid] = useState(null);
  const [loading, setLoading] = useState(Boolean(bidId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const seqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const onRefresh = useCallback(async () => {
    if (!bidId) {
      setLoading(false);
      setError("No bidding selected.");
      return;
    }
    if (!api || typeof api.getDetails !== "function") {
      setLoading(false);
      setError("Transport bidding details API is not connected.");
      return;
    }
    const seq = ++seqRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await api.getDetails(bidId);
      if (mountedRef.current && seq === seqRef.current) setSelectedBid(extractBid(response));
    } catch (loadError) {
      if (mountedRef.current && seq === seqRef.current) {
        setError((loadError && loadError.message) || "Unable to load bidding details");
      }
    } finally {
      if (mountedRef.current && seq === seqRef.current) setLoading(false);
    }
  }, [bidId, api]);

  useEffect(() => {
    setSelectedBid(null);
    onRefresh();
  }, [onRefresh]);

  const withSaving = useCallback(async task => {
    setSaving(true);
    try {
      return await task();
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, []);

  const onEditBid = useCallback(p => withSaving(() => api.updateBid(p.bidId, p.submissionId, p)), [api, withSaving]);
  const onDeleteBid = useCallback(p => withSaving(() => api.deleteBid(p.bidId, p.submissionId, p.reason)), [api, withSaving]);
  const onAddBid = useCallback(p => withSaving(() => api.addBid(p.bidId, p)), [api, withSaving]);
  const onCloseBidding = useCallback(p => withSaving(() => api.closeBidding(p.bidId, p.reason)), [api, withSaving]);
  const onSearchTransporters = useCallback(text => api.searchTransporters(text), [api]);

  return {
    selectedBid, loading, error, saving,
    onRefresh, onRetry: onRefresh,
    onEditBid, onDeleteBid, onAddBid, onCloseBidding, onSearchTransporters
  };
}

/* ------------------------------------------------------------------ Icons -- */

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: "false"
  };
  const paths = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 9" /><path d="m4 15 2.3 2.6A7 7 0 0 0 18 15" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    close: <><path d="m7 7 10 10" /><path d="m17 7-10 10" /></>,
    sort: <><path d="M8 6h12" /><path d="M8 12h9" /><path d="M8 18h6" /><path d="m3 8 2-2 2 2" /><path d="M5 6v12" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    hourglass: <><path d="M6 3h12M6 21h12" /><path d="M7 3c0 4 5 5.5 5 9s-5 5-5 9" /><path d="M17 3c0 4-5 5.5-5 9s5 5 5 9" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v9" /></>,
    bolt: <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 5h11l-2 3.5L16 12H5" /></>,
    check: <><path d="m5 13 4.5 4.5L19 7" /></>,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" /></>,
    users: <><circle cx="9" cy="8" r="3.4" /><path d="M2.8 20a6.4 6.4 0 0 1 12.4 0" /><path d="M16 4.6a3.4 3.4 0 0 1 0 6.6" /><path d="M18.4 14a6.4 6.4 0 0 1 2.8 6" /></>,
    rupee: <><path d="M7 4h11" /><path d="M7 9h11" /><path d="M9 4h1.5a4.5 4.5 0 0 1 0 9H7l8 7" /></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H5a3 3 0 0 0 3 4" /><path d="M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4" /><path d="M8.5 20h7" /><path d="M10 17h4v3h-4z" /></>,
    crown: <><path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 10H5Z" /><path d="M5 21h14" /></>,
    route: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" /></>,
    gavel: <><path d="m14 4 6 6" /><path d="m11 7 6 6" /><path d="m12.5 5.5-5 5 6 6 5-5" /><path d="M9.5 12.5 3 19l2 2 6.5-6.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /></>,
    doc: <><path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z" /><path d="M14 3v5h5" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.2 1 .4 2 .8 2.8a2 2 0 0 1-.5 2.1l-1.2 1.2a16 16 0 0 0 4.1 4.1l1.2-1.2a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.8a2 2 0 0 1 1.7 1.6Z" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6.5 7 7.5 20h9l1-13" /><path d="M10 11v5M14 11v5" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    shield: <><path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6Z" /><path d="m9 12 2 2 4-4" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
    expand: <><path d="M4 9V4h5" /><path d="M20 9V4h-5" /><path d="M4 15v5h5" /><path d="M20 15v5h-5" /></>,
    ban: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
    stop: <><circle cx="12" cy="12" r="9" /><rect x="9" y="9" width="6" height="6" rx="1" /></>,
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.4 6.4 2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8" /></>,
    note: <><path d="M5 4h14v12l-4 4H5z" /><path d="M15 20v-4h4" /><path d="M8 9h8M8 13h5" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>
  };
  return <svg {...common}>{paths[name] || paths.cube}</svg>;
}

/* ------------------------------------------------------------- Modal kit -- */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let openModalCount = 0;
let savedBodyOverflow = "";

function Modal({ title, subtitle, icon = "doc", tone = "orange", size = "md", onClose, busy = false, footer, children, className = "" }) {
  const dialogRef = useRef(null);
  const titleId = useRef("bd-modal-" + Math.random().toString(36).slice(2, 9)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const trigger = document.activeElement;
    if (openModalCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openModalCount += 1;

    const node = dialogRef.current;
    const preferred = node && (node.querySelector("[data-autofocus]") || node.querySelector(".bd-modal-body " + FOCUSABLE));
    (preferred || node)?.focus({ preventScroll: true });

    return () => {
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) document.body.style.overflow = savedBodyOverflow;
      if (trigger && typeof trigger.focus === "function" && document.contains(trigger)) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);

  const requestClose = () => {
    if (!busyRef.current) onCloseRef.current();
  };

  const handleKeyDown = event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      requestClose();
      return;
    }
    if (event.key !== "Tab") return;
    const node = dialogRef.current;
    if (!node) return;
    const items = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) {
      event.preventDefault();
      node.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="bd-overlay" onMouseDown={event => { if (event.target === event.currentTarget) requestClose(); }}>
      <div
        ref={dialogRef}
        className={"bd-modal size-" + size + " tone-" + tone + (className ? " " + className : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <header className="bd-modal-head">
          <span className="bd-modal-icon"><Icon name={icon} size={17} /></span>
          <div className="bd-modal-titles">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="bd-iconbtn sm" onClick={requestClose} disabled={busy} aria-label={"Close " + title}>
            <Icon name="close" size={15} />
          </button>
        </header>
        <div className="bd-modal-body">{children}</div>
        {footer ? <footer className="bd-modal-foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="bd-spinner" aria-hidden="true" />;
}

function InfoGrid({ rows, columns = 2 }) {
  return (
    <dl className={"bd-info cols-" + columns}>
      {rows.filter(Boolean).map(row => (
        <div key={row.label} className={"bd-info-row" + (row.wide ? " wide" : "") + (row.accent ? " accent" : "")}>
          <dt>{row.icon ? <Icon name={row.icon} size={12} /> : null}{row.label}</dt>
          <dd className={row.mono ? "mono" : ""}>{row.value === "" || row.value === null || row.value === undefined ? NA : row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ErrorNote({ message }) {
  if (!message) return null;
  return (
    <div className="bd-inline-error" role="alert">
      <Icon name="alert" size={14} />
      <span>{message}</span>
    </div>
  );
}

/* --------------------------------------------------------- Material image -- */

function MaterialImage({ src, alt, fit = "cover", className = "" }) {
  const [state, setState] = useState(src ? "loading" : "empty");

  useEffect(() => {
    setState(src ? "loading" : "empty");
  }, [src]);

  if (!src || state === "error" || state === "empty") {
    return (
      <div className={"bd-img is-" + (state === "error" ? "broken" : "empty") + " " + className} role="img" aria-label={alt + (state === "error" ? " (image failed to load)" : " (no image available)")}>
        <Icon name={state === "error" ? "alert" : "image"} size={20} />
        <span>{state === "error" ? "Image unavailable" : "No reference image"}</span>
      </div>
    );
  }

  return (
    <div className={"bd-img is-" + state + " fit-" + fit + " " + className}>
      {state === "loading" ? <span className="bd-img-shimmer" aria-hidden="true" /> : null}
      <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setState("loaded")} onError={() => setState("error")} />
    </div>
  );
}

/* -------------------------------------------------------------- Countdown -- */

function CountdownDisplay({ remaining, tone, large = false }) {
  const { h, m, s } = splitDuration(remaining);
  return (
    <div className={"bd-countdown tone-" + tone + (large ? " large" : "")} role="timer" aria-live="off" aria-label={durationWords(remaining) + " remaining"}>
      {[["hrs", h], ["min", m], ["sec", s]].map(([unit, value], index) => (
        <React.Fragment key={unit}>
          {index ? <i aria-hidden="true">:</i> : null}
          <span className="bd-count-cell" aria-hidden="true">
            <b>{pad(value)}</b>
            <small>{unit}</small>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------ Info-style modals -- */

function rateText(value, unit) {
  if (value === null) return NA;
  return inr(value) + (unit ? " / " + unit : "");
}

function qtyText(value, unit) {
  if (value === null) return NA;
  return num(value) + (unit ? " " + unit : "");
}

function ImageLightbox({ material, onClose }) {
  return (
    <Modal title={material.name} subtitle="Full-size reference image" icon="image" size="xl" onClose={onClose} className="bd-lightbox">
      <MaterialImage src={material.imageUrl} alt={"Full-size reference image of " + material.name} fit="contain" className="bd-lightbox-img" />
    </Modal>
  );
}

function ReferenceSourceModal({ material, onClose, onCallSeller, onCopied, onOpenLightbox }) {
  const seller = material.seller;
  const converter = material.feetPerTon !== null ? num(material.feetPerTon) + " ft³ per ton" : NA;

  const handleCopy = async () => {
    const lines = [
      "Reference Source — " + material.name,
      "Sample code: " + orNA(material.sampleCode),
      "Seller: " + orNA(seller.name) + " (" + orNA(seller.id) + ")",
      "Material type: " + orNA(material.materialType || material.name),
      "Source sample ID: " + orNA(material.sourceSampleId),
      "Location: " + orNA(seller.location || material.pickupArea),
      "Mobile: " + orNA(seller.phone),
      "Uploaded: " + dateTime(seller.sampleUploadedAt),
      "Recorded rate: " + rateText(material.rate, material.rateUnit),
      "Converter rate: " + converter,
      "Converted rate: " + rateText(material.convertedRate, material.convertedRateUnit),
      "Sample expiry: " + dateTime(seller.sampleExpiresAt),
      "Permit cost: " + inr(material.permitCost),
      "Available quantity: " + qtyText(material.availableQuantity, material.availableUnit)
    ];
    onCopied(await copyText(lines.join("\n")), "Reference information copied");
  };

  return (
    <Modal
      title="Reference Source"
      subtitle={material.name}
      icon="layers"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bd-btn ghost" onClick={onClose}>Close</button>
          <button type="button" className="bd-btn soft" onClick={handleCopy}><Icon name="copy" size={14} /> Copy information</button>
          <button type="button" className="bd-btn green" onClick={() => onCallSeller(seller.phone, seller.raw)} disabled={!seller.phone}>
            <Icon name="phone" size={14} /> Call Seller
          </button>
        </>
      }
    >
      <button type="button" className="bd-ref-hero" onClick={onOpenLightbox} disabled={!material.imageUrl} aria-label={"Open larger preview of " + material.name}>
        <MaterialImage src={material.imageUrl} alt={"Reference image of " + material.name} fit="contain" className="bd-ref-img" />
        {material.imageUrl ? <span className="bd-ref-zoom"><Icon name="expand" size={13} /> Tap to enlarge</span> : null}
        {material.sampleCode ? <span className="bd-ref-code"><Icon name="doc" size={12} /> {material.sampleCode}</span> : null}
      </button>

      <div className="bd-ref-uploader">
        <span className="bd-avatar">{initials(seller.name)}</span>
        <div>
          <small>Uploaded by</small>
          <strong>{orNA(seller.name)}</strong>
          <span className="mono">{orNA(seller.id)}</span>
        </div>
        <em><Icon name="clock" size={12} /> {dateTime(seller.sampleUploadedAt)}</em>
      </div>

      <InfoGrid
        rows={[
          { label: "Sample / reference code", value: material.sampleCode, mono: true },
          { label: "Seller name", value: seller.name },
          { label: "Seller ID", value: seller.id, mono: true },
          { label: "Material type", value: material.materialType || material.name },
          { label: "Source sample ID", value: material.sourceSampleId, mono: true },
          { label: "Location", value: seller.location || material.pickupArea },
          { label: "Mobile number", value: seller.phone, mono: true },
          { label: "Uploaded time", value: dateTime(seller.sampleUploadedAt) },
          { label: "Recorded material rate", value: rateText(material.rate, material.rateUnit), accent: true },
          { label: "Converter rate", value: converter },
          { label: "Converted material rate", value: rateText(material.convertedRate, material.convertedRateUnit), accent: true },
          { label: "Sample expiry", value: dateTime(seller.sampleExpiresAt) },
          { label: "Permit cost", value: inr(material.permitCost) },
          { label: "Available quantity", value: qtyText(material.availableQuantity, material.availableUnit) }
        ]}
      />

      <p className="bd-private-note"><Icon name="lock" size={13} /> Seller information is internal and will not be shown to the Buyer.</p>
    </Modal>
  );
}

function SellerModal({ material, onClose, onCallSeller, onCopied }) {
  const seller = material.seller;
  return (
    <Modal
      title="Seller Details"
      subtitle="Registered material Seller"
      icon="user"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bd-btn ghost" onClick={onClose}>Close</button>
          <button type="button" className="bd-btn soft" disabled={!seller.id} onClick={async () => onCopied(await copyText(seller.id), "Seller ID copied")}>
            <Icon name="copy" size={14} /> Copy Seller ID
          </button>
          <button type="button" className="bd-btn green" disabled={!seller.phone} onClick={() => onCallSeller(seller.phone, seller.raw)}>
            <Icon name="phone" size={14} /> Call
          </button>
        </>
      }
    >
      <div className="bd-profile">
        <span className="bd-avatar lg">{initials(seller.name)}</span>
        <div>
          <strong>{orNA(seller.name)}</strong>
          <span className="mono">{orNA(seller.id)}</span>
          <small><Icon name="pin" size={12} /> {orNA(seller.location)}</small>
        </div>
      </div>
      <h3 className="bd-subhead">Seller</h3>
      <InfoGrid
        rows={[
          { label: "Mobile number", value: seller.phone, mono: true, icon: "phone" },
          { label: "Joined", value: dateOnly(seller.joinedAt), icon: "calendar" },
          { label: "Registered location", value: seller.location, wide: true },
          { label: "City", value: seller.city },
          { label: "State", value: seller.state },
          { label: "Pincode", value: seller.pincode, mono: true }
        ]}
      />
      <h3 className="bd-subhead">Material listing</h3>
      <InfoGrid
        rows={[
          { label: "Material", value: material.name, wide: true },
          { label: "Published rate", value: material.rate !== null ? inr(material.rate) : NA, accent: true },
          { label: "Rate unit", value: material.rateUnit },
          { label: "Permit cost", value: inr(material.permitCost) },
          { label: "Sample code", value: material.sampleCode, mono: true },
          { label: "Sample uploaded", value: dateTime(seller.sampleUploadedAt) },
          { label: "Sample expiry", value: dateTime(seller.sampleExpiresAt) }
        ]}
      />
      <p className="bd-private-note"><Icon name="lock" size={13} /> Seller information is internal and will not be shown to the Buyer.</p>
    </Modal>
  );
}

function VehicleChips({ vehicles, empty = "No allocation provided" }) {
  if (!vehicles || !vehicles.length) return <span className="bd-muted-text">{empty}</span>;
  return (
    <span className="bd-vchips">
      {vehicles.map((v, index) => (
        <span className="bd-vchip" key={v.type + "-" + index}>
          <Icon name="truck" size={11} /> {v.type} <b>× {v.number !== null ? num(v.number) : "?"}</b>
        </span>
      ))}
    </span>
  );
}

function methodLabel(method) {
  return method === "perKm" ? "Per km" : "Total";
}

function TransporterModal({ bidder, awarded, onClose, onCopied }) {
  return (
    <Modal
      title="Transporter Details"
      subtitle="Registered Transporter and submitted offer"
      icon="truck"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bd-btn ghost" onClick={onClose}>Close</button>
          <button type="button" className="bd-btn soft" disabled={!bidder.transporterId} onClick={async () => onCopied(await copyText(bidder.transporterId), "Transporter ID copied")}>
            <Icon name="copy" size={14} /> Copy Transporter ID
          </button>
          {bidder.phone ? (
            <a className="bd-btn green" href={"tel:" + bidder.phone.replace(/[^\d+]/g, "")}><Icon name="phone" size={14} /> Call</a>
          ) : (
            <button type="button" className="bd-btn green" disabled><Icon name="phone" size={14} /> Call</button>
          )}
        </>
      }
    >
      <div className="bd-profile">
        <span className="bd-avatar lg">{initials(bidder.name)}</span>
        <div>
          <strong>{orNA(bidder.name)}</strong>
          <span className="mono">{orNA(bidder.transporterId)}</span>
          <small><Icon name="user" size={12} /> {orNA(bidder.ownerName)}</small>
        </div>
        <span className={"bd-rank-pill" + (bidder.rank === 1 ? " gold" : "")}>#{bidder.rank}</span>
      </div>
      {awarded ? <div className="bd-banner green"><Icon name="trophy" size={15} /> This Transporter has been awarded the bidding.</div> : null}
      <h3 className="bd-subhead">Agency</h3>
      <InfoGrid
        rows={[
          { label: "Mobile number", value: bidder.phone, mono: true, icon: "phone" },
          { label: "Joined", value: dateOnly(bidder.joinedAt), icon: "calendar" },
          { label: "Registered location", value: bidder.location, wide: true },
          { label: "City", value: bidder.city },
          { label: "State", value: bidder.state }
        ]}
      />
      <h3 className="bd-subhead">Offer</h3>
      <InfoGrid
        rows={[
          { label: "Bid position", value: "#" + bidder.rank },
          { label: "Cost method", value: methodLabel(bidder.method) },
          { label: "Transportation cost", value: inr(bidder.transportationCost) },
          { label: "Permit cost", value: inr(bidder.permitCost) },
          { label: "Total bid", value: inr(bidder.totalBid), accent: true, wide: true },
          { label: "Vehicle count", value: bidder.vehicleCount !== null ? num(bidder.vehicleCount) : NA },
          { label: "Vehicle allocation", value: <VehicleChips vehicles={bidder.vehicles} />, wide: true },
          { label: "Submitted", value: dateTime(bidder.submittedAt) },
          { label: "Last updated", value: dateTime(bidder.updatedAt) }
        ]}
      />
    </Modal>
  );
}

/* --------------------------------------------------------------- Bid form -- */

let vehicleUid = 0;
function nextVehicleUid() {
  vehicleUid += 1;
  return "veh-" + vehicleUid;
}

function initialFormState(bidder, distanceKm) {
  if (!bidder) {
    return { method: "total", amount: "", permitCost: "", vehicleCount: "1", vehicles: [{ uid: nextVehicleUid(), type: "", number: "1" }], adminNote: "" };
  }
  let amount = "";
  if (bidder.method === "perKm") {
    if (bidder.perKmRate !== null) amount = String(bidder.perKmRate);
    else if (bidder.transportationCost !== null && distanceKm) amount = String(Math.round((bidder.transportationCost / distanceKm) * 100) / 100);
  } else if (bidder.transportationCost !== null) {
    amount = String(bidder.transportationCost);
  }
  const vehicles = bidder.vehicles.length
    ? bidder.vehicles.map(v => ({ uid: nextVehicleUid(), type: v.type, number: v.number !== null ? String(v.number) : "" }))
    : [{ uid: nextVehicleUid(), type: "", number: "" }];
  return {
    method: bidder.method,
    amount,
    permitCost: bidder.permitCost !== null ? String(bidder.permitCost) : "0",
    vehicleCount: bidder.vehicleCount !== null ? String(bidder.vehicleCount) : "",
    vehicles,
    adminNote: ""
  };
}

/** Pure computation + validation for the bid form (integer paise maths). */
function evaluateForm(form, distanceKm) {
  const errors = {};
  const amountPaise = toPaise(form.amount);
  const permitPaise = form.permitCost === "" ? 0 : toPaise(form.permitCost);
  const count = toNumber(form.vehicleCount);

  if (amountPaise === null || amountPaise <= 0) {
    errors.amount = form.method === "perKm" ? "Enter a per-km rate greater than zero." : "Enter a transportation amount greater than zero.";
  }
  if (permitPaise === null || permitPaise < 0) errors.permitCost = "Permit cost must be zero or greater.";
  if (form.method === "perKm" && !(distanceKm > 0)) errors.amount = "Route distance is unavailable, so Per km pricing cannot be used.";

  let transportationPaise = null;
  if (!errors.amount && amountPaise !== null) {
    transportationPaise = form.method === "perKm" ? Math.round(amountPaise * distanceKm) : amountPaise;
  }
  const totalPaise = transportationPaise !== null && permitPaise !== null && permitPaise >= 0 ? transportationPaise + permitPaise : null;
  if (totalPaise !== null && totalPaise <= 0) errors.total = "Total bid must be greater than zero.";

  if (count === null || !Number.isInteger(count) || count < 1) errors.vehicleCount = "Enter at least one vehicle (whole number).";

  const seen = new Set();
  let allocated = 0;
  const rowErrors = {};
  form.vehicles.forEach(row => {
    const n = toNumber(row.number);
    if (!row.type) rowErrors[row.uid] = "Select a vehicle type.";
    else if (seen.has(row.type)) rowErrors[row.uid] = "This vehicle type is already added.";
    else if (n === null || !Number.isInteger(n) || n < 1) rowErrors[row.uid] = "Quantity must be a whole number of at least 1.";
    if (row.type) seen.add(row.type);
    if (n !== null && n > 0) allocated += n;
  });
  if (!form.vehicles.length) errors.vehicles = "Add at least one vehicle type.";
  else if (Object.keys(rowErrors).length) errors.vehicles = "Fix the highlighted vehicle rows.";
  else if (count !== null && count >= 1 && allocated !== count) {
    errors.vehicles = "Allocated vehicles (" + allocated + ") must equal the declared count (" + count + ").";
  }
  if (form.adminNote.length > 500) errors.adminNote = "Keep the note under 500 characters.";

  const costDone = !errors.amount && !errors.permitCost && !errors.total;
  const vehiclesDone = !errors.vehicleCount && !errors.vehicles;

  return {
    errors,
    rowErrors,
    valid: Object.keys(errors).length === 0,
    costDone,
    vehiclesDone,
    allocated,
    count: count !== null && count > 0 ? count : 0,
    transportation: fromPaise(transportationPaise),
    permit: permitPaise !== null && permitPaise >= 0 ? fromPaise(permitPaise) : null,
    total: fromPaise(totalPaise),
    perKmRate: form.method === "perKm" ? fromPaise(amountPaise) : null
  };
}

function buildPayload(form, calc, distanceKm) {
  return {
    method: form.method,
    transportationCost: calc.transportation,
    perKmRate: calc.perKmRate,
    distanceKm: form.method === "perKm" ? distanceKm : null,
    permitCost: calc.permit,
    vehicleCount: calc.count,
    vehicles: form.vehicles.map(v => ({ type: v.type, number: Number(v.number) })),
    adminNote: form.adminNote.trim()
  };
}

function MoneyInput({ id, label, prefix = "₹", suffix, value, onChange, error, disabled, hint }) {
  return (
    <div className={"bd-field" + (error ? " has-error" : "")}>
      <label htmlFor={id}>{label}</label>
      <div className="bd-input">
        {prefix ? <b aria-hidden="true">{prefix}</b> : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? id + "-err" : hint ? id + "-hint" : undefined}
          onChange={event => {
            const next = event.target.value.replace(/[^\d.]/g, "");
            if (/^\d*\.?\d{0,2}$/.test(next)) onChange(next);
          }}
        />
        {suffix ? <b className="suffix" aria-hidden="true">{suffix}</b> : null}
      </div>
      {error ? <small id={id + "-err"} className="bd-field-error">{error}</small> : hint ? <small id={id + "-hint"} className="bd-field-hint">{hint}</small> : null}
    </div>
  );
}

function BidForm({ form, setForm, calc, distanceKm, vehicleTypes, disabled, idPrefix, showErrors }) {
  const update = patch => setForm(prev => ({ ...prev, ...patch }));
  const updateRow = (uid, patch) => setForm(prev => ({ ...prev, vehicles: prev.vehicles.map(v => (v.uid === uid ? { ...v, ...patch } : v)) }));
  const usedTypes = new Set(form.vehicles.map(v => v.type).filter(Boolean));
  const canAddRow = form.vehicles.length < vehicleTypes.length;
  const progress = calc.count ? Math.min(1, calc.allocated / calc.count) : 0;
  const allocState = !calc.count ? "idle" : calc.allocated === calc.count ? "ok" : calc.allocated > calc.count ? "over" : "under";
  const err = key => (showErrors ? calc.errors[key] : "");

  return (
    <div className="bd-form">
      <section className="bd-form-section">
        <header><span>1</span><div><b>Cost</b><small>Transportation pricing and permit</small></div></header>
        <div className="bd-seg" role="radiogroup" aria-label="Transportation cost method">
          {[["total", "Total", "Lump-sum for the full route"], ["perKm", "Per km", "Rate × route distance"]].map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={form.method === value}
              className={form.method === value ? "active" : ""}
              disabled={disabled || (value === "perKm" && !(distanceKm > 0))}
              onClick={() => update({ method: value })}
            >
              <b>{label}</b><small>{hint}</small>
            </button>
          ))}
        </div>
        <div className="bd-form-grid">
          <MoneyInput
            id={idPrefix + "-amount"}
            label={form.method === "perKm" ? "Rate per km (₹)" : "Transportation amount (₹)"}
            suffix={form.method === "perKm" ? "/ km" : ""}
            value={form.amount}
            onChange={v => update({ amount: v })}
            error={err("amount")}
            disabled={disabled}
          />
          <MoneyInput
            id={idPrefix + "-permit"}
            label="Permit cost (₹)"
            value={form.permitCost}
            onChange={v => update({ permitCost: v })}
            error={err("permitCost")}
            disabled={disabled}
            hint="Enter 0 if no permit applies"
          />
        </div>
        <div className="bd-calc">
          <div><span><Icon name="route" size={12} /> Route distance</span><b>{distanceKm !== null ? num(distanceKm) + " km" : NA}</b></div>
          <div>
            <span><Icon name="truck" size={12} /> Transportation total</span>
            <b>{calc.transportation !== null ? inr(calc.transportation) : "—"}</b>
            {form.method === "perKm" && calc.perKmRate !== null && distanceKm ? <em>{inr(calc.perKmRate)} × {num(distanceKm)} km</em> : null}
          </div>
          <div><span><Icon name="doc" size={12} /> Permit total</span><b>{calc.permit !== null ? inr(calc.permit) : "—"}</b></div>
          <div className="grand"><span>Overall total bid</span><b>{calc.total !== null ? inr(calc.total) : "—"}</b></div>
        </div>
        {err("total") ? <small className="bd-field-error">{err("total")}</small> : null}
      </section>

      <section className="bd-form-section">
        <header><span>2</span><div><b>Vehicles</b><small>Fleet count and type allocation</small></div></header>
        <div className="bd-count-row">
          <div className={"bd-field" + (err("vehicleCount") ? " has-error" : "")}>
            <label htmlFor={idPrefix + "-count"}>Number of vehicles</label>
            <div className="bd-stepper">
              <button type="button" aria-label="Decrease vehicle count" disabled={disabled || calc.count <= 1}
                onClick={() => update({ vehicleCount: String(Math.max(1, calc.count - 1)) })}><Icon name="minus" size={14} /></button>
              <input id={idPrefix + "-count"} type="text" inputMode="numeric" value={form.vehicleCount} disabled={disabled}
                aria-invalid={err("vehicleCount") ? "true" : "false"}
                onChange={event => update({ vehicleCount: event.target.value.replace(/\D/g, "").slice(0, 3) })} />
              <button type="button" aria-label="Increase vehicle count" disabled={disabled}
                onClick={() => update({ vehicleCount: String(calc.count + 1) })}><Icon name="plus" size={14} /></button>
            </div>
            {err("vehicleCount") ? <small className="bd-field-error">{err("vehicleCount")}</small> : null}
          </div>
          <div className={"bd-alloc state-" + allocState} aria-live="polite">
            <div className="bd-alloc-top">
              <span>Allocation</span>
              <b>{calc.allocated} / {calc.count || "—"}</b>
            </div>
            <span className="bd-alloc-bar" aria-hidden="true"><i style={{ transform: "scaleX(" + progress + ")" }} /></span>
            <small>
              {allocState === "ok" ? "All vehicles allocated" : allocState === "over" ? "Over-allocated by " + (calc.allocated - calc.count)
                : allocState === "under" ? (calc.count - calc.allocated) + " left to allocate" : "Set the vehicle count"}
            </small>
          </div>
        </div>

        <div className="bd-vrows">
          {form.vehicles.map((row, index) => {
            const rowError = showErrors ? calc.rowErrors[row.uid] : "";
            return (
              <div className={"bd-vrow" + (rowError ? " has-error" : "")} key={row.uid}>
                <span className="bd-vrow-index">{index + 1}</span>
                <label className="bd-vrow-type">
                  <span className="bd-sr">Vehicle type {index + 1}</span>
                  <select value={row.type} disabled={disabled} onChange={event => updateRow(row.uid, { type: event.target.value })} aria-invalid={rowError ? "true" : "false"}>
                    <option value="">Select type</option>
                    {vehicleTypes.map(type => (
                      <option key={type} value={type} disabled={type !== row.type && usedTypes.has(type)}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="bd-vrow-qty">
                  <span className="bd-sr">Quantity for vehicle type {row.type || index + 1}</span>
                  <b aria-hidden="true">×</b>
                  <input type="text" inputMode="numeric" value={row.number} disabled={disabled} placeholder="Qty"
                    onChange={event => updateRow(row.uid, { number: event.target.value.replace(/\D/g, "").slice(0, 3) })} />
                </label>
                <button type="button" className="bd-vrow-remove" disabled={disabled || form.vehicles.length === 1}
                  aria-label={"Remove vehicle type " + (row.type || index + 1)}
                  onClick={() => setForm(prev => ({ ...prev, vehicles: prev.vehicles.filter(v => v.uid !== row.uid) }))}>
                  <Icon name="trash" size={14} />
                </button>
                {rowError ? <small className="bd-field-error bd-vrow-error">{rowError}</small> : null}
              </div>
            );
          })}
        </div>
        <button type="button" className="bd-add-row" disabled={disabled || !canAddRow}
          onClick={() => setForm(prev => ({ ...prev, vehicles: [...prev.vehicles, { uid: nextVehicleUid(), type: "", number: "" }] }))}>
          <Icon name="plus" size={14} /> Add vehicle type
        </button>
        {err("vehicles") ? <small className="bd-field-error">{err("vehicles")}</small> : null}
      </section>

      <section className="bd-form-section">
        <header><span>3</span><div><b>Admin note</b><small>Optional — stored with the audit trail</small></div></header>
        <div className={"bd-field" + (err("adminNote") ? " has-error" : "")}>
          <label htmlFor={idPrefix + "-note"}>Note (optional)</label>
          <textarea id={idPrefix + "-note"} rows={3} maxLength={600} value={form.adminNote} disabled={disabled}
            placeholder="e.g. Rate confirmed with Transporter over phone"
            onChange={event => update({ adminNote: event.target.value })} />
          <small className="bd-field-hint right">{form.adminNote.length}/500</small>
          {err("adminNote") ? <small className="bd-field-error">{err("adminNote")}</small> : null}
        </div>
      </section>
    </div>
  );
}

function StageIndicator({ stages }) {
  return (
    <ol className="bd-stages" aria-label="Bid progress">
      {stages.map((stage, index) => (
        <li key={stage.label} className={"state-" + stage.state} aria-current={stage.state === "current" ? "step" : undefined}>
          <span className="bd-stage-dot">{stage.state === "done" ? <Icon name="check" size={12} /> : index + 1}</span>
          <b>{stage.label}</b>
        </li>
      ))}
    </ol>
  );
}

async function runMutation(callback, payload) {
  const result = await callback(payload);
  if (result && typeof result === "object" && (result.success === false || result.ok === false)) {
    throw new Error(result.message || result.error || "Operation failed");
  }
  return result;
}

function errorMessage(error, fallback) {
  return (error && (error.message || (typeof error === "string" ? error : ""))) || fallback;
}

/* --------------------------------------------------------- Action modals -- */

function BidderSummary({ bidder, label = "Selected Transporter" }) {
  return (
    <div className="bd-bidder-summary">
      <span className="bd-avatar">{initials(bidder.name)}</span>
      <div>
        <small>{label}</small>
        <strong>{orNA(bidder.name)}</strong>
        <span className="mono">{orNA(bidder.transporterId)}</span>
      </div>
      <dl>
        <div><dt>Position</dt><dd>#{bidder.rank}</dd></div>
        <div><dt>Current total</dt><dd>{inr(bidder.totalBid)}</dd></div>
      </dl>
    </div>
  );
}

function EditBidModal({ detail, bidder, vehicleTypes, canMutate, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => initialFormState(bidder, detail.distanceKm));
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [apiError, setApiError] = useState("");
  const calc = useMemo(() => evaluateForm(form, detail.distanceKm), [form, detail.distanceKm]);
  const busy = submitting || saving;
  const locked = !canMutate;

  const handleSave = async () => {
    setShowErrors(true);
    setApiError("");
    if (locked || !calc.valid || busy) return;
    setSubmitting(true);
    try {
      await onSubmit({
        bidId: detail.id,
        submissionId: bidder.id,
        transporterPublicId: bidder.transporterId,
        ...buildPayload(form, calc, detail.distanceKm)
      });
    } catch (error) {
      setApiError(errorMessage(error, "Unable to save bid changes."));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Edit Transporter Bid"
      subtitle={detail.id}
      icon="edit"
      size="lg"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <div className="bd-foot-total"><span>New total</span><b>{calc.total !== null ? inr(calc.total) : "—"}</b></div>
          <button type="button" className="bd-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="bd-btn primary" onClick={handleSave} disabled={busy || locked} aria-busy={busy}>
            {busy ? <Spinner /> : <Icon name="check" size={14} />} {busy ? "Saving…" : "Save Bid Changes"}
          </button>
        </>
      }
    >
      <BidderSummary bidder={bidder} />
      {locked ? <div className="bd-banner grey"><Icon name="lock" size={14} /> This bidding is no longer open. Bids cannot be edited.</div> : null}
      <ErrorNote message={apiError} />
      <BidForm form={form} setForm={setForm} calc={calc} distanceKm={detail.distanceKm} vehicleTypes={vehicleTypes}
        disabled={busy || locked} idPrefix="edit" showErrors={showErrors} />
      <p className="bd-fine"><Icon name="shield" size={12} /> Totals and ranking are recalculated by the server after saving.</p>
    </Modal>
  );
}

function DeleteBidModal({ detail, bidder, canMutate, saving, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [apiError, setApiError] = useState("");
  const busy = submitting || saving;
  const trimmed = reason.trim();
  const reasonError = trimmed.length < 5 ? "Enter a reason of at least 5 characters." : "";

  const handleDelete = async () => {
    setTouched(true);
    setApiError("");
    if (!canMutate || reasonError || busy) return;
    setSubmitting(true);
    try {
      await onSubmit({ bidId: detail.id, submissionId: bidder.id, transporterPublicId: bidder.transporterId, reason: trimmed });
    } catch (error) {
      setApiError(errorMessage(error, "Unable to delete this bid."));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Delete Transporter Bid?"
      subtitle="This requires confirmation"
      icon="trash"
      tone="red"
      size="sm"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bd-btn ghost" onClick={onClose} disabled={busy} data-autofocus>Cancel</button>
          <button type="button" className="bd-btn danger" onClick={handleDelete} disabled={busy || !canMutate} aria-busy={busy}>
            {busy ? <Spinner /> : <Icon name="trash" size={14} />} {busy ? "Deleting…" : "Delete Bid"}
          </button>
        </>
      }
    >
      <InfoGrid
        rows={[
          { label: "Transporter", value: bidder.name, wide: true },
          { label: "Transporter ID", value: bidder.transporterId, mono: true },
          { label: "Position", value: "#" + bidder.rank },
          { label: "Transportation cost", value: inr(bidder.transportationCost) },
          { label: "Permit cost", value: inr(bidder.permitCost) },
          { label: "Total bid", value: inr(bidder.totalBid), accent: true, wide: true }
        ]}
      />
      <div className="bd-banner red">
        <Icon name="alert" size={15} />
        This action will remove this Transporter submission from the active bidding and recalculate the bidding positions.
      </div>
      <div className={"bd-field" + (touched && reasonError ? " has-error" : "")}>
        <label htmlFor="delete-reason">Reason for deletion (required)</label>
        <textarea id="delete-reason" rows={3} maxLength={500} value={reason} disabled={busy}
          placeholder="e.g. Transporter withdrew the offer by phone"
          aria-invalid={touched && reasonError ? "true" : "false"}
          onChange={event => setReason(event.target.value)} onBlur={() => setTouched(true)} />
        {touched && reasonError ? <small className="bd-field-error">{reasonError}</small> : null}
      </div>
      <ErrorNote message={apiError} />
    </Modal>
  );
}

function CloseBiddingModal({ detail, remaining, canMutate, saving, onClose, onSubmit }) {
  const [choice, setChoice] = useState("");
  const [custom, setCustom] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const busy = submitting || saving;
  const reason = choice === "Other" ? custom.trim() : choice;
  const reasonError = !choice ? "Select a reason." : choice === "Other" && custom.trim().length < 5 ? "Describe the reason (at least 5 characters)." : "";

  const handleClose = async () => {
    setTouched(true);
    setApiError("");
    if (!canMutate || reasonError || busy) return;
    setSubmitting(true);
    try {
      await onSubmit({ bidId: detail.id, reason });
    } catch (error) {
      setApiError(errorMessage(error, "Unable to close this bidding."));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Close this bidding?"
      subtitle={detail.id}
      icon="stop"
      tone="red"
      size="sm"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bd-btn ghost" onClick={onClose} disabled={busy} data-autofocus>Keep Bidding Open</button>
          <button type="button" className="bd-btn danger" onClick={handleClose} disabled={busy || !canMutate} aria-busy={busy}>
            {busy ? <Spinner /> : <Icon name="stop" size={14} />} {busy ? "Closing…" : "Close Bidding"}
          </button>
        </>
      }
    >
      <InfoGrid
        rows={[
          { label: "Bid ID", value: detail.id, mono: true, wide: true },
          { label: "Time remaining", value: remaining !== null ? clockText(remaining) : "No closing time", mono: true },
          { label: "Active bidders", value: num(detail.bidders.length) },
          { label: "Current lowest bid", value: detail.lowestBid !== null ? inr(detail.lowestBid) : "Not available", accent: true, wide: true }
        ]}
      />
      <div className="bd-banner amber">
        <Icon name="alert" size={15} />
        Closing this bidding will stop new submissions and prevent existing Transporters from revising their bids.
      </div>
      <fieldset className={"bd-reasons" + (touched && reasonError ? " has-error" : "")} disabled={busy}>
        <legend>Reason (required)</legend>
        {CLOSE_REASONS.map(item => (
          <label key={item} className={choice === item ? "active" : ""}>
            <input type="radio" name="close-reason" value={item} checked={choice === item} onChange={() => setChoice(item)} />
            <span className="bd-radio" aria-hidden="true" />
            {item}
          </label>
        ))}
      </fieldset>
      {choice === "Other" ? (
        <div className="bd-field">
          <label htmlFor="close-custom">Custom reason</label>
          <textarea id="close-custom" rows={2} maxLength={500} value={custom} disabled={busy} onChange={event => setCustom(event.target.value)} />
        </div>
      ) : null}
      {touched && reasonError ? <small className="bd-field-error">{reasonError}</small> : null}
      <ErrorNote message={apiError} />
    </Modal>
  );
}

function transporterEligibility(t, existingIds) {
  if (t.id && existingIds.has(t.id)) return { ok: false, reason: "This Transporter has already submitted a bid." };
  if (!t.id) return { ok: false, reason: "Missing Transporter ID" };
  if (t.activeKnown && !t.isActive) return { ok: false, reason: "Transporter account is not active" };
  if (t.verifiedKnown && !t.isVerified) return { ok: false, reason: "Transporter is not verified" };
  if (!t.activeKnown && !t.verifiedKnown) return { ok: false, reason: "Verification status not provided by server" };
  return { ok: true, reason: "" };
}

function AddBidModal({ detail, vehicleTypes, canMutate, saving, onClose, onSearch, onSubmit }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => initialFormState(null, detail.distanceKm));
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const searchSeq = useRef(0);
  const calc = useMemo(() => evaluateForm(form, detail.distanceKm), [form, detail.distanceKm]);
  const busy = submitting || saving;
  const existingIds = useMemo(() => new Set(detail.bidders.map(b => b.transporterId).filter(Boolean)), [detail.bidders]);

  useEffect(() => {
    const text = query.trim();
    if (selected) return undefined;
    if (text.length < SEARCH_MIN_CHARS) {
      searchSeq.current += 1;
      setResults([]);
      setSearching(false);
      setSearchError("");
      setSearched("");
      return undefined;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await onSearch(text);
        if (seq !== searchSeq.current) return;
        setResults(extractList(response).map(normalizeTransporterResult));
        setSearchError("");
        setSearched(text);
      } catch (error) {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setSearchError(errorMessage(error, "Transporter search failed."));
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, selected, onSearch]);

  const selectedEligibility = selected ? transporterEligibility(selected, existingIds) : null;
  const stages = [
    { label: "Cost", state: !selected ? "pending" : calc.costDone ? "done" : "current" },
    { label: "Vehicles", state: !selected ? "pending" : calc.vehiclesDone ? "done" : calc.costDone ? "current" : "pending" },
    { label: "Submit", state: selected && calc.valid ? "current" : "pending" }
  ];

  const handleSubmit = async () => {
    setShowErrors(true);
    setApiError("");
    if (!selected) { setApiError("Select a registered Transporter first."); return; }
    if (!selectedEligibility.ok) { setApiError(selectedEligibility.reason); return; }
    if (!canMutate) { setApiError("This bidding is no longer open for new submissions."); return; }
    if (!calc.valid || busy) return;
    setSubmitting(true);
    try {
      await onSubmit({ bidId: detail.id, transporterPublicId: selected.id, ...buildPayload(form, calc, detail.distanceKm) });
    } catch (error) {
      setApiError(errorMessage(error, "Unable to submit this bid."));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Transporter Bid"
      subtitle={"Submit on behalf of a registered Transporter · " + detail.id}
      icon="plus"
      size="lg"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <div className="bd-foot-total"><span>Total bid</span><b>{selected && calc.total !== null ? inr(calc.total) : "—"}</b></div>
          <button type="button" className="bd-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="bd-btn primary" onClick={handleSubmit}
            disabled={busy || !canMutate || !selected || (selectedEligibility && !selectedEligibility.ok)} aria-busy={busy}>
            {busy ? <Spinner /> : <Icon name="gavel" size={14} />} {busy ? "Submitting…" : "Submit Bid for Transporter"}
          </button>
        </>
      }
    >
      <StageIndicator stages={stages} />
      {!canMutate ? <div className="bd-banner grey"><Icon name="lock" size={14} /> This bidding is no longer open for new submissions.</div> : null}

      <section className="bd-form-section">
        <header><span><Icon name="search" size={12} /></span><div><b>Select Transporter</b><small>Only active, verified Transporters can be selected</small></div></header>
        {selected ? (
          <div className={"bd-selected-t" + (selectedEligibility.ok ? "" : " invalid")}>
            <span className="bd-avatar">{initials(selected.name)}</span>
            <div>
              <strong>{orNA(selected.name)}</strong>
              <span className="mono">{orNA(selected.id)}</span>
              <small>{[selected.ownerName, selected.phone, selected.location].filter(Boolean).join(" · ") || NA}</small>
            </div>
            <button type="button" className="bd-btn ghost sm" disabled={busy}
              onClick={() => { setSelected(null); setApiError(""); }}>Change Transporter</button>
            {!selectedEligibility.ok ? <p className="bd-field-error">{selectedEligibility.reason}</p> : null}
          </div>
        ) : (
          <>
            <label className="bd-searchbox" htmlFor="add-search">
              <Icon name="search" size={16} />
              <span className="bd-sr">Search Transporters</span>
              <input id="add-search" type="search" autoComplete="off" value={query} data-autofocus
                placeholder="Search by Transporter name, ID, phone, city, or location"
                onChange={event => setQuery(event.target.value)} disabled={!canMutate} />
              {searching ? <Spinner /> : query ? (
                <button type="button" className="bd-clear" aria-label="Clear search" onClick={() => setQuery("")}><Icon name="close" size={12} /></button>
              ) : null}
            </label>
            <div className="bd-results" aria-live="polite">
              {query.trim().length > 0 && query.trim().length < SEARCH_MIN_CHARS ? (
                <p className="bd-results-note">Type at least {SEARCH_MIN_CHARS} characters to search.</p>
              ) : searchError ? (
                <ErrorNote message={searchError} />
              ) : searched && !searching && results.length === 0 ? (
                <p className="bd-results-note">No registered Transporters match “{searched}”.</p>
              ) : (
                results.map(t => {
                  const eligibility = transporterEligibility(t, existingIds);
                  return (
                    <button key={t.key} type="button" className={"bd-result" + (eligibility.ok ? "" : " disabled")}
                      aria-disabled={!eligibility.ok}
                      onClick={() => { if (eligibility.ok) { setSelected(t); setApiError(""); } else setApiError(eligibility.reason); }}>
                      <span className="bd-avatar sm">{initials(t.name)}</span>
                      <span className="bd-result-main">
                        <b>{orNA(t.name)}</b>
                        <small className="mono">{orNA(t.id)}{t.ownerName ? " · " + t.ownerName : ""}</small>
                        <small>{[t.phone, t.city, t.state].filter(Boolean).join(" · ") || NA}</small>
                      </span>
                      <span className="bd-result-flags">
                        {t.verifiedKnown ? <em className={t.isVerified ? "ok" : "bad"}>{t.isVerified ? "Verified" : "Unverified"}</em> : null}
                        {t.activeKnown ? <em className={t.isActive ? "ok" : "bad"}>{t.isActive ? "Active" : "Inactive"}</em> : null}
                        {!eligibility.ok ? <small>{eligibility.reason}</small> : <Icon name="arrow" size={14} />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>

      <ErrorNote message={apiError} />

      {selected && selectedEligibility.ok ? (
        <BidForm form={form} setForm={setForm} calc={calc} distanceKm={detail.distanceKm} vehicleTypes={vehicleTypes}
          disabled={busy || !canMutate} idPrefix="add" showErrors={showErrors} />
      ) : null}
      <p className="bd-fine"><Icon name="shield" size={12} /> The server validates eligibility, duplicate submissions and recalculates totals.</p>
    </Modal>
  );
}

/* --------------------------------------------------------- Page sections -- */

function SectionHead({ icon, title, subtitle, children }) {
  return (
    <header className="bd-section-head">
      <span className="bd-section-icon"><Icon name={icon} size={15} /></span>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? <div className="bd-section-actions">{children}</div> : null}
    </header>
  );
}

function StatusBanner({ phase, detail, now }) {
  if (phase === "open") return null;
  const map = {
    expired: { tone: "grey", icon: "clock", title: "Bidding closed", text: "The bidding window has ended. Submissions are locked; historical data remains visible." },
    closed: {
      tone: "grey", icon: "lock", title: "Bidding closed",
      text: (detail.closedReason ? "Reason: " + detail.closedReason + ". " : "") + (detail.closedAt ? "Closed " + dateTime(detail.closedAt) + ". " : "") + "All modification controls are disabled."
    },
    awarded: { tone: "green", icon: "trophy", title: "Bidding awarded", text: (detail.awardedAt ? "Awarded " + dateTime(detail.awardedAt) + ". " : "") + "All modification controls are disabled." },
    cancelled: { tone: "red", icon: "ban", title: "Bidding cancelled", text: "Reason: " + (detail.cancellationReason || "Not provided") + ". Historical submissions remain visible." }
  }[phase];
  if (!map) return null;
  return (
    <div className={"bd-status-banner tone-" + map.tone} role="status">
      <span><Icon name={map.icon} size={17} /></span>
      <div><b>{map.title}</b><p>{map.text}</p></div>
      {detail.deadline !== null && phase === "expired" ? <em>{relativeTime(detail.deadline, now)}</em> : null}
    </div>
  );
}

function SummaryCard({ detail, phase, badge, remaining, onCloseBidding, canMutate, busy }) {
  const open = phase === "open";
  const tone = !open ? "ended" : remaining === null ? "steady" : remaining < CRITICAL_WINDOW_MS ? "critical" : remaining < URGENT_WINDOW_MS ? "urgent" : "steady";
  const ratio = open && remaining !== null && detail.windowMs ? Math.max(0, Math.min(1, remaining / detail.windowMs)) : 0;

  return (
    <section className={"bd-card bd-summary tone-" + tone} aria-label="Bidding summary">
      <span className="bd-card-mesh" aria-hidden="true" />
      <div className="bd-summary-top">
        <div className="bd-summary-ids">
          <span className="bd-kicker"><Icon name="gavel" size={12} /> Bid ID</span>
          <strong className="bd-bidid">{detail.id || "Unavailable"}</strong>
          <span className="bd-reqid"><Icon name="doc" size={12} /> Request <b>{detail.requestId || "—"}</b></span>
        </div>
        <span className={"bd-badge " + BADGE_CLASS[badge]}><i />{badge}</span>
      </div>

      <div className={"bd-timer-panel tone-" + tone}>
        <div className="bd-timer-label">
          <span className="bd-timer-icon"><Icon name={open ? (tone === "steady" ? "hourglass" : "bolt") : "flag"} size={16} /></span>
          <div>
            <small>{open ? (tone === "steady" ? "Time remaining" : "Urgent — closing soon") : "Status"}</small>
            {!open || remaining === null ? <b>{open ? "Closing time not provided" : "Bidding closed"}</b> : null}
          </div>
        </div>
        {open && remaining !== null ? <CountdownDisplay remaining={remaining} tone={tone} large /> : null}
        {open && remaining !== null ? <span className="bd-timer-bar" aria-hidden="true"><i style={{ transform: "scaleX(" + ratio + ")" }} /></span> : null}
      </div>

      <dl className="bd-kpis">
        <div><dt><Icon name="users" size={12} /> Transporters</dt><dd>{num(detail.applicants)}</dd></div>
        <div className={detail.lowestBid !== null ? "best" : ""}><dt><Icon name="rupee" size={12} /> Lowest bid</dt><dd>{detail.lowestBid !== null ? inr(detail.lowestBid) : "Not available"}</dd></div>
        <div><dt><Icon name="route" size={12} /> Distance</dt><dd>{detail.distanceKm !== null ? num(detail.distanceKm) + " km" : NA}</dd></div>
      </dl>

      <div className="bd-dates">
        <div><Icon name="calendar" size={13} /><span>Published</span><b>{dateTime(detail.createdAt)}</b></div>
        <div><Icon name="clock" size={13} /><span>Closes</span><b>{detail.deadline !== null ? dateTime(detail.deadline) : NA}</b></div>
      </div>

      {open ? (
        <button type="button" className="bd-close-btn" onClick={onCloseBidding} disabled={!canMutate || busy}>
          <Icon name="stop" size={15} /> Close Bidding
        </button>
      ) : null}
    </section>
  );
}

function RouteCard({ detail, live }) {
  return (
    <section className="bd-card bd-routecard" aria-label="Route">
      <SectionHead icon="route" title="Route" subtitle="Pickup to delivery" />
      <ol className={"bd-route" + (live ? " is-live" : "")}>
        <li className="bd-stop pickup">
          <span className="bd-stop-mark"><i /></span>
          <div><small>Pickup</small><strong>{detail.pickup || "Pickup location not provided"}</strong></div>
        </li>
        <li className="bd-leg" aria-label={"Direction: pickup to drop" + (detail.distanceKm !== null ? ", " + num(detail.distanceKm) + " kilometres" : "")}>
          <span className="bd-leg-line" aria-hidden="true"><i /></span>
          <span className="bd-leg-chip">
            <Icon name="truck" size={13} />
            {detail.distanceKm !== null ? <><b>{num(detail.distanceKm)}</b> km</> : "Distance not available"}
            <Icon name="arrow" size={12} />
          </span>
        </li>
        <li className="bd-stop drop">
          <span className="bd-stop-mark"><Icon name="pin" size={13} /></span>
          <div><small>Delivery</small><strong>{detail.drop || "Drop location not provided"}</strong></div>
        </li>
      </ol>
    </section>
  );
}

function MaterialCard({ material, index, onOpenReference, onOpenSeller }) {
  const seller = material.seller;
  const sellerClickable = Boolean(seller.name || seller.id);
  return (
    <article className="bd-material" style={{ animationDelay: index * 60 + "ms" }}>
      <button type="button" className="bd-material-thumb" onClick={onOpenReference} aria-label={"Open reference source for " + material.name}>
        <MaterialImage src={material.imageUrl} alt={"Reference image of " + material.name} />
        <span className="bd-thumb-hint"><Icon name="expand" size={11} /> Reference</span>
      </button>
      <div className="bd-material-body">
        <div className="bd-material-head">
          <div>
            <h3>{material.name}</h3>
            {material.sampleCode ? <span className="bd-code mono">{material.sampleCode}</span> : null}
          </div>
          <span className="bd-qty"><b>{material.quantity !== null ? num(material.quantity) : "—"}</b>{material.unit || ""}</span>
        </div>
        <div className="bd-seller-line">
          <Icon name="user" size={12} />
          {sellerClickable ? (
            <>
              <button type="button" className="bd-link" onClick={onOpenSeller}>{seller.name || "Unnamed Seller"}</button>
              {seller.id ? <button type="button" className="bd-link mono subtle" onClick={onOpenSeller}>{seller.id}</button> : null}
            </>
          ) : <span className="bd-muted-text">Seller not provided</span>}
        </div>
        <div className="bd-seller-line"><Icon name="pin" size={12} /><span>{material.pickupArea || seller.location || "Pickup area not provided"}</span></div>
        <dl className="bd-mgrid">
          <div className="accent"><dt>Material rate</dt><dd>{rateText(material.rate, material.rateUnit)}</dd></div>
          {material.convertedRate !== null ? <div><dt>Converted rate</dt><dd>{rateText(material.convertedRate, material.convertedRateUnit)}</dd></div> : null}
          {material.feetPerTon !== null ? <div><dt>Conversion</dt><dd>{num(material.feetPerTon)} ft / ton</dd></div> : null}
          <div><dt>Permit cost</dt><dd>{inr(material.permitCost)}</dd></div>
          <div><dt>Available</dt><dd>{qtyText(material.availableQuantity, material.availableUnit)}</dd></div>
        </dl>
      </div>
    </article>
  );
}

function BidderCard({ bidder, detail, index, lowestBid, canMutate, busy, onOpen, onEdit, onDelete }) {
  const awarded = isAwardedBidder(bidder, detail);
  const leader = bidder.rank === 1;
  const gap = lowestBid !== null && bidder.totalBid !== null && bidder.totalBid > lowestBid ? bidder.totalBid - lowestBid : null;
  const locked = !canMutate || busy;
  const lockReason = canMutate ? "" : " (bidding is not open)";

  return (
    <article className={"bd-bidder" + (leader ? " leader" : "") + (awarded ? " awarded" : "")} style={{ animationDelay: Math.min(index, 10) * 50 + "ms" }}>
      <div className="bd-rank" aria-label={"Position " + bidder.rank}>
        {leader ? <Icon name={awarded ? "trophy" : "crown"} size={14} /> : null}
        <b>#{bidder.rank}</b>
      </div>

      <div className="bd-bidder-id">
        <button type="button" className="bd-link strong" onClick={onOpen}>{bidder.name || "Unnamed Transporter"}</button>
        <div className="bd-bidder-sub">
          <button type="button" className="bd-link mono subtle" onClick={onOpen}>{bidder.transporterId || "ID unavailable"}</button>
          {bidder.ownerName ? <span><Icon name="user" size={11} /> {bidder.ownerName}</span> : null}
        </div>
        <span className="bd-bidder-loc"><Icon name="pin" size={11} /> {bidder.location || [bidder.city, bidder.state].filter(Boolean).join(", ") || NA}</span>
        <div className="bd-tags">
          {awarded ? <em className="tag green"><Icon name="trophy" size={11} /> Awarded</em>
            : leader ? <em className="tag gold"><Icon name="crown" size={11} /> Leading bid</em> : null}
          <em className={"tag status-" + bidder.status}>{bidder.status}</em>
          <em className="tag">{methodLabel(bidder.method)}</em>
        </div>
      </div>

      <dl className="bd-costs">
        <div><dt>Transport</dt><dd>{inr(bidder.transportationCost)}</dd></div>
        <div><dt>Permit</dt><dd>{inr(bidder.permitCost)}</dd></div>
        <div className="total"><dt>Total bid</dt><dd>{inr(bidder.totalBid)}</dd>{gap !== null ? <small>+{inr(gap)} vs lowest</small> : leader && bidder.totalBid !== null ? <small className="ok">Lowest offer</small> : null}</div>
      </dl>

      <div className="bd-fleet">
        <span className="bd-fleet-count"><Icon name="truck" size={13} /> {bidder.vehicleCount !== null ? num(bidder.vehicleCount) : "—"} vehicle{bidder.vehicleCount === 1 ? "" : "s"}</span>
        <VehicleChips vehicles={bidder.vehicles} />
      </div>

      <div className="bd-bidder-times">
        <span><Icon name="calendar" size={11} /> Submitted <b>{dateTime(bidder.submittedAt)}</b></span>
        <span><Icon name="clock" size={11} /> Updated <b>{dateTime(bidder.updatedAt)}</b></span>
      </div>

      <div className="bd-row-actions">
        <button type="button" className="bd-act edit" onClick={onEdit} disabled={locked} aria-label={"Edit bid from " + (bidder.name || bidder.transporterId) + lockReason} title="Edit bid">
          <Icon name="edit" size={15} /><span>Edit</span>
        </button>
        <button type="button" className="bd-act delete" onClick={onDelete} disabled={locked} aria-label={"Delete bid from " + (bidder.name || bidder.transporterId) + lockReason} title="Delete bid">
          <Icon name="trash" size={15} /><span>Delete</span>
        </button>
      </div>
    </article>
  );
}

function BiddersSection({ detail, now, canMutate, busy, sort, setSort, onAdd, onOpen, onEdit, onDelete }) {
  const list = useMemo(() => sortBidders(detail.bidders, sort), [detail.bidders, sort]);
  return (
    <section className="bd-card bd-bidders" aria-labelledby="bd-bidders-title">
      <header className="bd-section-head">
        <span className="bd-section-icon"><Icon name="gavel" size={15} /></span>
        <div>
          <h2 id="bd-bidders-title">Transporter Bids</h2>
          <p>Review all active Transporter offers and vehicle allocations</p>
        </div>
        <div className="bd-section-actions">
          <button type="button" className="bd-btn primary" onClick={onAdd} disabled={!canMutate || busy}>
            <Icon name="plus" size={14} /> Add Bid
          </button>
        </div>
      </header>

      <dl className="bd-stats">
        <div><dt>Active bidders</dt><dd>{num(detail.bidders.length)}</dd></div>
        <div className="best"><dt>Lowest</dt><dd>{detail.lowestBid !== null ? inr(detail.lowestBid) : "Not available"}</dd></div>
        <div><dt>Highest</dt><dd>{detail.highestBid !== null ? inr(detail.highestBid) : "Not available"}</dd></div>
        <div><dt>Average</dt><dd>{detail.averageBid !== null ? inr(detail.averageBid) : "Not available"}</dd></div>
        <div className="wide"><dt>Last bid update</dt><dd>{detail.lastUpdate !== null ? timeOnly(detail.lastUpdate) + " · " + relativeTime(detail.lastUpdate, now) : "No activity yet"}</dd></div>
      </dl>

      {list.length ? (
        <>
          <div className="bd-list-tools">
            <span className="bd-list-count"><Icon name="spark" size={12} /> {list.length} ranked submission{list.length === 1 ? "" : "s"}</span>
            <label className="bd-sort">
              <Icon name="sort" size={14} />
              <span className="bd-sr">Sort Transporter bids</span>
              <select value={sort} onChange={event => setSort(event.target.value)}>
                {BIDDER_SORTS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="bd-bidder-list">
            {list.map((bidder, index) => (
              <BidderCard key={bidder.key} bidder={bidder} detail={detail} index={index} lowestBid={detail.lowestBid}
                canMutate={canMutate} busy={busy}
                onOpen={() => onOpen(bidder)} onEdit={() => onEdit(bidder)} onDelete={() => onDelete(bidder)} />
            ))}
          </div>
        </>
      ) : (
        <div className="bd-empty">
          <span className="bd-empty-icon"><Icon name="users" size={22} /></span>
          <h3>No Transporter bids have been submitted yet.</h3>
          <p>{canMutate ? "You can add a bid on behalf of a registered Transporter." : "This bidding closed without any submissions."}</p>
          {canMutate ? (
            <button type="button" className="bd-btn primary lg" onClick={onAdd} disabled={busy}><Icon name="plus" size={15} /> Add Bid</button>
          ) : null}
        </div>
      )}

      {detail.inactiveBidders.length ? (
        <p className="bd-fine"><Icon name="info" size={12} /> {detail.inactiveBidders.length} withdrawn or removed submission{detail.inactiveBidders.length === 1 ? " is" : "s are"} excluded from ranking.</p>
      ) : null}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bd-main" aria-busy="true" aria-label="Loading bidding details">
      <div className="bd-card sk-card"><div className="sk w40 h14" /><div className="sk w60 h24 mt" /><div className="sk w100 h70 mt" /><div className="sk-row mt"><div className="sk h46" /><div className="sk h46" /><div className="sk h46" /></div></div>
      <div className="bd-card sk-card"><div className="sk w30 h14" /><div className="sk w100 h40 mt" /><div className="sk w50 h20 mt" /><div className="sk w100 h40 mt" /></div>
      <div className="bd-card sk-card span"><div className="sk w30 h14" /><div className="sk-row mt"><div className="sk h110" /><div className="sk h110" /></div></div>
      <div className="bd-card sk-card span"><div className="sk w40 h14" /><div className="sk-row five mt"><div className="sk h46" /><div className="sk h46" /><div className="sk h46" /><div className="sk h46" /><div className="sk h46" /></div><div className="sk w100 h90 mt" /><div className="sk w100 h90 mt" /></div>
    </div>
  );
}

/* ------------------------------------------------------- Page component -- */

const noop = () => {};
const asyncNoop = async () => {};

export default function StoneRateAdminTransportBiddingDetails({
  selectedBid = null,
  loading = false,
  error = "",
  saving = false,
  onBack = noop,
  onRefresh = noop,
  onRetry = noop,
  onEditBid = asyncNoop,
  onDeleteBid = asyncNoop,
  onAddBid = asyncNoop,
  onCloseBidding = asyncNoop,
  onSearchTransporters = asyncNoop,
  onCallSeller = noop,
  vehicleTypes = DEFAULT_VEHICLE_TYPES,
  // Accepted for API compatibility with the other Admin pages. Like
  // AdminRateRequestDetails, this detail page has no bottom navigation.
  onHome = noop,
  onSamples = noop,
  onTransporterBidding = noop,
  onRateRequests = noop,
  onConfirmedOrders = noop
}) {
  const [now, setNow] = useState(() => Date.now());
  const [modal, setModal] = useState(null); // { type, bidder?, material? }
  const [lightbox, setLightbox] = useState(null);
  const [sort, setSort] = useState("position");
  const [toast, setToast] = useState({ text: "", tone: "ok", id: 0 });
  const [closedLocally, setClosedLocally] = useState(false);
  const toastTimer = useRef(null);

  /* anchor `secondsLeft` to when this particular response arrived */
  const receivedAtRef = useRef({ bid: null, at: Date.now() });
  if (receivedAtRef.current.bid !== selectedBid) receivedAtRef.current = { bid: selectedBid, at: Date.now() };
  const receivedAt = receivedAtRef.current.at;

  const detail = useMemo(() => normalizeDetail(selectedBid, receivedAt), [selectedBid, receivedAt]);
  const types = Array.isArray(vehicleTypes) && vehicleTypes.length ? vehicleTypes : DEFAULT_VEHICLE_TYPES;

  const detailId = detail ? detail.id : "";
  useEffect(() => { setClosedLocally(false); }, [detailId]);

  const phase = detail ? derivePhase(detail, now, closedLocally) : "open";
  const open = phase === "open";
  const remaining = detail && open && detail.deadline !== null ? Math.max(0, detail.deadline - now) : null;
  const badge = detail ? deriveBadge(phase, remaining, detail.bidders.length) : "OPEN";
  const busy = saving || loading;

  /* 1-second clock only while the bidding is open */
  useEffect(() => {
    if (!open || !detail || detail.deadline === null) return undefined;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, detail]);

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  const showToast = useCallback((text, tone = "ok") => {
    setToast(prev => ({ text, tone, id: prev.id + 1 }));
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(prev => ({ ...prev, text: "" })), 2800);
  }, []);

  const handleCopied = useCallback((ok, message) => {
    showToast(ok ? message : "Copy failed — clipboard unavailable", ok ? "ok" : "error");
  }, [showToast]);

  const closeModal = useCallback(() => setModal(null), []);

  /* All mutations: await backend → close modal → toast → refresh from backend. Errors are re-thrown to the modal. */
  const mutate = useCallback(async (callback, payload, successText, onSuccess) => {
    try {
      await runMutation(callback, payload);
    } catch (mutationError) {
      showToast("API operation failed", "error");
      throw mutationError;
    }
    if (onSuccess) onSuccess();
    setModal(null);
    showToast(successText);
    try {
      await onRefresh();
    } catch (refreshError) {
      showToast("Saved, but refreshing failed. Pull to refresh.", "error");
    }
  }, [onRefresh, showToast]);

  const submitEdit = useCallback(p => mutate(onEditBid, p, "Bid updated successfully"), [mutate, onEditBid]);
  const submitDelete = useCallback(p => mutate(onDeleteBid, p, "Bid deleted successfully"), [mutate, onDeleteBid]);
  const submitAdd = useCallback(p => mutate(onAddBid, p, "Bid added successfully"), [mutate, onAddBid]);
  const submitClose = useCallback(
    p => mutate(onCloseBidding, p, "Bidding closed successfully", () => setClosedLocally(true)),
    [mutate, onCloseBidding]
  );

  const handleCallSeller = useCallback((phone, seller) => {
    if (!phone) { showToast("Seller mobile number not available", "error"); return; }
    onCallSeller(phone, seller);
  }, [onCallSeller, showToast]);

  const winner = detail ? detail.bidders.find(b => isAwardedBidder(b, detail)) : null;

  /* ---------------------------------------------------------- body -- */
  let body;
  if (error && !detail) {
    body = (
      <section className="bd-card bd-state error" role="alert">
        <span className="bd-state-icon"><Icon name="alert" size={24} /></span>
        <h2>Unable to load bidding details</h2>
        <p>{error}</p>
        <div className="bd-state-actions">
          <button type="button" className="bd-btn ghost" onClick={onBack}><Icon name="back" size={14} /> Back</button>
          <button type="button" className="bd-btn primary" onClick={onRetry}><Icon name="refresh" size={14} /> Retry</button>
        </div>
      </section>
    );
  } else if (!detail && loading) {
    body = <LoadingSkeleton />;
  } else if (!detail) {
    body = (
      <section className="bd-card bd-state">
        <span className="bd-state-icon"><Icon name="gavel" size={24} /></span>
        <h2>No bidding selected</h2>
        <p>Open a bidding from Transport Biddings to view its details.</p>
        <div className="bd-state-actions">
          <button type="button" className="bd-btn primary" onClick={onBack}><Icon name="back" size={14} /> Back to biddings</button>
        </div>
      </section>
    );
  } else {
    body = (
      <>
        {error ? (
          <div className="bd-banner red refresh-error" role="alert">
            <Icon name="alert" size={15} /> <span>Refresh failed: {error}. Showing the last loaded data.</span>
            <button type="button" className="bd-btn ghost sm" onClick={onRetry}>Retry</button>
          </div>
        ) : null}
        <StatusBanner phase={phase} detail={detail} now={now} />
        {winner ? (
          <div className="bd-winner">
            <span className="bd-winner-icon"><Icon name="trophy" size={20} /></span>
            <div>
              <small>Winning Transporter</small>
              <button type="button" className="bd-link strong" onClick={() => setModal({ type: "transporter", bidder: winner })}>{winner.name || winner.transporterId}</button>
              <span className="mono">{winner.transporterId}</span>
            </div>
            <b>{inr(winner.totalBid)}</b>
          </div>
        ) : null}

        <div className={"bd-main" + (loading ? " is-refreshing" : "")}>
          <SummaryCard detail={detail} phase={phase} badge={badge} remaining={remaining}
            canMutate={open} busy={busy} onCloseBidding={() => setModal({ type: "close" })} />
          <RouteCard detail={detail} live={open} />

          <section className="bd-card bd-materials span" aria-label="Materials">
            <SectionHead icon="cube" title="Materials" subtitle={detail.materials.length + " material" + (detail.materials.length === 1 ? "" : "s") + " in this bidding"} />
            {detail.materials.length ? (
              <div className="bd-material-list">
                {detail.materials.map((material, index) => (
                  <MaterialCard key={material.key} material={material} index={index}
                    onOpenReference={() => setModal({ type: "reference", material })}
                    onOpenSeller={() => setModal({ type: "seller", material })} />
                ))}
              </div>
            ) : <p className="bd-muted-text pad">No materials listed for this bidding.</p>}
          </section>

          <div className="span">
            <BiddersSection detail={detail} now={now} canMutate={open} busy={busy} sort={sort} setSort={setSort}
              onAdd={() => setModal({ type: "add" })}
              onOpen={bidder => setModal({ type: "transporter", bidder })}
              onEdit={bidder => setModal({ type: "edit", bidder })}
              onDelete={bidder => setModal({ type: "delete", bidder })} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bd-root">
      <style>{STYLES}</style>
      <div className="bd-bg" aria-hidden="true"><i /><b /><span /><em /></div>

      {/* ============================ HEADER ============================ */}
      <header className="bd-header">
        <div className="bd-width">
          <div className="bd-top">
            <button type="button" className="bd-iconbtn" onClick={onBack} aria-label="Back to Transport Biddings">
              <Icon name="back" size={18} />
            </button>
            <div className="bd-brand">
              <span className="bd-brand-mark"><Icon name="truck" size={17} strokeWidth={1.9} /><i /></span>
              <span className="bd-brand-text"><b>StoneRate</b><small>Admin · Bidding Desk</small></span>
            </div>
            {detail ? <span className={"bd-badge head " + BADGE_CLASS[badge]}><i />{badge}</span> : null}
            <button type="button" className={"bd-iconbtn" + (loading ? " spinning" : "")} onClick={onRefresh} disabled={loading || saving}
              aria-label={loading ? "Refreshing bidding details" : "Refresh bidding details"}>
              <Icon name="refresh" size={18} />
            </button>
          </div>

          <div className="bd-hero">
            <span className="bd-eyebrow"><Icon name="gavel" size={12} /> Reverse auction control</span>
            <h1>Transport <span>Bidding Details</span></h1>
            <p>Review bids, manage submissions, and control the bidding lifecycle</p>
            <div className="bd-hero-ids">
              <span><small>Bid</small><b className="mono">{detail ? detail.id || "—" : loading ? "Loading…" : "—"}</b></span>
              <span><small>Request</small><b className="mono">{detail ? detail.requestId || "—" : loading ? "Loading…" : "—"}</b></span>
              {detail && detail.updatedAt !== null ? <span className="soft"><small>Updated</small><b>{relativeTime(detail.updatedAt, now)}</b></span> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="bd-width bd-shell">{body}</main>

      {/* ============================ MODALS ============================ */}
      {detail && modal && modal.type === "reference" ? (
        <ReferenceSourceModal material={modal.material} onClose={closeModal} onCallSeller={handleCallSeller} onCopied={handleCopied}
          onOpenLightbox={() => setLightbox(modal.material)} />
      ) : null}
      {detail && modal && modal.type === "seller" ? (
        <SellerModal material={modal.material} onClose={closeModal} onCallSeller={handleCallSeller} onCopied={handleCopied} />
      ) : null}
      {detail && modal && modal.type === "transporter" ? (
        <TransporterModal bidder={modal.bidder} awarded={isAwardedBidder(modal.bidder, detail)} onClose={closeModal} onCopied={handleCopied} />
      ) : null}
      {detail && modal && modal.type === "edit" ? (
        <EditBidModal detail={detail} bidder={modal.bidder} vehicleTypes={types} canMutate={open} saving={saving} onClose={closeModal} onSubmit={submitEdit} />
      ) : null}
      {detail && modal && modal.type === "delete" ? (
        <DeleteBidModal detail={detail} bidder={modal.bidder} canMutate={open} saving={saving} onClose={closeModal} onSubmit={submitDelete} />
      ) : null}
      {detail && modal && modal.type === "add" ? (
        <AddBidModal detail={detail} vehicleTypes={types} canMutate={open} saving={saving} onClose={closeModal}
          onSearch={onSearchTransporters} onSubmit={submitAdd} />
      ) : null}
      {detail && modal && modal.type === "close" ? (
        <CloseBiddingModal detail={detail} remaining={remaining} canMutate={open} saving={saving} onClose={closeModal} onSubmit={submitClose} />
      ) : null}
      {lightbox ? <ImageLightbox material={lightbox} onClose={() => setLightbox(null)} /> : null}

      <div className={"bd-toast tone-" + toast.tone + (toast.text ? " show" : "")} role="status" aria-live="polite">
        <span className="bd-toast-pip"><Icon name={toast.tone === "error" ? "alert" : "check"} size={12} /></span>
        {toast.text}
      </div>
    </div>
  );
}

/* ===========================================================================
 * Styles — white canvas + signal orange (same tokens as AdminRateRequestDetails).
 * ========================================================================= */

const STYLES = `
.bd-root{
  --o:#f97316;--o2:#c2560b;--o-ink:#9a4408;--soft:rgba(249,115,22,.10);--soft2:rgba(249,115,22,.18);
  --amber:#e08b1e;--amber-ink:#a15c07;--amber-soft:rgba(224,139,30,.12);
  --green:#1f9463;--green-ink:#0f7a4c;--green-soft:rgba(31,148,99,.11);
  --red:#d64545;--red-ink:#b42318;--red-soft:rgba(214,69,69,.10);
  --blue:#3b6fd8;--blue-ink:#2451a8;--blue-soft:rgba(59,111,216,.10);
  --violet:#7c5cd6;--violet-ink:#5b3fb0;--violet-soft:rgba(124,92,214,.11);
  --gold:#d59a0b;--gold-soft:rgba(234,179,8,.14);
  --ink:#141a24;--ink2:#3b4658;--muted:#626d7e;--faint:#8a94a3;--line:#e9edf3;--line2:#dbe2ec;
  --glass:rgba(255,255,255,.80);--glass2:rgba(255,255,255,.93);
  --mono:"SF Mono",ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace;
  position:relative;isolation:isolate;min-height:100dvh;padding-bottom:40px;color:var(--ink);background:#f4f7fb;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;
}
.bd-root *{box-sizing:border-box}
.bd-root button,.bd-root input,.bd-root select,.bd-root textarea{font:inherit;color:inherit}
.bd-root button{cursor:pointer}
.bd-root button:disabled{cursor:not-allowed}
.bd-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.mono{font-family:var(--mono);letter-spacing:.01em}
.bd-root :focus-visible{outline:2px solid rgba(249,115,22,.75);outline-offset:2px}

/* background */
.bd-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:#f4f7fb}
.bd-bg>i{position:absolute;inset:0;background:linear-gradient(transparent 0 31px,rgba(24,42,72,.035) 31px 32px),linear-gradient(90deg,transparent 0 31px,rgba(24,42,72,.035) 31px 32px);
  background-size:32px 32px;-webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%);mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%)}
.bd-bg>b,.bd-bg>span,.bd-bg>em{position:absolute;border-radius:50%;filter:blur(58px);opacity:.5}
.bd-bg>b{width:44vw;height:44vw;max-width:520px;max-height:520px;left:-9vw;top:-16vw;background:radial-gradient(circle,rgba(255,168,74,.55),transparent 66%);animation:bdFloat 16s ease-in-out infinite}
.bd-bg>span{width:40vw;height:40vw;max-width:470px;max-height:470px;right:-10vw;top:-6vw;background:radial-gradient(circle,rgba(80,140,255,.42),transparent 66%);animation:bdFloat 19s ease-in-out infinite reverse}
.bd-bg>em{width:36vw;height:36vw;max-width:420px;max-height:420px;left:34vw;top:30vw;background:radial-gradient(circle,rgba(13,148,136,.24),transparent 68%)}
@keyframes bdFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(2.5vw,1.8vw)}}
@keyframes bdRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes bdSpin{to{transform:rotate(360deg)}}
@keyframes bdBlink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes bdPing{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}
@keyframes bdAlert{0%,100%{box-shadow:0 0 0 0 rgba(214,69,69,.32)}50%{box-shadow:0 0 0 6px rgba(214,69,69,0)}}

.bd-width{width:min(100%,1120px);margin:0 auto;position:relative;z-index:1}

/* header */
.bd-header{position:relative;z-index:2;border-bottom:1px solid rgba(16,28,50,.06);background:rgba(244,247,251,.16)}
.bd-header:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(249,115,22,.3),rgba(80,140,255,.2),transparent)}
.bd-header .bd-width{padding:12px 14px 18px}
.bd-top{display:flex;align-items:center;gap:10px}
.bd-iconbtn{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;border:1px solid var(--line2);border-radius:11px;background:var(--glass2);color:var(--ink2);
  box-shadow:0 2px 8px rgba(20,26,36,.05),inset 0 1px 0 #fff;transition:transform .18s,border-color .18s,box-shadow .18s,color .18s}
.bd-iconbtn:hover:not(:disabled){transform:translateY(-1px);color:var(--o2);border-color:rgba(249,115,22,.45);box-shadow:0 6px 18px rgba(249,115,22,.18)}
.bd-iconbtn:disabled{opacity:.55}
.bd-iconbtn.sm{width:32px;height:32px;border-radius:9px}
.bd-iconbtn.spinning svg{animation:bdSpin .9s linear infinite}
.bd-brand{display:flex;align-items:center;gap:9px;flex:1;min-width:0}
.bd-brand-mark{position:relative;width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;color:#fff;
  background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 6px 16px rgba(249,115,22,.32),inset 0 1px 0 rgba(255,255,255,.35)}
.bd-brand-mark i{position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;background:#22c55e;border:2px solid #fff;animation:bdPing 2.4s ease-in-out infinite}
.bd-brand-text{display:flex;flex-direction:column;min-width:0}
.bd-brand-text b{font-size:14px;line-height:1.15}
.bd-brand-text small{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--o2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.bd-hero{padding:16px 2px 0;animation:bdRise .45s ease both}
.bd-eyebrow{display:inline-flex;align-items:center;gap:5px;margin-bottom:8px;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.bd-eyebrow svg{color:var(--o)}
.bd-hero h1{margin:0;font-size:27px;line-height:1.08;letter-spacing:-.035em;font-weight:750}
.bd-hero h1 span{background:linear-gradient(100deg,var(--o),#fbbf24 50%,var(--o2) 90%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:bdShine 6s ease-in-out infinite}
@keyframes bdShine{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.bd-hero>p{margin:7px 0 0;font-size:12.5px;line-height:1.5;color:var(--muted);max-width:60ch}
.bd-hero-ids{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.bd-hero-ids>span{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;padding:5px 10px;border-radius:999px;border:1px solid rgba(249,115,22,.24);background:var(--soft);color:var(--o-ink)}
.bd-hero-ids>span.soft{border-color:var(--line2);background:var(--glass2);color:var(--ink2)}
.bd-hero-ids small{font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.7}
.bd-hero-ids b{font-size:11.5px;overflow-wrap:anywhere}

/* badge */
.bd-badge{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:5px 9px;border-radius:8px;border:1px solid;font-size:9.5px;line-height:1;font-weight:850;letter-spacing:.09em;white-space:nowrap}
.bd-badge i{width:5px;height:5px;border-radius:50%;background:currentColor}
.bd-badge.open{color:var(--o-ink);background:var(--soft);border-color:rgba(249,115,22,.34)}
.bd-badge.open i{animation:bdBlink 1.6s ease-in-out infinite}
.bd-badge.urgent{color:#fff;background:linear-gradient(135deg,#ef5b5b,var(--red-ink));border-color:transparent;animation:bdAlert 1.8s ease-in-out infinite}
.bd-badge.closed{color:#5b6576;background:#f1f4f8;border-color:var(--line2)}
.bd-badge.awarded{color:var(--green-ink);background:var(--green-soft);border-color:rgba(31,148,99,.32)}
.bd-badge.cancelled{color:var(--red-ink);background:var(--red-soft);border-color:rgba(214,69,69,.3)}
.bd-badge.nobids{color:var(--violet-ink);background:var(--violet-soft);border-color:rgba(124,92,214,.3)}

/* shell + grid */
.bd-shell{padding:16px 14px 24px}
.bd-main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;transition:opacity .25s}
.bd-main.is-refreshing{opacity:.72}
.bd-card{position:relative;overflow:hidden;min-width:0;padding:14px;border:1px solid var(--line);border-radius:18px;background:var(--glass2);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 4px 16px rgba(20,26,36,.055),inset 0 1px 0 #fff;animation:bdRise .45s cubic-bezier(.2,.7,.3,1) both}
.bd-card-mesh{position:absolute;inset:0;pointer-events:none;opacity:.55;background-image:linear-gradient(rgba(20,26,36,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(20,26,36,.035) 1px,transparent 1px);
  background-size:22px 22px;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 100% 0%,#000,transparent 72%);mask-image:radial-gradient(ellipse 70% 60% at 100% 0%,#000,transparent 72%)}
.bd-card>*{position:relative}
.bd-card>.bd-card-mesh{position:absolute}

.bd-section-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.bd-section-head>div:not(.bd-section-actions){flex:1;min-width:160px}
.bd-section-icon{width:32px;height:32px;flex:0 0 auto;display:grid;place-items:center;border-radius:10px;color:var(--o2);background:var(--soft);border:1px solid rgba(249,115,22,.2)}
.bd-section-head h2{margin:0;font-size:15px;font-weight:750;letter-spacing:-.015em}
.bd-section-head p{margin:2px 0 0;font-size:11.5px;color:var(--muted)}
.bd-section-actions{display:flex;gap:8px;margin-left:auto}

/* buttons */
.bd-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:9px 15px;border:1px solid var(--line2);border-radius:11px;
  background:#fff;color:var(--ink2);font-size:12px;font-weight:750;text-decoration:none;white-space:nowrap;transition:transform .18s,box-shadow .18s,border-color .18s,background .18s,color .18s}
.bd-btn:hover:not(:disabled){transform:translateY(-1px);border-color:rgba(249,115,22,.4);color:var(--o2)}
.bd-btn:disabled{opacity:.5;transform:none}
.bd-btn.sm{min-height:32px;padding:6px 10px;font-size:11px;border-radius:9px}
.bd-btn.lg{min-height:46px;padding:11px 20px;font-size:13px}
.bd-btn.primary{border:0;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 5px 16px rgba(249,115,22,.30),inset 0 1px 0 rgba(255,255,255,.25)}
.bd-btn.primary:hover:not(:disabled){color:#fff;box-shadow:0 9px 24px rgba(249,115,22,.42)}
.bd-btn.danger{border:0;color:#fff;background:linear-gradient(135deg,#ef5b5b,var(--red-ink));box-shadow:0 5px 16px rgba(214,69,69,.28)}
.bd-btn.danger:hover:not(:disabled){color:#fff;box-shadow:0 9px 22px rgba(214,69,69,.38)}
.bd-btn.green{border:0;color:#fff;background:linear-gradient(135deg,#27a871,var(--green-ink));box-shadow:0 5px 14px rgba(31,148,99,.26)}
.bd-btn.green:hover:not(:disabled){color:#fff}
.bd-btn.soft{color:var(--o-ink);border-color:rgba(249,115,22,.3);background:var(--soft)}
.bd-btn.ghost{background:#fff}
.bd-spinner{width:14px;height:14px;flex:0 0 auto;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:bdSpin .7s linear infinite}
.bd-link{padding:0;border:0;background:none;color:var(--ink);font-weight:650;text-align:left;text-decoration:underline;text-decoration-color:rgba(249,115,22,.35);text-underline-offset:3px;overflow-wrap:anywhere}
.bd-link:hover{color:var(--o2);text-decoration-color:var(--o)}
.bd-link.strong{font-size:13.5px;font-weight:750}
.bd-link.subtle{font-size:11px;color:var(--muted);font-weight:600}
.bd-muted-text{color:var(--faint);font-size:11px}
.bd-muted-text.pad{padding:10px 2px;margin:0}

/* summary card */
.bd-summary{padding:15px;border-top:3px solid var(--o)}
.bd-summary.tone-urgent{border-top-color:var(--amber)}
.bd-summary.tone-critical{border-top-color:var(--red)}
.bd-summary.tone-ended{border-top-color:#94a3b8}
.bd-summary-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.bd-summary-ids{display:flex;flex-direction:column;gap:3px;min-width:0}
.bd-kicker{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.bd-kicker svg{color:var(--o)}
.bd-bidid{font-family:var(--mono);font-size:18px;font-weight:700;letter-spacing:.01em;overflow-wrap:anywhere;line-height:1.2}
.bd-reqid{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;font-size:11px;color:var(--muted)}
.bd-reqid b{font-family:var(--mono);color:var(--ink2);overflow-wrap:anywhere}

.bd-timer-panel{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:13px;padding:12px 12px 15px;border-radius:14px;
  border:1px solid var(--tl,rgba(249,115,22,.22));background:linear-gradient(135deg,var(--ts,rgba(249,115,22,.07)),rgba(255,255,255,.7))}
.bd-timer-panel.tone-urgent{--tl:rgba(224,139,30,.34);--ts:rgba(224,139,30,.10);--tt:var(--amber);--ti:var(--amber-ink)}
.bd-timer-panel.tone-critical{--tl:rgba(214,69,69,.38);--ts:rgba(214,69,69,.10);--tt:var(--red);--ti:var(--red-ink)}
.bd-timer-panel.tone-ended{--tl:var(--line2);--ts:#f4f6f9;--tt:#94a3b8;--ti:#475569}
.bd-timer-label{display:flex;align-items:center;gap:9px;min-width:0}
.bd-timer-label small{display:block;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.bd-timer-label b{font-size:14px;color:var(--ti,var(--o-ink))}
.bd-timer-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;color:#fff;background:var(--tt,var(--o));box-shadow:0 4px 12px rgba(20,26,36,.14)}
.bd-timer-panel.tone-critical .bd-timer-icon{animation:bdAlert 1.4s ease-in-out infinite}
.bd-timer-bar{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(20,26,36,.06)}
.bd-timer-bar i{position:absolute;inset:0;background:linear-gradient(90deg,var(--tt,var(--o)),#fbbf24);transform-origin:left;transition:transform 1s linear}

.bd-countdown{display:inline-flex;align-items:flex-start;gap:4px;font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--ti,var(--o-ink))}
.bd-countdown>i{font-style:normal;font-size:20px;font-weight:700;line-height:38px;opacity:.45;animation:bdBlink 1s steps(2,start) infinite}
.bd-count-cell{display:flex;flex-direction:column;align-items:center;gap:2px}
.bd-count-cell b{display:block;min-width:46px;padding:5px 6px;border-radius:10px;text-align:center;font-size:22px;font-weight:750;line-height:28px;background:#fff;border:1px solid var(--tl,var(--line2));box-shadow:0 2px 8px rgba(20,26,36,.06)}
.bd-count-cell small{font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.bd-countdown.tone-critical .bd-count-cell b{color:#fff;background:linear-gradient(135deg,#ef5b5b,var(--red-ink));border-color:transparent}

.bd-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0 0}
.bd-kpis>div{min-width:0;padding:9px 10px;border-radius:12px;border:1px solid var(--line);background:#fff}
.bd-kpis dt{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
.bd-kpis dd{margin:5px 0 0;font-size:15px;font-weight:750;letter-spacing:-.02em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.bd-kpis>div.best{border-color:rgba(31,148,99,.28);background:linear-gradient(135deg,rgba(31,148,99,.09),#fff)}
.bd-kpis>div.best dd,.bd-kpis>div.best dt{color:var(--green-ink)}
.bd-dates{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-top:11px;padding-top:11px;border-top:1px dashed var(--line2)}
.bd-dates>div{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-size:11px;color:var(--muted)}
.bd-dates svg{color:var(--faint)}
.bd-dates b{color:var(--ink2);font-weight:650}
.bd-close-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;margin-top:12px;border:1px solid rgba(214,69,69,.35);border-radius:12px;
  background:linear-gradient(135deg,rgba(214,69,69,.08),rgba(255,255,255,.9));color:var(--red-ink);font-size:12.5px;font-weight:800;transition:.18s}
.bd-close-btn:hover:not(:disabled){background:linear-gradient(135deg,#ef5b5b,var(--red-ink));color:#fff;border-color:transparent;box-shadow:0 8px 20px rgba(214,69,69,.3)}
.bd-close-btn:disabled{opacity:.5}

/* route */
.bd-route{list-style:none;margin:0;padding:12px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(180deg,#fbfcfe,#f5f7fa)}
.bd-stop{display:flex;align-items:flex-start;gap:11px;min-width:0}
.bd-stop>div{display:flex;flex-direction:column;gap:2px;min-width:0}
.bd-stop small{font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}
.bd-stop strong{font-size:13px;font-weight:650;line-height:1.4;overflow-wrap:anywhere;word-break:break-word}
.bd-stop-mark{width:24px;height:24px;flex:0 0 auto;display:grid;place-items:center;border-radius:50%}
.bd-stop.pickup .bd-stop-mark{border:2px solid var(--o);background:#fff}
.bd-stop.pickup .bd-stop-mark i{width:8px;height:8px;border-radius:50%;background:var(--o)}
.bd-stop.drop .bd-stop-mark{color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 3px 10px rgba(249,115,22,.32)}
.bd-leg{display:flex;align-items:stretch;gap:11px;min-height:46px}
.bd-leg-line{position:relative;width:24px;flex:0 0 auto;display:flex;justify-content:center}
.bd-leg-line:before{content:"";width:2px;height:100%;background:repeating-linear-gradient(180deg,rgba(249,115,22,.6) 0 4px,transparent 4px 8px);background-size:2px 8px}
.bd-route.is-live .bd-leg-line:before{animation:bdFlow 1s linear infinite}
@keyframes bdFlow{to{background-position:0 8px}}
.bd-leg-line i{position:absolute;left:50%;top:0;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:var(--o);opacity:0}
.bd-route.is-live .bd-leg-line i{animation:bdTravel 2.2s ease-in-out infinite}
@keyframes bdTravel{0%{top:0;opacity:0}15%,85%{opacity:1}100%{top:calc(100% - 7px);opacity:0}}
.bd-leg-chip{align-self:center;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid var(--line2);background:#fff;font-size:11px;font-weight:650;color:var(--ink2);box-shadow:0 2px 6px rgba(20,26,36,.05)}
.bd-leg-chip svg{color:var(--o2)}
.bd-leg-chip b{font-family:var(--mono);color:var(--o-ink)}

/* materials */
.bd-material-list{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.bd-material{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;padding:10px;border:1px solid var(--line);border-radius:15px;background:#fff;
  box-shadow:0 2px 10px rgba(20,26,36,.04);transition:border-color .2s,box-shadow .2s,transform .2s;animation:bdRise .45s ease both}
.bd-material:hover{border-color:rgba(249,115,22,.3);box-shadow:0 12px 26px rgba(20,26,36,.08);transform:translateY(-2px)}
.bd-material-thumb{position:relative;padding:0;border:0;border-radius:12px;overflow:hidden;background:#eef2f6;align-self:start;aspect-ratio:1/1}
.bd-material-thumb .bd-img{width:100%;height:100%;border-radius:12px}
.bd-material-thumb:hover img{transform:scale(1.06)}
.bd-thumb-hint{position:absolute;left:5px;right:5px;bottom:5px;display:flex;align-items:center;justify-content:center;gap:4px;padding:3px 4px;border-radius:7px;
  background:rgba(20,26,36,.66);color:#fff;font-size:9px;font-weight:750;backdrop-filter:blur(4px)}
.bd-material-body{display:flex;flex-direction:column;gap:6px;min-width:0}
.bd-material-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.bd-material-head>div{min-width:0}
.bd-material-head h3{margin:0;font-size:13.5px;font-weight:750;line-height:1.3;overflow-wrap:anywhere}
.bd-code{display:inline-block;margin-top:3px;padding:2px 6px;border-radius:6px;background:#f1f4f8;color:var(--muted);font-size:10px;overflow-wrap:anywhere}
.bd-qty{flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end;padding:5px 9px;border-radius:10px;background:var(--soft);color:var(--o-ink);font-size:10px;font-weight:700}
.bd-qty b{font-size:15px;font-family:var(--mono);line-height:1.1}
.bd-seller-line{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0;font-size:11.5px;color:var(--muted)}
.bd-seller-line>svg{color:var(--faint);flex:0 0 auto}
.bd-seller-line>span{overflow-wrap:anywhere}
.bd-mgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:4px 0 0}
.bd-mgrid>div{min-width:0;padding:7px 8px;border-radius:10px;background:#f7f9fc;border:1px solid var(--line)}
.bd-mgrid>div.accent{background:linear-gradient(135deg,rgba(249,115,22,.09),#fff);border-color:rgba(249,115,22,.24)}
.bd-mgrid dt{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.bd-mgrid dd{margin:3px 0 0;font-size:12px;font-weight:700;overflow-wrap:anywhere}
.bd-mgrid>div.accent dd{color:var(--o-ink)}

/* images */
.bd-img{position:relative;display:grid;place-items:center;overflow:hidden;background:#eef2f6}
.bd-img img{display:block;width:100%;height:100%;transition:opacity .3s,transform .4s}
.bd-img.fit-cover img{object-fit:cover}
.bd-img.fit-contain img{object-fit:contain}
.bd-img.is-loading img{opacity:0}
.bd-img-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:bdShimmer 1.3s linear infinite}
.bd-img.is-empty,.bd-img.is-broken{display:flex;flex-direction:column;gap:4px;color:#7b8797;border:1px dashed #cbd5e1;font-size:9.5px;font-weight:700;text-align:center;padding:6px}
.bd-img.is-broken{color:var(--red-ink);background:var(--red-soft);border-color:rgba(214,69,69,.3)}

/* bidders */
.bd-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:0 0 12px}
.bd-stats>div{min-width:0;padding:9px 10px;border-radius:12px;border:1px solid var(--line);background:#fff}
.bd-stats>div.wide{grid-column:1/-1}
.bd-stats>div.best{border-color:rgba(31,148,99,.28);background:linear-gradient(135deg,rgba(31,148,99,.09),#fff)}
.bd-stats dt{font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
.bd-stats dd{margin:4px 0 0;font-size:14.5px;font-weight:750;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.bd-stats>div.best dd{color:var(--green-ink)}
.bd-list-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
.bd-list-count{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:750;color:var(--ink2)}
.bd-list-count svg{color:var(--o)}
.bd-sort{position:relative;display:block;color:var(--muted)}
.bd-sort svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none}
.bd-sort:after{content:"";position:absolute;right:11px;top:50%;width:6px;height:6px;margin-top:-5px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);pointer-events:none}
.bd-sort select{height:38px;padding:0 28px 0 31px;border:1px solid var(--line2);border-radius:11px;background:#fff;font-size:12px;font-weight:700;appearance:none;-webkit-appearance:none;outline:none}
.bd-sort select:focus-visible{border-color:rgba(249,115,22,.6);box-shadow:0 0 0 3px rgba(249,115,22,.15)}

.bd-bidder-list{display:grid;gap:9px}
.bd-bidder{position:relative;display:grid;grid-template-columns:52px minmax(0,1fr);grid-template-areas:"rank id" "costs costs" "fleet fleet" "times times" "actions actions";
  gap:9px 11px;padding:12px;border:1px solid var(--line);border-radius:15px;background:#fff;box-shadow:0 2px 10px rgba(20,26,36,.04);transition:border-color .2s,box-shadow .2s;animation:bdRise .45s ease both}
.bd-bidder:hover{border-color:rgba(249,115,22,.3);box-shadow:0 12px 26px rgba(20,26,36,.08)}
.bd-bidder.leader{border-color:rgba(213,154,11,.45);background:linear-gradient(135deg,rgba(254,243,199,.55),#fff 45%);box-shadow:0 10px 26px rgba(213,154,11,.14)}
.bd-bidder.leader:before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#fbbf24,var(--gold))}
.bd-bidder.awarded{border-color:rgba(31,148,99,.45);background:linear-gradient(135deg,rgba(220,252,231,.7),#fff 45%)}
.bd-bidder.awarded:before{background:linear-gradient(180deg,#34d399,var(--green))}
.bd-rank{grid-area:rank;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:52px;height:52px;border-radius:14px;background:#f1f4f8;color:var(--ink2)}
.bd-rank b{font-family:var(--mono);font-size:16px;font-weight:800}
.bd-bidder.leader .bd-rank{color:#fff;background:linear-gradient(135deg,#fbbf24,var(--gold));box-shadow:0 6px 16px rgba(213,154,11,.32)}
.bd-bidder.awarded .bd-rank{background:linear-gradient(135deg,#34d399,var(--green-ink));box-shadow:0 6px 16px rgba(31,148,99,.3)}
.bd-bidder-id{grid-area:id;display:flex;flex-direction:column;gap:4px;min-width:0}
.bd-bidder-sub{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--muted)}
.bd-bidder-sub span{display:inline-flex;align-items:center;gap:4px}
.bd-bidder-loc{display:flex;align-items:flex-start;gap:4px;font-size:11px;color:var(--muted);overflow-wrap:anywhere}
.bd-bidder-loc svg{flex:0 0 auto;margin-top:2px}
.bd-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px}
.bd-tags .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:6px;font-size:9.5px;font-style:normal;font-weight:800;letter-spacing:.03em;text-transform:capitalize;background:#f1f4f8;color:var(--muted)}
.bd-tags .tag.gold{color:#8a5a00;background:var(--gold-soft)}
.bd-tags .tag.green,.bd-tags .tag.status-awarded{color:var(--green-ink);background:var(--green-soft)}
.bd-tags .tag.status-active{color:var(--blue-ink);background:var(--blue-soft)}
.bd-costs{grid-area:costs;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0}
.bd-costs>div{min-width:0;padding:7px 8px;border-radius:10px;background:#f7f9fc;border:1px solid var(--line)}
.bd-costs dt{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.bd-costs dd{margin:3px 0 0;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.bd-costs .total{background:linear-gradient(135deg,rgba(249,115,22,.10),#fff);border-color:rgba(249,115,22,.28)}
.bd-costs .total dd{font-size:14.5px;color:var(--o-ink)}
.bd-costs small{display:block;margin-top:2px;font-size:9.5px;font-weight:650;color:var(--muted)}
.bd-costs small.ok{color:var(--green-ink)}
.bd-fleet{grid-area:fleet;display:flex;align-items:center;flex-wrap:wrap;gap:7px}
.bd-fleet-count{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:750;color:var(--ink2)}
.bd-fleet-count svg{color:var(--o2)}
.bd-vchips{display:inline-flex;flex-wrap:wrap;gap:5px}
.bd-vchip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;border:1px solid var(--line2);background:#fff;font-size:10.5px;font-weight:650;color:var(--ink2)}
.bd-vchip svg{color:var(--faint)}
.bd-vchip b{font-family:var(--mono);color:var(--o-ink)}
.bd-bidder-times{grid-area:times;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:10.5px;color:var(--faint)}
.bd-bidder-times span{display:inline-flex;align-items:center;gap:4px}
.bd-bidder-times b{color:var(--muted);font-weight:650}
.bd-row-actions{grid-area:actions;display:grid;grid-template-columns:1fr 1fr;gap:7px}
.bd-act{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;border-radius:11px;border:1px solid var(--line2);background:#fff;font-size:12px;font-weight:750;transition:.18s}
.bd-act.edit{color:var(--blue-ink)}
.bd-act.edit:hover:not(:disabled){background:var(--blue-soft);border-color:rgba(59,111,216,.4)}
.bd-act.delete{color:var(--red-ink)}
.bd-act.delete:hover:not(:disabled){background:var(--red-soft);border-color:rgba(214,69,69,.4)}
.bd-act:disabled{opacity:.4}

.bd-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:28px 16px;border:1px dashed var(--line2);border-radius:15px;background:rgba(255,255,255,.6)}
.bd-empty-icon,.bd-state-icon{width:54px;height:54px;display:grid;place-items:center;margin-bottom:12px;border-radius:17px;color:var(--o2);background:var(--soft);border:1px solid rgba(249,115,22,.24);box-shadow:0 8px 22px rgba(249,115,22,.14)}
.bd-empty h3{margin:0;font-size:14px;font-weight:750}
.bd-empty p{margin:6px 0 14px;font-size:12px;color:var(--muted);max-width:40ch}

/* banners */
.bd-banner{display:flex;align-items:flex-start;gap:8px;margin:10px 0;padding:10px 12px;border-radius:12px;border:1px solid;font-size:11.5px;font-weight:600;line-height:1.45}
.bd-banner svg{flex:0 0 auto;margin-top:1px}
.bd-banner.red{color:var(--red-ink);background:#fff4f4;border-color:rgba(214,69,69,.3)}
.bd-banner.amber{color:var(--amber-ink);background:#fff8eb;border-color:rgba(224,139,30,.32)}
.bd-banner.green{color:var(--green-ink);background:#effbf5;border-color:rgba(31,148,99,.3)}
.bd-banner.grey{color:#475569;background:#f4f6f9;border-color:var(--line2)}
.bd-banner.refresh-error{align-items:center;margin-top:0}
.bd-banner.refresh-error span{flex:1}
.bd-status-banner{display:flex;align-items:center;gap:11px;margin-bottom:12px;padding:12px 14px;border-radius:15px;border:1px solid;animation:bdRise .4s ease both}
.bd-status-banner>span{width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;color:#fff}
.bd-status-banner>div{flex:1;min-width:0}
.bd-status-banner b{font-size:13px}
.bd-status-banner p{margin:2px 0 0;font-size:11.5px;line-height:1.45;overflow-wrap:anywhere}
.bd-status-banner em{font-style:normal;font-size:10.5px;font-weight:700;opacity:.75;white-space:nowrap}
.bd-status-banner.tone-grey{color:#334155;background:linear-gradient(135deg,#f1f4f8,#fff);border-color:var(--line2)}
.bd-status-banner.tone-grey>span{background:#64748b}
.bd-status-banner.tone-green{color:var(--green-ink);background:linear-gradient(135deg,#e8f8ef,#fff);border-color:rgba(31,148,99,.3)}
.bd-status-banner.tone-green>span{background:var(--green)}
.bd-status-banner.tone-red{color:var(--red-ink);background:linear-gradient(135deg,#fdeeee,#fff);border-color:rgba(214,69,69,.3)}
.bd-status-banner.tone-red>span{background:var(--red)}
.bd-winner{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:13px 15px;border-radius:16px;border:1px solid rgba(31,148,99,.35);
  background:linear-gradient(120deg,rgba(220,252,231,.9),rgba(254,243,199,.6));box-shadow:0 10px 26px rgba(31,148,99,.14);animation:bdRise .4s ease both}
.bd-winner-icon{width:44px;height:44px;flex:0 0 auto;display:grid;place-items:center;border-radius:14px;color:#fff;background:linear-gradient(135deg,#fbbf24,var(--gold))}
.bd-winner>div{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.bd-winner small{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green-ink)}
.bd-winner .mono{font-size:11px;color:var(--muted)}
.bd-winner>b{font-size:17px;color:var(--green-ink);white-space:nowrap}

/* page states */
.bd-state{display:flex;flex-direction:column;align-items:center;text-align:center;padding:36px 20px;min-height:280px;justify-content:center}
.bd-state.error{border-color:rgba(214,69,69,.3)}
.bd-state.error .bd-state-icon{color:var(--red-ink);background:var(--red-soft);border-color:rgba(214,69,69,.26);box-shadow:0 8px 22px rgba(214,69,69,.12)}
.bd-state h2{margin:0 0 6px;font-size:16px}
.bd-state p{margin:0;font-size:12px;color:var(--muted);max-width:44ch;overflow-wrap:anywhere}
.bd-state-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}

/* skeleton */
.sk-card{min-height:150px;animation:none}
.sk{border-radius:9px;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:bdShimmer 1.3s linear infinite}
@keyframes bdShimmer{to{background-position:-220% 0}}
.sk.mt,.sk-row.mt{margin-top:12px}
.sk.w30{width:30%}.sk.w40{width:40%}.sk.w50{width:50%}.sk.w60{width:60%}.sk.w100{width:100%}
.sk.h14{height:14px}.sk.h20{height:20px}.sk.h24{height:24px}.sk.h40{height:40px}.sk.h46{height:46px}.sk.h70{height:70px}.sk.h90{height:90px}.sk.h110{height:110px}
.sk-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px}

/* modal */
.bd-overlay{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;padding:8px 6px 0;background:rgba(12,22,40,.42);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:bdFade .2s ease both}
@keyframes bdFade{from{opacity:0}to{opacity:1}}
@keyframes bdSheet{from{transform:translateY(28px);opacity:.4}to{transform:none;opacity:1}}
.bd-modal{position:relative;width:100%;max-height:calc(100dvh - 12px);display:flex;flex-direction:column;overflow:hidden;border-radius:22px 22px 0 0;background:#f7f9fc;
  box-shadow:0 -10px 40px rgba(12,22,40,.25);outline:none;animation:bdSheet .28s cubic-bezier(.2,.8,.3,1) both}
.bd-modal:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--o),#fbbf24)}
.bd-modal.tone-red:before{background:linear-gradient(90deg,#ef5b5b,var(--red-ink))}
.bd-modal-head{display:flex;align-items:center;gap:10px;padding:15px 14px 12px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.92)}
.bd-modal-icon{width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 5px 14px rgba(249,115,22,.3)}
.bd-modal.tone-red .bd-modal-icon{background:linear-gradient(135deg,#ef5b5b,var(--red-ink));box-shadow:0 5px 14px rgba(214,69,69,.3)}
.bd-modal-titles{flex:1;min-width:0}
.bd-modal-titles h2{margin:0;font-size:15.5px;font-weight:750;letter-spacing:-.015em}
.bd-modal-titles p{margin:2px 0 0;font-size:11px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bd-modal-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px}
.bd-modal-foot{display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:11px 14px calc(11px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:rgba(255,255,255,.96)}
.bd-modal-foot .bd-btn{flex:1 1 auto}
.bd-foot-total{flex:1 0 100%;display:flex;align-items:center;justify-content:space-between;padding:0 2px 2px;font-size:11px;font-weight:700;color:var(--muted)}
.bd-foot-total b{font-size:17px;color:var(--o-ink);font-variant-numeric:tabular-nums}

.bd-info{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:0}
.bd-info-row{min-width:0;padding:8px 10px;border-radius:10px;background:#fff;border:1px solid var(--line)}
.bd-info-row.wide{grid-column:1/-1}
.bd-info-row.accent{background:linear-gradient(135deg,rgba(249,115,22,.09),#fff);border-color:rgba(249,115,22,.24)}
.bd-info-row dt{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.bd-info-row dd{margin:3px 0 0;font-size:12px;font-weight:650;color:var(--ink);overflow-wrap:anywhere}
.bd-info-row.accent dd{color:var(--o-ink);font-weight:750}
.bd-subhead{margin:14px 0 7px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--o2)}
.bd-private-note{display:flex;align-items:center;gap:6px;margin:12px 0 0;padding:9px 11px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-size:11px;font-weight:600}
.bd-fine{display:flex;align-items:center;gap:6px;margin:12px 0 0;font-size:10.5px;color:var(--faint)}
.bd-inline-error{display:flex;align-items:flex-start;gap:7px;margin:10px 0;padding:9px 11px;border-radius:10px;background:#fff4f4;border:1px solid rgba(214,69,69,.3);color:var(--red-ink);font-size:11.5px;font-weight:650;animation:bdRise .25s ease both}
.bd-inline-error svg{flex:0 0 auto;margin-top:1px}

.bd-avatar{width:40px;height:40px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;color:#fff;font-size:13px;font-weight:800;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 4px 12px rgba(249,115,22,.25)}
.bd-avatar.lg{width:54px;height:54px;border-radius:16px;font-size:17px}
.bd-avatar.sm{width:34px;height:34px;border-radius:10px;font-size:11.5px}
.bd-profile{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:linear-gradient(135deg,rgba(249,115,22,.08),#fff);border:1px solid rgba(249,115,22,.2)}
.bd-profile>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.bd-profile strong{font-size:15px;overflow-wrap:anywhere}
.bd-profile .mono{font-size:11.5px;color:var(--muted)}
.bd-profile small{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);overflow-wrap:anywhere}
.bd-rank-pill{padding:6px 10px;border-radius:10px;background:#f1f4f8;font-family:var(--mono);font-weight:800}
.bd-rank-pill.gold{color:#fff;background:linear-gradient(135deg,#fbbf24,var(--gold))}

/* reference modal */
.bd-ref-hero{position:relative;display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:repeating-conic-gradient(#f1f4f8 0 25%,#fff 0 50%) 50%/18px 18px}
.bd-ref-img{width:100%;height:clamp(200px,42vh,340px)}
.bd-ref-img.bd-img{background:transparent}
.bd-ref-zoom,.bd-ref-code{position:absolute;display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:9px;font-size:10.5px;font-weight:750;backdrop-filter:blur(6px)}
.bd-ref-zoom{right:9px;bottom:9px;background:rgba(20,26,36,.7);color:#fff}
.bd-ref-code{left:9px;top:9px;background:rgba(255,255,255,.9);color:var(--ink2);border:1px solid var(--line);font-family:var(--mono)}
.bd-ref-uploader{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:4px 10px;margin:12px 0;padding:10px 12px;border-radius:13px;background:#fff;border:1px solid var(--line)}
.bd-ref-uploader>div{display:flex;flex-direction:column;min-width:0}
.bd-ref-uploader small{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.bd-ref-uploader strong{font-size:13px;overflow-wrap:anywhere}
.bd-ref-uploader .mono{font-size:11px;color:var(--muted)}
.bd-ref-uploader em{grid-column:1/-1;display:flex;align-items:center;gap:4px;font-style:normal;font-size:10.5px;color:var(--muted)}
.bd-lightbox .bd-modal-body{padding:8px;background:#0f1520}
.bd-lightbox-img{width:100%;height:calc(100dvh - 150px);background:transparent}

/* forms */
.bd-form{display:grid;gap:12px;margin-top:12px}
.bd-form-section{padding:12px;border:1px solid var(--line);border-radius:15px;background:#fff}
.bd-form-section>header{display:flex;align-items:center;gap:9px;margin-bottom:11px}
.bd-form-section>header>span{width:26px;height:26px;flex:0 0 auto;display:grid;place-items:center;border-radius:8px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));font-size:12px;font-weight:800}
.bd-form-section>header b{display:block;font-size:12.5px}
.bd-form-section>header small{display:block;font-size:10.5px;color:var(--muted)}
.bd-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px;border-radius:13px;background:#f1f4f8}
.bd-seg button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 10px;border:1px solid transparent;border-radius:10px;background:transparent;text-align:left;transition:.18s}
.bd-seg button b{font-size:12.5px}
.bd-seg button small{font-size:10px;color:var(--faint)}
.bd-seg button.active{background:#fff;border-color:rgba(249,115,22,.4);box-shadow:0 3px 10px rgba(249,115,22,.14);color:var(--o-ink)}
.bd-seg button:disabled{opacity:.45}
.bd-form-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-top:10px}
.bd-field{display:flex;flex-direction:column;gap:5px;min-width:0}
.bd-field>label{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.bd-input{height:44px;display:flex;align-items:center;border:1px solid var(--line2);border-radius:11px;background:#fff;transition:border-color .18s,box-shadow .18s}
.bd-input:focus-within{border-color:rgba(249,115,22,.6);box-shadow:0 0 0 3px rgba(249,115,22,.14)}
.bd-input b{padding:0 2px 0 11px;color:var(--muted);font-weight:700}
.bd-input b.suffix{padding:0 11px 0 4px;font-size:11px;white-space:nowrap}
.bd-input input{flex:1;min-width:0;height:100%;padding:0 8px;border:0;outline:0;background:transparent;font-size:14px;font-weight:650;font-variant-numeric:tabular-nums}
.bd-field textarea{width:100%;min-height:70px;padding:10px;border:1px solid var(--line2);border-radius:11px;background:#fff;font-size:12.5px;line-height:1.45;resize:vertical;outline:none}
.bd-field textarea:focus{border-color:rgba(249,115,22,.6);box-shadow:0 0 0 3px rgba(249,115,22,.14)}
.bd-field.has-error .bd-input,.bd-field.has-error textarea,.bd-field.has-error .bd-stepper{border-color:rgba(214,69,69,.55);box-shadow:0 0 0 3px rgba(214,69,69,.08)}
.bd-field-error{display:block;color:var(--red-ink);font-size:10.5px;font-weight:650;margin-top:4px}
.bd-field-hint{color:var(--faint);font-size:10px}
.bd-field-hint.right{align-self:flex-end}
.bd-calc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:11px;padding:10px;border-radius:13px;background:#f7f9fc;border:1px dashed var(--line2)}
.bd-calc>div{display:flex;flex-direction:column;gap:2px;min-width:0}
.bd-calc span{display:flex;align-items:center;gap:4px;font-size:9.5px;font-weight:750;letter-spacing:.04em;text-transform:uppercase;color:var(--faint)}
.bd-calc b{font-size:13.5px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.bd-calc em{font-style:normal;font-size:10px;color:var(--muted)}
.bd-calc .grand{grid-column:1/-1;flex-direction:row;align-items:center;justify-content:space-between;margin-top:4px;padding:10px 12px;border-radius:11px;background:linear-gradient(135deg,var(--o),var(--o2));color:#fff}
.bd-calc .grand span{color:rgba(255,255,255,.85);font-size:10.5px}
.bd-calc .grand b{font-size:18px;color:#fff}

.bd-count-row{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.bd-stepper{height:44px;display:grid;grid-template-columns:44px minmax(0,1fr) 44px;border:1px solid var(--line2);border-radius:11px;overflow:hidden;background:#fff}
.bd-stepper button{border:0;background:#f7f9fc;color:var(--ink2);display:grid;place-items:center}
.bd-stepper button:hover:not(:disabled){background:var(--soft);color:var(--o2)}
.bd-stepper button:disabled{opacity:.4}
.bd-stepper input{min-width:0;border:0;outline:0;text-align:center;font-size:16px;font-weight:750;font-variant-numeric:tabular-nums;background:#fff}
.bd-alloc{padding:9px 11px;border-radius:12px;border:1px solid var(--line);background:#f7f9fc}
.bd-alloc-top{display:flex;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.bd-alloc-top b{font-size:13px;letter-spacing:0;font-family:var(--mono);color:var(--ink)}
.bd-alloc-bar{position:relative;display:block;height:6px;margin:7px 0 5px;border-radius:6px;background:rgba(20,26,36,.08);overflow:hidden}
.bd-alloc-bar i{position:absolute;inset:0;border-radius:6px;background:var(--o);transform-origin:left;transition:transform .35s cubic-bezier(.2,.7,.3,1),background .2s}
.bd-alloc small{font-size:10.5px;font-weight:650;color:var(--muted)}
.bd-alloc.state-ok{border-color:rgba(31,148,99,.3);background:#effbf5}
.bd-alloc.state-ok .bd-alloc-bar i{background:var(--green)}
.bd-alloc.state-ok small{color:var(--green-ink)}
.bd-alloc.state-over{border-color:rgba(214,69,69,.3);background:#fff4f4}
.bd-alloc.state-over .bd-alloc-bar i{background:var(--red)}
.bd-alloc.state-over small{color:var(--red-ink)}
.bd-vrows{display:grid;gap:7px;margin-top:11px}
.bd-vrow{display:grid;grid-template-columns:26px minmax(0,1fr) 92px 40px;align-items:center;gap:7px;padding:7px;border:1px solid var(--line);border-radius:12px;background:#f9fafc;animation:bdRise .25s ease both}
.bd-vrow.has-error{border-color:rgba(214,69,69,.4);background:#fff8f8}
.bd-vrow-index{width:26px;height:26px;display:grid;place-items:center;border-radius:8px;background:#fff;border:1px solid var(--line2);font-size:11px;font-weight:800;color:var(--muted)}
.bd-vrow-type select{width:100%;height:40px;padding:0 10px;border:1px solid var(--line2);border-radius:10px;background:#fff;font-size:12.5px;font-weight:650;outline:none}
.bd-vrow-type select:focus-visible,.bd-vrow-qty:focus-within{border-color:rgba(249,115,22,.6);box-shadow:0 0 0 3px rgba(249,115,22,.14)}
.bd-vrow-qty{height:40px;display:flex;align-items:center;border:1px solid var(--line2);border-radius:10px;background:#fff}
.bd-vrow-qty b{padding-left:9px;color:var(--faint)}
.bd-vrow-qty input{width:100%;min-width:0;padding:0 8px;border:0;outline:0;background:transparent;font-size:14px;font-weight:700;text-align:center}
.bd-vrow-remove{width:40px;height:40px;display:grid;place-items:center;border:1px solid transparent;border-radius:10px;background:var(--red-soft);color:var(--red-ink)}
.bd-vrow-remove:disabled{opacity:.35}
.bd-vrow-error{grid-column:2/-1;margin-top:0}
.bd-add-row{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;min-height:42px;margin-top:9px;border:1px dashed rgba(249,115,22,.5);border-radius:11px;background:var(--soft);color:var(--o2);font-size:12px;font-weight:750}
.bd-add-row:hover:not(:disabled){background:var(--soft2)}
.bd-add-row:disabled{opacity:.45}

.bd-reasons{display:grid;gap:6px;margin:12px 0 0;padding:0;border:0}
.bd-reasons legend{margin-bottom:6px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.bd-reasons label{position:relative;display:flex;align-items:center;gap:9px;min-height:42px;padding:9px 11px;border:1px solid var(--line2);border-radius:11px;background:#fff;font-size:12.5px;font-weight:650;cursor:pointer;transition:.16s}
.bd-reasons label.active{border-color:rgba(214,69,69,.45);background:#fff6f6;color:var(--red-ink)}
.bd-reasons input{position:absolute;opacity:0;pointer-events:none}
.bd-reasons label:focus-within{outline:2px solid rgba(249,115,22,.7);outline-offset:2px}
.bd-radio{width:17px;height:17px;flex:0 0 auto;border-radius:50%;border:2px solid var(--line2);background:#fff;transition:.16s}
.bd-reasons label.active .bd-radio{border-color:var(--red);box-shadow:inset 0 0 0 3px #fff;background:var(--red)}
.bd-reasons.has-error label{border-color:rgba(214,69,69,.35)}

.bd-bidder-summary{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;padding:12px;border-radius:14px;background:linear-gradient(135deg,rgba(249,115,22,.08),#fff);border:1px solid rgba(249,115,22,.22)}
.bd-bidder-summary>div{display:flex;flex-direction:column;min-width:0}
.bd-bidder-summary small{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.bd-bidder-summary strong{font-size:14px;overflow-wrap:anywhere}
.bd-bidder-summary .mono{font-size:11px;color:var(--muted)}
.bd-bidder-summary dl{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0}
.bd-bidder-summary dl>div{padding:7px 9px;border-radius:10px;background:#fff;border:1px solid var(--line)}
.bd-bidder-summary dt{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)}
.bd-bidder-summary dd{margin:2px 0 0;font-size:13.5px;font-weight:750}

.bd-stages{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 12px;padding:0}
.bd-stages li{position:relative;display:flex;align-items:center;gap:7px;padding:8px 9px;border-radius:11px;background:#fff;border:1px solid var(--line);color:var(--faint);font-size:11.5px;transition:.2s}
.bd-stage-dot{width:22px;height:22px;flex:0 0 auto;display:grid;place-items:center;border-radius:50%;background:#f1f4f8;font-size:11px;font-weight:800}
.bd-stages li.state-current{color:var(--o-ink);border-color:rgba(249,115,22,.4);box-shadow:0 3px 10px rgba(249,115,22,.14)}
.bd-stages li.state-current .bd-stage-dot{color:#fff;background:var(--o)}
.bd-stages li.state-done{color:var(--green-ink);border-color:rgba(31,148,99,.3);background:#f3fbf7}
.bd-stages li.state-done .bd-stage-dot{color:#fff;background:var(--green)}

.bd-searchbox{height:46px;display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid var(--line2);border-radius:12px;background:#fff;color:var(--faint);transition:.18s}
.bd-searchbox:focus-within{border-color:rgba(249,115,22,.6);box-shadow:0 0 0 3px rgba(249,115,22,.14);color:var(--o2)}
.bd-searchbox input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font-size:13px;color:var(--ink);-webkit-appearance:none;appearance:none}
.bd-searchbox input::-webkit-search-cancel-button{display:none}
.bd-searchbox input::placeholder{color:#9aa4b2;text-overflow:ellipsis}
.bd-clear{width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:8px;background:#f1f4f8;color:var(--muted)}
.bd-results{display:grid;gap:6px;margin-top:8px;max-height:300px;overflow-y:auto}
.bd-results-note{margin:4px 2px;font-size:11.5px;color:var(--muted)}
.bd-result{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:left;transition:.16s;animation:bdRise .25s ease both}
.bd-result:hover:not(.disabled){border-color:rgba(249,115,22,.4);background:#fff8f1}
.bd-result.disabled{opacity:.6;cursor:not-allowed;background:#f8f9fb}
.bd-result-main{display:flex;flex-direction:column;gap:1px;min-width:0}
.bd-result-main b{font-size:13px;overflow-wrap:anywhere}
.bd-result-main small{font-size:10.5px;color:var(--muted);overflow-wrap:anywhere}
.bd-result-flags{display:flex;flex-direction:column;align-items:flex-end;gap:3px;max-width:120px;text-align:right}
.bd-result-flags em{padding:2px 6px;border-radius:6px;font-size:9px;font-style:normal;font-weight:800}
.bd-result-flags em.ok{color:var(--green-ink);background:var(--green-soft)}
.bd-result-flags em.bad{color:var(--red-ink);background:var(--red-soft)}
.bd-result-flags small{font-size:9.5px;font-weight:650;color:var(--red-ink);line-height:1.25}
.bd-result-flags svg{color:var(--o2)}
.bd-selected-t{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 10px;align-items:center;padding:11px;border-radius:13px;border:1px solid rgba(31,148,99,.35);background:linear-gradient(135deg,#effbf5,#fff)}
.bd-selected-t.invalid{border-color:rgba(214,69,69,.4);background:#fff6f6}
.bd-selected-t>div{display:flex;flex-direction:column;min-width:0}
.bd-selected-t strong{font-size:13.5px;overflow-wrap:anywhere}
.bd-selected-t .mono{font-size:11px;color:var(--muted)}
.bd-selected-t small{font-size:10.5px;color:var(--muted);overflow-wrap:anywhere}
.bd-selected-t>.bd-btn{grid-column:1/-1}
.bd-selected-t>p{grid-column:1/-1;margin:0}

/* toast */
.bd-toast{position:fixed;z-index:90;left:50%;bottom:22px;display:flex;align-items:center;gap:8px;max-width:calc(100% - 24px);transform:translate(-50%,12px);opacity:0;pointer-events:none;
  padding:10px 15px;border-radius:12px;font-size:12px;font-weight:650;color:#fff;background:#161d29;border:1px solid rgba(255,255,255,.1);box-shadow:0 14px 34px rgba(20,26,36,.3);transition:.26s cubic-bezier(.2,.7,.3,1)}
.bd-toast.show{opacity:1;transform:translate(-50%,0)}
.bd-toast-pip{width:20px;height:20px;flex:0 0 auto;display:grid;place-items:center;border-radius:50%;background:var(--green)}
.bd-toast.tone-error .bd-toast-pip{background:var(--red)}

/* responsive */
@media(max-width:380px){
  .bd-brand-text small{letter-spacing:.05em}
  .bd-badge.head{display:none}
  .bd-count-cell b{min-width:40px;font-size:19px}
  .bd-kpis{grid-template-columns:1fr 1fr}
  .bd-kpis>div:last-child{grid-column:1/-1}
  .bd-costs{grid-template-columns:1fr 1fr}
  .bd-costs .total{grid-column:1/-1}
  .bd-material{grid-template-columns:76px minmax(0,1fr)}
  .bd-vrow{grid-template-columns:minmax(0,1fr) 78px 40px}
  .bd-vrow-index{display:none}
  .bd-vrow-error{grid-column:1/-1}
  .bd-info{grid-template-columns:minmax(0,1fr)}
  .bd-stages li b{font-size:10.5px}
}
@media(min-width:560px){
  .bd-header .bd-width,.bd-shell{padding-left:20px;padding-right:20px}
  .bd-hero h1{font-size:32px}
  .bd-form-grid{grid-template-columns:1fr 1fr}
  .bd-count-row{grid-template-columns:200px minmax(0,1fr);align-items:end}
  .bd-stats{grid-template-columns:repeat(4,minmax(0,1fr))}
  .bd-calc{grid-template-columns:repeat(3,minmax(0,1fr))}
  .bd-dates{grid-template-columns:1fr 1fr}
  .bd-overlay{align-items:center;padding:20px}
  .bd-modal{border-radius:20px;max-height:min(90dvh,860px);box-shadow:0 24px 60px rgba(12,22,40,.3)}
  .bd-modal.size-sm{max-width:460px}
  .bd-modal.size-md{max-width:560px}
  .bd-modal.size-lg{max-width:720px}
  .bd-modal.size-xl{max-width:1000px}
  .bd-modal-foot .bd-btn{flex:0 0 auto}
  .bd-foot-total{flex:1 1 auto;justify-content:flex-start;gap:10px}
  .bd-selected-t{grid-template-columns:auto minmax(0,1fr) auto}
  .bd-selected-t>.bd-btn{grid-column:auto}
  .bd-bidder-summary{grid-template-columns:auto minmax(0,1fr) auto}
  .bd-bidder-summary dl{grid-column:auto;min-width:220px}
}
@media(min-width:760px){
  .bd-main{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}
  .bd-main>.span{grid-column:1/-1}
  .bd-material-list{grid-template-columns:repeat(2,minmax(0,1fr))}
  .bd-hero h1{font-size:36px}
  .bd-stats{grid-template-columns:repeat(5,minmax(0,1fr))}
  .bd-stats>div.wide{grid-column:auto}
  .bd-bidder{grid-template-columns:56px minmax(0,1.3fr) minmax(0,1.6fr) auto;grid-template-areas:"rank id costs actions" "rank fleet fleet actions" "rank times times actions";align-items:center;padding:13px 14px}
  .bd-rank{width:56px;height:56px;align-self:start}
  .bd-row-actions{grid-template-columns:1fr;align-self:stretch;align-content:center}
  .bd-act{min-width:94px}
}
@media(min-width:1040px){
  .bd-material-list{grid-template-columns:repeat(3,minmax(0,1fr))}
  .bd-material{grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr}
  .bd-material-thumb{aspect-ratio:16/10}
}
@media(prefers-reduced-motion:reduce){
  .bd-root *,.bd-root *:before,.bd-root *:after{animation:none!important;transition:none!important}
}
`;
