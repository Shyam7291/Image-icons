import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  getAdminBuyerVerification,
  getAdminBuyerVerificationImageUrl,
  verifyAdminBuyerBusiness,
  requestAdminBuyerResubmission,
  rejectAdminBuyerVerification,
  getAdminBuyerVerificationHistory,
} from "../api/adminApi";

// ============================================================================
// STONERATE ADMIN — BUYER BUSINESS VERIFICATION REVIEW
// File: StoneRateAdminBuyerVerification.js
// Route: adminBuyerVerification
// Theme reference: StoneRateAdminUsersPartners.js
// ----------------------------------------------------------------------------
// Lets an authorized Admin review a Buyer's business-verification submission:
// Aadhaar status, live shop-front photo, live selfie, captured coordinates,
// location evidence, and record a Verify / Request Resubmission / Reject
// decision with mandatory notes and an immutable review history.
// ============================================================================

/**
 * Icon system (matches the stroke / viewBox conventions of the directory page).
 */
function Icon({ name, size = 18, className = "" }) {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const p = {
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h10" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    shieldCheck: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
    selfie: (
      <>
        <circle cx="12" cy="9" r="3.2" />
        <path d="M6 20a6 6 0 0 1 12 0" />
        <rect x="3" y="3" width="18" height="18" rx="3" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    navigation: (
      <>
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </>
    ),
    zoomIn: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
      </>
    ),
    zoomOut: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5M8 11h6" />
      </>
    ),
    maximize: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
      </>
    ),
    expand: (
      <>
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12 2.5 2.5L16 9" />
      </>
    ),
    close: <path d="m7 7 10 10M17 7 7 17" />,
    minus: <path d="M5 12h14" />,
    alert: (
      <>
        <path d="M12 3 3 20h18L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),
    history: (
      <>
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    note: (
      <>
        <path d="M4 4a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    gauge: (
      <>
        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="m13.4 10.6 3.6-3.6" />
        <path d="M4 18a8 8 0 1 1 16 0" />
      </>
    ),
    id: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="8" cy="12" r="2.4" />
        <path d="M13 10h5M13 14h3" />
      </>
    ),
    compare: (
      <>
        <path d="M3 6h7M3 18h7M17 3v18" />
        <path d="m14 7 3-3 3 3M14 17l3 3 3-3" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return <svg {...c}>{p[name] || p.shield}</svg>;
}

/**
 * Formatting + derivation helpers
 */
const formatDateTime = (iso) => {
  if (!iso) return "Not available";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Not available";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Not available";
  }
};

const formatDate = (iso) => {
  if (!iso) return "Not available";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Not available";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Not available";
  }
};

