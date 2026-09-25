import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* Renders overlays on <body> so no transformed/overflow parent can clip or hide them. */
function BodyPortal({ children }) {
  if (typeof document === "undefined" || !document.body) return children;
  return createPortal(children, document.body);
}

/* ===========================================================================
 * StoneRate Admin — Transporter Request Details
 *
 * Frontend-only, callback-driven page. All request data arrives through the
 * `selectedRequest` prop; every decision is delegated to parent callbacks and
 * is only reflected after the backend confirms success and the parent
 * refreshes the request. No request data is fabricated in this file.
 *
 * Future API functions (NOT implemented here):
 *   getAdminTransporterRequestDetails(requestId)
 *   acceptAdminTransporterRequest(requestId, payload)
 *   rejectAdminTransporterRequest(requestId, payload)
 * ========================================================================= */

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
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.2 1 .4 2 .8 2.8a2 2 0 0 1-.5 2.1l-1.2 1.2a16 16 0 0 0 4.1 4.1l1.2-1.2a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.8a2 2 0 0 1 1.7 1.6Z" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v9" /></>,
    close: <path d="m7 7 10 10M17 7 7 17" />,
    check: <path d="m5 12 4 4L19 6" />,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    xCircle: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
    alert: <><path d="M12 3 3 20h18L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    truck: <><path d="M2.8 6.5h10.4v9.8H2.8z" /><path d="M13.2 9.6h3.9l3.1 3.6v3.1h-7" /><circle cx="7" cy="17.6" r="1.9" /><circle cx="17" cy="17.6" r="1.9" /></>,
    route: <><circle cx="6" cy="19" r="2.2" /><circle cx="18" cy="5" r="2.2" /><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M16 3v4M8 3v4M3.5 10h17" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-8.5 9" /></>,
    expand: <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M16 9h2a2 2 0 0 1 2 2v10M2.5 21h19M8 7h4M8 11h4M8 15h4" /></>,
    rupee: <><path d="M7 4h11M7 9h11M13 4c3.4 0 4.5 2.2 4.5 3.9C17.5 10.6 15 13 11 13H7l8 7" /></>,
    scale: <><path d="M12 3v18M5 21h14" /><path d="m5 7 7-2 7 2" /><path d="m5 7-2.5 6a3.2 3.2 0 0 0 5 0L5 7ZM19 7l-2.5 6a3.2 3.2 0 0 0 5 0L19 7Z" /></>,
    swap: <><path d="M7 7h13l-3-3M17 17H4l3 3" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2.2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    hash: <path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18" />,
    note: <><path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z" /><path d="M14 3v5h5M8.6 13h6.4M8.6 16.5h4.2" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 4h11l-1.8 4L16 12H5" /></>,
    spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    home: <><path d="m3.5 10.5 8.5-7 8.5 7" /><path d="M5.5 9v11h13V9" /><path d="M10 20v-6h4v6" /></>,
    samples: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M8 15h8" />,
    doc: <><path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z" /><path d="M14 3v5h5" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2.4" /><path d="M9 4.5V3h6v1.5M9 12l2 2 4-4" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>
  };
  return <svg {...common}>{paths[name] || paths.cube}</svg>;
}

/* ---------------------------------------------------------------- Helpers -- */

const REJECTION_REASONS = [
  {
    value: "seller_not_answering",
    label: "Seller not picking up the call",
    hint: "The Seller could not be reached to confirm the material.",
    icon: "phone"
  },
  {
    value: "material_unavailable",
    label: "Material is no longer available",
    hint: "The requested stock has been sold out or withdrawn.",
    icon: "cube"
  },
  {
    value: "other",
    label: "Other",
    hint: "Describe the reason in the rejection notes.",
    icon: "note"
  }
];

const NOTE_MAX = 500;
const KNOWN_STATUSES = ["new", "accepted", "rejected"];

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function pick(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return null;
}

function text(...values) {
  const value = pick(...values);
  if (value === null) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function num(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function bool(value) {
  if (value === true || value === false) return value;
  return null;
}

function time(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

const DATE_FORMAT = (() => {
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

const DAY_FORMAT = (() => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch (formatError) {
    return null;
  }
})();

function formatParts(formatter, value, withTime) {
  if (value === null) return null;
  const date = new Date(value);
  if (!formatter) return withTime ? date.toLocaleString() : date.toLocaleDateString();
  try {
    const parts = {};
    formatter.formatToParts(date).forEach(part => {
      parts[part.type] = part.value;
    });
    const month = String(parts.month || "").replace(/\.$/, "").slice(0, 3);
    const day = parts.day + " " + month + " " + parts.year;
    if (!withTime) return day;
    const period = String(parts.dayPeriod || "").toUpperCase();
    return day + ", " + parts.hour + ":" + parts.minute + (period ? " " + period : "");
  } catch (formatError) {
    return formatter.format(date);
  }
}

/** "25 Sep 2026, 10:30 AM" in Asia/Kolkata */
function formatDateTime(value) {
  return formatParts(DATE_FORMAT, value, true);
}

/** "25 Sep 2026" in Asia/Kolkata */
function formatDate(value) {
  return formatParts(DAY_FORMAT, value, false);
}

function formatNumber(value, maxFraction = 2) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: maxFraction }).format(value);
  } catch (formatError) {
    return String(value);
  }
}

/** Returns null (never "₹0") when a commercial value is unavailable. */
function formatMoney(value, unit) {
  if (value === null) return null;
  return "₹" + formatNumber(value) + (unit ? " / " + unit : "");
}

function formatQuantity(value, unit) {
  if (value === null) return null;
  return formatNumber(value) + (unit ? " " + unit : "");
}

function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    hours,
    minutes,
    seconds,
    hh: String(hours).padStart(2, "0"),
    mm: String(minutes).padStart(2, "0"),
    ss: String(seconds).padStart(2, "0")
  };
}

function durationLabel(ms) {
  const d = splitDuration(ms);
  return d.hh + " : " + d.mm + " : " + d.ss;
}

function spokenDuration(ms) {
  const d = splitDuration(ms);
  return d.hours + " hours, " + d.minutes + " minutes and " + d.seconds + " seconds remaining";
}

function timerLevel(remaining) {
  if (remaining <= 0) return "closed";
  if (remaining <= 15 * 60000) return "critical";
  if (remaining <= 60 * 60000) return "urgent";
  return "steady";
}

function validCoordinate(lat, lng) {
  if (lat === null || lng === null) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return !(lat === 0 && lng === 0);
}

function joinParts(...parts) {
  const cleaned = parts.filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : null;
}

function initials(name, fallback) {
  const source = name || fallback || "";
  const letters = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join("");
  return letters || "—";
}

function safeCall(callback, ...args) {
  if (typeof callback !== "function") return undefined;
  try {
    return callback(...args);
  } catch (callbackError) {
    // eslint-disable-next-line no-console
    console.error("[TransporterRequestDetails] callback failed:", callbackError);
    return undefined;
  }
}

/** Awaits a decision callback and treats explicit failure results as errors. */
async function runDecision(callback, payload) {
  if (typeof callback !== "function") {
    throw new Error("This action is not connected yet.");
  }
  const result = await callback(payload);
  if (result === false) {
    throw new Error("The request could not be completed. Please try again.");
  }
  if (result && typeof result === "object" && (result.success === false || result.ok === false)) {
    throw new Error(
      text(result.message, result.error) || "The request could not be completed. Please try again."
    );
  }
  return result;
}

function errorMessage(caught, fallback) {
  if (!caught) return fallback;
  if (typeof caught === "string") return caught || fallback;
  return (
    text(caught?.response?.data?.message, caught?.data?.message, caught?.message) || fallback
  );
}

async function copyText(value) {
  if (!value) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (clipboardError) {
    /* fall through to legacy copy */
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    area.style.pointerEvents = "none";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch (legacyError) {
    return false;
  }
}

/* ----------------------------------------------------- Request normalizer -- */

/**
 * Builds a read-only, render-safe view model. The selectedRequest prop is
 * never mutated; missing values remain null so the UI can show fallbacks.
 */
function normalizeRequest(raw, receivedAt) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  const t = obj(r.transporter);
  const m = obj(r.material);
  const s = obj(r.seller);

  const rawStatus = String(pick(r.status, r.requestStatus, "") || "").trim().toLowerCase();
  const status = KNOWN_STATUSES.includes(rawStatus) ? rawStatus : "unknown";

  const expiresAt = time(pick(r.responseExpiresAt, r.expiresAt, r.responseDeadline));
  const secondsLeft = num(r.secondsLeft, r.remainingSeconds);
  let deadline = null;
  if (expiresAt !== null) deadline = expiresAt;
  else if (secondsLeft !== null && secondsLeft >= 0) deadline = receivedAt + secondsLeft * 1000;

  const requestedAt = time(pick(r.requestedAt, r.createdAt));
  const windowTotal =
    deadline !== null && requestedAt !== null && deadline > requestedAt ? deadline - requestedAt : null;

  const latitude = num(s.latitude, s.lat);
  const longitude = num(s.longitude, s.lng, s.lon);
  const hasCoordinates = validCoordinate(latitude, longitude);

  const rejectionCode = text(r.rejectionReason, r.rejectionReasonCode, r.reasonCode);
  const knownReason = REJECTION_REASONS.find(item => item.value === rejectionCode);

  const materialName = text(m.name, m.materialName, typeof r.material === "string" ? r.material : null);
  const quantity = num(m.quantity, r.quantity);
  const quantityUnit = text(m.quantityUnit, m.unit, r.quantityUnit);
  const rateUnit = text(m.rateUnit);

  return {
    raw: r,
    id: text(r.id, r.requestId, r.transporterRequestId),
    status,
    statusLabel: status === "unknown" ? (rawStatus ? rawStatus.toUpperCase() : "STATUS N/A") : status.toUpperCase(),
    requestedAt,
    expiresAt: deadline,
    windowTotal,
    acceptedAt: time(r.acceptedAt),
    rejectedAt: time(r.rejectedAt),
    rejectionLabel: knownReason
      ? knownReason.label
      : text(r.rejectionReasonLabel, r.reasonLabel, rejectionCode),
    rejectionNote: text(r.rejectionNote, r.rejectionNotes, r.note),
    transporter: {
      raw: r.transporter || null,
      id: text(t.id, t.transporterId, r.transporterId),
      name: text(t.name, t.agencyName, r.transporterName),
      ownerName: text(t.ownerName, t.owner),
      phone: text(t.phone, t.mobile, t.phoneNumber),
      location: text(t.location),
      address: text(t.address),
      city: text(t.city),
      state: text(t.state),
      pincode: text(t.pincode, t.pinCode),
      joinedAt: time(pick(t.joinedAt, t.createdAt)),
      phoneVerified: bool(t.phoneVerified),
      adminVerified: bool(t.adminVerified)
    },
    material: {
      raw: r.material || null,
      id: text(m.id, m.materialId),
      name: materialName,
      type: text(m.materialType, m.type),
      quantity,
      quantityUnit,
      quantityLabel: formatQuantity(quantity, quantityUnit),
      sampleId: text(m.sampleId),
      sampleCode: text(m.sampleCode, m.referenceCode),
      imageUrl: text(m.imageUrl, m.image),
      thumbnailUrl: text(m.thumbnailUrl, m.imageUrl, m.image),
      rate: num(m.rate),
      rateUnit,
      rateLabel: formatMoney(num(m.rate), rateUnit),
      feetPerTon: num(m.feetPerTon),
      converterLabel:
        num(m.feetPerTon) !== null
          ? "1 " + (rateUnit || "ton") + " = " + formatNumber(num(m.feetPerTon)) + " " + (text(m.convertedRateUnit) || "feet")
          : null,
      convertedRateLabel: formatMoney(num(m.convertedRate), text(m.convertedRateUnit)),
      permitCostLabel: formatMoney(num(m.permitCost), null),
      availableLabel: formatQuantity(num(m.availableQuantity), text(m.availableQuantityUnit)),
      uploadedBy: text(m.uploadedBy, m.uploadedByName),
      uploadedAt: time(pick(m.sampleUploadedAt, m.uploadedAt)),
      sampleExpiresAt: time(pick(m.sampleExpiresAt, m.expiresAt))
    },
    seller: {
      raw: r.seller || null,
      id: text(s.id, s.sellerId, r.sellerId),
      name: text(s.name, s.sellerName, r.sellerName),
      plantName: text(s.plantName, s.businessName),
      phone: text(s.phone, s.mobile, s.phoneNumber),
      location: text(s.location, r.pickupLocation),
      address: text(s.address),
      city: text(s.city),
      state: text(s.state),
      pincode: text(s.pincode, s.pinCode),
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      hasCoordinates,
      joinedAt: time(pick(s.joinedAt, s.createdAt))
    }
  };
}

/* ------------------------------------------------------ Modal primitives -- */

const MODAL_STACK = [];
let scrollLocks = 0;
let savedOverflow = "";

function lockScroll() {
  if (typeof document === "undefined") return;
  if (scrollLocks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks += 1;
}

function unlockScroll() {
  if (typeof document === "undefined") return;
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = savedOverflow;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: role="dialog", aria-modal, labelled title, Escape closing,
 * focus trapping, focus restoration, click-outside closing and scroll locking.
 * `locked` disables every close path during a critical submission.
 */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon = "info",
  tone = "orange",
  size = "md",
  locked = false,
  footer = null,
  children,
  initialFocusRef = null,
  className = ""
}) {
  const panelRef = useRef(null);
  const tokenRef = useRef(null);
  const closeRef = useRef(onClose);
  const lockedRef = useRef(locked);
  const titleId = useMemo(() => "trd-dlg-" + Math.random().toString(36).slice(2, 9), []);

  closeRef.current = onClose;
  lockedRef.current = locked;

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    tokenRef.current = token;
    MODAL_STACK.push(token);
    const previouslyFocused = typeof document !== "undefined" ? document.activeElement : null;
    lockScroll();

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target =
        (initialFocusRef && initialFocusRef.current) || panel.querySelector("[data-autofocus]") || panel;
      if (target && typeof target.focus === "function") target.focus();
    }, 30);

    const handleKey = event => {
      if (MODAL_STACK[MODAL_STACK.length - 1] !== token) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        if (!lockedRef.current) closeRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        node => node.offsetParent !== null || node === document.activeElement
      );
      if (!nodes.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey, true);
      const index = MODAL_STACK.indexOf(token);
      if (index >= 0) MODAL_STACK.splice(index, 1);
      unlockScroll();
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        window.setTimeout(() => {
          try {
            previouslyFocused.focus();
          } catch (focusError) {
            /* element no longer focusable */
          }
        }, 0);
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <BodyPortal>
    <div
      className="trd-root-portal trd-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !locked) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={"trd-modal size-" + size + " tone-" + tone + (className ? " " + className : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={locked || undefined}
        tabIndex={-1}
      >
        <header className="trd-modal-head">
          <span className="trd-modal-icon" aria-hidden="true">
            <Icon name={icon} size={18} strokeWidth={2} />
          </span>
          <div className="trd-modal-titles">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="trd-modal-close"
            onClick={() => !locked && onClose?.()}
            disabled={locked}
            aria-label={"Close " + title}
          >
            <Icon name="close" size={17} strokeWidth={2.1} />
          </button>
        </header>
        <div className="trd-modal-body">{children}</div>
        {footer ? <footer className="trd-modal-foot">{footer}</footer> : null}
      </div>
    </div>
    </BodyPortal>
  );
}

/* ---------------------------------------------------------- Small pieces -- */

function Spinner({ light = false }) {
  return <span className={"trd-spinner" + (light ? " light" : "")} aria-hidden="true" />;
}

function StatusBadge({ status, label, size = "md" }) {
  const icon = status === "accepted" ? "check" : status === "rejected" ? "close" : null;
  return (
    <span className={"trd-badge s-" + status + " sz-" + size}>
      {status === "new" ? <i className="trd-live" aria-hidden="true" /> : null}
      {icon ? <Icon name={icon} size={11} strokeWidth={2.8} /> : null}
      <span>{label}</span>
    </span>
  );
}

