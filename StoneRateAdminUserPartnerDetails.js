import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  getAdminUserPartnerProfile,
  getAdminUserPartnerOrders,
  verifyAdminUserPartner,
  blockAdminUserPartner,
  unblockAdminUserPartner,
  requestAdminDeleteOtp,
  verifyAdminDeleteOtp,
  deleteAdminUserPartner,
} from "../api/adminApi";

// ============================================================================
// STONERATE ADMIN — USER & PARTNER DETAILS
// File: StoneRateAdminUserPartnerDetails.js
// Theme reference: StoneRateAdminUsersPartners.js
// ----------------------------------------------------------------------------
// Opens when an Admin clicks "View Details" on a record in the directory.
// Displays the full Admin-authorised profile + operational history of the
// selected Buyer / Stone Seller / Sand Seller / Transporter / Admin, and
// exposes secure verify / block / unblock / delete workflows.
// ============================================================================

/**
 * Role theme map — matched to the directory page accent system, extended with
 * role-specific hero gradients + soft tints used across this detail page.
 */
const ROLE_THEME = {
  buyer: {
    key: "buyer",
    singular: "Buyer",
    title: "Buyer Profile",
    icon: "user",
    accent: "#2563eb",
    accentDeep: "#1d4ed8",
    avatarBg: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    heroGlow: "rgba(37, 99, 235, 0.16)",
    soft: "rgba(37, 99, 235, 0.09)",
    businessLabel: "Shop Name",
    hasGstin: false,
  },
  stone_seller: {
    key: "stone_seller",
    singular: "Stone Seller",
    title: "Stone Seller Profile",
    icon: "cube",
    accent: "#f97316",
    accentDeep: "#c2560b",
    avatarBg: "linear-gradient(135deg, #f97316, #c2560b)",
    heroGlow: "rgba(249, 115, 22, 0.18)",
    soft: "rgba(249, 115, 22, 0.1)",
    businessLabel: "Plant or Business Name",
    hasGstin: true,
  },
  sand_seller: {
    key: "sand_seller",
    singular: "Sand Seller",
    title: "Sand Seller Profile",
    icon: "layers",
    accent: "#d97706",
    accentDeep: "#b45309",
    avatarBg: "linear-gradient(135deg, #f59e0b, #b45309)",
    heroGlow: "rgba(217, 119, 6, 0.18)",
    soft: "rgba(217, 119, 6, 0.1)",
    businessLabel: "Sand Yard Name",
    hasGstin: true,
  },
  transporter: {
    key: "transporter",
    singular: "Transporter",
    title: "Transporter Profile",
    icon: "truck",
    accent: "#0d9488",
    accentDeep: "#047857",
    avatarBg: "linear-gradient(135deg, #10b981, #047857)",
    heroGlow: "rgba(16, 185, 129, 0.18)",
    soft: "rgba(16, 185, 129, 0.1)",
    businessLabel: "Agency Name",
    hasGstin: true,
  },
  admin: {
    key: "admin",
    singular: "Admin",
    title: "Admin Profile",
    icon: "shield",
    accent: "#8b5cf6",
    accentDeep: "#6d28d9",
    avatarBg: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    heroGlow: "rgba(139, 92, 246, 0.18)",
    soft: "rgba(139, 92, 246, 0.1)",
    businessLabel: "Admin Role",
    hasGstin: false,
  },
};

const getRoleTheme = (role) => ROLE_THEME[role] || ROLE_THEME.buyer;

/**
 * Status visual map for ACTIVE / PENDING / BLOCKED / SUSPENDED / DELETED.
 */
const STATUS_META = {
  ACTIVE: { label: "Active", cls: "st-active" },
  PENDING: { label: "Pending", cls: "st-pending" },
  BLOCKED: { label: "Blocked", cls: "st-blocked" },
  SUSPENDED: { label: "Suspended", cls: "st-suspended" },
  DELETED: { label: "Deleted", cls: "st-deleted" },
};

const normStatus = (s) => String(s || "ACTIVE").toUpperCase();

/**
 * Inline icon system (same stroke language as the directory page).
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
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    cube: (
      <>
        <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
        <path d="m4 6.5 8 4.5 8-4.5M12 11v9" />
      </>
    ),
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    truck: (
      <>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05A1 1 0 0 0 17.76 8H14v10" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m7 7 10 10M17 7 7 17" />,
    down: <path d="m6 9 6 6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    navigate: (
      <>
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </>
    ),
    badgeCheck: (
      <>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
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
    doc: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    box: (
      <>
        <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
        <path d="M3 8h18M8 3v18" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    ban: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m5.6 5.6 12.8 12.8" />
      </>
    ),
    rotate: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),
  };
  return <svg {...c}>{p[name] || p.cube}</svg>;
}

/**
 * Formatting helpers
 */
const formatDate = (iso) => {
  if (!iso) return "Not available";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};

const getInitials = (name) => {
  if (!name) return "SR";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatPhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return String(phone);
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const maskAadhaar = (last4) =>
  last4 ? `XXXX XXXX ${String(last4).slice(-4)}` : "Not linked";

const formatQuantity = (qty, unit) => {
  if (qty == null) return "--";
  const n = Number(qty);
  const num = Number.isFinite(n) ? n.toLocaleString("en-IN") : qty;
  return `${num} ${unit || ""}`.trim();
};

const safeVal = (v, fallback = "Not provided") =>
  v == null || v === "" ? fallback : v;

/**
 * Copy-to-clipboard pill. Shows transient "Copied" feedback.
 * Guards against bubbling so it never triggers the surrounding card/row.
 */
function CopyPill({ value, label, mono = true, size = "sm" }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!value) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(value));
      } else {
        const ta = document.createElement("textarea");
        ta.value = String(value);
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard denied — silent */
    }
  };

  return (
    <span className={`copy-row ${size}`}>
      <span className={mono ? "copy-val mono" : "copy-val"}>{label || value}</span>
      <button
        type="button"
        className={`copy-btn ${copied ? "copied" : ""}`}
        onClick={handleCopy}
        aria-label={`Copy ${label || value}`}
        title="Copy"
      >
        {copied ? <Icon name="check" size={13} /> : <Icon name="copy" size={13} />}
        <span className="copy-btn-text">{copied ? "Copied" : "Copy"}</span>
      </button>
    </span>
  );
}

/**
 * Generic modal shell with background scroll-lock + restore on cleanup.
 * Clicking the scrim closes; content area scrolls independently on mobile.
 */
function Modal({ open, onClose, children, tone = "default", labelledBy }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="sr-modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`sr-modal-card tone-${tone}`} role="document">
        {children}
      </div>
    </div>
  );
}

/**
 * Six-digit OTP input: numeric-only, auto-advance, backspace nav, paste support.
 */