const getInitials = (name) => {
  if (!name) return "SR";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const titleCase = (str) =>
  String(str || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

// Coordinate presentation — never render undefined / null / 0,0 as a real value.
const hasValidCoords = (lat, lng) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  !(lat === 0 && lng === 0) &&
  !isNaN(lat) &&
  !isNaN(lng);

// Accuracy classification (configurable thresholds, product-design defaults).
const classifyAccuracy = (meters) => {
  if (meters == null || isNaN(meters)) {
    return { label: "Unknown", tone: "slate", desc: "Accuracy not reported" };
  }
  if (meters <= 25) {
    return { label: "High Accuracy", tone: "green", desc: "Up to 25 metres" };
  }
  if (meters <= 100) {
    return { label: "Moderate Accuracy", tone: "amber", desc: "26 to 100 metres" };
  }
  return { label: "Low Accuracy", tone: "red", desc: "More than 100 metres" };
};

// Map the business-verification status to a presentational badge tone.
const VERIFICATION_STATUS = {
  verified: { label: "Verified", tone: "green" },
  under_review: { label: "Under Review", tone: "amber" },
  resubmission_required: { label: "Resubmission Required", tone: "amber" },
  rejected: { label: "Rejected", tone: "red" },
  not_submitted: { label: "Not Submitted", tone: "slate" },
};

const RESUBMISSION_REASONS = [
  { key: "shop_hoarding_not_visible", label: "Shop hoarding is not visible" },
  { key: "shop_name_not_readable", label: "Shop name is not readable" },
  { key: "shop_name_not_matching", label: "Shop name does not match registration" },
  { key: "selfie_background_unclear", label: "Selfie background is unclear" },
  { key: "selfie_quality_insufficient", label: "Selfie quality is insufficient" },
  { key: "location_not_captured", label: "Location was not captured" },
  { key: "location_accuracy_poor", label: "Location accuracy is poor" },
  { key: "locations_inconsistent", label: "Shop and selfie locations appear inconsistent" },
  { key: "aadhaar_incomplete", label: "Aadhaar verification is incomplete" },
  { key: "other", label: "Other" },
];

const REPLACE_COMPONENTS = [
  { key: "shop_photo", label: "Shop photo" },
  { key: "selfie_photo", label: "Selfie with shop" },
  { key: "location", label: "Location" },
  { key: "aadhaar", label: "Aadhaar verification" },
  { key: "business_info", label: "Registered business information" },
];

const REJECTION_REASONS = [
  { key: "business_information_inconsistent", label: "Business information is inconsistent" },
  { key: "evidence_insufficient", label: "Submitted evidence is insufficient" },
  { key: "suspected_misrepresentation", label: "Suspected misrepresentation" },
  { key: "duplicate_or_fraudulent", label: "Duplicate or fraudulent submission" },
  { key: "other", label: "Other" },
];

const NOTE_MIN = 10;
const NOTE_MAX = 1500;

/**
 * Tone-aware status badge (text + colour — never colour alone, per a11y rules).
 */
function StatusBadge({ tone = "slate", children, icon }) {
  return (
    <span className={`bv-badge tone-${tone}`}>
      {icon && <Icon name={icon} size={13} />}
      <span>{children}</span>
    </span>
  );
}

/**
 * Compact eyebrow + value stat line used across info cards.
 */
function DataLine({ label, value, mono = false, children }) {
  return (
    <div className="bv-data-line">
      <span className="bv-data-label">{label}</span>
      {children ? (
        <span className="bv-data-value">{children}</span>
      ) : (
        <span className={`bv-data-value${mono ? " mono" : ""}`}>
          {value != null && value !== "" ? value : "Not available"}
        </span>
      )}
    </div>
  );
}

/**
 * Review checklist with three accessible states: Confirmed / Unclear / Not Confirmed.
 */
const CHECK_OPTIONS = [
  { key: "confirmed", label: "Confirmed", tone: "green" },
  { key: "unclear", label: "Unclear", tone: "amber" },
  { key: "not_confirmed", label: "Not Confirmed", tone: "red" },
];

function ReviewChecklist({ items, values, onChange, idPrefix }) {
  return (
    <ul className="bv-checklist" aria-label="Admin review checklist">
      {items.map((item) => {
        const current = values[item.key] || "";
        return (
          <li key={item.key} className="bv-check-row">
            <span className="bv-check-text" id={`${idPrefix}-${item.key}`}>
              {item.label}
            </span>
            <div
              className="bv-check-options"
              role="radiogroup"
              aria-labelledby={`${idPrefix}-${item.key}`}
            >
              {CHECK_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={current === opt.key}
                  className={`bv-check-pill tone-${opt.tone} ${
                    current === opt.key ? "active" : ""
                  }`}
                  onClick={() => onChange(item.key, opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Secure image viewer card with zoom, fit-to-screen, and full-view controls.
 * Uses short-lived signed URLs only; never renders a public download button.
 */
function EvidenceImageCard({
  title,
  eyebrow,
  icon,
  imageUrl,
  imageState, // "idle" | "loading" | "loaded" | "error" | "missing"
  alt,
  metadata,
  qualityWarning,
  onLoadImage,
  onRetry,
  onOpenFull,
}) {
  const [zoom, setZoom] = useState(1);

  const resetZoom = () => setZoom(1);
  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));

  return (
    <article className="bv-card bv-evidence-card">
      <div className="bv-card-head">
        <div className="bv-card-head-text">
          <span className="bv-eyebrow">{eyebrow}</span>
          <h3 className="bv-card-title">
            <Icon name={icon} size={17} />
            {title}
          </h3>
        </div>
        {metadata?.imageStatus && (
          <StatusBadge tone={metadata.imageStatus.tone} icon={metadata.imageStatus.icon}>
            {metadata.imageStatus.label}
          </StatusBadge>
        )}
      </div>

      <div className="bv-image-stage">
        {imageState === "loaded" && imageUrl ? (
          <div className="bv-image-frame">
            <img
              src={imageUrl}
              alt={alt}
              className="bv-evidence-img"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
            <div className="bv-image-toolbar">
              <button type="button" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
                <Icon name="zoomOut" size={16} />
              </button>
              <span className="bv-zoom-level">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
                <Icon name="zoomIn" size={16} />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                aria-label="Fit to screen"
                title="Fit to screen"
              >
                <Icon name="maximize" size={16} />
              </button>
              <button
                type="button"
                onClick={() => onOpenFull?.(imageUrl)}
                aria-label="Open full image"
                title="Open full image"
              >
                <Icon name="expand" size={16} />
              </button>
            </div>
            {metadata?.captureBadge && (
              <span className="bv-capture-badge">
                <Icon name="camera" size={12} />
                {metadata.captureBadge}
              </span>
            )}
          </div>
        ) : imageState === "loading" ? (
          <div className="bv-image-placeholder">
            <span className="bv-spinner lg" />
            <p>Loading secure image…</p>
          </div>
        ) : imageState === "error" ? (
          <div className="bv-image-placeholder error">
            <Icon name="alert" size={26} />
            <p>This verification image could not be loaded securely.</p>
            <button type="button" className="bv-btn bv-btn-ghost" onClick={onRetry}>
              <Icon name="refresh" size={14} />
              <span>Retry Image</span>
            </button>
          </div>
        ) : imageState === "missing" ? (
          <div className="bv-image-placeholder">
            <Icon name="camera" size={26} />
            <p>No image was submitted for this evidence.</p>
          </div>
        ) : (
          <div className="bv-image-placeholder">
            <Icon name="lock" size={24} />
            <p>This image is stored privately and loads on demand.</p>
            <button type="button" className="bv-btn bv-btn-secondary" onClick={onLoadImage}>
              <Icon name="eye" size={14} />
              <span>Load Secure Image</span>
            </button>
          </div>
        )}
      </div>

      {qualityWarning && (
        <div className="bv-inline-warn">
          <Icon name="alert" size={14} />
          <span>{qualityWarning}</span>
        </div>
      )}

      {metadata?.rows && (
        <div className="bv-meta-grid">
          {metadata.rows.map((row) => (
            <DataLine key={row.label} label={row.label} value={row.value} mono={row.mono} />
          ))}
        </div>
      )}
    </article>
  );
}

/**
 * Accessible modal — focus trapped, Escape closes non-final dialogs,
 * scrolls internally on small screens.
 */
function Modal({ open, title, onClose, closeOnEsc = true, children, footer, tone = "neutral" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    // Lock background scroll only while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape" && closeOnEsc) {
        onClose?.();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    const t = setTimeout(() => {
      const firstBtn = panelRef.current?.querySelector("button, input, textarea");
      firstBtn?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  return (
    <div className="bv-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeOnEsc && onClose?.()}>
      <div
        className={`bv-modal-panel tone-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        <div className="bv-modal-head">
          <h3 className="bv-modal-title">{title}</h3>
          <button type="button" className="bv-modal-close" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="bv-modal-body">{children}</div>
        {footer && <div className="bv-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Lightweight skeleton block for loading states.
 */
function Skeleton({ h = 14, w = "100%", r = 8, style }) {
  return <span className="bv-skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StoneRateAdminBuyerVerification({
  buyerPublicId,
  selectedBuyer,
  currentAdmin,
  onBack,
  onVerificationUpdated,
  onNavigateToBuyerDetails,
}) {
  const publicId = buyerPublicId || selectedBuyer?.publicId || "";

  // Core data state
  const [verification, setVerification] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState("");

  // Secure image state (URL loaded on demand via signed URL).
  const [shopImage, setShopImage] = useState({ state: "idle", url: "" });
  const [selfieImage, setSelfieImage] = useState({ state: "idle", url: "" });
  const [fullImage, setFullImage] = useState(null);

  // Review working state
  const [shopChecklist, setShopChecklist] = useState({});
  const [selfieChecklist, setSelfieChecklist] = useState({});
  const [adminNote, setAdminNote] = useState("");

  // Decision modals
  const [activeModal, setActiveModal] = useState(null); // "verify" | "resubmit" | "reject"
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState("");

  // Resubmission working state
  const [resubReasons, setResubReasons] = useState([]);
  const [resubReplace, setResubReplace] = useState([]);
  // Rejection working state
  const [rejectReasons, setRejectReasons] = useState([]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  // --- Data loading --------------------------------------------------------
  const loadVerification = useCallback(
    async (isRefresh = false) => {
      if (!publicId) {
        setLoadError("No Buyer was selected for verification review.");
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const res = await getAdminBuyerVerification({ buyerPublicId: publicId });
        if (res && res.success) {
          setVerification(res.verification || null);
        } else {
          setLoadError("Unable to load Buyer verification.");
        }
      } catch (err) {
        setLoadError(err.message || "Unable to load Buyer verification.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [publicId]
  );

  const loadHistory = useCallback(async () => {
    if (!publicId) return;
    try {
      const res = await getAdminBuyerVerificationHistory({ buyerPublicId: publicId });
      if (res && res.success) setHistory(res.history || []);
    } catch {
      // History is non-blocking; keep page usable.
      setHistory([]);
    }
  }, [publicId]);

  useEffect(() => {
    loadVerification(false);
    loadHistory();
  }, [loadVerification, loadHistory]);

  // --- Secure image loading (signed URL on demand) -------------------------
  const loadSecureImage = useCallback(
    async (imageType) => {
      const setter = imageType === "shop" ? setShopImage : setSelfieImage;
      setter({ state: "loading", url: "" });
      try {
        const res = await getAdminBuyerVerificationImageUrl({
          buyerPublicId: publicId,
          imageType,
        });
        if (res && res.success && res.signedUrl) {
          setter({ state: "loaded", url: res.signedUrl });
        } else {
          setter({ state: "error", url: "" });
        }
      } catch {
        setter({ state: "error", url: "" });
      }
    },
    [publicId]
  );

  // --- Derived values ------------------------------------------------------
  const buyer = verification?.buyer || selectedBuyer || {};
  const aadhaar = verification?.aadhaar || {};
  const shopPhoto = verification?.shopPhoto || {};
  const selfiePhoto = verification?.selfiePhoto || {};
  const locationComparison = verification?.locationComparison || {};

  const vStatus =
    VERIFICATION_STATUS[verification?.status] ||
    VERIFICATION_STATUS.not_submitted;

  const hasSubmission = Boolean(
    verification && verification.status && verification.status !== "not_submitted"
  );

  const progressCards = useMemo(() => {
    const shopAcc = classifyAccuracy(shopPhoto.accuracyMeters);
    return [
      {
        key: "aadhaar",
        label: "AADHAAR",
        icon: "shieldCheck",
        status: aadhaar.verified ? "Verified" : "Not Verified",
        tone: aadhaar.verified ? "green" : "red",
        desc: aadhaar.verified
          ? "Identity verification completed"
          : "Identity not yet verified",
      },
      {
        key: "shop",
        label: "SHOP PHOTO",
        icon: "camera",
        status: shopPhoto.privateObjectKey || shopPhoto.signedViewUrl ? "Submitted" : "Missing",
        tone: shopPhoto.privateObjectKey || shopPhoto.signedViewUrl ? "green" : "slate",
        desc: shopPhoto.captureMethod ? titleCase(shopPhoto.captureMethod) : "Awaiting upload",
      },
      {
        key: "selfie",
        label: "SELFIE WITH SHOP",
        icon: "selfie",
        status: selfiePhoto.privateObjectKey || selfiePhoto.signedViewUrl ? "Submitted" : "Missing",
        tone: selfiePhoto.privateObjectKey || selfiePhoto.signedViewUrl ? "green" : "slate",
        desc: selfiePhoto.captureMethod ? titleCase(selfiePhoto.captureMethod) : "Awaiting upload",
      },
      {
        key: "location",
        label: "LOCATION",
        icon: "pin",
        status: hasValidCoords(shopPhoto.latitude, shopPhoto.longitude)
          ? "Captured"
          : "Not Available",
        tone: hasValidCoords(shopPhoto.latitude, shopPhoto.longitude) ? "green" : "slate",
        desc: hasValidCoords(shopPhoto.latitude, shopPhoto.longitude)
          ? `Accuracy: ${shopPhoto.accuracyMeters ?? "?"} metres`
          : "No coordinates captured",
      },
    ];
  }, [aadhaar, shopPhoto, selfiePhoto]);

  // --- Action helpers ------------------------------------------------------
  const openMapsFor = (lat, lng) => {
    if (!hasValidCoords(lat, lng)) {
      showToast("Coordinates are not available for navigation.");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const noteLen = adminNote.trim().length;
  const noteValid = noteLen >= NOTE_MIN && noteLen <= NOTE_MAX;

  const closeModals = () => {
    if (processing) return;
    setActiveModal(null);
    setActionError("");
  };

  const toggleFromList = (list, setList, key) => {
    setList((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const afterDecision = (updatedVerification, message) => {
    if (updatedVerification) setVerification(updatedVerification);
    setActiveModal(null);
    setProcessing(false);
    setActionError("");
    setAdminNote("");
    loadHistory();
    showToast(message);
    onVerificationUpdated?.(updatedVerification);
  };

  const handleVerify = async () => {
    setProcessing(true);
    setActionError("");
    try {
      const res = await verifyAdminBuyerBusiness({
        buyerPublicId: publicId,
        note: adminNote.trim(),
        checklist: {
          shopVisible: shopChecklist.shop_frontage_visible === "confirmed",
          shopNameReadable: shopChecklist.shop_name_readable === "confirmed",
          shopNameConsistent: shopChecklist.shop_name_matches === "confirmed",
          selfieWithShopClear: selfieChecklist.selfie_shop_visible === "confirmed",
          locationReviewed: true,
        },
      });
      if (res && res.success) {
        afterDecision(res.verification, "Buyer business verified");
      } else {
        setActionError("Unable to save the verification decision.");
        setProcessing(false);
      }
    } catch (err) {
      setActionError(err.message || "Unable to save the verification decision.");
      setProcessing(false);
    }
  };

  const handleResubmission = async () => {
    if (resubReasons.length === 0) {
      setActionError("Select at least one reason for resubmission.");
      return;
    }
    if (!noteValid) {
      setActionError(`A note of ${NOTE_MIN}–${NOTE_MAX} characters is required.`);
      return;
    }
    setProcessing(true);
    setActionError("");
    try {
      const res = await requestAdminBuyerResubmission({
        buyerPublicId: publicId,
        reasons: resubReasons,
        replace: resubReplace,
        note: adminNote.trim(),
      });
      if (res && res.success) {
        afterDecision(res.verification, "Resubmission requested");
        setResubReasons([]);
        setResubReplace([]);
      } else {
        setActionError("Unable to save the verification decision.");
        setProcessing(false);
      }
    } catch (err) {
      setActionError(err.message || "Unable to save the verification decision.");
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (rejectReasons.length === 0) {
      setActionError("Select a rejection reason.");
      return;
    }
    if (!noteValid) {
      setActionError(`A note of ${NOTE_MIN}–${NOTE_MAX} characters is required.`);
      return;
    }
    setProcessing(true);
    setActionError("");
    try {
      const res = await rejectAdminBuyerVerification({
        buyerPublicId: publicId,
        reasons: rejectReasons,
        note: adminNote.trim(),
      });
      if (res && res.success) {
        afterDecision(res.verification, "Verification rejected");
        setRejectReasons([]);
      } else {
        setActionError("Unable to save the verification decision.");
        setProcessing(false);
      }
    } catch (err) {
      setActionError(err.message || "Unable to save the verification decision.");
      setProcessing(false);
    }
  };

  // Image metadata builders -------------------------------------------------
  const buildImageMeta = (photo, submitted) => {
    const acc = classifyAccuracy(photo.accuracyMeters);
    return {
      imageStatus: submitted
        ? { label: "Submitted", tone: "green", icon: "check" }
        : { label: "Missing", tone: "slate" },
      captureBadge: photo.captureMethod ? titleCase(photo.captureMethod) : null,
      rows: [
        { label: "Capture Method", value: photo.captureMethod ? titleCase(photo.captureMethod) : "Not available" },
        { label: "Captured", value: formatDateTime(photo.capturedAt) },
        { label: "Location", value: hasValidCoords(photo.latitude, photo.longitude) ? "Captured" : "Not captured" },
        {
          label: "Location Accuracy",
          value: photo.accuracyMeters != null ? `${photo.accuracyMeters} metres (${acc.label})` : "Not available",
        },
      ],
    };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="bv-root">
      <style>{BV_CSS}</style>

      {/* Ambient background glows (matches directory theme) */}
      <div className="bv-bg" aria-hidden="true">
        <i className="bv-grid" />
        <b className="bv-orb orange" />
        <span className="bv-orb blue" />
        <em className="bv-orb teal" />
      </div>

      {/* ---------------------------------------------------------------- HEADER */}
      <header className="bv-header">
        <div className="bv-container">
          <div className="bv-header-row">
            <button
              type="button"
              className="bv-icon-btn"
              onClick={() => onBack?.()}
              aria-label="Back"
              title="Back"
            >
              <Icon name="back" size={18} />
            </button>

            <div className="bv-header-brand">
              <strong className="bv-brand-mark">
                <Icon name="shieldCheck" size={18} />
              </strong>
              <div className="bv-brand-text">
                <span className="bv-eyebrow">BUYER BUSINESS VERIFICATION</span>
                <h1 className="bv-brand-title">Review Verification</h1>
              </div>
            </div>

            <div className="bv-header-actions">
              {publicId && <span className="bv-id-pill">{publicId}</span>}
              <StatusBadge tone={vStatus.tone} icon="shield">
                {vStatus.label.toUpperCase()}
              </StatusBadge>
              <button
                type="button"
                className="bv-icon-btn"
                onClick={() => loadVerification(true)}
                aria-label="Refresh"
                title="Refresh"
                disabled={refreshing}
              >
                {refreshing ? <span className="bv-spinner" /> : <Icon name="refresh" size={17} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="bv-container bv-main">
        {loadError ? (
          /* ---------------------------------------------------- PROFILE ERROR */
          <div className="bv-state-card">
            <div className="bv-state-icon error">
              <Icon name="alert" size={28} />
            </div>
            <h3 className="bv-state-title">Unable to load Buyer verification</h3>
            <p className="bv-state-desc">{loadError}</p>
            <button type="button" className="bv-btn bv-btn-secondary" onClick={() => loadVerification(false)}>
              <Icon name="refresh" size={15} />
              <span>Retry</span>
            </button>
          </div>
        ) : loading ? (
          /* --------------------------------------------------------- SKELETON */
          <div className="bv-skeleton-stack">
            <Skeleton h={140} r={18} />
            <div className="bv-progress-grid">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} h={108} r={16} />
              ))}
            </div>
            <div className="bv-two-col">
              <Skeleton h={360} r={18} />
              <Skeleton h={360} r={18} />
            </div>
            <Skeleton h={200} r={18} />
          </div>
        ) : (
          <>
            {/* ------------------------------------------------- BUYER HERO */}
            <section className="bv-card bv-hero">
              <div className="bv-hero-main">
                <div className="bv-hero-avatar">{getInitials(buyer.name)}</div>
                <div className="bv-hero-identity">
                  <span className="bv-eyebrow blue">BUYER</span>
                  <h2 className="bv-hero-name">{buyer.name || "Unknown Buyer"}</h2>
                  {buyer.shopName && (
                    <p className="bv-hero-business">
                      <Icon name="building" size={14} />
                      {buyer.shopName}
                    </p>
                  )}
                </div>
              </div>

              <div className="bv-hero-grid">
                <DataLine label="Buyer ID" value={publicId} mono />
                <DataLine label="Primary Mobile" value={buyer.phone} />
                <DataLine
                  label="Registered Location"
                  value={
                    buyer.city
                      ? `${buyer.city}${buyer.state ? ", " + buyer.state : ""}`
                      : buyer.state || "Not available"
                  }
                />
                <DataLine label="Joined" value={formatDate(buyer.joinedAt)} />
                <DataLine label="Account Status">
                  <StatusBadge
                    tone={buyer.accountStatus === "active" ? "green" : "slate"}
                  >
                    {titleCase(buyer.accountStatus || "Unknown")}
                  </StatusBadge>
                </DataLine>
                <DataLine label="Business Verification">
                  <StatusBadge tone={vStatus.tone}>{vStatus.label}</StatusBadge>
                </DataLine>
              </div>
            </section>

            {/* ----------------------------------------- NO SUBMISSION EMPTY */}
            {!hasSubmission ? (
              <div className="bv-state-card">
                <div className="bv-state-icon">
                  <Icon name="camera" size={28} />
                </div>
                <h3 className="bv-state-title">No verification submitted</h3>
                <p className="bv-state-desc">
                  Buyer has not submitted business-verification evidence. Missing: shop-front
                  photograph, selfie with shop, and captured location.
                </p>
                {onNavigateToBuyerDetails && (
                  <button
                    type="button"
                    className="bv-btn bv-btn-secondary"
                    onClick={() => onNavigateToBuyerDetails(publicId)}
                  >
                    <Icon name="user" size={15} />
                    <span>Open Buyer Details</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* --------------------------------- PROGRESS SUMMARY CARDS */}
                <section className="bv-progress-grid" aria-label="Verification progress">
                  {progressCards.map((card) => (
                    <article key={card.key} className={`bv-progress-card tone-${card.tone}`}>
                      <div className="bv-progress-top">
                        <span className="bv-progress-icon">
                          <Icon name={card.icon} size={18} />
                        </span>
                        <span className="bv-eyebrow">{card.label}</span>
                      </div>
                      <strong className="bv-progress-status">{card.status}</strong>
                      <span className="bv-progress-desc">{card.desc}</span>
                    </article>
                  ))}
                </section>

                {/* ------------------------------------- AADHAAR CARD */}
                <section className="bv-card">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">AADHAAR IDENTITY VERIFICATION</span>
                      <h3 className="bv-card-title">
                        <Icon name="lock" size={17} />
                        Aadhaar Verification
                      </h3>
                    </div>
                    <StatusBadge tone={aadhaar.verified ? "green" : "red"} icon={aadhaar.verified ? "check" : "alert"}>
                      {aadhaar.verified ? "Verified" : "Not Verified"}
                    </StatusBadge>
                  </div>

                  {aadhaar.verified ? (
                    <div className="bv-meta-grid">
                      <DataLine label="Aadhaar" value={aadhaar.last4 ? `XXXX XXXX ${aadhaar.last4}` : "Masked"} mono />
                      <DataLine label="Verification Method" value={titleCase(aadhaar.verificationMethod)} />
                      <DataLine label="Name Match" value={aadhaar.nameMatch ? "Successful" : "Not confirmed"} />
                      <DataLine label="Verified" value={formatDateTime(aadhaar.verifiedAt)} />
                      <DataLine label="Provider Reference" value={aadhaar.providerReference} mono />
                    </div>
                  ) : (
                    <div className="bv-inline-warn">
                      <Icon name="alert" size={15} />
                      <span>
                        Aadhaar verification has not been completed. It can only be marked verified when
                        the approved provider returns a successful result.
                      </span>
                    </div>
                  )}
                </section>

                {/* ------------------------- TWO-COLUMN EVIDENCE GRID */}
                <section className="bv-two-col">
                  <div className="bv-evidence-column">
                    <EvidenceImageCard
                      eyebrow="SHOP-FRONT EVIDENCE"
                      title="Shop-Front Photograph"
                      icon="camera"
                      imageUrl={shopImage.url}
                      imageState={
                        shopPhoto.privateObjectKey || shopPhoto.signedViewUrl
                          ? shopImage.state === "idle"
                            ? "idle"
                            : shopImage.state
                          : "missing"
                      }
                      alt="Buyer-submitted shop-front photograph showing storefront and hoarding"
                      metadata={buildImageMeta(shopPhoto, !!(shopPhoto.privateObjectKey || shopPhoto.signedViewUrl))}
                      qualityWarning={shopPhoto.qualityWarning}
                      onLoadImage={() => loadSecureImage("shop")}
                      onRetry={() => loadSecureImage("shop")}
                      onOpenFull={(url) => setFullImage({ url, alt: "Shop-front photograph" })}
                    />
                    <div className="bv-card bv-checklist-card">
                      <span className="bv-eyebrow">ADMIN REVIEW CHECKLIST</span>
                      <ReviewChecklist
                        idPrefix="shop"
                        values={shopChecklist}
                        onChange={(k, v) => setShopChecklist((p) => ({ ...p, [k]: v }))}
                        items={[
                          { key: "shop_frontage_visible", label: "Shop frontage is clearly visible" },
                          { key: "shop_name_readable", label: "Shop name or hoarding is readable" },
                          { key: "shop_name_matches", label: "Shop name matches the registered business name" },
                          { key: "photo_current", label: "The photograph appears current" },
                          { key: "sufficient_context", label: "The image provides sufficient business context" },
                          { key: "no_inconsistency", label: "No major inconsistency is visible" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="bv-evidence-column">
                    <EvidenceImageCard
                      eyebrow="SELFIE WITH SHOP EVIDENCE"
                      title="Selfie With Shop"
                      icon="selfie"
                      imageUrl={selfieImage.url}
                      imageState={
                        selfiePhoto.privateObjectKey || selfiePhoto.signedViewUrl
                          ? selfieImage.state === "idle"
                            ? "idle"
                            : selfieImage.state
                          : "missing"
                      }
                      alt="Buyer-submitted selfie with shop hoarding in background"
                      metadata={buildImageMeta(selfiePhoto, !!(selfiePhoto.privateObjectKey || selfiePhoto.signedViewUrl))}
                      qualityWarning={selfiePhoto.qualityWarning}
                      onLoadImage={() => loadSecureImage("selfie")}
                      onRetry={() => loadSecureImage("selfie")}
                      onOpenFull={(url) => setFullImage({ url, alt: "Selfie with shop hoarding" })}
                    />
                    <div className="bv-card bv-checklist-card">
                      <span className="bv-eyebrow">SELFIE REVIEW CHECKLIST</span>
                      <ReviewChecklist
                        idPrefix="selfie"
                        values={selfieChecklist}
                        onChange={(k, v) => setSelfieChecklist((p) => ({ ...p, [k]: v }))}
                        items={[
                          { key: "live_camera", label: "Selfie was captured using the live camera flow" },
                          { key: "selfie_shop_visible", label: "Shop hoarding is visible in the background" },
                          { key: "name_consistent", label: "Shop name appears consistent with the registered shop" },
                          { key: "quality_sufficient", label: "Image quality is sufficient for review" },
                          { key: "no_mismatch", label: "No obvious upload mismatch is present" },
                          { key: "no_additional", label: "Additional verification is not required" },
                        ]}
                      />
                    </div>
                  </div>
                </section>

                {/* --------------------------------- LOCATION EVIDENCE */}
                <section className="bv-card">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">CAPTURED LOCATION EVIDENCE</span>
                      <h3 className="bv-card-title">
                        <Icon name="pin" size={17} />
                        Location Evidence
                      </h3>
                    </div>
                  </div>

                  {hasValidCoords(shopPhoto.latitude, shopPhoto.longitude) ||
                  hasValidCoords(selfiePhoto.latitude, selfiePhoto.longitude) ? (
                    <>
                      <div className="bv-two-col tight">
                        {[
                          { title: "SHOP PHOTO LOCATION", photo: shopPhoto },
                          { title: "SELFIE LOCATION", photo: selfiePhoto },
                        ].map((loc) => {
                          const valid = hasValidCoords(loc.photo.latitude, loc.photo.longitude);
                          const acc = classifyAccuracy(loc.photo.accuracyMeters);
                          return (
                            <div key={loc.title} className="bv-location-card">
                              <span className="bv-eyebrow">{loc.title}</span>
                              {valid ? (
                                <>
                                  <div className="bv-meta-grid">
                                    <DataLine label="Latitude" value={loc.photo.latitude.toFixed(6)} mono />
                                    <DataLine label="Longitude" value={loc.photo.longitude.toFixed(6)} mono />
                                    <DataLine
                                      label="Accuracy"
                                      value={`${loc.photo.accuracyMeters ?? "?"} metres`}
                                    >
                                      <StatusBadge tone={acc.tone}>
                                        {loc.photo.accuracyMeters ?? "?"} m · {acc.label}
                                      </StatusBadge>
                                    </DataLine>
                                    <DataLine label="Captured" value={formatDateTime(loc.photo.capturedAt)} />
                                    <DataLine
                                      label="Source"
                                      value={loc.photo.locationSource || "Device foreground location"}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    className="bv-btn bv-btn-secondary full"
                                    onClick={() => openMapsFor(loc.photo.latitude, loc.photo.longitude)}
                                  >
                                    <Icon name="navigation" size={15} />
                                    <span>Open Navigation</span>
                                  </button>
                                </>
                              ) : (
                                <p className="bv-muted-note">Location was not captured for this capture.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {locationComparison.distanceMeters != null && (
                        <div className={`bv-location-compare tone-${
                          locationComparison.classification === "consistent"
                            ? "green"
                            : locationComparison.classification === "incomplete"
                            ? "slate"
                            : "amber"
                        }`}>
                          <div className="bv-compare-left">
                            <Icon name="compare" size={18} />
                            <div>
                              <span className="bv-eyebrow">DISTANCE BETWEEN CAPTURES</span>
                              <strong className="bv-compare-value">
                                {locationComparison.distanceMeters} metres
                              </strong>
                            </div>
                          </div>
                          <span className="bv-compare-note">
                            {locationComparison.classification === "consistent"
                              ? "Locations appear consistent"
                              : locationComparison.classification === "incomplete"
                              ? "Location evidence is incomplete"
                              : "Location difference requires review"}
                          </span>
                        </div>
                      )}

                      {classifyAccuracy(shopPhoto.accuracyMeters).tone === "red" && (
                        <div className="bv-inline-warn">
                          <Icon name="alert" size={15} />
                          <span>
                            Location accuracy is low. Review the photographs and registered address carefully.
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="bv-muted-note">Location was not captured for this verification submission.</p>
                  )}
                </section>

                {/* ------------------------- REGISTERED BUSINESS COMPARISON */}
                <section className="bv-card">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">REGISTERED BUSINESS INFORMATION</span>
                      <h3 className="bv-card-title">
                        <Icon name="building" size={17} />
                        Registered Business Comparison
                      </h3>
                    </div>
                  </div>
                  <div className="bv-meta-grid">
                    <DataLine label="Buyer Name" value={buyer.name} />
                    <DataLine label="Shop Name" value={buyer.shopName} />
                    <DataLine label="City" value={buyer.city} />
                    <DataLine label="State" value={buyer.state} />
                    <DataLine label="Pincode" value={buyer.pincode} mono />
                    <DataLine label="Registered Address" value={buyer.address} />
                  </div>
                  <div className="bv-compare-row">
                    <div className="bv-compare-chip">
                      <span className="bv-eyebrow">REGISTERED SHOP</span>
                      <strong>{buyer.shopName || "Not available"}</strong>
                    </div>
                    <Icon name="arrowRight" size={18} className="bv-compare-arrow" />
                    <div className="bv-compare-chip">
                      <span className="bv-eyebrow">SUBMITTED HOARDING</span>
                      <strong>{verification?.submittedHoarding || buyer.shopName || "Pending Admin review"}</strong>
                    </div>
                    <StatusBadge tone="amber">Requires Admin confirmation</StatusBadge>
                  </div>
                </section>

                {/* ---------------------------------- SUBMISSION INFORMATION */}
                <section className="bv-card">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">SUBMISSION INFORMATION</span>
                      <h3 className="bv-card-title">
                        <Icon name="id" size={17} />
                        Submission Details
                      </h3>
                    </div>
                  </div>
                  <div className="bv-meta-grid">
                    <DataLine label="Submission ID" value={verification?.submissionId} mono />
                    <DataLine label="Buyer ID" value={publicId} mono />
                    <DataLine label="Attempt" value={verification?.attemptNumber} />
                    <DataLine label="Status">
                      <StatusBadge tone={vStatus.tone}>{vStatus.label}</StatusBadge>
                    </DataLine>
                    <DataLine label="Submitted" value={formatDateTime(verification?.submittedAt)} />
                    <DataLine label="Last Updated" value={formatDateTime(verification?.updatedAt)} />
                    <DataLine
                      label="Previous Result"
                      value={verification?.previousResult ? titleCase(verification.previousResult) : "First submission"}
                    />
                    <DataLine
                      label="Current Reviewer"
                      value={verification?.latestReview?.adminPublicId || currentAdmin?.publicId || "Unassigned"}
                    />
                  </div>
                  {verification?.resubmissionReason && (
                    <div className="bv-inline-note">
                      <span className="bv-eyebrow">RESUBMISSION REASON</span>
                      <p>{verification.resubmissionReason}</p>
                    </div>
                  )}
                </section>

                {/* ----------------------------------------- ADMIN REVIEW NOTE */}
                <section className="bv-card">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">ADMIN REVIEW NOTE</span>
                      <h3 className="bv-card-title">
                        <Icon name="note" size={17} />
                        Review Notes
                      </h3>
                    </div>
                  </div>
                  <textarea
                    className="bv-textarea"
                    value={adminNote}
                    maxLength={NOTE_MAX}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Record your review findings. Explain any mismatch, missing evidence, approval basis, or resubmission requirement."
                    aria-label="Admin review note"
                  />
                  <div className="bv-char-count">
                    <span className={noteLen > 0 && noteLen < NOTE_MIN ? "warn" : ""}>
                      {noteLen} / {NOTE_MAX} characters
                    </span>
                    <span className="bv-muted-note">
                      Mandatory for Reject &amp; Resubmission (min {NOTE_MIN}); recommended for Verify.
                    </span>
                  </div>
                </section>

                {/* ------------------------------------------- DECISION PANEL */}
                <section className="bv-card bv-decision-panel">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">VERIFICATION DECISION</span>
                      <h3 className="bv-card-title">
                        <Icon name="shieldCheck" size={17} />
                        Record Your Decision
                      </h3>
                    </div>
                  </div>
                  <div className="bv-decision-actions">
                    <button
                      type="button"
                      className="bv-btn bv-btn-verify"
                      onClick={() => {
                        setActionError("");
                        setActiveModal("verify");
                      }}
                    >
                      <Icon name="checkCircle" size={16} />
                      <span>Verify Buyer</span>
                    </button>
                    <button
                      type="button"
                      className="bv-btn bv-btn-resubmit"
                      onClick={() => {
                        setActionError("");
                        setActiveModal("resubmit");
                      }}
                    >
                      <Icon name="refresh" size={16} />
                      <span>Request Resubmission</span>
                    </button>
                    <button
                      type="button"
                      className="bv-btn bv-btn-reject"
                      onClick={() => {
                        setActionError("");
                        setActiveModal("reject");
                      }}
                    >
                      <Icon name="close" size={16} />
                      <span>Reject Verification</span>
                    </button>
                  </div>
                  <p className="bv-muted-note">
                    Business verification and account status are independent. Verifying a Buyer does not
                    change a Restricted or Blocked account state.
                  </p>
                </section>

                {/* ------------------------------------------- REVIEW HISTORY */}
                <section className="bv-card">
                  <div className="bv-card-head">
                    <div className="bv-card-head-text">
                      <span className="bv-eyebrow">VERIFICATION REVIEW HISTORY</span>
                      <h3 className="bv-card-title">
                        <Icon name="history" size={17} />
                        Review History
                      </h3>
                    </div>
                  </div>
                  {history.length === 0 ? (
                    <p className="bv-muted-note">No Admin review has been recorded.</p>
                  ) : (
                    <ul className="bv-timeline">
                      {history.map((event, idx) => (
                        <li key={event.id || idx} className="bv-timeline-item">
                          <span className="bv-timeline-dot" />
                          <div className="bv-timeline-body">
                            <div className="bv-timeline-head">
                              <strong className="bv-timeline-action">{titleCase(event.action)}</strong>
                              <span className="bv-timeline-time">{formatDateTime(event.createdAt)}</span>
                            </div>
                            {event.newStatus && (
                              <StatusBadge tone={VERIFICATION_STATUS[event.newStatus]?.tone || "slate"}>
                                {VERIFICATION_STATUS[event.newStatus]?.label || titleCase(event.newStatus)}
                              </StatusBadge>
                            )}
                            {event.adminNote && <p className="bv-timeline-note">{event.adminNote}</p>}
                            <div className="bv-timeline-meta">
                              {event.changedByAdminId && <span>Reviewed by: {event.changedByAdminId}</span>}
                              {event.auditReference && <span className="mono">{event.auditReference}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* ============================================ VERIFY MODAL */}
      <Modal
        open={activeModal === "verify"}
        title="Verify Buyer Business?"
        tone="green"
        onClose={closeModals}
        closeOnEsc={!processing}
        footer={
          <>
            <button type="button" className="bv-btn bv-btn-ghost" onClick={closeModals} disabled={processing}>
              Cancel
            </button>
            <button type="button" className="bv-btn bv-btn-verify" onClick={handleVerify} disabled={processing}>
              {processing ? (
                <>
                  <span className="bv-spinner" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <Icon name="checkCircle" size={15} />
                  <span>Verify Buyer</span>
                </>
              )}
            </button>
          </>
        }
      >
        <p className="bv-modal-text">
          You are confirming that the submitted identity and business evidence has been reviewed and is
          sufficient for StoneRate Buyer activity.
        </p>
        <ul className="bv-modal-summary">
          <li><Icon name="check" size={14} /> Aadhaar verified</li>
          <li><Icon name="check" size={14} /> Shop photo reviewed</li>
          <li><Icon name="check" size={14} /> Selfie reviewed</li>
          <li><Icon name="check" size={14} /> Location evidence reviewed</li>
          <li><Icon name="check" size={14} /> Registered business details reviewed</li>
        </ul>
        {actionError && <div className="bv-modal-error">{actionError}</div>}
      </Modal>

      {/* ======================================== RESUBMISSION MODAL */}
      <Modal
        open={activeModal === "resubmit"}
        title="Request New Verification Evidence"
        tone="amber"
        onClose={closeModals}
        closeOnEsc={!processing}
        footer={
          <>
            <button type="button" className="bv-btn bv-btn-ghost" onClick={closeModals} disabled={processing}>
              Cancel
            </button>
            <button type="button" className="bv-btn bv-btn-resubmit" onClick={handleResubmission} disabled={processing}>
              {processing ? (
                <>
                  <span className="bv-spinner" />
                  <span>Requesting Resubmission…</span>
                </>
              ) : (
                <span>Request Resubmission</span>
              )}
            </button>
          </>
        }
      >
        <p className="bv-modal-label">Select one or more reasons</p>
        <div className="bv-option-list">
          {RESUBMISSION_REASONS.map((r) => (
            <label key={r.key} className={`bv-option ${resubReasons.includes(r.key) ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={resubReasons.includes(r.key)}
                onChange={() => toggleFromList(resubReasons, setResubReasons, r.key)}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>

        <p className="bv-modal-label">Evidence that must be replaced</p>
        <div className="bv-chip-select">
          {REPLACE_COMPONENTS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`bv-select-chip ${resubReplace.includes(c.key) ? "active" : ""}`}
              onClick={() => toggleFromList(resubReplace, setResubReplace, c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="bv-modal-label">
          Admin note <span className="req">required</span>
        </p>
        <textarea
          className="bv-textarea compact"
          value={adminNote}
          maxLength={NOTE_MAX}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Explain what the Buyer must re-capture or correct."
        />
        <div className="bv-char-count">
          <span className={noteLen > 0 && noteLen < NOTE_MIN ? "warn" : ""}>
            {noteLen} / {NOTE_MAX} characters (min {NOTE_MIN})
          </span>
        </div>
        {actionError && <div className="bv-modal-error">{actionError}</div>}
      </Modal>

      {/* ============================================= REJECT MODAL */}
      <Modal
        open={activeModal === "reject"}
        title="Reject Buyer Verification?"
        tone="red"
        onClose={closeModals}
        closeOnEsc={!processing}
        footer={
          <>
            <button type="button" className="bv-btn bv-btn-ghost" onClick={closeModals} disabled={processing}>
              Go Back
            </button>
            <button type="button" className="bv-btn bv-btn-reject-solid" onClick={handleReject} disabled={processing}>
              {processing ? (
                <>
                  <span className="bv-spinner" />
                  <span>Rejecting…</span>
                </>
              ) : (
                <span>Reject Verification</span>
              )}
            </button>
          </>
        }
      >
        <p className="bv-modal-text">
          The Buyer's current verification submission will be rejected. The Buyer cannot create new
          commercial requests unless a new submission is permitted and later approved. The account is not
          blocked or deleted by this action.
        </p>
        <p className="bv-modal-label">Select a rejection reason</p>
        <div className="bv-option-list">
          {REJECTION_REASONS.map((r) => (
            <label key={r.key} className={`bv-option ${rejectReasons.includes(r.key) ? "active" : ""}`}>
              <input
                type="checkbox"
                checked={rejectReasons.includes(r.key)}
                onChange={() => toggleFromList(rejectReasons, setRejectReasons, r.key)}
              />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
        <p className="bv-modal-label">
          Admin note <span className="req">required</span>
        </p>
        <textarea
          className="bv-textarea compact"
          value={adminNote}
          maxLength={NOTE_MAX}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Explain the basis for rejection."
        />
        <div className="bv-char-count">
          <span className={noteLen > 0 && noteLen < NOTE_MIN ? "warn" : ""}>
            {noteLen} / {NOTE_MAX} characters (min {NOTE_MIN})
          </span>
        </div>
        {actionError && <div className="bv-modal-error">{actionError}</div>}
      </Modal>

      {/* ========================================= FULL IMAGE LIGHTBOX */}
      {fullImage && (
        <div
          className="bv-lightbox"
          onMouseDown={(e) => e.target === e.currentTarget && setFullImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full image view"
        >
          <button
            type="button"
            className="bv-lightbox-close"
            onClick={() => setFullImage(null)}
            aria-label="Close full image"
          >
            <Icon name="close" size={20} />
          </button>
          <img src={fullImage.url} alt={fullImage.alt} className="bv-lightbox-img" />
        </div>
      )}

      {/* ===================================================== TOAST */}
      <div className={`bv-toast ${toast ? "show" : ""}`} role="status">
        <Icon name="check" size={15} />
        <span>{toast}</span>
      </div>
    </div>
  );
}

// ============================================================================
// STYLESHEET — theme extracted from StoneRateAdminUsersPartners.js, with the
// larger / more readable typography specified in the page brief.
// ============================================================================

const BV_CSS = `
.bv-root {
  --o: #f97316;
  --o2: #c2560b;
  --soft: rgba(249, 115, 22, 0.11);
  --navy: #141a24;
  --ink: #141a24;
  --muted: #5a6475;
  --faint: #8a94a4;
  --line: #e9edf3;
  --line2: #dbe2ec;
  --card-bg: #ffffff;
  --ivory: #faf7f2;

  --green: #1f9463;
  --green-bg: #e7f6ee;
  --green-ink: #0f6c44;
  --blue: #2563eb;
  --blue-bg: #e8f0fe;
  --blue-ink: #1d4ed8;
  --amber: #d97706;
  --amber-bg: #fef3c7;
  --amber-ink: #92400e;
  --red: #d64545;
  --red-bg: #fde8e8;
  --red-ink: #b02a2a;
  --slate: #64748b;
  --slate-bg: #f1f5f9;

  min-height: 100vh;
  height: auto;
  overflow-x: hidden;
  padding-bottom: 72px;
  color: var(--ink);
  background: #faf8f4;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.bv-root * { box-sizing: border-box; }
.bv-root button,
.bv-root input,
.bv-root select,
.bv-root textarea { font: inherit; }

/* Ambient background */
.bv-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.bv-grid {
  position: absolute; inset: 0;
  background: linear-gradient(transparent 0 31px, rgba(24, 42, 72, 0.03) 31px 32px),
              linear-gradient(90deg, transparent 0 31px, rgba(24, 42, 72, 0.03) 31px 32px);
  background-size: 32px 32px;
  mask-image: radial-gradient(120% 85% at 50% 0%, #000 20%, transparent 78%);
}
.bv-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.4; }
.bv-orb.orange { width: 44vw; height: 44vw; left: -9vw; top: -16vw; background: radial-gradient(circle, rgba(255, 168, 74, 0.5), transparent 66%); }
.bv-orb.blue { width: 40vw; height: 40vw; right: -10vw; top: -6vw; background: radial-gradient(circle, rgba(80, 140, 255, 0.36), transparent 66%); }
.bv-orb.teal { width: 36vw; height: 36vw; left: 34vw; top: 30vw; background: radial-gradient(circle, rgba(13, 148, 136, 0.2), transparent 68%); }

/* Layout */
.bv-container { width: min(100%, 1120px); margin: 0 auto; padding: 0 18px; position: relative; z-index: 1; }
.bv-main { margin-top: 20px; display: flex; flex-direction: column; gap: 18px; }

/* Header (semi-sticky, non-blocking) */
.bv-header {
  position: sticky; top: 0; z-index: 20;
  border-bottom: 1px solid rgba(16, 28, 50, 0.07);
  background: rgba(250, 248, 244, 0.88);
  backdrop-filter: blur(10px);
  padding: 14px 0;
}
.bv-header-row { display: flex; align-items: center; gap: 14px; }
.bv-header-brand { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.bv-brand-mark {
  width: 42px; height: 42px; display: grid; place-items: center;
  border-radius: 12px; color: #fff;
  background: linear-gradient(135deg, var(--o), var(--o2));
  box-shadow: 0 5px 14px rgba(249, 115, 22, 0.28); flex-shrink: 0;
}
.bv-brand-text { display: flex; flex-direction: column; min-width: 0; }
.bv-brand-title { margin: 2px 0 0; color: var(--navy); font-size: 26px; font-weight: 820; letter-spacing: -0.02em; line-height: 1.15; }
.bv-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.bv-eyebrow { color: var(--o2); font-size: 11px; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
.bv-eyebrow.blue { color: var(--blue-ink); }

.bv-id-pill {
  display: inline-block; padding: 5px 11px; border-radius: 999px;
  background: var(--slate-bg); color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px; font-weight: 750; letter-spacing: 0.02em;
}

.bv-icon-btn {
  width: 40px; height: 40px; display: grid; place-items: center;
  border: 1px solid var(--line2); border-radius: 11px; background: #fff;
  color: var(--ink); cursor: pointer; transition: all 0.16s ease; flex-shrink: 0;
}
.bv-icon-btn:hover:not(:disabled) { border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.bv-icon-btn:disabled { opacity: 0.6; cursor: default; }

/* Cards */
.bv-card {
  padding: 20px; border: 1px solid var(--line); border-radius: 18px;
  background: var(--card-bg); box-shadow: 0 6px 22px rgba(20, 26, 36, 0.04);
}
.bv-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.bv-card-head-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.bv-card-title { margin: 0; display: flex; align-items: center; gap: 8px; color: var(--navy); font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
.bv-card-title svg { color: var(--o2); flex-shrink: 0; }

/* Buyer hero */
.bv-hero { background: linear-gradient(135deg, #ffffff 0%, var(--ivory) 100%); border-color: #efe6d8; }
.bv-hero-main { display: flex; align-items: center; gap: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 18px; }
.bv-hero-avatar {
  width: 72px; height: 72px; display: grid; place-items: center; border-radius: 20px;
  color: #fff; font-size: 26px; font-weight: 850; flex-shrink: 0;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
}
.bv-hero-identity { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.bv-hero-name { margin: 2px 0; color: var(--navy); font-size: 24px; font-weight: 820; letter-spacing: -0.02em; }
.bv-hero-business { margin: 0; display: inline-flex; align-items: center; gap: 7px; color: var(--muted); font-size: 15px; font-weight: 650; }
.bv-hero-business svg { color: var(--o2); }
.bv-hero-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 24px;
}

/* Data lines */
.bv-data-line { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.bv-data-label { color: var(--faint); font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
.bv-data-value { color: var(--ink); font-size: 14px; font-weight: 600; word-break: break-word; }
.bv-data-value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; letter-spacing: 0.02em; }

/* Badges */
.bv-badge {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px;
  border-radius: 999px; font-size: 12px; font-weight: 750; letter-spacing: 0.02em; white-space: nowrap;
}
.bv-badge.tone-green { background: var(--green-bg); color: var(--green-ink); }
.bv-badge.tone-blue { background: var(--blue-bg); color: var(--blue-ink); }
.bv-badge.tone-amber { background: var(--amber-bg); color: var(--amber-ink); }
.bv-badge.tone-red { background: var(--red-bg); color: var(--red-ink); }
.bv-badge.tone-slate { background: var(--slate-bg); color: var(--slate); }

/* Progress cards */
.bv-progress-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.bv-progress-card {
  padding: 18px; border: 1px solid var(--line); border-radius: 16px; background: #fff;
  display: flex; flex-direction: column; gap: 7px; position: relative; overflow: hidden;
  box-shadow: 0 4px 16px rgba(20, 26, 36, 0.03); transition: transform 0.16s ease;
}
.bv-progress-card:hover { transform: translateY(-2px); }
.bv-progress-card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--slate); }
.bv-progress-card.tone-green::before { background: var(--green); }
.bv-progress-card.tone-amber::before { background: var(--amber); }
.bv-progress-card.tone-red::before { background: var(--red); }
.bv-progress-top { display: flex; align-items: center; gap: 9px; }
.bv-progress-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; background: var(--slate-bg); color: var(--slate); }
.bv-progress-card.tone-green .bv-progress-icon { background: var(--green-bg); color: var(--green-ink); }
.bv-progress-card.tone-amber .bv-progress-icon { background: var(--amber-bg); color: var(--amber-ink); }
.bv-progress-card.tone-red .bv-progress-icon { background: var(--red-bg); color: var(--red-ink); }
.bv-progress-status { color: var(--navy); font-size: 18px; font-weight: 820; }
.bv-progress-desc { color: var(--muted); font-size: 12.5px; }

/* Two column layout */
.bv-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
.bv-two-col.tight { gap: 14px; }
.bv-evidence-column { display: flex; flex-direction: column; gap: 16px; }

/* Meta grid */
.bv-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 20px; }

/* Evidence image card */
.bv-evidence-card { display: flex; flex-direction: column; gap: 14px; }
.bv-image-stage { border-radius: 14px; overflow: hidden; background: #0f141c; min-height: 260px; display: flex; }
.bv-image-frame { position: relative; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #0f141c; }
.bv-evidence-img { max-width: 100%; max-height: 420px; object-fit: contain; transition: transform 0.2s ease; transform-origin: center; }
.bv-image-toolbar {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px; padding: 5px 8px;
  border-radius: 999px; background: rgba(15, 20, 28, 0.82); backdrop-filter: blur(6px);
}
.bv-image-toolbar button { width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: #fff; cursor: pointer; transition: background 0.15s ease; }
.bv-image-toolbar button:hover { background: rgba(255,255,255,0.16); }
.bv-zoom-level { color: #fff; font-size: 12px; font-weight: 700; min-width: 40px; text-align: center; }
.bv-capture-badge {
  position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 999px; background: rgba(15, 20, 28, 0.78); color: #fff;
  font-size: 11.5px; font-weight: 700; backdrop-filter: blur(4px);
}
.bv-image-placeholder {
  width: 100%; min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 24px; text-align: center; color: #aab4c2; background: #f8fafc;
}
.bv-image-placeholder svg { color: var(--faint); }
.bv-image-placeholder p { margin: 0; font-size: 13.5px; color: var(--muted); max-width: 300px; line-height: 1.5; }
.bv-image-placeholder.error { background: #fdf1f1; color: var(--red-ink); }
.bv-image-placeholder.error svg { color: var(--red); }
.bv-image-placeholder.error p { color: var(--red-ink); }

/* Inline warnings & notes */
.bv-inline-warn {
  display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px; border-radius: 12px;
  background: var(--amber-bg); color: var(--amber-ink); font-size: 13.5px; font-weight: 600; line-height: 1.5;
}
.bv-inline-warn svg { flex-shrink: 0; margin-top: 1px; }
.bv-inline-note { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: var(--slate-bg); }
.bv-inline-note p { margin: 5px 0 0; color: var(--ink); font-size: 13.5px; line-height: 1.5; }
.bv-muted-note { color: var(--muted); font-size: 13px; line-height: 1.5; margin: 0; }

/* Checklist */
.bv-checklist-card { display: flex; flex-direction: column; gap: 12px; }
.bv-checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.bv-check-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding-bottom: 10px; border-bottom: 1px solid var(--line);
}
.bv-check-row:last-child { border-bottom: 0; padding-bottom: 0; }
.bv-check-text { color: var(--ink); font-size: 13.5px; font-weight: 600; flex: 1; min-width: 160px; }
.bv-check-options { display: inline-flex; gap: 5px; flex-shrink: 0; }
.bv-check-pill {
  padding: 5px 11px; border: 1px solid var(--line2); border-radius: 8px; background: #fff;
  color: var(--muted); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
}
.bv-check-pill:hover { border-color: #cbd5e1; }
.bv-check-pill.tone-green.active { background: var(--green-bg); border-color: var(--green); color: var(--green-ink); }
.bv-check-pill.tone-amber.active { background: var(--amber-bg); border-color: var(--amber); color: var(--amber-ink); }
.bv-check-pill.tone-red.active { background: var(--red-bg); border-color: var(--red); color: var(--red-ink); }

/* Location */
.bv-location-card { padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: #fcfdff; display: flex; flex-direction: column; gap: 12px; }
.bv-location-compare {
  margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;
  padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line2); background: var(--slate-bg);
}
.bv-location-compare.tone-green { background: var(--green-bg); border-color: rgba(31,148,99,0.3); }
.bv-location-compare.tone-amber { background: var(--amber-bg); border-color: rgba(217,119,6,0.3); }
.bv-compare-left { display: flex; align-items: center; gap: 12px; }
.bv-compare-left svg { color: var(--navy); }
.bv-compare-value { display: block; color: var(--navy); font-size: 20px; font-weight: 820; }
.bv-compare-note { color: var(--ink); font-size: 14px; font-weight: 700; }

/* Registered business compare row */
.bv-compare-row { margin-top: 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 16px; border-radius: 14px; background: var(--ivory); border: 1px solid #efe6d8; }
.bv-compare-chip { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 150px; }
.bv-compare-chip strong { color: var(--navy); font-size: 15px; font-weight: 750; }
.bv-compare-arrow { color: var(--faint); flex-shrink: 0; }

/* Textarea */
.bv-textarea {
  width: 100%; min-height: 130px; padding: 14px; border: 1px solid var(--line2); border-radius: 12px;
  background: #fff; color: var(--ink); font-size: 14px; line-height: 1.55; resize: vertical; outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.bv-textarea.compact { min-height: 90px; }
.bv-textarea:focus { border-color: rgba(249,115,22,0.6); box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
.bv-char-count { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; color: var(--faint); font-size: 12px; font-weight: 600; }
.bv-char-count .warn { color: var(--amber-ink); }

/* Decision panel */
.bv-decision-panel { background: linear-gradient(135deg, #ffffff 0%, var(--ivory) 100%); border-color: #efe6d8; }
.bv-decision-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }

/* Buttons */
.bv-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px;
  padding: 11px 18px; border: 1px solid transparent; border-radius: 12px; font-size: 14px; font-weight: 750;
  cursor: pointer; transition: all 0.16s ease; white-space: nowrap;
}
.bv-btn:disabled { opacity: 0.65; cursor: default; }
.bv-btn.full { width: 100%; }
.bv-btn-verify { background: linear-gradient(135deg, #1fa86f, #0f7a4e); color: #fff; box-shadow: 0 4px 14px rgba(31,148,99,0.28); }
.bv-btn-verify:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
.bv-btn-resubmit { background: linear-gradient(135deg, #f0a022, #d97706); color: #fff; box-shadow: 0 4px 14px rgba(217,119,6,0.26); }
.bv-btn-resubmit:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
.bv-btn-reject { background: #fff; border-color: var(--red); color: var(--red-ink); }
.bv-btn-reject:hover:not(:disabled) { background: var(--red-bg); }
.bv-btn-reject-solid { background: linear-gradient(135deg, #e05454, #b02a2a); color: #fff; box-shadow: 0 4px 14px rgba(214,69,69,0.26); }
.bv-btn-reject-solid:hover:not(:disabled) { filter: brightness(1.05); }
.bv-btn-secondary { background: #fff; border-color: var(--line2); color: var(--ink); }
.bv-btn-secondary:hover:not(:disabled) { border-color: rgba(249,115,22,0.5); color: var(--o2); background: #fff8f1; }
.bv-btn-ghost { background: transparent; border-color: var(--line2); color: var(--muted); }
.bv-btn-ghost:hover:not(:disabled) { background: var(--slate-bg); color: var(--ink); }

/* Timeline */
.bv-timeline { list-style: none; margin: 0; padding: 0 0 0 6px; }
.bv-timeline-item { position: relative; padding: 0 0 20px 24px; border-left: 2px solid var(--line); }
.bv-timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
.bv-timeline-dot { position: absolute; left: -7px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--o); border: 2px solid #fff; box-shadow: 0 0 0 2px var(--soft); }
.bv-timeline-body { display: flex; flex-direction: column; gap: 6px; }
.bv-timeline-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.bv-timeline-action { color: var(--navy); font-size: 15px; font-weight: 800; }
.bv-timeline-time { color: var(--faint); font-size: 12.5px; font-weight: 600; }
.bv-timeline-note { margin: 2px 0; color: var(--ink); font-size: 13.5px; line-height: 1.5; }
.bv-timeline-meta { display: flex; gap: 14px; flex-wrap: wrap; color: var(--muted); font-size: 12px; }
.bv-timeline-meta .mono { font-family: ui-monospace, monospace; }

/* State cards */
.bv-state-card { padding: 54px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; border: 1px solid var(--line); border-radius: 18px; background: #fff; box-shadow: 0 6px 22px rgba(20,26,36,0.04); }
.bv-state-icon { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 18px; margin-bottom: 14px; background: var(--soft); color: var(--o2); }
.bv-state-icon.error { background: var(--red-bg); color: var(--red); }
.bv-state-title { margin: 0 0 7px; color: var(--navy); font-size: 19px; font-weight: 820; }
.bv-state-desc { margin: 0 0 18px; color: var(--muted); font-size: 14px; max-width: 440px; line-height: 1.55; }

/* Skeletons */
.bv-skeleton-stack { display: flex; flex-direction: column; gap: 18px; }
.bv-skeleton { display: block; background: linear-gradient(90deg, #eef2f7 25%, #e3e9f1 37%, #eef2f7 63%); background-size: 400% 100%; animation: bvShimmer 1.4s ease infinite; }
@keyframes bvShimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

/* Spinner */
.bv-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.45); border-top-color: #fff; border-radius: 50%; animation: bvSpin 0.75s linear infinite; }
.bv-spinner.lg { width: 30px; height: 30px; border-width: 3px; border-color: rgba(249,115,22,0.3); border-top-color: var(--o); }
.bv-icon-btn .bv-spinner { border-color: rgba(249,115,22,0.3); border-top-color: var(--o); }
@keyframes bvSpin { to { transform: rotate(360deg); } }

/* Modals */
.bv-modal-overlay { position: fixed; inset: 0; z-index: 900; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(15, 20, 28, 0.55); backdrop-filter: blur(3px); animation: bvFade 0.18s ease; }
@keyframes bvFade { from { opacity: 0; } to { opacity: 1; } }
.bv-modal-panel {
  width: min(100%, 560px); max-height: 88vh; display: flex; flex-direction: column;
  background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.3);
  animation: bvPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes bvPop { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }
.bv-modal-panel.tone-green { border-top: 4px solid var(--green); }
.bv-modal-panel.tone-amber { border-top: 4px solid var(--amber); }
.bv-modal-panel.tone-red { border-top: 4px solid var(--red); }
.bv-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--line); }
.bv-modal-title { margin: 0; color: var(--navy); font-size: 19px; font-weight: 820; }
.bv-modal-close { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--line2); border-radius: 9px; background: #fff; color: var(--muted); cursor: pointer; }
.bv-modal-close:hover { background: var(--slate-bg); color: var(--ink); }
.bv-modal-body { padding: 20px; overflow-y: auto; }
.bv-modal-foot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--line); background: #fafbfd; }
.bv-modal-text { margin: 0 0 14px; color: var(--ink); font-size: 14.5px; line-height: 1.6; }
.bv-modal-label { margin: 16px 0 10px; color: var(--navy); font-size: 14px; font-weight: 750; }
.bv-modal-label:first-child { margin-top: 0; }
.bv-modal-label .req { color: var(--red-ink); font-size: 12px; font-weight: 700; margin-left: 4px; }
.bv-modal-summary { list-style: none; margin: 0; padding: 14px 16px; border-radius: 12px; background: var(--green-bg); display: flex; flex-direction: column; gap: 9px; }
.bv-modal-summary li { display: flex; align-items: center; gap: 9px; color: var(--green-ink); font-size: 13.5px; font-weight: 650; }
.bv-modal-error { margin-top: 14px; padding: 11px 14px; border-radius: 10px; background: var(--red-bg); color: var(--red-ink); font-size: 13px; font-weight: 650; }

/* Option lists */
.bv-option-list { display: flex; flex-direction: column; gap: 8px; }
.bv-option { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border: 1px solid var(--line2); border-radius: 11px; background: #fff; cursor: pointer; transition: all 0.15s ease; }
.bv-option:hover { border-color: #cbd5e1; background: #fcfdff; }
.bv-option.active { border-color: rgba(249,115,22,0.6); background: #fff7ed; }
.bv-option input { width: 17px; height: 17px; accent-color: var(--o); cursor: pointer; flex-shrink: 0; }
.bv-option span { color: var(--ink); font-size: 13.5px; font-weight: 600; }
.bv-chip-select { display: flex; flex-wrap: wrap; gap: 8px; }
.bv-select-chip { padding: 8px 13px; border: 1px solid var(--line2); border-radius: 9px; background: #fff; color: var(--muted); font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
.bv-select-chip:hover { border-color: #cbd5e1; }
.bv-select-chip.active { border-color: rgba(249,115,22,0.6); background: #fff7ed; color: var(--o2); }

/* Lightbox */
.bv-lightbox { position: fixed; inset: 0; z-index: 950; display: flex; align-items: center; justify-content: center; padding: 28px; background: rgba(8, 11, 16, 0.92); animation: bvFade 0.18s ease; }
.bv-lightbox-img { max-width: 94vw; max-height: 90vh; object-fit: contain; border-radius: 10px; }
.bv-lightbox-close { position: absolute; top: 20px; right: 20px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 12px; background: rgba(255,255,255,0.14); color: #fff; cursor: pointer; }
.bv-lightbox-close:hover { background: rgba(255,255,255,0.26); }

/* Toast */
.bv-toast {
  position: fixed; bottom: 26px; left: 50%; transform: translateX(-50%) translateY(40px); z-index: 999;
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 999px;
  background: var(--navy); color: #fff; font-size: 13.5px; font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25); opacity: 0; pointer-events: none;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
.bv-toast svg { color: #4ade80; }
.bv-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }

/* ---------------------------------------------------------- RESPONSIVE */
@media (max-width: 1024px) {
  .bv-progress-grid { grid-template-columns: repeat(2, 1fr); }
  .bv-two-col { grid-template-columns: 1fr; }
  .bv-hero-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 680px) {
  .bv-container { padding: 0 14px; }
  .bv-brand-title { font-size: 22px; }
  .bv-header-actions { gap: 7px; }
  .bv-id-pill { display: none; }
  .bv-main { gap: 14px; }
  .bv-card { padding: 16px; border-radius: 16px; }
  .bv-hero-main { flex-direction: row; align-items: center; gap: 14px; }
  .bv-hero-avatar { width: 58px; height: 58px; font-size: 21px; border-radius: 16px; }
  .bv-hero-name { font-size: 21px; }
  .bv-hero-grid { grid-template-columns: 1fr 1fr; gap: 12px 16px; }
  .bv-progress-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .bv-progress-card { padding: 14px; }
  .bv-meta-grid { grid-template-columns: 1fr; }
  .bv-decision-actions { grid-template-columns: 1fr; }
  .bv-check-row { align-items: flex-start; }
  .bv-check-options { width: 100%; }
  .bv-check-pill { flex: 1; text-align: center; }
  .bv-evidence-img { max-height: 320px; }
  .bv-modal-foot { flex-direction: column-reverse; }
  .bv-modal-foot .bv-btn { width: 100%; }
}

@media (max-width: 420px) {
  .bv-hero-grid { grid-template-columns: 1fr; }
  .bv-progress-grid { grid-template-columns: 1fr; }
}
`;