/** Label/value row; shows the fallback in a muted italic style when empty. */
function InfoRow({ icon, label, value, fallback = "Not provided", mono = false, strong = false, children }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="trd-row">
      <dt>
        {icon ? <Icon name={icon} size={13} /> : null}
        <span>{label}</span>
      </dt>
      <dd className={(empty ? "trd-missing" : "") + (mono && !empty ? " mono" : "") + (strong && !empty ? " strong" : "")}>
        {empty ? fallback : value}
        {children}
      </dd>
    </div>
  );
}

function Stat({ icon, label, value, fallback = "Not provided", tone = "", mono = false }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={"trd-stat" + (tone ? " t-" + tone : "")}>
      <span className="trd-stat-label">
        <Icon name={icon} size={12} />
        {label}
      </span>
      <strong className={(empty ? "trd-missing" : "") + (mono && !empty ? " mono" : "")}>
        {empty ? fallback : value}
      </strong>
    </div>
  );
}

function VerifyChip({ label, value }) {
  if (value === null) return null;
  return (
    <span className={"trd-verify " + (value ? "ok" : "no")}>
      <Icon name={value ? "shield" : "alert"} size={12} strokeWidth={2} />
      {label}: {value ? "Verified" : "Not verified"}
    </span>
  );
}

function Toast({ toast }) {
  return (
    <BodyPortal>
    <div
      className={"trd-root-portal trd-toast" + (toast ? " show t-" + toast.tone : "")}
      role={toast && toast.tone === "error" ? "alert" : "status"}
      aria-live={toast && toast.tone === "error" ? "assertive" : "polite"}
    >
      {toast ? (
        <>
          <span className="trd-toast-icon">
            <Icon
              name={toast.tone === "success" ? "checkCircle" : toast.tone === "error" ? "alert" : "info"}
              size={15}
              strokeWidth={2}
            />
          </span>
          <span>{toast.message}</span>
        </>
      ) : null}
    </div>
    </BodyPortal>
  );
}

/* --------------------------------------------------------- Response timer -- */

/**
 * Ticks once per second only while the request is NEW with a valid deadline.
 * Stops automatically at zero and on unmount. Never changes request status.
 */
function useCountdown(deadline, active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active || deadline === null) return undefined;
    setNow(Date.now());
    if (deadline - Date.now() <= 0) return undefined;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (deadline - current <= 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, active]);
  return now;
}

function ResponseTimer({ request, now, compact = false }) {
  const status = request.status;

  if (status === "accepted" || status === "rejected") {
    const accepted = status === "accepted";
    const at = accepted ? request.acceptedAt : request.rejectedAt;
    return (
      <div className={"trd-timer final s-" + status + (compact ? " compact" : "")}>
        <span className="trd-timer-emblem"><Icon name={accepted ? "checkCircle" : "xCircle"} size={22} strokeWidth={1.9} /></span>
        <div>
          <span className="trd-kicker">Response window</span>
          <strong>{accepted ? "Request accepted" : "Request rejected"}</strong>
          <small>{at ? (accepted ? "Accepted " : "Rejected ") + formatDateTime(at) : "Decision time not provided"}</small>
        </div>
      </div>
    );
  }

  if (status !== "new") {
    return (
      <div className={"trd-timer final muted" + (compact ? " compact" : "")}>
        <span className="trd-timer-emblem"><Icon name="info" size={20} /></span>
        <div>
          <span className="trd-kicker">Response window</span>
          <strong>Status not recognised</strong>
        </div>
      </div>
    );
  }

  if (request.expiresAt === null) {
    return (
      <div className={"trd-timer final muted" + (compact ? " compact" : "")}>
        <span className="trd-timer-emblem"><Icon name="clock" size={20} /></span>
        <div>
          <span className="trd-kicker">Response window</span>
          <strong>Response deadline not provided</strong>
        </div>
      </div>
    );
  }

  const remaining = request.expiresAt - now;
  const level = timerLevel(remaining);

  const parts = splitDuration(remaining);
  const progress =
    request.windowTotal ? Math.max(0, Math.min(100, (remaining / request.windowTotal) * 100)) : null;

  return (
    <div className={"trd-timer live lvl-" + level + (compact ? " compact" : "")}>
      <div className="trd-timer-top">
        <span className="trd-kicker">
          <i className="trd-timer-pip" aria-hidden="true" />
          Response window
        </span>
        {level === "urgent" ? <em className="trd-timer-flag">Ending soon</em> : null}
        {level === "critical" ? <em className="trd-timer-flag critical">Ending soon · Critical</em> : null}
        {level === "closed" ? <em className="trd-timer-flag ended">Time up · Decision pending</em> : null}
      </div>
      <div className="trd-timer-digits" role="timer" aria-live="off" aria-label={spokenDuration(remaining)}>
        <span className="trd-unit"><b>{parts.hh}</b><small>Hours</small></span>
        <i aria-hidden="true">:</i>
        <span className="trd-unit"><b>{parts.mm}</b><small>Min</small></span>
        <i aria-hidden="true">:</i>
        <span className="trd-unit"><b>{parts.ss}</b><small>Sec</small></span>
      </div>
      {progress !== null ? (
        <span className="trd-timer-track" aria-hidden="true">
          <span style={{ transform: "scaleX(" + progress / 100 + ")" }} />
        </span>
      ) : null}
      <small className="trd-timer-foot">
        {level === "closed" ? "Window ended " : "Closes "}
        {formatDateTime(request.expiresAt)}
        {level === "closed" ? " · Admin can still accept or reject" : ""}
      </small>
    </div>
  );
}

/* ---------------------------------------------------------- Image framing -- */

function MaterialImage({ src, alt, fit = "cover", className = "", onClick, badge = null, label }) {
  const [state, setState] = useState(src ? "loading" : "empty");

  useEffect(() => {
    setState(src ? "loading" : "empty");
  }, [src]);

  const body = (
    <>
      {state === "loading" ? <span className="trd-img-skel" aria-hidden="true" /> : null}
      {src && state !== "error" ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={"fit-" + fit + (state === "ready" ? " ready" : "")}
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
        />
      ) : null}
      {state === "error" || state === "empty" ? (
        <span className="trd-img-fallback">
          <Icon name="image" size={26} strokeWidth={1.5} />
          <b>{state === "error" ? "Image could not be loaded" : "Reference image not provided"}</b>
        </span>
      ) : null}
      {badge ? <span className="trd-img-badge">{badge}</span> : null}
      {onClick && state !== "empty" ? (
        <span className="trd-img-hover" aria-hidden="true">
          <Icon name="expand" size={16} strokeWidth={2} />
          <span>View reference</span>
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={"trd-img state-" + state + " " + className}
        onClick={onClick}
        aria-label={label || "Open material reference"}
      >
        {body}
      </button>
    );
  }
  return <div className={"trd-img state-" + state + " " + className}>{body}</div>;
}

function ImageLightbox({ open, src, alt, onClose }) {
  const closeRef = useRef(null);
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const token = {};
    tokenRef.current = token;
    MODAL_STACK.push(token);
    const previous = document.activeElement;
    lockScroll();
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);
    const handleKey = event => {
      if (MODAL_STACK[MODAL_STACK.length - 1] !== token) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey, true);
      const index = MODAL_STACK.indexOf(token);
      if (index >= 0) MODAL_STACK.splice(index, 1);
      unlockScroll();
      if (previous && typeof previous.focus === "function") window.setTimeout(() => previous.focus(), 0);
    };
  }, [open]);

  if (!open || !src) return null;
  return (
    <BodyPortal>
    <div
      className="trd-root-portal trd-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Material image viewer"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <button ref={closeRef} type="button" className="trd-lightbox-close" onClick={onClose} aria-label="Close image viewer">
        <Icon name="close" size={20} strokeWidth={2.2} />
        <span>Close</span>
      </button>
      <figure>
        <img src={src} alt={alt} />
        {alt ? <figcaption>{alt}</figcaption> : null}
      </figure>
    </div>
    </BodyPortal>
  );
}

function SkeletonBlock({ className = "" }) {
  return <span className={"trd-sk " + className} aria-hidden="true" />;
}

/* ------------------------------------------------------- Header & summary -- */

function RequestHeader({ request, loading, refreshing, onBack, onRefresh }) {
  return (
    <header className="trd-header">
      <div className="trd-width trd-header-inner">
        <div className="trd-top">
          <button className="trd-iconbtn" type="button" onClick={() => safeCall(onBack)} aria-label="Back to Transporter requests">
            <Icon name="back" />
          </button>
          <div className="trd-brand">
            <strong aria-hidden="true">
              <Icon name="truck" size={16} strokeWidth={1.9} />
            </strong>
            <span>
              <b>Transporter Request</b>
              <small className={request && request.id ? "mono" : ""}>
                {request ? request.id || "Request ID unavailable" : "Loading…"}
              </small>
            </span>
          </div>
          {request ? <StatusBadge status={request.status} label={request.statusLabel} /> : null}
          <button
            className={"trd-iconbtn trd-refresh" + (refreshing || loading ? " spinning" : "")}
            type="button"
            onClick={() => safeCall(onRefresh)}
            disabled={refreshing || loading}
            aria-label={refreshing || loading ? "Refreshing request details" : "Refresh request details"}
          >
            <Icon name="refresh" />
          </button>
        </div>

      </div>
    </header>
  );
}