function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);

  const setDigit = (idx, digit) => {
    const next = value.split("");
    next[idx] = digit;
    const joined = next.join("").slice(0, 6);
    onChange(joined);
  };

  const handleChange = (idx, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(idx, "");
      return;
    }
    setDigit(idx, raw[raw.length - 1]);
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (value[idx]) {
        setDigit(idx, "");
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        setDigit(idx - 1, "");
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="otp-group" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="otp-box"
          value={value[idx] || ""}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * Small labelled field used across the profile grid.
 */
function Field({ label, children, full = false }) {
  return (
    <div className={`info-field ${full ? "full" : ""}`}>
      <span className="info-label">{label}</span>
      <div className="info-value">{children}</div>
    </div>
  );
}

/**
 * Section wrapper with uppercase eyebrow title + optional accent icon.
 */
function Section({ title, icon, accent, children, right }) {
  return (
    <section className="detail-section">
      <div className="section-head">
        <div className="section-title-wrap">
          {icon && (
            <span className="section-icon" style={accent ? { color: accent } : undefined}>
              <Icon name={icon} size={16} />
            </span>
          )}
          <h2 className="section-title">{title}</h2>
        </div>
        {right}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StoneRateAdminUserPartnerDetails({
  selectedUser,
  selectedRole,
  onBack,
  onRefresh,
  onAccountUpdated,
  onOpenOrder,
  currentAdmin,
}) {
  const role = selectedRole || "buyer";
  const theme = useMemo(() => getRoleTheme(role), [role]);
  const publicId = selectedUser?.publicId;

  // ---- Profile state ----
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // ---- Orders state ----
  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");

  // ---- Action / workflow state ----
  const [toast, setToast] = useState("");
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [blockStep, setBlockStep] = useState(0); // 0 closed, 1 first, 2 second
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  const [unblockModal, setUnblockModal] = useState(false);
  const [unblocking, setUnblocking] = useState(false);

  const [deleteStep, setDeleteStep] = useState(0); // 0 closed,1 warn,2 otp,3 final
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [deleteAuthId, setDeleteAuthId] = useState(null);
  const [finalDeleting, setFinalDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const status = normStatus(profile?.status || selectedUser?.status);
  const isDeleted = status === "DELETED";
  const isBlocked = status === "BLOCKED";
  const isActive = status === "ACTIVE";

  // Permission flags — backend remains source of truth; these only gate UI.
  const isSuperAdmin = currentAdmin?.permissionLevel === "super_admin";
  const isSelfAccount =
    currentAdmin && publicId && currentAdmin.publicId === publicId;
  const canDelete = isSuperAdmin && !isSelfAccount;
  const canBlock = !isSelfAccount;

  // -------------------------------------------------------------------------
  // Load profile
  // -------------------------------------------------------------------------
  const loadProfile = useCallback(async () => {
    if (!publicId) {
      setProfileError("No account reference was provided.");
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await getAdminUserPartnerProfile({ role, publicId });
      if (res && res.success && res.record) {
        setProfile(res.record);
      } else {
        setProfileError("Unable to load account details.");
      }
    } catch (err) {
      setProfileError(err?.message || "Unable to load account details.");
    } finally {
      setLoadingProfile(false);
    }
  }, [role, publicId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // -------------------------------------------------------------------------
  // Order search debounce
  // -------------------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderSearch(orderSearch), 400);
    return () => clearTimeout(t);
  }, [orderSearch]);

  // -------------------------------------------------------------------------
  // Load orders (page 1 or append). Deleted accounts never load orders.
  // -------------------------------------------------------------------------
  const loadOrders = useCallback(
    async (pageToLoad, append) => {
      if (!publicId || isDeleted) return;
      if (append) setLoadingMoreOrders(true);
      else setLoadingOrders(true);
      setOrdersError(null);
      try {
        const res = await getAdminUserPartnerOrders({
          role,
          publicId,
          search: debouncedOrderSearch,
          page: pageToLoad,
          limit: 10,
        });
        if (res && res.success) {
          const incoming = res.records || [];
          if (append) {
            setOrders((prev) => {
              const merged = [...prev, ...incoming];
              const seen = new Set();
              return merged.filter((o) => {
                const key = o.id || o.requestId || JSON.stringify(o);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            });
          } else {
            setOrders(incoming);
          }
          setOrderPagination(
            res.pagination || {
              page: pageToLoad,
              limit: 10,
              totalRecords: incoming.length,
              totalPages: 1,
            }
          );
          setOrderPage(pageToLoad);
        } else {
          setOrdersError("Unable to load order history.");
        }
      } catch (err) {
        setOrdersError(err?.message || "Unable to load order history.");
      } finally {
        setLoadingOrders(false);
        setLoadingMoreOrders(false);
      }
    },
    [role, publicId, debouncedOrderSearch, isDeleted]
  );

  // Reset to page 1 whenever the (debounced) search changes.
  useEffect(() => {
    if (isDeleted) return;
    setOrders([]);
    loadOrders(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOrderSearch, publicId, role, isDeleted]);

  const handleLoadMoreOrders = () => {
    if (
      orderPage < orderPagination.totalPages &&
      !loadingMoreOrders &&
      !loadingOrders
    ) {
      loadOrders(orderPage + 1, true);
    }
  };

  // -------------------------------------------------------------------------
  // Refresh
  // -------------------------------------------------------------------------
  const handleRefresh = () => {
    loadProfile();
    if (!isDeleted) {
      setOrders([]);
      loadOrders(1, false);
    }
    onRefresh?.();
    showToast("Account details refreshed");
  };

  // -------------------------------------------------------------------------
  // Verify account
  // -------------------------------------------------------------------------
  const handleVerify = async () => {
    setVerifying(true);
    setActionError("");
    try {
      const res = await verifyAdminUserPartner({ role, publicId });
      if (res && res.success) {
        setProfile((p) => ({ ...(p || {}), adminVerified: true }));
        setVerifyModal(false);
        showToast("Account verified");
        onAccountUpdated?.({ role, publicId, change: "verified" });
      } else {
        setActionError(res?.message || "Unable to complete this account action.");
      }
    } catch (err) {
      setActionError(err?.message || "Unable to complete this account action.");
    } finally {
      setVerifying(false);
    }
  };

  // -------------------------------------------------------------------------
  // Block (double confirmation)
  // -------------------------------------------------------------------------
  const handleBlock = async () => {
    setBlocking(true);
    setActionError("");
    try {
      const res = await blockAdminUserPartner({
        role,
        publicId,
        reason: blockReason.trim(),
      });
      if (res && res.success) {
        setProfile((p) => ({ ...(p || {}), status: "blocked" }));
        setBlockStep(0);
        setBlockReason("");
        showToast("Account blocked");
        onAccountUpdated?.({ role, publicId, change: "blocked" });
      } else {
        setActionError(res?.message || "Unable to complete this account action.");
      }
    } catch (err) {
      setActionError(err?.message || "Unable to complete this account action.");
    } finally {
      setBlocking(false);
    }
  };

  // -------------------------------------------------------------------------
  // Unblock
  // -------------------------------------------------------------------------
  const handleUnblock = async () => {
    setUnblocking(true);
    setActionError("");
    try {
      const res = await unblockAdminUserPartner({ role, publicId });
      if (res && res.success) {
        setProfile((p) => ({ ...(p || {}), status: "active" }));
        setUnblockModal(false);
        showToast("Account unblocked");
        onAccountUpdated?.({ role, publicId, change: "unblocked" });
      } else {
        setActionError(res?.message || "Unable to complete this account action.");
      }
    } catch (err) {
      setActionError(err?.message || "Unable to complete this account action.");
    } finally {
      setUnblocking(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete workflow: warn -> request OTP -> verify OTP -> final delete
  // -------------------------------------------------------------------------
  const openDeleteFlow = () => {
    setDeleteConfirmText("");
    setOtpValue("");
    setOtpError("");
    setDeleteAuthId(null);
    setActionError("");
    setDeleteStep(1);
  };

  const closeDeleteFlow = () => {
    setDeleteStep(0);
    setDeleteConfirmText("");
    setOtpValue("");
    setOtpError("");
    setDeleteAuthId(null);
  };

  const handleRequestOtp = async () => {
    setOtpSending(true);
    setActionError("");
    try {
      const res = await requestAdminDeleteOtp({ role, publicId });
      if (res && res.success) {
        setOtpValue("");
        setOtpError("");
        setDeleteStep(2);
      } else {
        setActionError(res?.message || "Unable to send the verification code.");
      }
    } catch (err) {
      setActionError(err?.message || "Unable to send the verification code.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    await handleRequestOtp();
    showToast("A new code has been sent");
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Enter the complete six-digit code.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await verifyAdminDeleteOtp({ role, publicId, otp: otpValue });
      if (res && res.success && res.deletionAuthorizationId) {
        setDeleteAuthId(res.deletionAuthorizationId);
        setDeleteStep(3);
      } else {
        setOtpError(res?.message || "The code is invalid or has expired.");
      }
    } catch (err) {
      setOtpError(err?.message || "The code is invalid or has expired.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleFinalDelete = async () => {
    if (!deleteAuthId) return;
    setFinalDeleting(true);
    setActionError("");
    try {
      const res = await deleteAdminUserPartner({
        role,
        publicId,
        deletionAuthorizationId: deleteAuthId,
        confirmation: "DELETE",
      });
      if (res && res.success) {
        // Immediately clear sensitive state and render deleted view.
        setProfile({
          publicId,
          role,
          status: "deleted",
          phone: res.retainedMobile || profile?.phone || null,
          deletedAt: res.deletedAt || new Date().toISOString(),
          auditReference: res.auditReference || null,
        });
        setOrders([]);
        closeDeleteFlow();
        showToast("Account permanently deleted");
        onAccountUpdated?.({ role, publicId, change: "deleted" });
      } else {
        setActionError(res?.message || "Unable to complete the deletion.");
      }
    } catch (err) {
      setActionError(err?.message || "Unable to complete the deletion.");
    } finally {
      setFinalDeleting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Navigate to maps
  // -------------------------------------------------------------------------
  const handleNavigate = () => {
    const p = profile || {};
    let query;
    if (p.latitude != null && p.longitude != null) {
      query = `${p.latitude},${p.longitude}`;
    } else {
      query = [p.businessName, p.address, p.city, p.state, p.pincode]
        .filter(Boolean)
        .join(", ");
    }
    if (!query) {
      showToast("No address available to navigate");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenOrder = (order) => {
    onOpenOrder?.({ userRole: role, publicId, order });
  };

  // ===========================================================================
  // RENDER — role-aware header + hero + verification shared by every state
  // ===========================================================================

  const displayName =
    (isDeleted ? null : profile?.name) || selectedUser?.name || "Account";
  const businessName = isDeleted ? null : profile?.businessName;

  const StatusBadge = ({ large = false }) => {
    const meta = STATUS_META[status] || STATUS_META.ACTIVE;
    return (
      <span className={`status-badge ${meta.cls} ${large ? "lg" : ""}`}>
        <span className="status-dot" />
        {meta.label}
      </span>
    );
  };

  const Header = (
    <header className="dt-header">
      <div className="dt-container">
        <div className="dt-header-row">
          <button
            type="button"
            className="dt-icon-btn"
            onClick={() => onBack?.()}
            aria-label="Back to directory"
            title="Back"
          >
            <Icon name="back" size={18} />
          </button>

          <div className="dt-header-titles">
            <span className="dt-eyebrow" style={{ color: theme.accentDeep }}>
              USER &amp; PARTNER DETAILS
            </span>
            <div className="dt-title-line">
              <h1 className="dt-title">{theme.title}</h1>
              {publicId && <span className="dt-id-pill">{publicId}</span>}
            </div>
          </div>

          <div className="dt-header-actions">
            <span
              className="dt-role-badge"
              style={{
                color: theme.accentDeep,
                background: theme.soft,
                borderColor: theme.soft,
              }}
            >
              <Icon name={theme.icon} size={14} />
              {theme.singular}
            </span>
            <button
              type="button"
              className="dt-icon-btn"
              onClick={handleRefresh}
              aria-label="Refresh"
              title="Refresh"
            >
              <Icon name="refresh" size={17} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // ---- Deleted account dedicated view (no sensitive fields rendered) --------
  if (isDeleted) {
    return (
      <div className="dt-root" style={{ "--accent": "#64748b", "--accent-deep": "#475569" }}>
        <style>{DETAILS_CSS}</style>
        <div className="dt-bg" aria-hidden="true">
          <i className="dt-grid" />
          <b className="dt-orb a" />
          <span className="dt-orb b" />
        </div>
        {Header}
        <main className="dt-container dt-main">
          <div className="deleted-view">
            <div className="deleted-icon">
              <Icon name="lock" size={30} />
            </div>
            <h2 className="deleted-title">Account Deleted</h2>
            <p className="deleted-desc">
              All personal profile information for this account has been removed
              or anonymized. Only the minimum retained reference is shown below.
            </p>
            <div className="deleted-grid">
              <div className="deleted-field">
                <span className="info-label">Mobile Number</span>
                <div className="info-value">
                  {profile?.phone ? formatPhone(profile.phone) : "Not retained"}
                </div>
              </div>
              <div className="deleted-field">
                <span className="info-label">Status</span>
                <div className="info-value">
                  <StatusBadge />
                </div>
              </div>
              {profile?.deletedAt && (
                <div className="deleted-field">
                  <span className="info-label">Deleted On</span>
                  <div className="info-value">{formatDate(profile.deletedAt)}</div>
                </div>
              )}
              {profile?.auditReference && (
                <div className="deleted-field">
                  <span className="info-label">Audit Reference</span>
                  <div className="info-value">
                    <CopyPill value={profile.auditReference} />
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="dt-btn ghost" onClick={() => onBack?.()}>
              <Icon name="back" size={15} />
              <span>Back to Directory</span>
            </button>
          </div>
        </main>
        <div className={`dt-toast ${toast ? "show" : ""}`} role="status">
          <Icon name="check" size={15} />
          <span>{toast}</span>
        </div>
      </div>
    );
  }

  // ---- Profile load error ---------------------------------------------------
  if (!loadingProfile && profileError) {
    return (
      <div
        className="dt-root"
        style={{ "--accent": theme.accent, "--accent-deep": theme.accentDeep }}
      >
        <style>{DETAILS_CSS}</style>
        <div className="dt-bg" aria-hidden="true">
          <i className="dt-grid" />
          <b className="dt-orb a" style={{ background: `radial-gradient(circle, ${theme.heroGlow}, transparent 66%)` }} />
          <span className="dt-orb b" />
        </div>
        {Header}
        <main className="dt-container dt-main">
          <div className="state-card error">
            <div className="state-icon error">
              <Icon name="alert" size={28} />
            </div>
            <h3 className="state-title">Unable to load account details</h3>
            <p className="state-desc">{profileError}</p>
            <button type="button" className="dt-btn primary" onClick={loadProfile}>
              <Icon name="refresh" size={15} />
              <span>Retry</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const p = profile || {};
  const aadhaarVerified = !!p.aadhaarVerified;
  const adminVerified = !!p.adminVerified;

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================
  return (
    <div
      className="dt-root"
      style={{ "--accent": theme.accent, "--accent-deep": theme.accentDeep }}
    >
      <style>{DETAILS_CSS}</style>

      <div className="dt-bg" aria-hidden="true">
        <i className="dt-grid" />
        <b
          className="dt-orb a"
          style={{ background: `radial-gradient(circle, ${theme.heroGlow}, transparent 66%)` }}
        />
        <span className="dt-orb b" />
        <em className="dt-orb c" />
      </div>

      {Header}

      <main className="dt-container dt-main">
        {loadingProfile ? (
          <ProfileSkeleton />
        ) : (
          <div className="dt-layout">
            {/* ======================= LEFT COLUMN ======================= */}
            <div className="dt-col-main">
              {/* -------- IDENTITY HERO -------- */}
              <section className="hero-card">
                <span
                  className="hero-accent-bar"
                  style={{ background: theme.avatarBg }}
                />
                <div className="hero-top">
                  <div className="hero-avatar" style={{ background: theme.avatarBg }}>
                    {getInitials(displayName)}
                  </div>
                  <div className="hero-identity">
                    <div className="hero-name-row">
                      <h2 className="hero-name">{displayName}</h2>
                      <StatusBadge large />
                    </div>
                    <div className="hero-role" style={{ color: theme.accentDeep }}>
                      <Icon name={theme.icon} size={14} />
                      {theme.singular}
                    </div>
                    {businessName && (
                      <div className="hero-business">
                        <Icon name="building" size={14} />
                        {businessName}
                      </div>
                    )}
                    <div className="hero-meta">
                      <span className="hero-meta-item">
                        <span className="hm-label">ID</span>
                        <span className="hm-id">{publicId}</span>
                      </span>
                      <span className="hero-meta-dot" />
                      <span className="hero-meta-item">
                        <span className="hm-label">Joined</span>
                        <span className="hm-val">{formatDate(p.joinedAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* -------- VERIFICATION CARDS -------- */}
              <div className="verify-grid">
                <div className="verify-card">
                  <div className="verify-head">
                    <span className="verify-label">Aadhaar</span>
                    <span
                      className={`verify-chip ${aadhaarVerified ? "ok" : "pending"}`}
                    >
                      {aadhaarVerified ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}
                      {aadhaarVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="verify-value mono">{maskAadhaar(p.aadhaarLast4)}</div>
                  <p className="verify-note">
                    Full Aadhaar details are never shown here. Document review
                    uses a separate secure, audited workflow.
                  </p>
                </div>

                <div className="verify-card">
                  <div className="verify-head">
                    <span className="verify-label">Admin Verification</span>
                    <span
                      className={`verify-chip ${adminVerified ? "ok" : "pending"}`}
                    >
                      {adminVerified ? <Icon name="badgeCheck" size={13} /> : <Icon name="clock" size={13} />}
                      {adminVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  {adminVerified ? (
                    <div className="verify-value">
                      Reviewed and approved by StoneRate Admin.
                    </div>
                  ) : (
                    <>
                      <div className="verify-value muted">
                        This account has not yet been verified.
                      </div>
                      <button
                        type="button"
                        className="dt-btn primary sm"
                        onClick={() => {
                          setActionError("");
                          setVerifyModal(true);
                        }}
                      >
                        <Icon name="badgeCheck" size={15} />
                        <span>Verify Account</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* -------- PROFILE INFORMATION -------- */}
              <Section title="PROFILE INFORMATION" icon="doc" accent={theme.accent}>
                <div className="info-grid">
                  <Field label="Public ID">
                    <CopyPill value={publicId} />
                  </Field>
                  <Field label="Full Name">{safeVal(p.name)}</Field>
                  <Field label="Account Type">{theme.singular}</Field>
                  <Field label={theme.businessLabel}>{safeVal(businessName)}</Field>

                  <Field label="Primary Mobile">
                    {p.phone ? (
                      <div className="phone-cell">
                        <span className="phone-text">{formatPhone(p.phone)}</span>
                        <div className="phone-actions">
                          <CopyPill value={p.phone} label="Copy" mono={false} />
                          <a
                            className="phone-call-btn"
                            href={`tel:+91${String(p.phone).replace(/\D/g, "").slice(-10)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="phone" size={13} />
                            Call
                          </a>
                        </div>
                      </div>
                    ) : (
                      "Not provided"
                    )}
                  </Field>

                  <Field label="Alternate Mobile">
                    {p.alternatePhone ? (
                      <div className="phone-cell">
                        <span className="phone-text">
                          {formatPhone(p.alternatePhone)}
                        </span>
                        <div className="phone-actions">
                          <CopyPill value={p.alternatePhone} label="Copy" mono={false} />
                          <a
                            className="phone-call-btn"
                            href={`tel:+91${String(p.alternatePhone).replace(/\D/g, "").slice(-10)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="phone" size={13} />
                            Call
                          </a>
                        </div>
                      </div>
                    ) : (
                      "Not provided"
                    )}
                  </Field>

                  <Field label="Email ID" full>
                    {p.email ? (
                      <div className="phone-cell">
                        <span className="email-text">{p.email}</span>
                        <div className="phone-actions">
                          <CopyPill value={p.email} label="Copy" mono={false} />
                        </div>
                      </div>
                    ) : (
                      "Not provided"
                    )}
                  </Field>

                  {theme.hasGstin && (
                    <Field label="GSTIN">
                      {p.gstin ? (
                        <CopyPill value={p.gstin} />
                      ) : (
                        "Not provided"
                      )}
                    </Field>
                  )}

                  <Field label="Phone Verification">
                    <span className={`inline-chip ${p.phoneVerified ? "ok" : "pending"}`}>
                      {p.phoneVerified ? "Verified" : "Pending"}
                    </span>
                  </Field>
                  <Field label="Last Updated">{formatDate(p.updatedAt)}</Field>
                </div>
              </Section>

              {/* -------- REGISTERED ADDRESS -------- */}
              <Section
                title="REGISTERED ADDRESS"
                icon="pin"
                accent={theme.accent}
                right={
                  (p.address || p.city) && (
                    <button
                      type="button"
                      className="dt-btn ghost sm"
                      onClick={handleNavigate}
                    >
                      <Icon name="navigate" size={14} />
                      <span>Navigate</span>
                    </button>
                  )
                }
              >
                {p.address || p.city || p.state || p.pincode ? (
                  <address className="address-block">
                    {businessName && <strong>{businessName}</strong>}
                    {p.address && <span>{p.address}</span>}
                    {p.city && <span>{p.city}</span>}
                    {p.state && <span>{p.state}</span>}
                    {p.pincode && <span className="pincode">{p.pincode}</span>}
                  </address>
                ) : (
                  <p className="empty-inline">No registered address on file.</p>
                )}
              </Section>

              {/* -------- ROLE-SPECIFIC -------- */}
              {renderRoleSpecific(role, p, theme)}
            </div>

            {/* ======================= RIGHT COLUMN ======================= */}
            <aside className="dt-col-side">
              <div className="side-status-card">
                <span className="side-eyebrow">ACCOUNT STATUS</span>
                <StatusBadge large />
                <div className="side-divider" />
                <div className="side-stat-row">
                  <span className="side-stat-label">Aadhaar</span>
                  <span className={`inline-chip ${aadhaarVerified ? "ok" : "pending"}`}>
                    {aadhaarVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="side-stat-row">
                  <span className="side-stat-label">Admin Review</span>
                  <span className={`inline-chip ${adminVerified ? "ok" : "pending"}`}>
                    {adminVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="side-stat-row">
                  <span className="side-stat-label">Total Orders</span>
                  <span className="side-stat-value">
                    {orderPagination.totalRecords || orders.length || 0}
                  </span>
                </div>
              </div>

              {/* -------- ACCOUNT MANAGEMENT / DANGER ZONE -------- */}
              <div className="danger-card">
                <div className="danger-head">
                  <span className="danger-eyebrow">ACCOUNT MANAGEMENT</span>
                  <p className="danger-sub">
                    Operational, financial, and audit records are always retained.
                  </p>
                </div>

                {isSelfAccount && (
                  <p className="self-note">
                    <Icon name="alert" size={13} />
                    You cannot block or delete your own signed-in account.
                  </p>
                )}

                <div className="danger-actions">
                  {isBlocked ? (
                    <button
                      type="button"
                      className="dt-btn unblock"
                      onClick={() => {
                        setActionError("");
                        setUnblockModal(true);
                      }}
                      disabled={!canBlock}
                    >
                      <Icon name="rotate" size={15} />
                      <span>Unblock Account</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dt-btn block"
                      onClick={() => {
                        setBlockReason("");
                        setActionError("");
                        setBlockStep(1);
                      }}
                      disabled={!canBlock || !isActive}
                    >
                      <Icon name="ban" size={15} />
                      <span>Block Account</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="dt-btn delete"
                    onClick={openDeleteFlow}
                    disabled={!canDelete}
                    title={
                      !isSuperAdmin
                        ? "Only a Super Admin can delete accounts"
                        : isSelfAccount
                        ? "You cannot delete your own account"
                        : "Delete account"
                    }
                  >
                    <Icon name="trash" size={15} />
                    <span>Delete Account</span>
                  </button>

                  {!isSuperAdmin && (
                    <p className="perm-note">
                      Account deletion requires Super Admin permission.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ======================= ORDERS (full width) ======================= */}
        {!loadingProfile && (
          <OrdersSection
            theme={theme}
            orders={orders}
            loadingOrders={loadingOrders}
            loadingMoreOrders={loadingMoreOrders}
            ordersError={ordersError}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            orderPagination={orderPagination}
            onLoadMore={handleLoadMoreOrders}
            onRetry={() => loadOrders(1, false)}
            onOpenOrder={handleOpenOrder}
          />
        )}
      </main>

      {/* ============================ MODALS ============================ */}

      {/* Verify */}
      <Modal open={verifyModal} onClose={() => !verifying && setVerifyModal(false)} labelledBy="verify-title">
        <div className="modal-icon ok">
          <Icon name="badgeCheck" size={24} />
        </div>
        <h3 id="verify-title" className="modal-title">Verify this account?</h3>
        <p className="modal-text">
          You are confirming that the account and submitted registration
          information have been reviewed by StoneRate Admin.
        </p>
        {actionError && <p className="modal-error">{actionError}</p>}
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={() => setVerifyModal(false)} disabled={verifying}>
            Cancel
          </button>
          <button type="button" className="dt-btn primary" onClick={handleVerify} disabled={verifying}>
            {verifying ? (<><span className="btn-spin" />Verifying...</>) : (<><Icon name="check" size={15} />Verify Account</>)}
          </button>
        </div>
      </Modal>

      {/* Block — first confirmation */}
      <Modal open={blockStep === 1} onClose={() => !blocking && setBlockStep(0)} tone="warn" labelledBy="block1-title">
        <div className="modal-icon warn">
          <Icon name="ban" size={24} />
        </div>
        <h3 id="block1-title" className="modal-title">Block this account?</h3>
        <p className="modal-text">
          The account will lose access to StoneRate. Existing operational and
          transaction records will remain preserved.
        </p>
        <label className="modal-field-label" htmlFor="block-reason">Reason for blocking</label>
        <textarea
          id="block-reason"
          className="modal-textarea"
          rows={3}
          placeholder="Add a short reason for this action (recommended)"
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
        />
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={() => setBlockStep(0)}>Cancel</button>
          <button type="button" className="dt-btn block" onClick={() => setBlockStep(2)}>Continue</button>
        </div>
      </Modal>

      {/* Block — second confirmation */}
      <Modal open={blockStep === 2} onClose={() => !blocking && setBlockStep(0)} tone="warn" labelledBy="block2-title">
        <div className="modal-icon warn">
          <Icon name="alert" size={24} />
        </div>
        <h3 id="block2-title" className="modal-title">Confirm account block</h3>
        <p className="modal-text">
          This action will immediately prevent the account from signing in and
          using StoneRate.
        </p>
        {actionError && <p className="modal-error">{actionError}</p>}
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={() => setBlockStep(1)} disabled={blocking}>Go Back</button>
          <button type="button" className="dt-btn block solid" onClick={handleBlock} disabled={blocking}>
            {blocking ? (<><span className="btn-spin" />Blocking...</>) : (<><Icon name="ban" size={15} />Block Account</>)}
          </button>
        </div>
      </Modal>

      {/* Unblock */}
      <Modal open={unblockModal} onClose={() => !unblocking && setUnblockModal(false)} labelledBy="unblock-title">
        <div className="modal-icon ok">
          <Icon name="rotate" size={24} />
        </div>
        <h3 id="unblock-title" className="modal-title">Restore this account?</h3>
        <p className="modal-text">
          The account will regain access to StoneRate after confirmation.
        </p>
        {actionError && <p className="modal-error">{actionError}</p>}
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={() => setUnblockModal(false)} disabled={unblocking}>Cancel</button>
          <button type="button" className="dt-btn unblock solid" onClick={handleUnblock} disabled={unblocking}>
            {unblocking ? (<><span className="btn-spin" />Unblocking...</>) : (<><Icon name="check" size={15} />Unblock Account</>)}
          </button>
        </div>
      </Modal>

      {/* Delete — step 1: warning + type DELETE */}
      <Modal open={deleteStep === 1} onClose={() => !otpSending && closeDeleteFlow()} tone="danger" labelledBy="del1-title">
        <div className="modal-icon danger">
          <Icon name="trash" size={24} />
        </div>
        <h3 id="del1-title" className="modal-title">Delete this account?</h3>
        <p className="modal-text">
          This is a destructive action. Personal profile and account-access data
          will be removed or anonymized. Historical records required for
          operational, audit, financial, support, fraud-prevention, or legal
          purposes may be retained in protected form.
        </p>
        <ul className="impact-list">
          <li>Account login will be permanently disabled</li>
          <li>Name and profile details will be removed</li>
          <li>Email and alternate phone will be removed</li>
          <li>Address will be removed</li>
          <li>Aadhaar reference will be removed</li>
          <li>GSTIN and business profile will be removed where allowed</li>
          <li>Active sessions will be revoked</li>
          <li>Order history will be anonymized where retention is required</li>
          <li className="irreversible">This action cannot be reversed</li>
        </ul>
        <label className="modal-field-label" htmlFor="del-confirm">
          Type <strong>DELETE</strong> to continue
        </label>
        <input
          id="del-confirm"
          type="text"
          className="modal-input"
          placeholder="DELETE"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          autoComplete="off"
        />
        {actionError && <p className="modal-error">{actionError}</p>}
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={closeDeleteFlow} disabled={otpSending}>Cancel</button>
          <button
            type="button"
            className="dt-btn delete solid"
            onClick={handleRequestOtp}
            disabled={deleteConfirmText !== "DELETE" || otpSending}
          >
            {otpSending ? (<><span className="btn-spin" />Sending OTP...</>) : (<><Icon name="right" size={15} />Proceed</>)}
          </button>
        </div>
      </Modal>

      {/* Delete — step 2: OTP */}
      <Modal open={deleteStep === 2} onClose={() => !otpVerifying && closeDeleteFlow()} tone="danger" labelledBy="del2-title">
        <div className="modal-icon danger">
          <Icon name="lock" size={24} />
        </div>
        <h3 id="del2-title" className="modal-title">Security Verification</h3>
        <p className="modal-text">
          A six-digit verification code was sent to the registered Admin phone
          {currentAdmin?.phoneLast4 ? ` ending in ${currentAdmin.phoneLast4}` : ""}.
          Enter it below to authorize this deletion.
        </p>
        <OtpInput value={otpValue} onChange={setOtpValue} disabled={otpVerifying} />
        {otpError && <p className="modal-error">{otpError}</p>}
        <div className="otp-resend">
          <button type="button" className="link-btn" onClick={handleResendOtp} disabled={otpSending || otpVerifying}>
            {otpSending ? "Sending..." : "Resend code"}
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={closeDeleteFlow} disabled={otpVerifying}>Cancel</button>
          <button type="button" className="dt-btn delete solid" onClick={handleVerifyOtp} disabled={otpValue.length !== 6 || otpVerifying}>
            {otpVerifying ? (<><span className="btn-spin" />Verifying...</>) : (<><Icon name="check" size={15} />Verify OTP</>)}
          </button>
        </div>
      </Modal>

      {/* Delete — step 3: final confirmation */}
      <Modal open={deleteStep === 3} onClose={() => !finalDeleting && closeDeleteFlow()} tone="danger" labelledBy="del3-title">
        <div className="modal-icon danger">
          <Icon name="alert" size={24} />
        </div>
        <h3 id="del3-title" className="modal-title">Final account deletion confirmation</h3>
        <p className="modal-text">
          Admin verification was successful. Confirm permanent deletion and
          anonymization of this account.
        </p>
        <div className="final-summary">
          <div className="fs-row"><span>Account ID</span><strong className="mono">{publicId}</strong></div>
          <div className="fs-row"><span>Role</span><strong>{theme.singular}</strong></div>
          <div className="fs-row"><span>Current Status</span><strong>{STATUS_META[status]?.label || status}</strong></div>
          <div className="fs-row"><span>Mobile Number</span><strong>{p.phone ? formatPhone(p.phone) : "Not available"}</strong></div>
        </div>
        {actionError && <p className="modal-error">{actionError}</p>}
        <div className="modal-actions">
          <button type="button" className="dt-btn ghost" onClick={closeDeleteFlow} disabled={finalDeleting}>Cancel Deletion</button>
          <button type="button" className="dt-btn delete solid" onClick={handleFinalDelete} disabled={finalDeleting}>
            {finalDeleting ? (<><span className="btn-spin" />Deleting Account...</>) : (<><Icon name="trash" size={15} />Permanently Delete</>)}
          </button>
        </div>
      </Modal>

      {/* Toast */}
      <div className={`dt-toast ${toast ? "show" : ""}`} role="status">
        <Icon name="check" size={15} />
        <span>{toast}</span>
      </div>
    </div>
  );
}

// ============================================================================
// ROLE-SPECIFIC SECTIONS
// ============================================================================

function renderRoleSpecific(role, p, theme) {
  if (role === "buyer") {
    const cats = Array.isArray(p.categories) ? p.categories : [];
    return (
      <Section title="BUYER DETAILS" icon="user" accent={theme.accent}>
        <div className="info-grid">
          <Field label="Shop Name">{safeVal(p.businessName)}</Field>
          <Field label="Total Requests">{p.totalRequests ?? 0}</Field>
          <Field label="Active Orders">{p.activeOrders ?? 0}</Field>
          <Field label="Delivered Orders">{p.deliveredOrders ?? 0}</Field>
          <Field label="Delivery Availability">
            {p.deliveryAvailable ? "Available" : "Not set"}
          </Field>
        </div>
        {cats.length > 0 && (
          <div className="chip-wrap" style={{ marginTop: 12 }}>
            {cats.map((c, i) => (
              <span key={i} className="data-chip">{c}</span>
            ))}
          </div>
        )}
      </Section>
    );
  }

  if (role === "stone_seller") {
    const mats = Array.isArray(p.materialCategories) ? p.materialCategories : [];
    return (
      <Section title="STONE SELLER DETAILS" icon="cube" accent={theme.accent}>
        <div className="info-grid">
          <Field label="Plant / Business Name">{safeVal(p.businessName)}</Field>
          <Field label="Seller Product Type">{safeVal(p.productType)}</Field>
          <Field label="Daily Production">
            {p.dailyProduction ? `${p.dailyProduction}` : "Not provided"}
          </Field>
          <Field label="GSTIN">
            {p.gstin ? <CopyPill value={p.gstin} /> : "Not provided"}
          </Field>
        </div>
        {mats.length > 0 && (
          <>
            <span className="sub-eyebrow">Material Categories</span>
            <div className="chip-wrap">
              {mats.map((m, i) => (
                <span key={i} className="data-chip">{m}</span>
              ))}
            </div>
          </>
        )}
      </Section>
    );
  }

  if (role === "sand_seller") {
    const conversions = Array.isArray(p.bucketConversions) ? p.bucketConversions : [];
    return (
      <Section title="BUCKET CONVERSION INFORMATION" icon="layers" accent={theme.accent}>
        {conversions.length === 0 ? (
          <p className="empty-inline">No bucket conversion information has been saved.</p>
        ) : (
          <div className="conversion-grid">
            {conversions.map((cv, i) => (
              <div key={i} className={`conversion-card ${cv.active === false ? "inactive" : ""}`}>
                <div className="cv-top">
                  <span className="cv-material">{cv.materialName}</span>
                  <span className={`cv-state ${cv.active === false ? "off" : "on"}`}>
                    {cv.active === false ? "Unavailable" : "Active"}
                  </span>
                </div>
                <div className="cv-value">
                  <strong>1 bucket</strong>
                  <span className="cv-eq">=</span>
                  <strong>{cv.cubicFeet} feet</strong>
                </div>
                {cv.updatedAt && (
                  <span className="cv-updated">Updated {formatDate(cv.updatedAt)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    );
  }

  if (role === "transporter") {
    const trucks = Array.isArray(p.trucks) ? p.trucks : [];
    const cities = Array.isArray(p.registeredCities) ? p.registeredCities : [];
    const totalFleet = trucks.reduce((sum, t) => sum + Number(t.truckCount || 0), 0);
    return (
      <>
        <Section
          title="REGISTERED TRUCKS"
          icon="truck"
          accent={theme.accent}
          right={
            trucks.length > 0 && (
              <span className="count-chip" style={{ background: theme.soft, color: theme.accentDeep }}>
                {totalFleet} total
              </span>
            )
          }
        >
          {trucks.length === 0 ? (
            <p className="empty-inline">No trucks have been registered for this Transporter.</p>
          ) : (
            <div className="truck-grid">
              {trucks.map((t, i) => (
                <div key={i} className="truck-card">
                  <span className="truck-icon" style={{ color: theme.accentDeep, background: theme.soft }}>
                    <Icon name="truck" size={16} />
                  </span>
                  <div className="truck-info">
                    <span className="truck-type">{t.truckType}</span>
                    <span className="truck-count">
                      {t.truckCount} {Number(t.truckCount) === 1 ? "truck" : "trucks"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="REGISTERED OPERATING CITIES"
          icon="pin"
          accent={theme.accent}
          right={
            cities.length > 0 && (
              <span className="count-chip" style={{ background: theme.soft, color: theme.accentDeep }}>
                {cities.length} {cities.length === 1 ? "city" : "cities"}
              </span>
            )
          }
        >
          {cities.length === 0 ? (
            <p className="empty-inline">No operating cities have been registered.</p>
          ) : (
            <div className="chip-wrap">
              {cities.map((c, i) => (
                <span key={i} className="city-chip">
                  <Icon name="pin" size={12} />
                  {c}
                </span>
              ))}
            </div>
          )}
        </Section>
      </>
    );
  }

  if (role === "admin") {
    return (
      <Section title="ADMIN DETAILS" icon="shield" accent={theme.accent}>
        <div className="info-grid">
          <Field label="Admin Role">{safeVal(p.businessName || p.adminRole, "System Administrator")}</Field>
          <Field label="Account Status">
            {STATUS_META[normStatus(p.status)]?.label || "Active"}
          </Field>
          <Field label="Phone Verification">
            <span className={`inline-chip ${p.phoneVerified ? "ok" : "pending"}`}>
              {p.phoneVerified ? "Verified" : "Pending"}
            </span>
          </Field>
          <Field label="Last Login">{p.lastLogin ? formatDate(p.lastLogin) : "Not available"}</Field>
          <Field label="Joined">{formatDate(p.joinedAt)}</Field>
          <Field label="Permission Level">
            {p.permissionLevel === "super_admin" ? "Super Admin" : "Admin"}
          </Field>
        </div>
      </Section>
    );
  }

  return null;
}

// ============================================================================
// ORDERS SECTION
// ============================================================================

function OrdersSection({
  theme,
  orders,
  loadingOrders,
  loadingMoreOrders,
  ordersError,
  orderSearch,
  setOrderSearch,
  orderPagination,
  onLoadMore,
  onRetry,
  onOpenOrder,
}) {
  const hasMore = orderPagination.page < orderPagination.totalPages;

  const renderId = (val) =>
    val ? (
      <CopyPill value={val} />
    ) : (
      <span className="not-assigned">Not assigned</span>
    );

  return (
    <section className="orders-panel">
      <div className="orders-head">
        <div className="orders-title-wrap">
          <span className="section-icon" style={{ color: theme.accent }}>
            <Icon name="box" size={16} />
          </span>
          <h2 className="section-title">LATEST ORDERS</h2>
          {orderPagination.totalRecords > 0 && (
            <span className="count-chip" style={{ background: theme.soft, color: theme.accentDeep }}>
              {orderPagination.totalRecords} total
            </span>
          )}
        </div>
      </div>

      <div className="orders-search">
        <span className="search-icon"><Icon name="search" size={15} /></span>
        <input
          type="text"
          className="orders-search-input"
          placeholder="Search by material, quantity, date, Request ID, Delivery ID, or Transport ID"
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          aria-label="Search orders"
        />
        {orderSearch && (
          <button type="button" className="clear-btn" onClick={() => setOrderSearch("")} aria-label="Clear search">
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      {loadingOrders ? (
        <div className="orders-skeleton">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="osk-row">
              <div className="osk-line w40" />
              <div className="osk-line w20" />
              <div className="osk-line w30" />
            </div>
          ))}
        </div>
      ) : ordersError ? (
        <div className="state-card error compact">
          <div className="state-icon error"><Icon name="alert" size={24} /></div>
          <h3 className="state-title">Unable to load order history</h3>
          <p className="state-desc">{ordersError}</p>
          <button type="button" className="dt-btn primary sm" onClick={onRetry}>
            <Icon name="refresh" size={14} />Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="state-card empty compact">
          <div className="state-icon" style={{ background: theme.soft, color: theme.accentDeep }}>
            <Icon name="box" size={24} />
          </div>
          <h3 className="state-title">
            {orderSearch ? "No orders match your search" : "No orders found for this account"}
          </h3>
          {orderSearch && (
            <button type="button" className="dt-btn ghost sm" onClick={() => setOrderSearch("")}>
              Reset search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Date</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Request ID</th>
                  <th>Delivery ID</th>
                  <th>Transport ID</th>
                  <th className="th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id || o.requestId || i}>
                    <td className="od-date">{formatDate(o.orderDate)}</td>
                    <td className="od-material">{safeVal(o.materialName, "--")}</td>
                    <td className="od-qty">{formatQuantity(o.quantity, o.quantityUnit)}</td>
                    <td>{renderId(o.requestId)}</td>
                    <td>{renderId(o.deliveryId)}</td>
                    <td>{renderId(o.transportId)}</td>
                    <td className="td-action">
                      <button type="button" className="order-view-btn" onClick={() => onOpenOrder(o)}>
                        <span>View</span>
                        <Icon name="right" size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="orders-cards">
            {orders.map((o, i) => (
              <article key={o.id || o.requestId || i} className="order-card">
                <div className="oc-top">
                  <span className="oc-date">{formatDate(o.orderDate)}</span>
                  <span className="oc-qty">{formatQuantity(o.quantity, o.quantityUnit)}</span>
                </div>
                <div className="oc-material">{safeVal(o.materialName, "--")}</div>
                <div className="oc-ids">
                  <div className="oc-id-row">
                    <span className="oc-id-label">Request ID</span>
                    {renderId(o.requestId)}
                  </div>
                  <div className="oc-id-row">
                    <span className="oc-id-label">Delivery ID</span>
                    {renderId(o.deliveryId)}
                  </div>
                  <div className="oc-id-row">
                    <span className="oc-id-label">Transport ID</span>
                    {renderId(o.transportId)}
                  </div>
                </div>
                <button type="button" className="dt-btn ghost full" onClick={() => onOpenOrder(o)}>
                  <span>View Order</span>
                  <Icon name="right" size={14} />
                </button>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="orders-loadmore">
              <span className="loadmore-count">
                Showing {orders.length} of {orderPagination.totalRecords} orders
              </span>
              <button
                type="button"
                className="dt-btn ghost"
                onClick={onLoadMore}
                disabled={loadingMoreOrders}
              >
                {loadingMoreOrders ? (<><span className="btn-spin" />Loading...</>) : (<><span>Load More</span><Icon name="down" size={15} /></>)}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ProfileSkeleton() {
  return (
    <div className="dt-layout" aria-busy="true">
      <div className="dt-col-main">
        <div className="sk-card sk-hero">
          <div className="sk-avatar" />
          <div className="sk-lines">
            <div className="sk-line w50" />
            <div className="sk-line w30" />
            <div className="sk-line w40" />
          </div>
        </div>
        <div className="verify-grid">
          <div className="sk-card sk-sm" />
          <div className="sk-card sk-sm" />
        </div>
        <div className="sk-card sk-block" />
        <div className="sk-card sk-block" />
      </div>
      <aside className="dt-col-side">
        <div className="sk-card sk-side" />
        <div className="sk-card sk-side" />
      </aside>
    </div>
  );
}

// ============================================================================
// STYLESHEET — theme matched to StoneRateAdminUsersPartners.js, typography
// scaled up per spec (readable sizes on mobile + desktop).
// ============================================================================

const DETAILS_CSS = `
.dt-root {
  --o: #f97316;
  --o2: #c2560b;
  --ink: #141a24;
  --muted: #6b7687;
  --faint: #96a0af;
  --line: #e9edf3;
  --line2: #dbe2ec;
  --card: #ffffff;
  --panel: #f8fafc;
  --green: #1f9463;
  --red: #d64545;
  --accent: #f97316;
  --accent-deep: #c2560b;

  min-height: 100vh;
  height: auto;
  overflow-x: hidden;
  padding-bottom: 72px;
  color: var(--ink);
  background: #f4f7fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.dt-root * { box-sizing: border-box; }
.dt-root button, .dt-root input, .dt-root select, .dt-root textarea { font: inherit; }

/* Ambient background */
.dt-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.dt-grid {
  position: absolute; inset: 0;
  background: linear-gradient(transparent 0 31px, rgba(24,42,72,0.035) 31px 32px),
              linear-gradient(90deg, transparent 0 31px, rgba(24,42,72,0.035) 31px 32px);
  background-size: 32px 32px;
  mask-image: radial-gradient(120% 80% at 50% 0%, #000 18%, transparent 76%);
}
.dt-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.5; }
.dt-orb.a { width: 46vw; height: 46vw; left: -10vw; top: -16vw; background: radial-gradient(circle, rgba(255,168,74,0.5), transparent 66%); }
.dt-orb.b { width: 40vw; height: 40vw; right: -12vw; top: -6vw; background: radial-gradient(circle, rgba(80,140,255,0.3), transparent 66%); }
.dt-orb.c { width: 34vw; height: 34vw; left: 36vw; top: 30vw; background: radial-gradient(circle, rgba(13,148,136,0.2), transparent 68%); }

/* Container */
.dt-container { width: min(100%, 1140px); margin: 0 auto; padding: 0 18px; position: relative; z-index: 1; }

/* Header */
.dt-header {
  position: sticky; top: 0; z-index: 20;
  border-bottom: 1px solid rgba(16,28,50,0.07);
  background: rgba(244,247,251,0.88);
  backdrop-filter: blur(10px);
  padding: 14px 0;
}
.dt-header-row { display: flex; align-items: center; gap: 14px; }
.dt-icon-btn {
  width: 42px; height: 42px; display: grid; place-items: center;
  border: 1px solid var(--line2); border-radius: 12px; background: #fff;
  color: var(--ink); cursor: pointer; flex-shrink: 0; transition: all .16s ease;
}
.dt-icon-btn:hover { border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,.05); }
.dt-icon-btn:active { transform: translateY(0); }
.dt-header-titles { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dt-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.dt-title-line { display: flex; align-items: center; gap: 11px; flex-wrap: wrap; }
.dt-title { margin: 0; font-size: 25px; font-weight: 850; letter-spacing: -0.02em; line-height: 1.15; color: var(--ink); }
.dt-id-pill {
  padding: 4px 11px; border-radius: 999px; background: #fff; border: 1px solid var(--line2);
  color: #334155; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; font-weight: 750; letter-spacing: 0.02em;
}
.dt-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dt-role-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px; border-radius: 999px; border: 1px solid transparent;
  font-size: 12.5px; font-weight: 750;
}

/* Main / layout */
.dt-main { margin-top: 20px; }
.dt-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
.dt-col-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.dt-col-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 90px; }

/* Hero identity card */
.hero-card {
  position: relative; overflow: hidden;
  padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: var(--card);
  box-shadow: 0 10px 30px rgba(20,26,36,0.05);
}
.hero-accent-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
.hero-top { display: flex; gap: 18px; align-items: flex-start; }
.hero-avatar {
  width: 72px; height: 72px; border-radius: 18px; display: grid; place-items: center;
  color: #fff; font-size: 26px; font-weight: 850; flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(20,26,36,0.18);
}
.hero-identity { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.hero-name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.hero-name { margin: 0; font-size: 24px; font-weight: 850; letter-spacing: -0.02em; color: var(--ink); }
.hero-role { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 750; }
.hero-business { display: inline-flex; align-items: center; gap: 7px; color: var(--muted); font-size: 14px; font-weight: 600; }
.hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
.hero-meta-item { display: inline-flex; align-items: center; gap: 7px; }
.hm-label { font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
.hm-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-weight: 750; color: #334155; }
.hm-val { font-size: 13px; font-weight: 650; color: var(--muted); }
.hero-meta-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--line2); }

/* Status badge */
.status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 800;
  letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap;
}
.status-badge.lg { font-size: 12px; padding: 6px 13px; }
.status-badge .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.st-active { background: #dcfce7; color: #15803d; }
.st-pending { background: #fef3c7; color: #92400e; }
.st-blocked { background: #fee2e2; color: #b91c1c; }
.st-suspended { background: #ffedd5; color: #c2410c; }
.st-deleted { background: #f1f5f9; color: #64748b; }

/* Verification cards */
.verify-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.verify-card {
  padding: 16px 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--card);
  box-shadow: 0 6px 18px rgba(20,26,36,0.04); display: flex; flex-direction: column; gap: 9px;
}
.verify-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.verify-label { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
.verify-chip {
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 800;
}
.verify-chip.ok { background: #dcfce7; color: #15803d; }
.verify-chip.pending { background: #fef3c7; color: #92400e; }
.verify-value { font-size: 15px; font-weight: 700; color: var(--ink); }
.verify-value.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.04em; }
.verify-value.muted { color: var(--muted); font-weight: 600; font-size: 13.5px; }
.verify-note { margin: 0; font-size: 12px; line-height: 1.5; color: var(--faint); }

/* Section */
.detail-section {
  border: 1px solid var(--line); border-radius: 16px; background: var(--card);
  box-shadow: 0 6px 18px rgba(20,26,36,0.04); overflow: hidden;
}
.section-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 15px 18px; border-bottom: 1px solid var(--line); background: #fafbfd;
}
.section-title-wrap { display: flex; align-items: center; gap: 9px; min-width: 0; }
.section-icon {
  width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px;
  background: #f1f5f9; color: var(--muted); flex-shrink: 0;
}
.section-title { margin: 0; font-size: 14.5px; font-weight: 850; letter-spacing: 0.03em; text-transform: uppercase; color: var(--ink); }
.section-body { padding: 18px; }
.sub-eyebrow { display: block; margin: 14px 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }

/* Info grid */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; }
.info-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.info-field.full { grid-column: 1 / -1; }
.info-label { font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--faint); }
.info-value { font-size: 14.5px; font-weight: 650; color: var(--ink); word-break: break-word; }

/* Copy pill */
.copy-row { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.copy-val { font-size: 14px; font-weight: 700; color: var(--ink); }
.copy-val.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.02em; font-size: 13.5px; }
.copy-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 8px;
  border: 1px solid var(--line2); background: #fff; color: var(--muted);
  font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all .15s ease;
}
.copy-btn:hover { border-color: var(--accent); color: var(--accent-deep); background: #fff8f1; }
.copy-btn.copied { border-color: #86efac; background: #f0fdf4; color: #15803d; }
.copy-btn-text { line-height: 1; }

/* Phone / email cells */
.phone-cell { display: flex; flex-direction: column; gap: 7px; }
.phone-text { font-size: 15px; font-weight: 750; color: var(--ink); letter-spacing: 0.01em; }
.email-text { font-size: 14px; font-weight: 650; color: var(--ink); word-break: break-all; }
.phone-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.phone-call-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px;
  border: 1px solid var(--line2); background: #fff; color: var(--green);
  font-size: 11.5px; font-weight: 750; cursor: pointer; text-decoration: none; transition: all .15s ease;
}
.phone-call-btn:hover { border-color: #86efac; background: #f0fdf4; }

.inline-chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 750; }
.inline-chip.ok { background: #dcfce7; color: #15803d; }
.inline-chip.pending { background: #fef3c7; color: #92400e; }

/* Address */
.address-block { display: flex; flex-direction: column; gap: 3px; font-style: normal; }
.address-block strong { font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 2px; }
.address-block span { font-size: 14px; color: var(--muted); line-height: 1.5; }
.address-block .pincode { font-weight: 700; color: var(--ink); font-family: ui-monospace, monospace; }
.empty-inline { margin: 0; font-size: 13.5px; color: var(--muted); }

/* Chips */
.chip-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.data-chip {
  padding: 6px 13px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line2);
  color: var(--ink); font-size: 13px; font-weight: 650;
}
.city-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px;
  background: var(--panel); border: 1px solid var(--line2); color: var(--ink); font-size: 13.5px; font-weight: 700;
}
.city-chip svg { color: var(--accent); }
.count-chip { padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 800; }

/* Sand bucket conversions */
.conversion-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.conversion-card {
  padding: 14px 16px; border: 1px solid var(--line2); border-radius: 14px; background: var(--panel);
  display: flex; flex-direction: column; gap: 8px;
}
.conversion-card.inactive { opacity: 0.62; }
.cv-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cv-material { font-size: 14.5px; font-weight: 800; color: var(--ink); }
.cv-state { font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.03em; }
.cv-state.on { background: #dcfce7; color: #15803d; }
.cv-state.off { background: #f1f5f9; color: #64748b; }
.cv-value { display: flex; align-items: center; gap: 8px; font-size: 16px; color: var(--ink); }
.cv-value strong { font-weight: 800; }
.cv-eq { color: var(--accent); font-weight: 800; }
.cv-updated { font-size: 11.5px; color: var(--faint); }

/* Trucks */
.truck-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.truck-card {
  display: flex; align-items: center; gap: 12px; padding: 13px 15px;
  border: 1px solid var(--line2); border-radius: 14px; background: var(--panel);
}
.truck-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; flex-shrink: 0; }
.truck-info { display: flex; flex-direction: column; gap: 2px; }
.truck-type { font-size: 14.5px; font-weight: 800; color: var(--ink); }
.truck-count { font-size: 13px; font-weight: 650; color: var(--muted); }

/* Side status card */
.side-status-card {
  padding: 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--card);
  box-shadow: 0 6px 18px rgba(20,26,36,0.04); display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
}
.side-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
.side-divider { width: 100%; height: 1px; background: var(--line); }
.side-stat-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.side-stat-label { font-size: 13px; font-weight: 650; color: var(--muted); }
.side-stat-value { font-size: 16px; font-weight: 850; color: var(--ink); }

/* Danger zone */
.danger-card {
  padding: 18px; border: 1px solid #f5d5d0; border-radius: 16px;
  background: linear-gradient(180deg, #fffaf9, #fff);
  box-shadow: 0 6px 18px rgba(214,69,69,0.05); display: flex; flex-direction: column; gap: 14px;
}
.danger-head { display: flex; flex-direction: column; gap: 4px; }
.danger-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--red); }
.danger-sub { margin: 0; font-size: 12px; line-height: 1.5; color: var(--muted); }
.danger-actions { display: flex; flex-direction: column; gap: 10px; }
.self-note, .perm-note {
  margin: 0; display: flex; align-items: center; gap: 6px;
  font-size: 12px; line-height: 1.45; color: #b45309;
}
.perm-note { color: var(--faint); }

/* Buttons */
.dt-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 18px; border-radius: 12px; border: 1px solid transparent;
  font-size: 14px; font-weight: 750; cursor: pointer; transition: all .16s ease; white-space: nowrap;
}
.dt-btn.sm { padding: 8px 14px; font-size: 13px; }
.dt-btn.full { width: 100%; }
.dt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.dt-btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent-deep)); color: #fff; box-shadow: 0 5px 14px rgba(249,115,22,0.22); }
.dt-btn.primary:not(:disabled):hover { filter: brightness(1.05); transform: translateY(-1px); }
.dt-btn.ghost { background: #fff; border-color: var(--line2); color: var(--ink); }
.dt-btn.ghost:not(:disabled):hover { border-color: var(--accent); color: var(--accent-deep); background: #fff8f1; }
.dt-btn.block { background: #fff; border-color: #fca5a5; color: #c2410c; }
.dt-btn.block:not(:disabled):hover { background: #fff7ed; border-color: #f97316; }
.dt-btn.block.solid { background: linear-gradient(135deg, #f97316, #dc2626); color: #fff; border-color: transparent; box-shadow: 0 5px 14px rgba(220,38,38,0.2); }
.dt-btn.unblock { background: #fff; border-color: #86efac; color: #15803d; }
.dt-btn.unblock:not(:disabled):hover { background: #f0fdf4; border-color: #22c55e; }
.dt-btn.unblock.solid { background: linear-gradient(135deg, #22c55e, #15803d); color: #fff; border-color: transparent; box-shadow: 0 5px 14px rgba(21,128,61,0.2); }
.dt-btn.delete { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
.dt-btn.delete:not(:disabled):hover { background: #fee2e2; border-color: #ef4444; }
.dt-btn.delete.solid { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; border-color: transparent; box-shadow: 0 5px 14px rgba(185,28,28,0.25); }
.btn-spin { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: dt-spin .8s linear infinite; }
.dt-btn.ghost .btn-spin, .dt-btn.primary.sm .btn-spin { border-color: rgba(0,0,0,0.15); border-top-color: var(--accent); }
@keyframes dt-spin { to { transform: rotate(360deg); } }
.link-btn { border: 0; background: transparent; color: var(--accent-deep); font-size: 13px; font-weight: 750; cursor: pointer; padding: 0; }
.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Orders panel */
.orders-panel {
  margin-top: 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--card);
  box-shadow: 0 6px 20px rgba(20,26,36,0.04); overflow: hidden;
}
.orders-head { padding: 15px 18px; border-bottom: 1px solid var(--line); background: #fafbfd; }
.orders-title-wrap { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.orders-search {
  margin: 16px 18px; display: flex; align-items: center; gap: 9px; height: 46px; padding: 0 14px;
  border: 1px solid var(--line2); border-radius: 12px; background: #fff; color: var(--muted);
  transition: border-color .18s ease, box-shadow .18s ease;
}
.orders-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(249,115,22,0.1); color: var(--accent-deep); }
.orders-search .search-icon { display: grid; place-items: center; flex-shrink: 0; }
.orders-search-input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 14px; }
.clear-btn { width: 26px; height: 26px; display: grid; place-items: center; border: 0; border-radius: 7px; background: #f1f5f9; color: var(--muted); cursor: pointer; flex-shrink: 0; }
.clear-btn:hover { background: #e2e8f0; color: var(--ink); }

/* Orders table */
.orders-table-wrap { overflow-x: auto; padding: 0 6px; }
.orders-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
.orders-table th {
  padding: 11px 14px; color: var(--faint); font-size: 10.5px; font-weight: 800;
  letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; border-bottom: 1px solid var(--line2);
}
.orders-table td { padding: 13px 14px; border-bottom: 1px solid var(--line); font-size: 13.5px; vertical-align: middle; }
.orders-table tr:last-child td { border-bottom: 0; }
.orders-table tbody tr:hover, .orders-table tbody tr:hover { background: #fbfcfe; }
.od-date { color: var(--muted); font-weight: 650; white-space: nowrap; }
.od-material { font-weight: 800; color: var(--ink); }
.od-qty { font-weight: 750; color: var(--ink); white-space: nowrap; }
.th-action, .td-action { text-align: right; }
.not-assigned { font-size: 12px; font-weight: 650; color: var(--faint); font-style: italic; }
.order-view-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 7px 13px; border-radius: 9px;
  border: 1px solid var(--line2); background: #fff; color: var(--accent-deep); font-size: 12.5px; font-weight: 750; cursor: pointer; transition: all .15s ease;
}
.order-view-btn:hover { border-color: var(--accent); background: #fff8f1; }

/* Orders cards (mobile) */
.orders-cards { display: none; flex-direction: column; gap: 12px; padding: 0 16px 16px; }
.order-card {
  padding: 14px; border: 1px solid var(--line); border-radius: 14px; background: #fff;
  display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(20,26,36,0.03);
}
.oc-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.oc-date { font-size: 12.5px; font-weight: 700; color: var(--muted); }
.oc-qty { font-size: 14px; font-weight: 800; color: var(--ink); }
.oc-material { font-size: 16px; font-weight: 850; color: var(--ink); }
.oc-ids { display: flex; flex-direction: column; gap: 9px; padding: 11px; border-radius: 11px; background: var(--panel); }
.oc-id-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.oc-id-label { font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--faint); }

/* Load more */
.orders-loadmore { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 18px; border-top: 1px solid var(--line); background: #fafbfd; }
.loadmore-count { font-size: 13px; color: var(--muted); }

/* State cards */
.state-card { padding: 46px 22px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.state-card.compact { padding: 36px 20px; }
.state-icon { width: 60px; height: 60px; display: grid; place-items: center; border-radius: 17px; }
.state-icon.error { background: rgba(214,69,69,0.1); color: var(--red); }
.state-title { margin: 0; font-size: 17px; font-weight: 800; color: var(--ink); }
.state-desc { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--muted); max-width: 400px; }

/* Modals */
.sr-modal-scrim {
  position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
  padding: 18px; background: rgba(16,24,40,0.55); backdrop-filter: blur(3px);
  animation: dt-fade .18s ease; overflow-y: auto;
}
@keyframes dt-fade { from { opacity: 0; } to { opacity: 1; } }
.sr-modal-card {
  width: min(100%, 480px); max-height: calc(100vh - 36px); overflow-y: auto;
  padding: 26px; border-radius: 20px; background: #fff;
  box-shadow: 0 24px 60px rgba(0,0,0,0.28); animation: dt-pop .2s cubic-bezier(0.16,1,0.3,1);
  display: flex; flex-direction: column; gap: 13px;
}
@keyframes dt-pop { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }
.modal-icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; }
.modal-icon.ok { background: #dcfce7; color: #15803d; }
.modal-icon.warn { background: #ffedd5; color: #c2410c; }
.modal-icon.danger { background: #fee2e2; color: #b91c1c; }
.modal-title { margin: 0; font-size: 20px; font-weight: 850; letter-spacing: -0.01em; color: var(--ink); }
.modal-text { margin: 0; font-size: 14px; line-height: 1.55; color: var(--muted); }
.modal-error { margin: 0; padding: 9px 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 13px; font-weight: 650; }
.modal-field-label { font-size: 12.5px; font-weight: 750; color: var(--ink); }
.modal-field-label strong { color: var(--red); font-weight: 850; }
.modal-input, .modal-textarea {
  width: 100%; padding: 11px 13px; border: 1px solid var(--line2); border-radius: 11px;
  background: #fff; color: var(--ink); font-size: 14px; outline: 0; transition: border-color .16s ease, box-shadow .16s ease;
}
.modal-input:focus, .modal-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
.modal-textarea { resize: vertical; min-height: 72px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; flex-wrap: wrap; }
.modal-actions .dt-btn { flex: 1; min-width: 130px; }

/* Impact list */
.impact-list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 5px; }
.impact-list li { font-size: 13px; line-height: 1.45; color: var(--muted); }
.impact-list li.irreversible { color: #b91c1c; font-weight: 750; }

/* Final summary */
.final-summary { display: flex; flex-direction: column; gap: 9px; padding: 14px; border-radius: 12px; background: var(--panel); border: 1px solid var(--line2); }
.fs-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13.5px; }
.fs-row span { color: var(--muted); font-weight: 650; }
.fs-row strong { color: var(--ink); font-weight: 800; }
.fs-row strong.mono { font-family: ui-monospace, monospace; }

/* OTP */
.otp-group { display: flex; gap: 10px; justify-content: center; margin: 4px 0; }
.otp-box {
  width: 48px; height: 56px; text-align: center; font-size: 22px; font-weight: 800;
  border: 1px solid var(--line2); border-radius: 12px; background: #fff; color: var(--ink); outline: 0;
  transition: border-color .16s ease, box-shadow .16s ease;
}
.otp-box:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
.otp-box:disabled { background: var(--panel); }
.otp-resend { text-align: center; }

/* Deleted view */
.deleted-view {
  max-width: 560px; margin: 40px auto; padding: 36px 28px; text-align: center;
  border: 1px solid var(--line); border-radius: 20px; background: var(--card);
  box-shadow: 0 10px 30px rgba(20,26,36,0.05); display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.deleted-icon { width: 66px; height: 66px; display: grid; place-items: center; border-radius: 18px; background: #f1f5f9; color: #64748b; }
.deleted-title { margin: 0; font-size: 24px; font-weight: 850; color: var(--ink); }
.deleted-desc { margin: 0; font-size: 14px; line-height: 1.55; color: var(--muted); max-width: 420px; }
.deleted-grid { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 8px 0; text-align: left; }
.deleted-field { display: flex; flex-direction: column; gap: 5px; padding: 13px 15px; border: 1px solid var(--line2); border-radius: 13px; background: var(--panel); }

/* Skeleton */
.sk-card { border: 1px solid var(--line); border-radius: 16px; background: var(--card); overflow: hidden; position: relative; }
.sk-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: dt-shimmer 1.4s infinite; }
@keyframes dt-shimmer { 100% { transform: translateX(100%); } }
.sk-hero { padding: 22px; display: flex; gap: 18px; }
.sk-avatar { width: 72px; height: 72px; border-radius: 18px; background: #e2e8f0; flex-shrink: 0; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
.sk-line { height: 14px; border-radius: 6px; background: #e2e8f0; }
.sk-line.w50 { width: 50%; } .sk-line.w40 { width: 40%; } .sk-line.w30 { width: 30%; }
.sk-sm { height: 120px; } .sk-block { height: 180px; } .sk-side { height: 160px; }

/* Toast */
.dt-toast {
  position: fixed; bottom: 26px; left: 50%; transform: translateX(-50%) translateY(40px); z-index: 1100;
  display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 999px;
  background: #141a24; color: #fff; font-size: 13.5px; font-weight: 700; box-shadow: 0 10px 28px rgba(0,0,0,0.22);
  opacity: 0; pointer-events: none; transition: all .24s cubic-bezier(0.16,1,0.3,1);
}
.dt-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
.dt-toast svg { color: #4ade80; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 980px) {
  .dt-layout { grid-template-columns: 1fr; }
  .dt-col-side { position: static; }
}
@media (max-width: 680px) {
  .dt-container { padding: 0 14px; }
  .dt-title { font-size: 22px; }
  .dt-header-row { flex-wrap: wrap; }
  .dt-header-titles { order: 3; flex-basis: 100%; }
  .hero-top { flex-direction: column; }
  .hero-avatar { width: 64px; height: 64px; font-size: 23px; }
  .hero-name { font-size: 21px; }
  .verify-grid { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr; }
  .orders-table-wrap { display: none; }
  .orders-cards { display: flex; }
  .conversion-grid, .truck-grid { grid-template-columns: 1fr; }
  .deleted-grid { grid-template-columns: 1fr; }
  .modal-actions .dt-btn { flex-basis: 100%; }
  .otp-box { width: 42px; height: 50px; font-size: 19px; }
}
@media (max-width: 380px) {
  .otp-group { gap: 6px; }
  .otp-box { width: 38px; height: 46px; }
}
`;