function StatusBanner({ request }) {
  if (request.status === "accepted") {
    return (
      <section className="trd-banner s-accepted" aria-label="Request decision">
        <span className="trd-banner-icon"><Icon name="checkCircle" size={22} strokeWidth={1.9} /></span>
        <div>
          <strong>Request accepted</strong>
          <p>
            {request.acceptedAt
              ? "Accepted on " + formatDateTime(request.acceptedAt) + "."
              : "Acceptance time not provided."}{" "}
            Further decisions are disabled.
          </p>
        </div>
      </section>
    );
  }
  if (request.status === "rejected") {
    return (
      <section className="trd-banner s-rejected" aria-label="Request decision">
        <span className="trd-banner-icon"><Icon name="xCircle" size={22} strokeWidth={1.9} /></span>
        <div className="trd-banner-body">
          <strong>Request rejected</strong>
          <p>
            {request.rejectedAt
              ? "Rejected on " + formatDateTime(request.rejectedAt) + "."
              : "Rejection time not provided."}{" "}
            This request remains visible in request history.
          </p>
          <dl className="trd-banner-grid">
            <div>
              <dt>Reason</dt>
              <dd className={request.rejectionLabel ? "" : "trd-missing"}>
                {request.rejectionLabel || "Reason not provided"}
              </dd>
            </div>
            {request.rejectionNote ? (
              <div>
                <dt>Admin note</dt>
                <dd>{request.rejectionNote}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
    );
  }
  return null;
}

function RequestSummaryCard({ request, now }) {
  const m = request.material;
  const s = request.seller;
  const pickup = s.location || joinParts(s.address, s.city, s.state, s.pincode);
  return (
    <section className={"trd-card trd-summary s-" + request.status} aria-labelledby="trd-summary-title">
      <span className="trd-card-rail" aria-hidden="true" />
      <span className="trd-card-mesh" aria-hidden="true" />
      <div className="trd-summary-head">
        <div className="trd-summary-id">
          <span className="trd-kicker" id="trd-summary-title">Transporter Request ID</span>
          <strong className={request.id ? "mono" : "trd-missing"}>{request.id || "Request ID unavailable"}</strong>
        </div>
        <StatusBadge status={request.status} label={request.statusLabel} size="lg" />
      </div>

      <div className="trd-summary-grid">
        <div className="trd-summary-times">
          <div className="trd-timechip">
            <span className="trd-timechip-icon"><Icon name="calendar" size={15} /></span>
            <div>
              <span className="trd-kicker">Requested at</span>
              <strong className={request.requestedAt ? "" : "trd-missing"}>
                {formatDateTime(request.requestedAt) || "Requested time not available"}
              </strong>
            </div>
          </div>
          <div className="trd-timechip">
            <span className="trd-timechip-icon alt"><Icon name="flag" size={15} /></span>
            <div>
              <span className="trd-kicker">Response expires</span>
              <strong className={request.expiresAt ? "" : "trd-missing"}>
                {formatDateTime(request.expiresAt) || "Response deadline not provided"}
              </strong>
            </div>
          </div>
        </div>
        <ResponseTimer request={request} now={now} />
      </div>

      <div className="trd-summary-stats">
        <Stat icon="cube" label="Material" value={m.name} tone="orange" />
        <Stat icon="scale" label="Requested quantity" value={m.quantityLabel} tone="orange" mono />
        <Stat icon="building" label="Seller" value={s.name} tone="slate" />
        <Stat icon="pin" label="Pickup location" value={pickup} tone="red" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Transporter -- */

function CallButton({ phone, label, onClick, variant = "green", describedBy, missingText }) {
  const disabled = !phone;
  const hintId = describedBy || undefined;
  return (
    <>
      <button
        type="button"
        className={"trd-btn trd-btn-" + variant}
        onClick={onClick}
        disabled={disabled}
        aria-describedby={disabled ? hintId : undefined}
        aria-label={disabled ? label + " — phone number unavailable" : label + " at " + phone}
      >
        <Icon name="phone" size={15} strokeWidth={2} />
        <span>{label}</span>
      </button>
      {disabled && hintId ? (
        <span id={hintId} className="trd-hint">
          <Icon name="info" size={12} />
          {missingText || "Phone number not provided"}
        </span>
      ) : null}
    </>
  );
}

function TransporterCard({ request, onOpenDetails, onCall }) {
  const t = request.transporter;
  const cityState = joinParts(t.city, t.state);
  const context =
    request.status === "new"
      ? "Awaiting Admin decision"
      : request.status === "accepted"
        ? "Request accepted"
        : request.status === "rejected"
          ? "Request rejected"
          : "Status not recognised";
  return (
    <section className="trd-card trd-party t-transporter" aria-labelledby="trd-transporter-title">
      <div className="trd-card-head">
        <span className="trd-card-icon"><Icon name="truck" size={16} strokeWidth={1.9} /></span>
        <h2 id="trd-transporter-title">Transporter</h2>
        <span className={"trd-context s-" + request.status}>{context}</span>
      </div>

      <div className="trd-identity">
        <span className="trd-avatar" aria-hidden="true">
          <Icon name="truck" size={20} strokeWidth={1.8} />
          <em>{initials(t.name, "T")}</em>
        </span>
        <div className="trd-identity-text">
          <button type="button" className="trd-linkname" onClick={onOpenDetails} aria-label="Open Transporter details">
            <span className={t.name ? "" : "trd-missing"}>{t.name || "Transporter name not provided"}</span>
            <Icon name="arrow" size={14} strokeWidth={2.1} />
          </button>
          <div className="trd-identity-meta">
            {t.id ? (
              <button type="button" className="trd-idtag" onClick={onOpenDetails} aria-label={"Open details for Transporter " + t.id}>
                {t.id}
              </button>
            ) : (
              <span className="trd-idtag trd-missing">ID not provided</span>
            )}
            {t.ownerName ? (
              <span className="trd-owner"><Icon name="user" size={12} />{t.ownerName}</span>
            ) : null}
          </div>
        </div>
      </div>

      <dl className="trd-rows">
        <InfoRow icon="pin" label="Registered location" value={t.location || t.address} />
        <InfoRow icon="building" label="City & state" value={cityState} />
        <InfoRow icon="phone" label="Mobile number" value={t.phone} mono />
        <InfoRow icon="calendar" label="Joined" value={formatDate(t.joinedAt)} />
      </dl>

      {t.phoneVerified !== null || t.adminVerified !== null ? (
        <div className="trd-verifies">
          <VerifyChip label="Phone" value={t.phoneVerified} />
          <VerifyChip label="Admin" value={t.adminVerified} />
        </div>
      ) : null}

      <div className="trd-card-actions">
        <CallButton
          phone={t.phone}
          label="Call Transporter"
          onClick={onCall}
          variant="green"
          describedBy="trd-transporter-call-hint"
          missingText="Transporter phone number not provided"
        />
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Material -- */

function MaterialRequestCard({ request, onOpenReference }) {
  const m = request.material;
  const hasConversion = Boolean(m.converterLabel || m.convertedRateLabel);
  return (
    <section className="trd-card trd-material" aria-labelledby="trd-material-title">
      <div className="trd-card-head">
        <span className="trd-card-icon"><Icon name="layers" size={16} strokeWidth={1.9} /></span>
        <h2 id="trd-material-title">Requested Material</h2>
        {m.sampleCode ? <span className="trd-codechip mono">{m.sampleCode}</span> : null}
      </div>

      <div className="trd-material-grid">
        <MaterialImage
          src={m.thumbnailUrl}
          alt={(m.name || "Material") + " reference image"}
          className="trd-material-img"
          onClick={onOpenReference}
          label={"Open reference source for " + (m.name || "material")}
          badge={<><Icon name="shield" size={11} strokeWidth={2.2} />Reference</>}
        />

        <div className="trd-material-info">
          <div className="trd-material-name">
            <strong className={m.name ? "" : "trd-missing"}>{m.name || "Material not provided"}</strong>
            {m.type ? <span className="trd-typechip">{m.type}</span> : null}
          </div>

          <div className="trd-qty">
            <span className="trd-kicker">Requested quantity</span>
            {m.quantity !== null ? (
              <strong>
                <b>{formatNumber(m.quantity)}</b>
                <span>{m.quantityUnit || "unit not provided"}</span>
              </strong>
            ) : (
              <strong className="trd-missing">Quantity not provided</strong>
            )}
          </div>

          <div className="trd-rates">
            <div className="trd-rate primary">
              <span className="trd-kicker"><Icon name="rupee" size={12} />Material rate</span>
              <strong className={m.rateLabel ? "" : "trd-missing"}>{m.rateLabel || "Not provided"}</strong>
            </div>
            <div className="trd-rate">
              <span className="trd-kicker"><Icon name="note" size={12} />Permit cost</span>
              <strong className={m.permitCostLabel ? "" : "trd-missing"}>{m.permitCostLabel || "Not provided"}</strong>
            </div>
            {hasConversion ? (
              <>
                <div className="trd-rate">
                  <span className="trd-kicker"><Icon name="swap" size={12} />Converter rate</span>
                  <strong className={m.converterLabel ? "" : "trd-missing"}>{m.converterLabel || "Not provided"}</strong>
                </div>
                <div className="trd-rate">
                  <span className="trd-kicker"><Icon name="rupee" size={12} />Converted material rate</span>
                  <strong className={m.convertedRateLabel ? "" : "trd-missing"}>{m.convertedRateLabel || "Not provided"}</strong>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <dl className="trd-rows cols-2">
        <InfoRow icon="scale" label="Available quantity" value={m.availableLabel} />
        <InfoRow icon="hash" label="Sample code" value={m.sampleCode} mono />
        <InfoRow icon="doc" label="Source sample ID" value={m.sampleId} mono />
        <InfoRow icon="calendar" label="Sample uploaded" value={formatDateTime(m.uploadedAt)} />
        <InfoRow icon="clock" label="Sample expires" value={formatDateTime(m.sampleExpiresAt)} />
      </dl>

      <button type="button" className="trd-btn trd-btn-soft wide" onClick={onOpenReference}>
        <Icon name="image" size={15} />
        <span>Open Reference Source</span>
        <Icon name="arrow" size={14} strokeWidth={2.1} />
      </button>
    </section>
  );
}

/* ----------------------------------------------------------------- Seller -- */

function sellerNavigable(seller) {
  return seller.hasCoordinates || Boolean(seller.address || seller.location || seller.city || seller.pincode);
}

function SellerCard({ request, onOpenDetails, onCall, onNavigate }) {
  const s = request.seller;
  const m = request.material;
  const canNavigate = sellerNavigable(s);
  const fullAddress = joinParts(s.address, s.city, s.state, s.pincode);
  return (
    <section className="trd-card trd-party t-seller" aria-labelledby="trd-seller-title">
      <div className="trd-card-head">
        <span className="trd-card-icon"><Icon name="building" size={16} strokeWidth={1.9} /></span>
        <h2 id="trd-seller-title">Seller</h2>
        <span className="trd-context internal"><Icon name="lock" size={11} />Internal</span>
      </div>

      <div className="trd-identity">
        <span className="trd-avatar seller" aria-hidden="true">
          <Icon name="building" size={20} strokeWidth={1.8} />
          <em>{initials(s.name, "S")}</em>
        </span>
        <div className="trd-identity-text">
          <button type="button" className="trd-linkname" onClick={onOpenDetails} aria-label="Open Seller details">
            <span className={s.name ? "" : "trd-missing"}>{s.name || "Seller not assigned"}</span>
            <Icon name="arrow" size={14} strokeWidth={2.1} />
          </button>
          <div className="trd-identity-meta">
            {s.id ? (
              <button type="button" className="trd-idtag" onClick={onOpenDetails} aria-label={"Open details for Seller " + s.id}>
                {s.id}
              </button>
            ) : (
              <span className="trd-idtag trd-missing">ID not provided</span>
            )}
            {s.plantName ? <span className="trd-owner"><Icon name="building" size={12} />{s.plantName}</span> : null}
          </div>
        </div>
      </div>

      <div className="trd-pickup">
        <span className="trd-pickup-pin" aria-hidden="true"><Icon name="pin" size={16} /></span>
        <div>
          <span className="trd-kicker">Pickup location</span>
          <p className={s.location || fullAddress ? "" : "trd-missing"}>
            {s.location || fullAddress || "Pickup location not provided"}
          </p>
          {s.location && fullAddress && fullAddress !== s.location ? <small>{fullAddress}</small> : null}
          {s.hasCoordinates ? (
            <small className="mono">
              {formatNumber(s.latitude, 5)}, {formatNumber(s.longitude, 5)}
            </small>
          ) : null}
        </div>
      </div>

      <dl className="trd-rows">
        <InfoRow icon="phone" label="Mobile number" value={s.phone} mono />
        <InfoRow icon="building" label="City & state" value={joinParts(s.city, s.state)} />
        <InfoRow icon="hash" label="Pincode" value={s.pincode} mono />
        <InfoRow icon="calendar" label="Joined" value={formatDate(s.joinedAt)} />
        <InfoRow icon="cube" label="Material supplied" value={m.name} />
        <InfoRow icon="hash" label="Sample code" value={m.sampleCode} mono />
      </dl>

      <div className="trd-card-actions two">
        <div className="trd-action-cell">
          <button
            type="button"
            className="trd-btn trd-btn-blue"
            onClick={onNavigate}
            disabled={!canNavigate}
            aria-describedby={!canNavigate ? "trd-seller-nav-hint" : undefined}
          >
            <Icon name="route" size={15} strokeWidth={2} />
            <span>Navigate</span>
          </button>
          {!canNavigate ? (
            <span id="trd-seller-nav-hint" className="trd-hint">
              <Icon name="info" size={12} />Pickup address not provided
            </span>
          ) : null}
        </div>
        <div className="trd-action-cell">
          <CallButton
            phone={s.phone}
            label="Call Seller"
            onClick={onCall}
            variant="green"
            describedBy="trd-seller-call-hint"
            missingText="Seller phone number not provided"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ Detail modals -- */

function TransporterDetailsModal({ open, onClose, request, onCall, onCopy }) {
  const t = request.transporter;
  const m = request.material;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transporter Details"
      subtitle={t.name || "Registered Transporter"}
      icon="truck"
      footer={
        <>
          <button type="button" className="trd-btn trd-btn-ghost" onClick={onCopy} disabled={!t.id}>
            <Icon name="copy" size={15} />
            <span>Copy Transporter ID</span>
          </button>
          <button
            type="button"
            className="trd-btn trd-btn-green"
            onClick={onCall}
            disabled={!t.phone}
            aria-label={t.phone ? "Call Transporter at " + t.phone : "Call Transporter — phone number unavailable"}
            data-autofocus
          >
            <Icon name="phone" size={15} strokeWidth={2} />
            <span>Call Transporter</span>
          </button>
        </>
      }
    >
      <div className="trd-modal-hero">
        <span className="trd-avatar lg" aria-hidden="true">
          <Icon name="truck" size={22} strokeWidth={1.8} />
          <em>{initials(t.name, "T")}</em>
        </span>
        <div>
          <strong className={t.name ? "" : "trd-missing"}>{t.name || "Transporter name not provided"}</strong>
          <span className="mono">{t.id || "ID not provided"}</span>
          <div className="trd-verifies">
            <VerifyChip label="Phone" value={t.phoneVerified} />
            <VerifyChip label="Admin" value={t.adminVerified} />
          </div>
        </div>
      </div>

      <h3 className="trd-section-label">Identity & contact</h3>
      <dl className="trd-rows boxed">
        <InfoRow label="Agency name" value={t.name} strong />
        <InfoRow label="Transporter ID" value={t.id} mono />
        <InfoRow label="Owner name" value={t.ownerName} />
        <InfoRow label="Mobile number" value={t.phone} mono />
        <InfoRow label="Joining date" value={formatDate(t.joinedAt)} />
      </dl>

      <h3 className="trd-section-label">Registered address</h3>
      <dl className="trd-rows boxed">
        <InfoRow label="Registered location" value={t.location} />
        <InfoRow label="Address" value={t.address} />
        <InfoRow label="City" value={t.city} />
        <InfoRow label="State" value={t.state} />
        <InfoRow label="Pincode" value={t.pincode} mono />
      </dl>

      <h3 className="trd-section-label">Current request</h3>
      <dl className="trd-rows boxed accent">
        <InfoRow label="Request ID" value={request.id} mono />
        <InfoRow label="Requested material" value={m.name} />
        <InfoRow label="Requested quantity" value={m.quantityLabel} />
        <InfoRow label="Requested at" value={formatDateTime(request.requestedAt)} fallback="Requested time not available" />
      </dl>
    </Modal>
  );
}

function ReferenceSourceModal({ open, onClose, request, onCallSeller, onCopy, onOpenLightbox }) {
  const m = request.material;
  const s = request.seller;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reference Source"
      subtitle={m.sampleCode ? "Reference code " + m.sampleCode : "Material reference"}
      icon="image"
      size="lg"
      className="trd-reference"
      footer={
        <>
          <button type="button" className="trd-btn trd-btn-ghost" onClick={onCopy} data-autofocus>
            <Icon name="copy" size={15} />
            <span>Copy information</span>
          </button>
          <button
            type="button"
            className="trd-btn trd-btn-green"
            onClick={onCallSeller}
            disabled={!s.phone}
            aria-label={s.phone ? "Call Seller at " + s.phone : "Call Seller — phone number unavailable"}
          >
            <Icon name="phone" size={15} strokeWidth={2} />
            <span>Call Seller</span>
          </button>
        </>
      }
    >
      <div className="trd-ref-code">
        <span className="trd-kicker">Sample / reference code</span>
        <strong className={m.sampleCode ? "mono" : "trd-missing"}>{m.sampleCode || "Reference code not provided"}</strong>
      </div>

      <MaterialImage
        src={m.imageUrl || m.thumbnailUrl}
        alt={(m.name || "Material") + " reference image, full view"}
        fit="contain"
        className="trd-ref-img"
        onClick={m.imageUrl || m.thumbnailUrl ? onOpenLightbox : undefined}
        label="Open image in full-screen viewer"
        badge={<><Icon name="shield" size={11} strokeWidth={2.2} />Permanent reference</>}
      />

      <dl className="trd-rows boxed ref">
        <InfoRow label="Uploaded by" value={m.uploadedBy || s.name} />
        <InfoRow label="Seller name" value={s.name} strong />
        <InfoRow label="Seller ID" value={s.id} mono />
        <InfoRow label="Material type" value={m.type} />
        <InfoRow label="Source sample ID" value={m.sampleId} mono />
        <InfoRow label="Location" value={s.location || joinParts(s.address, s.city, s.state, s.pincode)} />
        <InfoRow label="Mobile" value={s.phone} mono />
        <InfoRow label="Uploaded" value={formatDateTime(m.uploadedAt)} />
        <InfoRow label="Recorded material rate" value={m.rateLabel} strong />
        <InfoRow label="Converter rate" value={m.converterLabel} />
        <InfoRow label="Converted material rate" value={m.convertedRateLabel} />
        <InfoRow label="Sample expiry" value={formatDateTime(m.sampleExpiresAt)} />
        <InfoRow label="Permit cost" value={m.permitCostLabel} />
        <InfoRow label="Available quantity" value={m.availableLabel} />
      </dl>

      <p className="trd-privacy">
        <Icon name="lock" size={14} />
        <span>
          Seller information is internal and will not be shown to the Buyer or Transporter unless StoneRate’s workflow
          explicitly allows it.
        </span>
      </p>
    </Modal>
  );
}

function SellerDetailsModal({ open, onClose, request, onCall, onNavigate, onCopy }) {
  const s = request.seller;
  const m = request.material;
  const canNavigate = sellerNavigable(s);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Seller Details"
      subtitle={s.plantName || s.name || "Registered Seller"}
      icon="building"
      className="trd-seller-modal"
      footer={
        <>
          <button type="button" className="trd-btn trd-btn-ghost" onClick={onCopy} disabled={!s.id}>
            <Icon name="copy" size={15} />
            <span>Copy Seller ID</span>
          </button>
          <button type="button" className="trd-btn trd-btn-blue" onClick={onNavigate} disabled={!canNavigate}>
            <Icon name="route" size={15} strokeWidth={2} />
            <span>Navigate</span>
          </button>
          <button
            type="button"
            className="trd-btn trd-btn-green"
            onClick={onCall}
            disabled={!s.phone}
            aria-label={s.phone ? "Call Seller at " + s.phone : "Call Seller — phone number unavailable"}
            data-autofocus
          >
            <Icon name="phone" size={15} strokeWidth={2} />
            <span>Call Seller</span>
          </button>
        </>
      }
    >
      <div className="trd-modal-hero">
        <span className="trd-avatar lg seller" aria-hidden="true">
          <Icon name="building" size={22} strokeWidth={1.8} />
          <em>{initials(s.name, "S")}</em>
        </span>
        <div>
          <strong className={s.name ? "" : "trd-missing"}>{s.name || "Seller not assigned"}</strong>
          <span className="mono">{s.id || "ID not provided"}</span>
        </div>
      </div>

      <h3 className="trd-section-label">Seller profile</h3>
      <dl className="trd-rows boxed">
        <InfoRow label="Seller name" value={s.name} strong />
        <InfoRow label="Seller ID" value={s.id} mono />
        <InfoRow label="Plant name" value={s.plantName} />
        <InfoRow label="Mobile number" value={s.phone} mono />
        <InfoRow label="Joining date" value={formatDate(s.joinedAt)} />
      </dl>

      <h3 className="trd-section-label">Pickup address</h3>
      <dl className="trd-rows boxed">
        <InfoRow label="Registered location" value={s.location} />
        <InfoRow label="Full address" value={s.address} />
        <InfoRow label="City" value={s.city} />
        <InfoRow label="State" value={s.state} />
        <InfoRow label="Pincode" value={s.pincode} mono />
      </dl>

      <h3 className="trd-section-label">Material reference</h3>
      <dl className="trd-rows boxed accent">
        <InfoRow label="Material name" value={m.name} />
        <InfoRow label="Published material rate" value={m.rateLabel} strong />
        <InfoRow label="Permit cost" value={m.permitCostLabel} />
        <InfoRow label="Available quantity" value={m.availableLabel} />
        <InfoRow label="Sample code" value={m.sampleCode} mono />
        <InfoRow label="Sample uploaded" value={formatDateTime(m.uploadedAt)} />
        <InfoRow label="Sample expires" value={formatDateTime(m.sampleExpiresAt)} />
      </dl>
    </Modal>
  );
}

/* ---------------------------------------------------------- Decision modals -- */

function AcceptRequestModal({ open, onClose, request, now, busy, error, onConfirm }) {
  const t = request.transporter;
  const m = request.material;
  const s = request.seller;
  const remaining = request.expiresAt !== null ? request.expiresAt - now : null;
  const remainingLabel =
    remaining === null ? "Deadline not provided" : remaining <= 0 ? "00 : 00 : 00 · Time up" : durationLabel(remaining);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Accept this Transporter request?"
      subtitle="Confirm the details below before recording the decision."
      icon="checkCircle"
      tone="green"
      locked={busy}
      footer={
        <>
          <button type="button" className="trd-btn trd-btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="trd-btn trd-btn-primary"
            onClick={onConfirm}
            disabled={busy}
            data-autofocus
          >
            {busy ? <Spinner light /> : <Icon name="check" size={15} strokeWidth={2.4} />}
            <span>{busy ? "Accepting…" : "Accept Request"}</span>
          </button>
        </>
      }
    >
      <div className={"trd-confirm-timer" + (remaining !== null && remaining > 0 ? " lvl-" + timerLevel(remaining) : "")}>
        <Icon name="clock" size={15} />
        <span>Remaining response time</span>
        <b className="mono">{remainingLabel}</b>
      </div>
      <dl className="trd-rows boxed">
        <InfoRow label="Request ID" value={request.id} mono />
        <InfoRow label="Transporter" value={t.name} strong />
        <InfoRow label="Transporter ID" value={t.id} mono />
        <InfoRow label="Material" value={m.name} />
        <InfoRow label="Requested quantity" value={m.quantityLabel} />
        <InfoRow label="Seller" value={s.name} />
        <InfoRow label="Pickup location" value={s.location || joinParts(s.address, s.city, s.state, s.pincode)} />
        <InfoRow label="Material rate" value={m.rateLabel} strong />
        <InfoRow label="Permit cost" value={m.permitCostLabel} />
      </dl>
      <p className="trd-confirm-note green">
        <Icon name="info" size={14} />
        <span>
          Accepting this request confirms that StoneRate can proceed with the selected material and Seller for the
          Transporter.
        </span>
      </p>
      {error ? (
        <div className="trd-inline-error" role="alert">
          <Icon name="alert" size={15} />
          <span>{error}</span>
        </div>
      ) : null}
    </Modal>
  );
}

function RejectRequestModal({ open, onClose, request, busy, error, onSubmit, windowOpen }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const noteRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setNote("");
      setTouched(false);
    }
  }, [open]);

  const trimmed = note.trim();
  const reasonMissing = !reason;
  const noteMissing = reason === "other" && trimmed.length === 0;
  const invalid = reasonMissing || noteMissing;
  const selected = REJECTION_REASONS.find(item => item.value === reason);

  const submit = () => {
    setTouched(true);
    if (busy || !windowOpen) return;
    if (invalid) {
      if (noteMissing && noteRef.current) noteRef.current.focus();
      return;
    }
    onSubmit({ reasonCode: reason, reasonLabel: selected ? selected.label : reason, note: trimmed });
  };

  const footer = (
    <>
      <button type="button" className="trd-btn trd-btn-ghost" onClick={onClose} disabled={busy}>
        Cancel
      </button>
      <button
        type="button"
        className="trd-btn trd-btn-danger solid"
        onClick={submit}
        disabled={busy || !windowOpen}
        aria-disabled={invalid || undefined}
      >
        {busy ? <Spinner light /> : <Icon name="close" size={15} strokeWidth={2.4} />}
        <span>{busy ? "Rejecting…" : "Reject Request"}</span>
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject Transporter Request"
      subtitle={request.id ? "Request " + request.id : undefined}
      icon="xCircle"
      tone="red"
      locked={busy}
      footer={footer}
    >
      <p className="trd-modal-lead">Select a reason, then tap <b>Reject Request</b>.</p>
      <div className="trd-reasons" role="radiogroup" aria-label="Rejection reason" aria-invalid={touched && reasonMissing}>
        {REJECTION_REASONS.map(item => {
          const active = reason === item.value;
          return (
            <label key={item.value} className={"trd-reason" + (active ? " active" : "") + (busy ? " disabled" : "")}>
              <input
                type="radio"
                name="trd-reject-reason"
                value={item.value}
                checked={active}
                disabled={busy}
                onChange={() => setReason(item.value)}
              />
              <span className="trd-reason-icon" aria-hidden="true"><Icon name={item.icon} size={14} /></span>
              <span className="trd-reason-text">
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
              <span className="trd-reason-radio" aria-hidden="true"><i /></span>
            </label>
          );
        })}
      </div>
      {touched && reasonMissing ? (
        <p className="trd-field-error" role="alert"><Icon name="alert" size={13} />Select a rejection reason.</p>
      ) : null}

      {reason ? (
        <div className={"trd-notes" + (touched && noteMissing ? " invalid" : "")}>
          <label htmlFor="trd-reject-notes">
            Rejection notes{reason === "other" ? <em> Required</em> : <small> Optional</small>}
          </label>
          <textarea
            id="trd-reject-notes"
            ref={noteRef}
            value={note}
            maxLength={NOTE_MAX}
            rows={3}
            disabled={busy}
            placeholder="Explain why this Transporter request is being rejected"
            onChange={event => setNote(event.target.value.slice(0, NOTE_MAX))}
            aria-invalid={touched && noteMissing}
            aria-describedby="trd-reject-notes-meta"
            required={reason === "other"}
          />
          <div className="trd-notes-meta" id="trd-reject-notes-meta">
            <span>
              {touched && noteMissing ? (
                <b className="trd-field-error inline"><Icon name="alert" size={12} />Notes are required for Other.</b>
              ) : (
                "Visible to StoneRate Admins only."
              )}
            </span>
            <span className={note.length >= NOTE_MAX - 40 ? "near" : ""}>
              {note.length} / {NOTE_MAX}
            </span>
          </div>
        </div>
      ) : null}

      {!windowOpen ? (
        <div className="trd-inline-error" role="alert">
          <Icon name="lock" size={15} />
          <span>This request has already been decided.</span>
        </div>
      ) : null}
      {error ? (
        <div className="trd-inline-error" role="alert">
          <Icon name="alert" size={15} />
          <span>{error}</span>
        </div>
      ) : null}
    </Modal>
  );
}

/* ---------------------------------------------------------------- States -- */

function LoadingSkeleton() {
  return (
    <div className="trd-grid" aria-hidden="true">
      <section className="trd-card trd-span sk-card">
        <div className="sk-row"><SkeletonBlock className="sk-w40 sk-h16" /><SkeletonBlock className="sk-badge" /></div>
        <div className="sk-split">
          <div className="sk-col">
            <SkeletonBlock className="sk-chip" />
            <SkeletonBlock className="sk-chip" />
          </div>
          <SkeletonBlock className="sk-timer" />
        </div>
        <div className="sk-quad">
          <SkeletonBlock className="sk-tile" /><SkeletonBlock className="sk-tile" />
          <SkeletonBlock className="sk-tile" /><SkeletonBlock className="sk-tile" />
        </div>
      </section>
      <section className="trd-card trd-span sk-card">
        <SkeletonBlock className="sk-w30 sk-h14" />
        <div className="sk-material">
          <SkeletonBlock className="sk-image" />
          <div className="sk-col">
            <SkeletonBlock className="sk-w60 sk-h18" />
            <SkeletonBlock className="sk-w40 sk-h28" />
            <div className="sk-pair"><SkeletonBlock className="sk-tile" /><SkeletonBlock className="sk-tile" /></div>
          </div>
        </div>
      </section>
      {[0, 1].map(key => (
        <section key={key} className="trd-card sk-card">
          <SkeletonBlock className="sk-w30 sk-h14" />
          <div className="sk-row start"><SkeletonBlock className="sk-avatar" /><div className="sk-col grow"><SkeletonBlock className="sk-w60 sk-h16" /><SkeletonBlock className="sk-w30 sk-h12" /></div></div>
          <SkeletonBlock className="sk-w100 sk-h12" />
          <SkeletonBlock className="sk-w80 sk-h12" />
          <SkeletonBlock className="sk-w90 sk-h12" />
          <SkeletonBlock className="sk-btn" />
        </section>
      ))}
      <section className="trd-card trd-span sk-card">
        <SkeletonBlock className="sk-w30 sk-h16" />
        <SkeletonBlock className="sk-w60 sk-h12" />
        <div className="sk-pair"><SkeletonBlock className="sk-btn" /><SkeletonBlock className="sk-btn" /></div>
      </section>
    </div>
  );
}

function ErrorState({ message, onRetry, onBack }) {
  return (
    <section className="trd-state error" role="alert">
      <span className="trd-state-icon"><Icon name="alert" size={24} /></span>
      <h2>Unable to load Transporter request details</h2>
      <p>{message}</p>
      <div className="trd-state-actions">
        <button type="button" className="trd-btn trd-btn-primary" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          <span>Retry</span>
        </button>
        <button type="button" className="trd-btn trd-btn-ghost" onClick={onBack}>
          <Icon name="back" size={15} />
          <span>Back</span>
        </button>
      </div>
    </section>
  );
}

function EmptyState({ onBack }) {
  return (
    <section className="trd-state empty">
      <span className="trd-empty-art" aria-hidden="true">
        <span className="ring one" />
        <span className="ring two" />
        <span className="core"><Icon name="truck" size={26} strokeWidth={1.7} /></span>
      </span>
      <h2>No Transporter request selected</h2>
      <p>Open a Transporter request from the Admin Request page to view its details.</p>
      <div className="trd-state-actions">
        <button type="button" className="trd-btn trd-btn-primary" onClick={onBack}>
          <Icon name="back" size={15} />
          <span>Back to Requests</span>
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Decision section -- */

function DecisionPanel({ request, now, busy, onAccept, onReject }) {
  const status = request.status;
  const remaining = request.expiresAt !== null ? request.expiresAt - now : null;
  const windowClosed = remaining !== null && remaining <= 0;
  const noDeadline = request.expiresAt === null;
  const actionable = status === "new";

  let message = null;
  if (status === "accepted") message = { tone: "green", icon: "checkCircle", text: "Request accepted" + (request.acceptedAt ? " · " + formatDateTime(request.acceptedAt) : "") };
  else if (status === "rejected") message = { tone: "red", icon: "xCircle", text: "Request rejected" + (request.rejectedAt ? " · " + formatDateTime(request.rejectedAt) : "") };
  else if (status !== "new") message = { tone: "muted", icon: "info", text: "Decision unavailable for this status" };

  return (
    <section
      className={"trd-decision" + (actionable ? " sticky" : "") + (message ? " t-" + message.tone : "")}
      aria-labelledby="trd-decision-title"
    >
      <div className="trd-decision-copy">
        <h2 id="trd-decision-title">
          <Icon name="flag" size={16} strokeWidth={2} />
          Request Decision
        </h2>
        {actionable && windowClosed ? (
          <small className="trd-hint"><Icon name="clock" size={12} />Response time is up — you can still accept or reject.</small>
        ) : actionable && noDeadline ? (
          <small className="trd-hint"><Icon name="info" size={12} />Response deadline not provided.</small>
        ) : null}
      </div>
      {message ? (
        <div className={"trd-decision-final t-" + message.tone} role="status">
          <Icon name={message.icon} size={18} strokeWidth={2} />
          <span>{message.text}</span>
        </div>
      ) : (
        <div className="trd-decision-actions">
          <button type="button" className="trd-btn trd-btn-danger lg" onClick={onReject} disabled={busy}>
            <Icon name="close" size={16} strokeWidth={2.4} />
            <span>Reject Request</span>
          </button>
          <button type="button" className="trd-btn trd-btn-primary lg" onClick={onAccept} disabled={busy}>
            {busy ? <Spinner light /> : <Icon name="check" size={16} strokeWidth={2.4} />}
            <span>Accept Request</span>
          </button>
        </div>
      )}
    </section>
  );
}

/* ========================================================== Page component -- */

export default function StoneRateAdminTransporterRequestDetails({
  selectedRequest = null,
  loading = false,
  error = "",
  saving = false,

  onBack = () => {},
  onRefresh = () => {},
  onRetry = () => {},

  onAcceptRequest = async () => {},
  onRejectRequest = async () => {},

  onCallTransporter = () => {},
  onCallSeller = () => {},
  onNavigateSeller = () => {},

  onHome = () => {},
  onSamples = () => {},
  onTransporterRequests = () => {},
  onRateRequests = () => {},
  onConfirmedOrders = () => {}
}) {
  const request = useMemo(() => normalizeRequest(selectedRequest, Date.now()), [selectedRequest]);

  const [modal, setModal] = useState(null); // transporter | reference | seller | accept | reject
  const [lightbox, setLightbox] = useState(false);
  const [submitting, setSubmitting] = useState(null); // accept | reject
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const mounted = useRef(true);
  const submitLock = useRef(false);

  const timerActive = Boolean(request && request.status === "new" && request.expiresAt !== null);
  const now = useCountdown(request ? request.expiresAt : null, timerActive);

  const busy = saving || submitting !== null;
  const refreshing = Boolean(request && loading);
  /* The timer is informational only — reaching zero never blocks or rejects. */
  const windowOpen = Boolean(request && request.status === "new");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message, tone = "info") => {
    setToast({ message, tone, key: Date.now() });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      if (mounted.current) setToast(null);
    }, 2800);
  }, []);

  /* Refresh failures while data is visible → non-blocking toast + banner */
  const previousError = useRef(error);
  useEffect(() => {
    if (error && error !== previousError.current && request) showToast("Refresh failed", "error");
    previousError.current = error;
  }, [error, request, showToast]);

  /* Close decision popups automatically if the backend status changes */
  useEffect(() => {
    if (request && request.status !== "new" && (modal === "accept" || modal === "reject") && !busy) {
      setModal(null);
    }
  }, [request, modal, busy]);

  const closeModal = useCallback(() => {
    if (busy && (modal === "accept" || modal === "reject")) return;
    setModal(null);
    setActionError("");
  }, [busy, modal]);

  /* ------------------------------ contact & navigation actions ------------------------------ */

  const callTransporter = () => {
    const phone = request?.transporter.phone;
    if (!phone) {
      showToast("Call information unavailable", "error");
      return;
    }
    safeCall(onCallTransporter, phone, selectedRequest?.transporter || null);
  };

  const callSeller = () => {
    const phone = request?.seller.phone;
    if (!phone) {
      showToast("Call information unavailable", "error");
      return;
    }
    safeCall(onCallSeller, phone, selectedRequest?.seller || null);
  };

  const navigateSeller = () => {
    if (!request || !sellerNavigable(request.seller)) {
      showToast("Navigation information unavailable", "error");
      return;
    }
    const s = request.seller;
    safeCall(onNavigateSeller, {
      seller: selectedRequest?.seller || null,
      material: selectedRequest?.material || null,
      request: selectedRequest,
      destination: {
        sellerName: s.name,
        sellerId: s.id,
        address: joinParts(s.address, s.city, s.state, s.pincode) || s.location,
        location: s.location,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        latitude: s.hasCoordinates ? s.latitude : null,
        longitude: s.hasCoordinates ? s.longitude : null,
        materialName: request.material.name,
        requestId: request.id
      }
    });
  };

  const copyValue = async (value, successMessage) => {
    const ok = await copyText(value);
    showToast(ok ? successMessage : "Copy failed", ok ? "success" : "error");
  };

  const copyReference = () => {
    if (!request) return;
    const m = request.material;
    const s = request.seller;
    const lines = [
      ["Request ID", request.id],
      ["Material", m.name],
      ["Sample code", m.sampleCode],
      ["Seller name", s.name],
      ["Seller ID", s.id],
      ["Location", s.location || joinParts(s.address, s.city, s.state, s.pincode)],
      ["Mobile", s.phone],
      ["Material rate", m.rateLabel],
      ["Converter rate", m.converterLabel],
      ["Converted material rate", m.convertedRateLabel],
      ["Permit cost", m.permitCostLabel],
      ["Available quantity", m.availableLabel],
      ["Sample expiry", formatDateTime(m.sampleExpiresAt)]
    ].map(([label, value]) => label + ": " + (value || "Not provided"));
    copyValue(["StoneRate · Reference Source", ...lines].join("\n"), "Reference information copied");
  };

  /* ------------------------------------ decisions ------------------------------------ */

  const openAccept = () => {
    if (!windowOpen || busy) return;
    setActionError("");
    setModal("accept");
  };

  const openReject = () => {
    if (!windowOpen || busy) return;
    setActionError("");
    setModal("reject");
  };

  const confirmAccept = async () => {
    if (!request || submitLock.current || saving) return;
    if (!windowOpen) {
      setActionError("This request has already been decided.");
      return;
    }
    submitLock.current = true;
    setSubmitting("accept");
    setActionError("");
    try {
      await runDecision(onAcceptRequest, {
        requestId: selectedRequest?.id ?? request.id,
        transporterId: selectedRequest?.transporter?.id ?? request.transporter.id,
        sellerId: selectedRequest?.seller?.id ?? request.seller.id,
        materialId: selectedRequest?.material?.id ?? request.material.id,
        sampleId: selectedRequest?.material?.sampleId ?? request.material.sampleId
      });
      if (!mounted.current) return;
      setModal(null);
      showToast("Transporter request accepted successfully", "success");
      safeCall(onRefresh);
    } catch (caught) {
      if (!mounted.current) return;
      const message = errorMessage(caught, "Unable to accept this request. Please try again.");
      setActionError(message);
      showToast("API operation failed", "error");
    } finally {
      submitLock.current = false;
      if (mounted.current) setSubmitting(null);
    }
  };

  const submitReject = async ({ reasonCode, reasonLabel, note }) => {
    if (!request || submitLock.current || saving) return;
    if (!windowOpen) {
      setActionError("This request has already been decided.");
      return;
    }
    submitLock.current = true;
    setSubmitting("reject");
    setActionError("");
    try {
      await runDecision(onRejectRequest, {
        requestId: selectedRequest?.id ?? request.id,
        reasonCode,
        reasonLabel,
        note
      });
      if (!mounted.current) return;
      setModal(null);
      showToast("Transporter request rejected", "success");
      safeCall(onRefresh);
    } catch (caught) {
      if (!mounted.current) return;
      const message = errorMessage(caught, "Unable to reject this request. Please try again.");
      setActionError(message);
      showToast("API operation failed", "error");
    } finally {
      submitLock.current = false;
      if (mounted.current) setSubmitting(null);
    }
  };

  /* ------------------------------------ layout ------------------------------------ */

  let content;
  if (!request && loading) {
    content = (
      <div role="status" aria-live="polite">
        <span className="trd-sr-only">Loading Transporter request details…</span>
        <LoadingSkeleton />
      </div>
    );
  } else if (!request && error) {
    content = (
      <ErrorState
        message={String(error)}
        onRetry={() => safeCall(onRetry)}
        onBack={() => safeCall(onBack)}
      />
    );
  } else if (!request) {
    content = <EmptyState onBack={() => safeCall(onBack)} />;
  } else {
    content = (
      <div className={"trd-content" + (refreshing ? " refreshing" : "")} aria-busy={refreshing || undefined}>
        {error ? (
          <div className="trd-warn" role="alert">
            <Icon name="alert" size={16} />
            <div>
              <strong>Refresh failed</strong>
              <span>{String(error)} Showing the last loaded details.</span>
            </div>
            <button type="button" className="trd-btn trd-btn-ghost sm" onClick={() => safeCall(onRetry)} disabled={loading}>
              <Icon name="refresh" size={13} />
              <span>Retry</span>
            </button>
          </div>
        ) : null}
        {refreshing ? (
          <div className="trd-refreshing" role="status" aria-live="polite">
            <Spinner />
            <span>Refreshing request details…</span>
          </div>
        ) : null}

        <div className="trd-grid">
          <div className="trd-span">
            <StatusBanner request={request} />
          </div>
          <div className="trd-span">
            <RequestSummaryCard request={request} now={now} />
          </div>
          <div className="trd-span">
            <MaterialRequestCard request={request} onOpenReference={() => setModal("reference")} />
          </div>
          <TransporterCard
            request={request}
            onOpenDetails={() => setModal("transporter")}
            onCall={callTransporter}
          />
          <SellerCard
            request={request}
            onOpenDetails={() => setModal("seller")}
            onCall={callSeller}
            onNavigate={navigateSeller}
          />
          <div className="trd-span">
            <DecisionPanel
              request={request}
              now={now}
              busy={busy || refreshing}
              onAccept={openAccept}
              onReject={openReject}
            />
          </div>
        </div>

        <TransporterDetailsModal
          open={modal === "transporter"}
          onClose={closeModal}
          request={request}
          onCall={callTransporter}
          onCopy={() => copyValue(request.transporter.id, "Transporter ID copied")}
        />
        <ReferenceSourceModal
          open={modal === "reference"}
          onClose={closeModal}
          request={request}
          onCallSeller={callSeller}
          onCopy={copyReference}
          onOpenLightbox={() => setLightbox(true)}
        />
        <SellerDetailsModal
          open={modal === "seller"}
          onClose={closeModal}
          request={request}
          onCall={callSeller}
          onNavigate={navigateSeller}
          onCopy={() => copyValue(request.seller.id, "Seller ID copied")}
        />
        <AcceptRequestModal
          open={modal === "accept"}
          onClose={closeModal}
          request={request}
          now={now}
          busy={busy}
          error={actionError}
          onConfirm={confirmAccept}
        />
        <RejectRequestModal
          open={modal === "reject"}
          onClose={closeModal}
          request={request}
          busy={busy}
          error={actionError}
          onSubmit={submitReject}
          windowOpen={windowOpen}
        />
        <ImageLightbox
          open={lightbox}
          src={request.material.imageUrl || request.material.thumbnailUrl}
          alt={(request.material.name || "Material") + " reference image"}
          onClose={() => setLightbox(false)}
        />
      </div>
    );
  }

  return (
    <div className="trd-root">
      <style>{CSS + CSS_2 + CSS_3}</style>
      <div className="trd-bg" aria-hidden="true">
        <i />
        <b />
        <span />
        <em />
      </div>

      <RequestHeader
        request={request}
        loading={loading}
        refreshing={refreshing}
        onBack={onBack}
        onRefresh={onRefresh}
      />

      <main className="trd-width trd-main">{content}</main>

      <Toast toast={toast} />
    </div>
  );
}

/* ===========================================================================
 * Styles — scoped with the `trd-` prefix. Tokens mirror AdminRateRequestDetails.
 * ========================================================================= */

const CSS = `
.trd-root{
  --o:#f97316;--o2:#c2560b;--o3:#9a4408;--soft:rgba(249,115,22,.11);--soft2:rgba(249,115,22,.18);
  --amber:#e08b1e;--amber-ink:#a15c07;--amber-soft:rgba(224,139,30,.13);
  --green:#1f9463;--green-ink:#0f7a4c;--green-soft:rgba(31,148,99,.11);
  --red:#d64545;--red-ink:#b42318;--red-soft:rgba(214,69,69,.10);
  --blue:#2563eb;--blue-ink:#175cd3;--blue-soft:rgba(37,99,235,.10);
  --ink:#141a24;--ink2:#3b4658;--muted:#6b7687;--faint:#96a0af;--line:#e9edf3;--line2:#dbe2ec;
  --mono:"SF Mono",ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace;
  --shadow:0 4px 16px rgba(20,26,36,.055),inset 0 1px 0 #fff;
  --shadow-lg:0 18px 44px rgba(20,26,36,.12);
  position:relative;isolation:isolate;min-height:100dvh;
  padding-bottom:calc(92px + env(safe-area-inset-bottom,0px));
  color:var(--ink);background:#f4f7fb;overflow-x:hidden;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.trd-root *{box-sizing:border-box}
.trd-root button,.trd-root input,.trd-root textarea{font:inherit}
.trd-root button{cursor:pointer}
.trd-root button:disabled{cursor:not-allowed}
.trd-root :focus-visible{outline:2px solid rgba(249,115,22,.6);outline-offset:2px}
.trd-root .mono{font-family:var(--mono);letter-spacing:.01em}
.trd-sr-only{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.trd-missing{color:var(--faint)!important;font-style:italic;font-weight:600!important;font-family:inherit!important}

/* background */
.trd-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.trd-bg>i{position:absolute;inset:0;background:linear-gradient(transparent 0 31px,rgba(24,42,72,.035) 31px 32px),linear-gradient(90deg,transparent 0 31px,rgba(24,42,72,.035) 31px 32px);background-size:32px 32px;-webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%);mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%)}
.trd-bg>b,.trd-bg>span,.trd-bg>em{position:absolute;border-radius:50%;filter:blur(58px);opacity:.5}
.trd-bg>b{width:44vw;height:44vw;max-width:520px;max-height:520px;left:-9vw;top:-16vw;background:radial-gradient(circle,rgba(255,168,74,.55),transparent 66%)}
.trd-bg>span{width:40vw;height:40vw;max-width:470px;max-height:470px;right:-10vw;top:-6vw;background:radial-gradient(circle,rgba(80,140,255,.42),transparent 66%)}
.trd-bg>em{width:36vw;height:36vw;max-width:420px;max-height:420px;left:34vw;top:26vw;background:radial-gradient(circle,rgba(13,148,136,.26),transparent 68%)}

.trd-width{width:min(100%,1080px);margin:0 auto;position:relative;z-index:1}

/* header */
.trd-header{position:relative;z-index:2;border-bottom:1px solid rgba(16,28,50,.06);background:rgba(244,247,251,.16);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.trd-header-inner{padding:12px 14px 16px}
.trd-top{display:flex;align-items:center;gap:10px}
.trd-iconbtn{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;padding:0;border:1px solid var(--line2);border-radius:11px;background:rgba(255,255,255,.94);color:var(--ink2);box-shadow:0 2px 8px rgba(20,26,36,.05);transition:.18s}
.trd-iconbtn:hover:not(:disabled){color:var(--o2);border-color:rgba(249,115,22,.4);transform:translateY(-1px)}
.trd-iconbtn:disabled{opacity:.6}
.trd-refresh.spinning svg{animation:trdSpin .9s linear infinite}
.trd-brand{display:flex;align-items:center;gap:9px;flex:1;min-width:0}
.trd-brand>strong{position:relative;width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 6px 16px rgba(249,115,22,.32)}
.trd-brand-ping{position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:#22c55e;border:2px solid #fff}
.trd-brand>span{display:flex;flex-direction:column;min-width:0}
.trd-brand b{font-size:14px;letter-spacing:-.01em}
.trd-brand small{font-size:10px;color:var(--o2);font-weight:750;text-transform:uppercase;letter-spacing:.06em}
.trd-title{margin:16px 0 0;font-size:25px;line-height:1.1;font-weight:750;letter-spacing:-.035em}
.trd-title span{background:linear-gradient(100deg,var(--o),#fbbf24 55%,var(--o2));-webkit-background-clip:text;background-clip:text;color:transparent}
.trd-sub{margin:7px 0 0;max-width:58ch;color:var(--muted);font-size:12.5px;line-height:1.5}
.trd-idline{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px;min-height:28px}
.trd-idchip{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:100%;padding:5px 10px;border:1px solid var(--line2);border-radius:9px;background:rgba(255,255,255,.92);color:var(--muted)}
.trd-idchip b{font-family:var(--mono);font-size:12.5px;font-weight:700;color:var(--ink);overflow-wrap:anywhere}

/* badges */
.trd-badge{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:5px 10px;border:1px solid;border-radius:999px;font-size:9.5px;line-height:1;font-weight:850;letter-spacing:.09em;white-space:nowrap}
.trd-badge.sz-lg{padding:7px 12px;font-size:10.5px}
.trd-badge.s-new{color:var(--o3);background:linear-gradient(135deg,#fff4ea,#ffe6d1);border-color:rgba(249,115,22,.42)}
.trd-badge.s-accepted{color:var(--green-ink);background:var(--green-soft);border-color:rgba(31,148,99,.34)}
.trd-badge.s-rejected{color:var(--red-ink);background:var(--red-soft);border-color:rgba(214,69,69,.34)}
.trd-badge.s-unknown{color:#475569;background:#f1f4f8;border-color:var(--line2)}
.trd-live{position:relative;width:7px;height:7px;border-radius:50%;background:var(--o)}
.trd-live:after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--o);opacity:0;animation:trdPing 1.8s cubic-bezier(0,0,.2,1) infinite}

/* layout */
.trd-main{padding:16px 14px 24px}
.trd-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
.trd-span{grid-column:1/-1;min-width:0}
.trd-content{transition:opacity .25s}
.trd-content.refreshing .trd-grid{opacity:.72;pointer-events:none}

/* cards */
.trd-card{position:relative;overflow:hidden;min-width:0;padding:14px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.95);box-shadow:var(--shadow);animation:trdRise .45s cubic-bezier(.2,.7,.3,1) both}
.trd-card-rail{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#fbbf24,var(--o))}
.trd-summary.s-accepted .trd-card-rail{background:linear-gradient(180deg,#34d399,var(--green))}
.trd-summary.s-rejected .trd-card-rail{background:linear-gradient(180deg,#f87171,var(--red))}
.trd-card-mesh{position:absolute;inset:0;pointer-events:none;opacity:.6;background-image:radial-gradient(rgba(20,26,36,.07) 1px,transparent 1.2px);background-size:14px 14px;-webkit-mask-image:radial-gradient(ellipse 60% 80% at 100% 0%,#000,transparent 72%);mask-image:radial-gradient(ellipse 60% 80% at 100% 0%,#000,transparent 72%)}
.trd-card-head{display:flex;align-items:center;gap:9px;margin-bottom:12px;min-width:0}
.trd-card-head h2{margin:0;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--ink2)}
.trd-card-icon{width:30px;height:30px;flex:0 0 auto;display:grid;place-items:center;border-radius:10px;color:var(--o2);background:var(--soft)}
.t-seller .trd-card-icon{color:#475569;background:rgba(71,85,105,.1)}
.trd-context{margin-left:auto;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:7px;font-size:9.5px;font-weight:750;white-space:nowrap;color:var(--muted);background:#f1f4f8}
.trd-context.s-new{color:var(--o3);background:var(--soft)}
.trd-context.s-accepted{color:var(--green-ink);background:var(--green-soft)}
.trd-context.s-rejected{color:var(--red-ink);background:var(--red-soft)}
.trd-codechip{margin-left:auto;max-width:52%;padding:4px 8px;border-radius:7px;font-size:10px;font-weight:700;color:var(--ink2);background:#f1f4f8;border:1px solid var(--line);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.trd-kicker{display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}

/* summary */
.trd-summary{padding:16px 16px 16px 20px;background:linear-gradient(155deg,#ffffff 0%,#fffaf5 55%,#fff4ea 100%)}
.trd-summary.s-accepted{background:linear-gradient(155deg,#ffffff 0%,#f6fdf9 60%,#ecfaf3 100%)}
.trd-summary.s-rejected{background:linear-gradient(155deg,#ffffff 0%,#fffafa 60%,#fdf0f0 100%)}
.trd-summary>*:not(.trd-card-rail):not(.trd-card-mesh){position:relative}
.trd-summary-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
.trd-summary-id{min-width:0}
.trd-summary-id strong{display:block;margin-top:5px;font-size:18px;font-weight:750;color:var(--ink);overflow-wrap:anywhere}
.trd-summary-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-top:14px}
.trd-summary-times{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
.trd-timechip{display:flex;align-items:center;gap:10px;min-width:0;padding:10px 11px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.85)}
.trd-timechip>div{min-width:0}
.trd-timechip strong{display:block;margin-top:3px;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
.trd-timechip-icon{width:32px;height:32px;flex:0 0 auto;display:grid;place-items:center;border-radius:10px;color:var(--blue-ink);background:var(--blue-soft)}
.trd-timechip-icon.alt{color:var(--o2);background:var(--soft)}
.trd-summary-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
.trd-stat{min-width:0;padding:10px 11px;border:1px solid var(--line);border-radius:13px;background:#fff}
.trd-stat-label{display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.trd-stat.t-orange .trd-stat-label svg{color:var(--o2)}
.trd-stat.t-red .trd-stat-label svg{color:var(--red-ink)}
.trd-stat.t-slate .trd-stat-label svg{color:#475569}
.trd-stat strong{display:block;margin-top:5px;font-size:13px;line-height:1.35;font-weight:700;color:var(--ink);overflow-wrap:anywhere}

/* timer */
.trd-timer{position:relative;min-width:0;padding:12px 13px;border:1px solid var(--line);border-radius:15px;background:#fff}
.trd-timer.live{--lv:var(--o);--lv-ink:var(--o3);--lv-soft:rgba(249,115,22,.10);border-color:rgba(249,115,22,.30);background:linear-gradient(135deg,#fff 0%,var(--lv-soft) 100%);box-shadow:0 8px 22px rgba(249,115,22,.10)}
.trd-timer.live.lvl-steady{--lv:var(--blue);--lv-ink:var(--blue-ink);--lv-soft:rgba(37,99,235,.08);border-color:rgba(37,99,235,.24);box-shadow:0 8px 22px rgba(37,99,235,.08)}
.trd-timer.live.lvl-urgent{--lv:var(--amber);--lv-ink:var(--amber-ink);--lv-soft:rgba(224,139,30,.14);border-color:rgba(224,139,30,.42)}
.trd-timer.live.lvl-critical{--lv:var(--red);--lv-ink:var(--red-ink);--lv-soft:rgba(214,69,69,.11);border-color:rgba(214,69,69,.46);animation:trdCritical 2.2s ease-in-out infinite}
.trd-timer-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:20px}
.trd-timer-pip{width:6px;height:6px;border-radius:50%;background:var(--lv);animation:trdBlink 1.4s ease-in-out infinite}
.trd-timer-flag{padding:3px 7px;border-radius:6px;font-style:normal;font-size:9px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:var(--amber);white-space:nowrap}
.trd-timer-flag.critical{background:var(--red)}
.trd-timer-digits{display:flex;align-items:flex-start;justify-content:center;gap:6px;margin-top:9px}
.trd-timer-digits>i{padding-top:9px;font-style:normal;font-size:18px;font-weight:700;color:var(--lv-ink);opacity:.45}
.trd-unit{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.trd-unit b{display:block;min-width:58px;padding:8px 6px;border-radius:12px;text-align:center;font-family:var(--mono);font-size:24px;line-height:1;font-weight:750;font-variant-numeric:tabular-nums;color:var(--lv-ink);background:#fff;border:1px solid rgba(20,26,36,.06);box-shadow:0 4px 12px rgba(20,26,36,.06),inset 0 -2px 0 var(--lv-soft)}
.trd-unit small{font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.trd-timer-track{display:block;height:4px;margin-top:10px;border-radius:4px;background:rgba(20,26,36,.06);overflow:hidden}
.trd-timer-track>span{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--lv),var(--lv-ink));transform-origin:left center;transition:transform 1s linear}
.trd-timer-foot{display:block;margin-top:8px;text-align:center;font-size:10.5px;color:var(--muted)}
.trd-timer.final{display:flex;align-items:center;gap:11px}
.trd-timer.final>div{min-width:0}
.trd-timer.final strong{display:block;margin-top:3px;font-size:14px;font-weight:750}
.trd-timer.final small{display:block;margin-top:2px;font-size:11px;color:var(--muted)}
.trd-timer-emblem{width:42px;height:42px;flex:0 0 auto;display:grid;place-items:center;border-radius:13px;color:#64748b;background:#f1f4f8}
.trd-timer.s-accepted{border-color:rgba(31,148,99,.28);background:linear-gradient(135deg,#fff,var(--green-soft))}
.trd-timer.s-accepted .trd-timer-emblem{color:#fff;background:linear-gradient(135deg,#34d399,var(--green))}
.trd-timer.s-accepted strong{color:var(--green-ink)}
.trd-timer.s-rejected{border-color:rgba(214,69,69,.28);background:linear-gradient(135deg,#fff,var(--red-soft))}
.trd-timer.s-rejected .trd-timer-emblem{color:#fff;background:linear-gradient(135deg,#f87171,var(--red))}
.trd-timer.s-rejected strong{color:var(--red-ink)}
.trd-timer.lvl-closed{background:#f6f8fb}
.trd-timer.lvl-closed strong{color:#475569}
.trd-timer.muted strong{color:var(--faint);font-style:italic}

/* banner */
.trd-banner{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;border:1px solid;border-radius:16px;animation:trdRise .4s both}
.trd-banner-icon{width:40px;height:40px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;color:#fff}
.trd-banner strong{display:block;font-size:14px;font-weight:800}
.trd-banner p{margin:3px 0 0;font-size:12px;line-height:1.5;color:var(--ink2)}
.trd-banner-body{min-width:0;flex:1}
.trd-banner.s-accepted{border-color:rgba(31,148,99,.28);background:linear-gradient(135deg,#f0fbf6,#e5f7ee)}
.trd-banner.s-accepted .trd-banner-icon{background:linear-gradient(135deg,#34d399,var(--green))}
.trd-banner.s-accepted strong{color:var(--green-ink)}
.trd-banner.s-rejected{border-color:rgba(214,69,69,.28);background:linear-gradient(135deg,#fff5f5,#fdecec)}
.trd-banner.s-rejected .trd-banner-icon{background:linear-gradient(135deg,#f87171,var(--red))}
.trd-banner.s-rejected strong{color:var(--red-ink)}
.trd-banner-grid{display:grid;gap:6px;margin:9px 0 0}
.trd-banner-grid>div{padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.75);border:1px solid rgba(214,69,69,.14)}
.trd-banner-grid dt{font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.trd-banner-grid dd{margin:3px 0 0;font-size:12.5px;font-weight:650;color:var(--ink);overflow-wrap:anywhere;white-space:pre-wrap}
`;

const CSS_2 = `
/* identity */
.trd-identity{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#fff,#f8fafc)}
.trd-identity-text{min-width:0;flex:1}
.trd-avatar{position:relative;width:46px;height:46px;flex:0 0 auto;display:grid;place-items:center;border-radius:14px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 6px 16px rgba(249,115,22,.30),inset 0 1px 0 rgba(255,255,255,.3)}
.trd-avatar.seller{background:linear-gradient(135deg,#475569,#1e293b);box-shadow:0 6px 16px rgba(30,41,59,.25)}
.trd-avatar.lg{width:54px;height:54px;border-radius:16px}
.trd-avatar em{position:absolute;right:-6px;bottom:-6px;min-width:22px;height:19px;padding:0 4px;display:grid;place-items:center;border-radius:6px;font-style:normal;font-size:9px;font-weight:850;letter-spacing:.04em;color:var(--o3);background:#fff;border:1px solid rgba(249,115,22,.35)}
.trd-avatar.seller em{color:#334155;border-color:var(--line2)}
.trd-linkname{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:0;border:0;background:transparent;text-align:left;color:var(--ink);font-size:15.5px;line-height:1.25;font-weight:750;letter-spacing:-.015em}
.trd-linkname>span{overflow-wrap:anywhere}
.trd-linkname svg{flex:0 0 auto;color:var(--o2);opacity:.55;transition:transform .2s,opacity .2s}
.trd-linkname:hover>span{color:var(--o2);text-decoration:underline;text-decoration-color:rgba(249,115,22,.4);text-underline-offset:3px}
.trd-linkname:hover svg{opacity:1;transform:translateX(3px)}
.trd-identity-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px}
.trd-idtag{display:inline-flex;align-items:center;max-width:100%;padding:3px 8px;border:1px solid var(--line2);border-radius:7px;background:#f5f7fa;color:var(--ink2);font-family:var(--mono);font-size:10.5px;font-weight:700;overflow-wrap:anywhere;transition:.18s}
button.trd-idtag:hover{color:var(--o2);border-color:rgba(249,115,22,.45);background:#fff7ef}
.trd-owner{display:inline-flex;align-items:center;gap:4px;min-width:0;font-size:11px;font-weight:600;color:var(--muted);overflow-wrap:anywhere}
.trd-owner svg{flex:0 0 auto;color:var(--faint)}

/* rows */
.trd-rows{display:grid;margin:10px 0 0;padding:0}
.trd-rows.cols-2{grid-template-columns:minmax(0,1fr);column-gap:16px}
.trd-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:9px 2px;border-bottom:1px dashed var(--line2);min-width:0}
.trd-row:last-child{border-bottom:0}
.trd-row dt{display:flex;align-items:center;gap:6px;flex:0 0 auto;max-width:48%;font-size:11.5px;font-weight:600;color:var(--muted)}
.trd-row dt svg{flex:0 0 auto;color:var(--faint)}
.trd-row dd{margin:0;min-width:0;text-align:right;font-size:12px;font-weight:650;color:var(--ink);overflow-wrap:anywhere;white-space:pre-wrap}
.trd-row dd.strong{font-weight:800}
.trd-rows.boxed{margin:0;padding:2px 12px;border:1px solid var(--line);border-radius:14px;background:#fff}
.trd-rows.boxed.accent{background:linear-gradient(135deg,#fffaf5,#fff);border-color:rgba(249,115,22,.2)}
.trd-verifies{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.trd-verifies:empty{display:none}
.trd-verify{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:750;border:1px solid}
.trd-verify.ok{color:var(--green-ink);background:var(--green-soft);border-color:rgba(31,148,99,.25)}
.trd-verify.no{color:var(--amber-ink);background:var(--amber-soft);border-color:rgba(224,139,30,.28)}

/* buttons */
.trd-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:0 16px;border:1px solid transparent;border-radius:12px;font-size:12.5px;font-weight:800;letter-spacing:-.005em;white-space:nowrap;transition:transform .18s,box-shadow .18s,background .18s,border-color .18s,color .18s,opacity .18s}
.trd-btn:hover:not(:disabled){transform:translateY(-1px)}
.trd-btn:active:not(:disabled){transform:translateY(0)}
.trd-btn:disabled{opacity:.48;transform:none!important;box-shadow:none!important}
.trd-btn.sm{min-height:34px;padding:0 11px;font-size:11.5px;border-radius:10px}
.trd-btn.lg{min-height:52px;padding:0 22px;font-size:14px;border-radius:14px}
.trd-btn.wide{width:100%;margin-top:12px}
.trd-btn-primary{color:#fff;background:linear-gradient(135deg,var(--o) 0%,#ea6a0a 50%,var(--o2) 100%);box-shadow:0 8px 20px rgba(249,115,22,.32),inset 0 1px 0 rgba(255,255,255,.28);overflow:hidden}
.trd-btn-primary:before{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-18deg);transition:left .6s ease;pointer-events:none}
.trd-btn-primary:hover:not(:disabled){box-shadow:0 12px 26px rgba(249,115,22,.42)}
.trd-btn-primary:hover:not(:disabled):before{left:120%}
.trd-btn-green{color:var(--green-ink);background:linear-gradient(135deg,#effcf6,#e2f7ed);border-color:rgba(31,148,99,.32)}
.trd-btn-green:hover:not(:disabled){box-shadow:0 8px 18px rgba(31,148,99,.18);border-color:rgba(31,148,99,.5)}
.trd-btn-blue{color:var(--blue-ink);background:linear-gradient(135deg,#f0f5ff,#e4edff);border-color:rgba(37,99,235,.28)}
.trd-btn-blue:hover:not(:disabled){box-shadow:0 8px 18px rgba(37,99,235,.16);border-color:rgba(37,99,235,.45)}
.trd-btn-ghost{color:var(--ink2);background:#fff;border-color:var(--line2);box-shadow:0 2px 8px rgba(20,26,36,.05)}
.trd-btn-ghost:hover:not(:disabled){color:var(--o2);border-color:rgba(249,115,22,.42)}
.trd-btn-soft{color:var(--o3);background:linear-gradient(135deg,#fff7ef,#ffeedd);border-color:rgba(249,115,22,.3)}
.trd-btn-soft:hover:not(:disabled){box-shadow:0 8px 18px rgba(249,115,22,.16)}
.trd-btn-danger{color:var(--red-ink);background:#fff;border-color:rgba(214,69,69,.45);box-shadow:0 2px 8px rgba(214,69,69,.08)}
.trd-btn-danger:hover:not(:disabled){background:#fff5f5;box-shadow:0 8px 18px rgba(214,69,69,.16)}
.trd-btn-danger.solid{color:#fff;border-color:transparent;background:linear-gradient(135deg,#ef4444,var(--red-ink));box-shadow:0 8px 20px rgba(214,69,69,.30)}
.trd-btn-danger.solid:hover:not(:disabled){background:linear-gradient(135deg,#ef4444,#991b1b)}
.trd-card-actions{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin-top:12px}
.trd-card-actions.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.trd-card-actions .trd-btn{width:100%}
.trd-action-cell{display:flex;flex-direction:column;gap:5px;min-width:0}
.trd-hint{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;color:var(--faint)}
.trd-hint svg{flex:0 0 auto}
.trd-spinner{width:15px;height:15px;flex:0 0 auto;border:2px solid rgba(249,115,22,.25);border-top-color:var(--o);border-radius:50%;animation:trdSpin .7s linear infinite}
.trd-spinner.light{border-color:rgba(255,255,255,.35);border-top-color:#fff}

/* material */
.trd-material{padding:15px}
.trd-material-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.trd-material-info{display:flex;flex-direction:column;gap:11px;min-width:0}
.trd-material-name{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.trd-material-name strong{font-size:18px;line-height:1.25;font-weight:800;letter-spacing:-.02em;overflow-wrap:anywhere}
.trd-typechip{padding:3px 9px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#475569;background:#eef2f6;border:1px solid var(--line2)}
.trd-qty{padding:11px 12px;border-radius:14px;border:1px solid rgba(249,115,22,.24);background:linear-gradient(135deg,#fff7ef,#fff)}
.trd-qty strong{display:flex;align-items:baseline;gap:6px;margin-top:4px}
.trd-qty strong b{font-family:var(--mono);font-size:26px;line-height:1;font-weight:800;color:var(--o3);font-variant-numeric:tabular-nums}
.trd-qty strong span{font-size:13px;font-weight:700;color:var(--ink2)}
.trd-rates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.trd-rate{min-width:0;padding:10px 11px;border-radius:13px;border:1px solid var(--line);background:#fff}
.trd-rate strong{display:block;margin-top:5px;font-size:14px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.trd-rate.primary{border-color:rgba(31,148,99,.25);background:linear-gradient(135deg,#f3fcf8,#fff)}
.trd-rate.primary strong{font-size:16px;color:var(--green-ink)}

/* image */
.trd-img{position:relative;display:block;width:100%;padding:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,#eef2f6,#f8fafc);text-align:left}
button.trd-img{cursor:zoom-in}
.trd-material-img{aspect-ratio:4/3;max-height:320px}
.trd-img img{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .35s,transform .5s cubic-bezier(.2,.7,.3,1)}
.trd-img img.ready{opacity:1}
.trd-img img.fit-cover{object-fit:cover}
.trd-img img.fit-contain{object-fit:contain}
button.trd-img:hover img.fit-cover{transform:scale(1.035)}
.trd-img-skel{position:absolute;inset:0;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:trdShimmer 1.3s linear infinite}
.trd-img-fallback{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px;text-align:center;color:#7b8797;border:1px dashed #cbd5e1;border-radius:inherit}
.trd-img-fallback b{font-size:11.5px;font-weight:700}
.trd-img-badge{position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;font-size:9.5px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:rgba(20,26,36,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.trd-img-hover{position:absolute;right:10px;bottom:10px;display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:10px;font-size:11px;font-weight:800;color:var(--ink);background:rgba(255,255,255,.92);box-shadow:0 6px 16px rgba(20,26,36,.18);transform:translateY(0);transition:transform .2s,box-shadow .2s}
button.trd-img:hover .trd-img-hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(20,26,36,.22)}
.trd-ref-img{aspect-ratio:16/10;max-height:52vh;margin-top:12px;background:#0f172a0d}

/* seller pickup */
.trd-pickup{display:flex;gap:10px;margin-top:10px;padding:11px 12px;border-radius:14px;border:1px dashed rgba(214,69,69,.28);background:linear-gradient(135deg,rgba(214,69,69,.04),#fff)}
.trd-pickup>div{min-width:0}
.trd-pickup-pin{width:32px;height:32px;flex:0 0 auto;display:grid;place-items:center;border-radius:10px;color:var(--red-ink);background:var(--red-soft)}
.trd-pickup p{margin:4px 0 0;font-size:12.5px;line-height:1.45;font-weight:650;color:var(--ink);overflow-wrap:anywhere}
.trd-pickup small{display:block;margin-top:3px;font-size:10.5px;color:var(--muted);overflow-wrap:anywhere}

/* decision */
.trd-decision{position:relative;display:flex;flex-direction:column;gap:12px;padding:15px;border:1px solid rgba(249,115,22,.26);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.97),rgba(255,247,239,.97));box-shadow:0 12px 32px rgba(20,26,36,.10),inset 0 1px 0 #fff;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.trd-decision.sticky{position:sticky;bottom:calc(80px + env(safe-area-inset-bottom,0px));z-index:5}
.trd-decision.t-green{border-color:rgba(31,148,99,.26);background:linear-gradient(135deg,#fff,#f0fbf6)}
.trd-decision.t-red{border-color:rgba(214,69,69,.26);background:linear-gradient(135deg,#fff,#fff4f4)}
.trd-decision.t-muted{border-color:var(--line2);background:#fff}
.trd-decision-copy{min-width:0}
.trd-decision h2{display:flex;align-items:center;gap:7px;margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em}
.trd-decision h2 svg{color:var(--o2)}
.trd-decision p{margin:5px 0 0;max-width:62ch;font-size:12px;line-height:1.5;color:var(--muted)}
.trd-decision .trd-hint{margin-top:6px}
.trd-decision-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:9px}
.trd-decision-actions .trd-btn{width:100%}
.trd-decision-final{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 14px;border-radius:13px;font-size:13px;font-weight:800;text-align:center}
.trd-decision-final.t-green{color:var(--green-ink);background:var(--green-soft)}
.trd-decision-final.t-red{color:var(--red-ink);background:var(--red-soft)}
.trd-decision-final.t-muted{color:#475569;background:#f1f4f8}

/* warnings */
.trd-warn{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 12px;border:1px solid rgba(224,139,30,.36);border-radius:14px;background:linear-gradient(135deg,#fffaf0,#fff4e0);color:var(--amber-ink)}
.trd-warn>div{flex:1;min-width:0;display:flex;flex-direction:column}
.trd-warn strong{font-size:12.5px}
.trd-warn span{font-size:11.5px;color:var(--ink2);overflow-wrap:anywhere}
.trd-refreshing{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 11px;border-radius:999px;font-size:11px;font-weight:700;color:var(--o3);background:rgba(255,255,255,.9);border:1px solid rgba(249,115,22,.25);box-shadow:var(--shadow)}

/* states */
.trd-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;padding:32px 22px;text-align:center;border:1px dashed var(--line2);border-radius:20px;background:rgba(255,255,255,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);animation:trdRise .4s both}
.trd-state h2{margin:0 0 6px;max-width:36ch;font-size:16px;font-weight:800;letter-spacing:-.015em}
.trd-state p{margin:0;max-width:46ch;font-size:12.5px;line-height:1.55;color:var(--muted);overflow-wrap:anywhere}
.trd-state-icon{width:52px;height:52px;display:grid;place-items:center;margin-bottom:14px;border-radius:16px;color:var(--red-ink);background:var(--red-soft);border:1px solid rgba(214,69,69,.22)}
.trd-state-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.trd-state-actions .trd-btn{min-width:140px}
.trd-state.empty{border-style:solid;background:radial-gradient(120% 90% at 50% 0%,rgba(249,115,22,.07),transparent 60%),rgba(255,255,255,.88)}
.trd-empty-art{position:relative;width:92px;height:92px;display:grid;place-items:center;margin-bottom:16px}
.trd-empty-art .ring{position:absolute;border-radius:50%;border:1px dashed rgba(249,115,22,.35)}
.trd-empty-art .ring.one{inset:0;animation:trdSpin 18s linear infinite}
.trd-empty-art .ring.two{inset:13px;border-style:solid;border-color:rgba(249,115,22,.16);background:rgba(249,115,22,.05)}
.trd-empty-art .core{position:relative;width:50px;height:50px;display:grid;place-items:center;border-radius:15px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 10px 24px rgba(249,115,22,.34)}

/* skeleton */
.trd-sk{display:block;border-radius:8px;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:trdShimmer 1.3s linear infinite}
.sk-idchip{width:170px;height:28px;border-radius:9px}
.sk-badge{width:72px;height:24px;border-radius:999px}
.sk-card{display:flex;flex-direction:column;gap:12px;animation:none}
.sk-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.sk-row.start{justify-content:flex-start}
.sk-col{display:flex;flex-direction:column;gap:8px;min-width:0}
.sk-col.grow{flex:1}
.sk-split{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.sk-quad{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.sk-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.sk-material{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
.sk-chip{height:54px;border-radius:13px}
.sk-timer{height:128px;border-radius:15px}
.sk-tile{height:58px;border-radius:13px}
.sk-image{aspect-ratio:4/3;max-height:260px;border-radius:16px}
.sk-avatar{width:46px;height:46px;flex:0 0 auto;border-radius:14px}
.sk-btn{height:46px;border-radius:12px}
.sk-w30{width:30%}.sk-w40{width:40%}.sk-w60{width:60%}.sk-w80{width:80%}.sk-w90{width:90%}.sk-w100{width:100%}
.sk-h12{height:12px}.sk-h14{height:14px}.sk-h16{height:16px}.sk-h18{height:18px}.sk-h28{height:28px}

/* modal */
.trd-overlay{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;padding:0;background:rgba(12,22,40,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:trdFade .2s ease both}
.trd-modal{position:relative;display:flex;flex-direction:column;width:100%;max-height:94dvh;overflow:hidden;border-radius:22px 22px 0 0;background:#f7f9fc;box-shadow:0 -12px 40px rgba(12,22,40,.22);animation:trdSheet .32s cubic-bezier(.2,.8,.2,1) both;outline:none}
.trd-modal-head{position:relative;display:flex;align-items:flex-start;gap:11px;padding:16px 16px 13px;background:#fff;border-bottom:1px solid var(--line)}
.trd-modal-head:before{content:"";position:absolute;left:50%;top:6px;width:38px;height:4px;margin-left:-19px;border-radius:4px;background:#dbe2ec}
.trd-modal-icon{width:38px;height:38px;flex:0 0 auto;display:grid;place-items:center;border-radius:12px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 6px 14px rgba(249,115,22,.28)}
.trd-modal.tone-green .trd-modal-icon{background:linear-gradient(135deg,#34d399,var(--green));box-shadow:0 6px 14px rgba(31,148,99,.28)}
.trd-modal.tone-red .trd-modal-icon{background:linear-gradient(135deg,#f87171,var(--red));box-shadow:0 6px 14px rgba(214,69,69,.28)}
.trd-modal-titles{flex:1;min-width:0;padding-top:1px}
.trd-modal-titles h2{margin:0;font-size:16px;line-height:1.3;font-weight:800;letter-spacing:-.015em;overflow-wrap:anywhere}
.trd-modal-titles p{margin:3px 0 0;font-size:11.5px;color:var(--muted);overflow-wrap:anywhere}
.trd-modal-close{width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;padding:0;border:1px solid var(--line2);border-radius:11px;background:#fff;color:var(--ink2);transition:.18s}
.trd-modal-close:hover:not(:disabled){color:var(--red-ink);border-color:rgba(214,69,69,.4);background:#fff5f5}
.trd-modal-close:disabled{opacity:.45}
.trd-modal-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 16px 16px;-webkit-overflow-scrolling:touch}
.trd-modal-foot{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid var(--line)}
.trd-modal-foot .trd-btn{flex:1 1 150px}
.trd-modal-hero{display:flex;align-items:center;gap:13px;margin-bottom:14px;padding:13px;border-radius:16px;border:1px solid var(--line);background:linear-gradient(135deg,#fff,#fff7ef)}
.trd-modal-hero>div{min-width:0}
.trd-modal-hero strong{display:block;font-size:16px;font-weight:800;overflow-wrap:anywhere}
.trd-modal-hero span.mono{display:block;margin-top:3px;font-size:11.5px;color:var(--muted)}
.trd-modal-hero .trd-verifies{margin-top:7px}
.trd-section-label{margin:14px 2px 7px;font-size:10px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.trd-modal-hero+.trd-section-label{margin-top:0}
.trd-modal-lead{margin:0 0 12px;font-size:12.5px;line-height:1.5;color:var(--ink2)}
.trd-ref-code{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:11px 12px;border-radius:13px;border:1px solid rgba(249,115,22,.24);background:linear-gradient(135deg,#fff7ef,#fff)}
.trd-ref-code strong{font-size:14px;font-weight:800;color:var(--o3);overflow-wrap:anywhere}
.trd-rows.ref{margin-top:12px}
.trd-privacy{display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;padding:10px 12px;border-radius:12px;font-size:11px;line-height:1.5;color:#475569;background:#eef2f6;border:1px solid var(--line2)}
.trd-privacy svg{flex:0 0 auto;margin-top:1px}
.trd-confirm-timer{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:10px 12px;border-radius:13px;font-size:12px;font-weight:700;color:var(--blue-ink);background:var(--blue-soft);border:1px solid rgba(37,99,235,.2)}
.trd-confirm-timer b{margin-left:auto;font-size:14px;font-variant-numeric:tabular-nums}
.trd-confirm-timer.lvl-urgent{color:var(--amber-ink);background:var(--amber-soft);border-color:rgba(224,139,30,.3)}
.trd-confirm-timer.lvl-critical{color:var(--red-ink);background:var(--red-soft);border-color:rgba(214,69,69,.3)}
.trd-confirm-note{display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;padding:10px 12px;border-radius:12px;font-size:11.5px;line-height:1.5}
.trd-confirm-note svg{flex:0 0 auto;margin-top:1px}
.trd-confirm-note.green{color:var(--green-ink);background:var(--green-soft);border:1px solid rgba(31,148,99,.2)}
.trd-inline-error{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:10px 12px;border-radius:12px;font-size:12px;font-weight:650;line-height:1.45;color:var(--red-ink);background:#fff1f1;border:1px solid rgba(214,69,69,.3);overflow-wrap:anywhere}
.trd-inline-error svg{flex:0 0 auto;margin-top:1px}

/* reasons */
.trd-reasons{display:grid;gap:8px}
.trd-reason{position:relative;display:flex;align-items:center;gap:11px;padding:12px;border:1.5px solid var(--line2);border-radius:14px;background:#fff;cursor:pointer;transition:border-color .18s,box-shadow .18s,background .18s}
.trd-reason:hover{border-color:rgba(214,69,69,.35)}
.trd-reason input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.trd-reason:focus-within{outline:2px solid rgba(214,69,69,.45);outline-offset:2px}
.trd-reason.active{border-color:rgba(214,69,69,.6);background:linear-gradient(135deg,#fff,#fff4f4);box-shadow:0 6px 16px rgba(214,69,69,.10)}
.trd-reason.disabled{opacity:.6;cursor:not-allowed}
.trd-reason-icon{width:34px;height:34px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;color:#64748b;background:#f1f4f8;transition:.18s}
.trd-reason.active .trd-reason-icon{color:#fff;background:linear-gradient(135deg,#f87171,var(--red))}
.trd-reason-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.trd-reason-text b{font-size:13px;font-weight:750;color:var(--ink)}
.trd-reason-text small{font-size:11px;line-height:1.4;color:var(--muted)}
.trd-reason-radio{width:20px;height:20px;flex:0 0 auto;display:grid;place-items:center;border:2px solid var(--line2);border-radius:50%;transition:.18s}
.trd-reason-radio i{width:10px;height:10px;border-radius:50%;background:var(--red);transform:scale(0);transition:transform .18s}
.trd-reason.active .trd-reason-radio{border-color:var(--red)}
.trd-reason.active .trd-reason-radio i{transform:scale(1)}
.trd-notes{margin-top:12px}
.trd-notes label{display:block;margin-bottom:6px;font-size:12px;font-weight:750;color:var(--ink2)}
.trd-notes label em{margin-left:4px;padding:2px 6px;border-radius:5px;font-style:normal;font-size:9.5px;font-weight:800;color:var(--red-ink);background:var(--red-soft)}
.trd-notes label small{font-size:10.5px;font-weight:600;color:var(--faint)}
.trd-notes textarea{display:block;width:100%;min-height:104px;padding:11px 12px;resize:vertical;border:1px solid var(--line2);border-radius:13px;background:#fff;color:var(--ink);font-size:12.5px;line-height:1.5;outline:none;transition:border-color .18s,box-shadow .18s}
.trd-notes textarea:focus{border-color:rgba(249,115,22,.55);box-shadow:0 0 0 3px rgba(249,115,22,.14)}
.trd-notes.invalid textarea{border-color:rgba(214,69,69,.6);box-shadow:0 0 0 3px rgba(214,69,69,.12)}
.trd-notes-meta{display:flex;justify-content:space-between;gap:10px;margin-top:6px;font-size:10.5px;color:var(--faint)}
.trd-notes-meta>span:last-child{flex:0 0 auto;font-family:var(--mono);font-variant-numeric:tabular-nums}
.trd-notes-meta .near{color:var(--amber-ink);font-weight:700}
.trd-field-error{display:flex;align-items:center;gap:5px;margin:8px 0 0;font-size:11px;font-weight:700;color:var(--red-ink)}
.trd-field-error.inline{display:inline-flex;margin:0}
.trd-final-warn{text-align:center}
.trd-final-icon{width:54px;height:54px;display:grid;place-items:center;margin:4px auto 10px;border-radius:17px;color:var(--red-ink);background:var(--red-soft);border:1px solid rgba(214,69,69,.24)}
.trd-final-warn h3{margin:0 0 5px;font-size:15px;font-weight:800}
.trd-final-warn p{margin:0 auto 12px;max-width:44ch;font-size:12.5px;line-height:1.5;color:var(--ink2)}
.trd-final-warn .trd-rows{text-align:left}

/* lightbox */
.trd-lightbox{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:56px 12px calc(16px + env(safe-area-inset-bottom,0px));background:rgba(6,10,18,.92);animation:trdFade .2s ease both}
.trd-lightbox figure{margin:0;max-width:100%;max-height:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.trd-lightbox img{display:block;max-width:min(100%,1400px);max-height:calc(100dvh - 120px);width:auto;height:auto;object-fit:contain;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.trd-lightbox figcaption{font-size:12px;color:rgba(255,255,255,.72);text-align:center}
.trd-lightbox-close{position:absolute;top:12px;right:12px;display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border:1px solid rgba(255,255,255,.22);border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font-size:12.5px;font-weight:750}
.trd-lightbox-close:hover{background:rgba(255,255,255,.18)}
.trd-lightbox-close:focus-visible{outline:2px solid #fff;outline-offset:2px}

/* toast */
.trd-toast{position:fixed;z-index:90;left:50%;bottom:calc(88px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:8px;max-width:calc(100% - 28px);padding:10px 14px;border-radius:13px;color:#fff;background:#161d29;font-size:12px;font-weight:650;box-shadow:0 14px 34px rgba(12,22,40,.3);opacity:0;transform:translate(-50%,12px);pointer-events:none;transition:opacity .22s,transform .22s}
.trd-toast.show{opacity:1;transform:translate(-50%,0)}
.trd-toast-icon{display:grid;place-items:center;flex:0 0 auto}
.trd-toast.t-success .trd-toast-icon{color:#4ade80}
.trd-toast.t-error .trd-toast-icon{color:#f87171}
.trd-toast.t-info .trd-toast-icon{color:#fdba74}

/* bottom nav */
.trd-bottomnav{position:fixed;z-index:30;left:50%;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(calc(100% - 16px),540px);height:62px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px;border:1px solid rgba(219,226,236,.9);border-radius:20px;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 12px 32px rgba(20,26,36,.14)}
.trd-navitem{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;padding:0;border:0;border-radius:15px;background:transparent;color:var(--faint);transition:.18s}
.trd-navitem:hover{color:var(--ink2)}
.trd-navitem.active{color:var(--o2);background:linear-gradient(135deg,#fff4ea,#ffe9d6)}
.trd-nav-label{font-size:10px;font-weight:750;white-space:nowrap}

/* animations */
@keyframes trdSpin{to{transform:rotate(360deg)}}
@keyframes trdPing{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.9);opacity:0}}
@keyframes trdBlink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes trdShimmer{to{background-position:-220% 0}}
@keyframes trdRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes trdFade{from{opacity:0}to{opacity:1}}
@keyframes trdSheet{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}
@keyframes trdCritical{0%,100%{box-shadow:0 0 0 0 rgba(214,69,69,0)}50%{box-shadow:0 0 0 5px rgba(214,69,69,.12)}}

/* responsive */
@media(max-width:390px){
  .trd-title{font-size:22px}
  .trd-unit b{min-width:50px;font-size:21px}
  .trd-summary-stats,.trd-rates,.trd-card-actions.two,.trd-decision-actions{grid-template-columns:minmax(0,1fr)}
  .trd-decision-actions .trd-btn-primary{order:-1}
  .trd-row{flex-direction:column;gap:3px}
  .trd-row dt{max-width:none}
  .trd-row dd{text-align:left}
}
@media(max-width:519px){
  .trd-decision-actions .trd-btn-primary{order:-1}
  .trd-decision-actions{grid-template-columns:minmax(0,1fr)}
}
@media(min-width:520px){
  .trd-header-inner,.trd-main{padding-left:20px;padding-right:20px}
  .trd-title{font-size:28px}
  .trd-summary-times{grid-template-columns:repeat(2,minmax(0,1fr))}
  .trd-summary-stats{grid-template-columns:repeat(4,minmax(0,1fr))}
  .trd-overlay{align-items:center;padding:20px}
  .trd-modal{width:min(100%,560px);max-height:min(88dvh,820px);border-radius:22px;box-shadow:var(--shadow-lg);animation:trdPop .26s cubic-bezier(.2,.8,.2,1) both}
  .trd-modal.size-lg{width:min(100%,720px)}
  .trd-modal-head:before{display:none}
  .trd-modal-foot{padding-bottom:12px}
  .trd-modal-foot .trd-btn{flex:0 1 auto}
}
@media(min-width:720px){
  .trd-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .trd-summary-grid{grid-template-columns:minmax(0,1fr) minmax(290px,.95fr);align-items:stretch}
  .trd-summary-times{grid-template-columns:minmax(0,1fr);align-content:center}
  .trd-material-grid{grid-template-columns:minmax(260px,.9fr) minmax(0,1.1fr);align-items:start}
  .trd-material-img{max-height:none;height:100%;min-height:260px}
  .trd-rows.cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
  .trd-rows.cols-2 .trd-row:nth-last-child(2):nth-child(odd){border-bottom:0}
  .trd-decision{flex-direction:row;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px}
  .trd-decision-actions,.trd-decision-final{flex:0 0 auto;min-width:360px}
  .trd-sk.sk-timer{height:auto;min-height:128px}
  .sk-split{grid-template-columns:minmax(0,1fr) minmax(290px,.95fr)}
  .sk-quad{grid-template-columns:repeat(4,minmax(0,1fr))}
  .sk-material{grid-template-columns:minmax(260px,.9fr) minmax(0,1.1fr)}
}
@media(min-width:1024px){
  .trd-title{font-size:30px}
  .trd-unit b{min-width:64px;font-size:27px}
}
@keyframes trdPop{from{transform:translateY(10px) scale(.98);opacity:0}to{transform:none;opacity:1}}
@media(prefers-reduced-motion:reduce){
  .trd-root *,.trd-root *:before,.trd-root *:after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
`;

const CSS_3 = `
/* ===== portal targets (modals / lightbox / toast live on <body>) ===== */
.trd-root-portal{
  --o:#f97316;--o2:#c2560b;--o3:#9a4408;--soft:rgba(249,115,22,.11);--soft2:rgba(249,115,22,.18);
  --amber:#e08b1e;--amber-ink:#a15c07;--amber-soft:rgba(224,139,30,.13);
  --green:#1f9463;--green-ink:#0f7a4c;--green-soft:rgba(31,148,99,.11);
  --red:#d64545;--red-ink:#b42318;--red-soft:rgba(214,69,69,.10);
  --blue:#2563eb;--blue-ink:#175cd3;--blue-soft:rgba(37,99,235,.10);
  --ink:#141a24;--ink2:#3b4658;--muted:#6b7687;--faint:#96a0af;--line:#e9edf3;--line2:#dbe2ec;
  --mono:"SF Mono",ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace;
  --shadow:0 4px 16px rgba(20,26,36,.055),inset 0 1px 0 #fff;
  --shadow-lg:0 18px 44px rgba(20,26,36,.12);
    font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;color:var(--ink)}
.trd-root-portal,.trd-root-portal *{box-sizing:border-box}
.trd-root-portal button,.trd-root-portal input,.trd-root-portal textarea{font:inherit}
.trd-root-portal button{cursor:pointer}
.trd-root-portal button:disabled{cursor:not-allowed}
.trd-root-portal .mono{font-family:var(--mono);letter-spacing:.01em}
.trd-root-portal .trd-missing{color:var(--faint)!important;font-style:italic;font-weight:600!important}
.trd-overlay{z-index:1000}
.trd-lightbox{z-index:1100}
.trd-toast{z-index:1200;bottom:calc(16px + env(safe-area-inset-bottom,0px))}
.trd-modal{max-height:min(90dvh,760px)}
.trd-modal-foot{position:relative;z-index:2;flex:0 0 auto}
.trd-modal-head{flex:0 0 auto}

/* ===== compact, professional density ===== */
.trd-root{padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}
.trd-header-inner{padding:10px 14px}
.trd-iconbtn{width:34px;height:34px;border-radius:10px}
.trd-brand{gap:8px}
.trd-brand>strong{width:32px;height:32px;border-radius:10px;box-shadow:0 4px 10px rgba(249,115,22,.26)}
.trd-brand b{font-size:13.5px;line-height:1.2}
.trd-brand small{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;font-weight:650;letter-spacing:0;text-transform:none;color:var(--muted)}
.trd-main{padding:10px 12px 16px}
.trd-grid{gap:8px}
.trd-card{padding:11px 12px;border-radius:14px}
.trd-card-head{gap:7px;margin-bottom:8px}
.trd-card-head h2{font-size:11px}
.trd-card-icon{width:24px;height:24px;border-radius:8px}
.trd-card-icon svg{width:13px;height:13px}
.trd-kicker{font-size:9px;letter-spacing:.07em}

/* summary */
.trd-summary{padding:11px 12px 11px 15px}
.trd-summary-head{display:none}
.trd-summary-grid{margin-top:0;gap:8px}
.trd-summary-times{gap:6px}
.trd-timechip{gap:8px;padding:7px 9px;border-radius:10px}
.trd-timechip strong{margin-top:1px;font-size:12px}
.trd-timechip-icon{width:26px;height:26px;border-radius:8px}
.trd-timechip-icon svg{width:13px;height:13px}
.trd-summary-stats{gap:6px;margin-top:8px}
.trd-stat{padding:7px 9px;border-radius:10px}
.trd-stat strong{margin-top:2px;font-size:12px}

/* timer */
.trd-timer{padding:9px 10px;border-radius:12px}
.trd-timer.live{box-shadow:none}
.trd-timer-top{min-height:16px}
.trd-timer-flag{padding:2px 6px;font-size:8.5px}
.trd-timer-flag.ended{background:#64748b}
.trd-timer-digits{gap:4px;margin-top:6px}
.trd-timer-digits>i{padding-top:5px;font-size:14px}
.trd-unit{gap:2px}
.trd-unit b{min-width:44px;padding:5px 4px;border-radius:9px;font-size:18px;box-shadow:0 2px 6px rgba(20,26,36,.05),inset 0 -2px 0 var(--lv-soft)}
.trd-unit small{font-size:8px}
.trd-timer-track{height:3px;margin-top:7px}
.trd-timer-foot{margin-top:5px;font-size:10px}
.trd-timer.live.lvl-closed{--lv:#64748b;--lv-ink:#475569;--lv-soft:rgba(100,116,139,.10);border-color:var(--line2);background:#f6f8fb}
.trd-timer.final{gap:9px}
.trd-timer.final strong{font-size:12.5px}
.trd-timer.final small{font-size:10.5px}
.trd-timer-emblem{width:32px;height:32px;border-radius:10px}
.trd-timer-emblem svg{width:17px;height:17px}

/* banner */
.trd-banner{gap:9px;padding:9px 11px;border-radius:12px}
.trd-banner-icon{width:30px;height:30px;border-radius:9px}
.trd-banner-icon svg{width:17px;height:17px}
.trd-banner strong{font-size:12.5px}
.trd-banner p{font-size:11px;margin-top:1px}
.trd-banner-grid{gap:5px;margin-top:6px}
.trd-banner-grid>div{padding:6px 8px;border-radius:8px}
.trd-banner-grid dd{font-size:11.5px}

/* material */
.trd-material{padding:11px 12px}
.trd-material-grid{grid-template-columns:96px minmax(0,1fr);gap:10px;align-items:start}
.trd-material-img{aspect-ratio:1/1;max-height:none;border-radius:11px}
.trd-material-img .trd-img-badge,.trd-material-img .trd-img-hover span{display:none}
.trd-material-img .trd-img-hover{right:5px;bottom:5px;padding:4px;border-radius:7px}
.trd-material-img .trd-img-fallback b{font-size:9.5px}
.trd-material-img .trd-img-fallback svg{width:18px;height:18px}
.trd-material-info{gap:7px}
.trd-material-name strong{font-size:14px}
.trd-typechip{padding:2px 7px;font-size:9px}
.trd-qty{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 9px;border-radius:10px}
.trd-qty strong{margin-top:0;gap:4px}
.trd-qty strong b{font-size:17px}
.trd-qty strong span{font-size:11.5px}
.trd-rates{gap:6px}
.trd-rate{padding:6px 8px;border-radius:9px}
.trd-rate strong{margin-top:2px;font-size:12px}
.trd-rate.primary strong{font-size:13px}
.trd-codechip{padding:3px 7px;font-size:9.5px}

/* rows */
.trd-rows{margin-top:6px}
.trd-row{gap:10px;padding:6px 1px}
.trd-row dt{gap:5px;font-size:11px}
.trd-row dd{font-size:11.5px}
.trd-rows.boxed{padding:1px 10px;border-radius:11px}

/* parties */
.trd-identity{gap:10px;padding:8px 9px;border-radius:11px}
.trd-avatar{width:36px;height:36px;border-radius:11px;box-shadow:0 4px 10px rgba(249,115,22,.24)}
.trd-avatar svg{width:16px;height:16px}
.trd-avatar em{right:-5px;bottom:-5px;min-width:18px;height:15px;font-size:8px;border-radius:5px}
.trd-avatar.lg{width:42px;height:42px}
.trd-linkname{font-size:13.5px}
.trd-identity-meta{gap:5px;margin-top:3px}
.trd-idtag{padding:2px 6px;font-size:10px;border-radius:6px}
.trd-owner{font-size:10.5px}
.trd-context{padding:2px 7px;font-size:9px}
.trd-pickup{gap:8px;margin-top:8px;padding:8px 9px;border-radius:11px}
.trd-pickup-pin{width:26px;height:26px;border-radius:8px}
.trd-pickup p{margin-top:1px;font-size:12px}
.trd-verify{padding:3px 7px;font-size:9.5px}
.trd-verifies{margin-top:7px}

/* buttons */
.trd-btn{min-height:38px;padding:0 13px;gap:6px;border-radius:10px;font-size:12px}
.trd-btn.sm{min-height:30px}
.trd-btn.lg{min-height:42px;padding:0 16px;font-size:13px;border-radius:11px}
.trd-btn.wide{margin-top:8px}
.trd-card-actions{gap:6px;margin-top:9px}
.trd-hint{font-size:10px}

/* decision bar — sticks to the bottom now that the nav is removed */
.trd-decision{gap:9px;padding:11px 12px;border-radius:14px;box-shadow:0 8px 24px rgba(20,26,36,.10)}
.trd-decision.sticky{bottom:calc(8px + env(safe-area-inset-bottom,0px))}
.trd-decision h2{font-size:13px}
.trd-decision-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.trd-decision-actions .trd-btn-primary{order:0}
.trd-decision-final{min-height:40px;font-size:12px;border-radius:10px}

/* warnings */
.trd-warn{margin-bottom:8px;padding:8px 10px;border-radius:11px}
.trd-refreshing{margin-bottom:8px}

/* modals */
.trd-modal-head{gap:9px;padding:13px 14px 10px}
.trd-modal-icon{width:32px;height:32px;border-radius:10px}
.trd-modal-icon svg{width:16px;height:16px}
.trd-modal-titles h2{font-size:14.5px}
.trd-modal-titles p{font-size:11px}
.trd-modal-close{width:32px;height:32px;border-radius:9px}
.trd-modal-body{padding:11px 14px 12px}
.trd-modal-foot{gap:8px;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px))}
.trd-modal-foot .trd-btn{flex:1 1 0}
.trd-modal-hero{gap:10px;margin-bottom:10px;padding:9px 10px;border-radius:12px}
.trd-modal-hero strong{font-size:14px}
.trd-section-label{margin:10px 2px 5px;font-size:9.5px}
.trd-modal-lead{margin:0 0 9px;font-size:12px}
.trd-confirm-timer{margin-bottom:9px;padding:8px 10px;border-radius:10px;font-size:11.5px}
.trd-confirm-timer b{font-size:12.5px}
.trd-confirm-note{margin-top:9px;padding:8px 10px;border-radius:10px;font-size:11px}
.trd-inline-error{margin-top:9px;padding:8px 10px;border-radius:10px;font-size:11.5px}
.trd-reasons{gap:6px}
.trd-reason{gap:9px;padding:9px 10px;border-radius:11px}
.trd-reason-icon{width:28px;height:28px;border-radius:9px}
.trd-reason-text b{font-size:12.5px}
.trd-reason-text small{font-size:10.5px}
.trd-reason-radio{width:18px;height:18px}
.trd-reason-radio i{width:8px;height:8px}
.trd-notes{margin-top:9px}
.trd-notes label{margin-bottom:4px;font-size:11.5px}
.trd-notes textarea{min-height:72px;padding:8px 10px;border-radius:10px;font-size:12px}
.trd-ref-code{padding:8px 10px;border-radius:10px}
.trd-privacy{margin-top:9px;padding:8px 10px;border-radius:10px;font-size:10.5px}

@media(max-width:390px){
  .trd-summary-stats,.trd-rates{grid-template-columns:repeat(2,minmax(0,1fr))}
  .trd-decision-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
  .trd-row{flex-direction:row;gap:8px}
  .trd-row dd{text-align:right}
  .trd-unit b{min-width:40px;font-size:17px}
}
@media(max-width:519px){
  .trd-decision-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(min-width:520px){
  .trd-header-inner,.trd-main{padding-left:18px;padding-right:18px}
  .trd-modal-foot .trd-btn{flex:0 1 auto;min-width:130px}
}
@media(min-width:720px){
  .trd-grid{gap:10px}
  .trd-material-grid{grid-template-columns:150px minmax(0,1fr)}
  .trd-material-img{min-height:0;height:auto}
  .trd-decision{padding:11px 14px}
  .trd-decision-actions,.trd-decision-final{min-width:300px}
}
`;
