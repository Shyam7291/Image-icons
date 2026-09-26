import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/*
 * StoneRate Admin — Transporter Active Order Details
 * ---------------------------------------------------
 * Frontend-only, callback-driven page. Visual theme mirrors AdminActiveOrderDetails.js
 * (same tokens, header, glass panels, sheets, status palette, toast).
 * No backend calls are made here; all data arrives through `selectedOrder`
 * and every mutation goes through the supplied callbacks.
 */

const NOOP = () => {};
const ASYNC_NOOP = async () => {};
const NOTE_LIMIT = 500;

const STATUS_META = {
  new: { label: "NEW", icon: "spark", stage: "Awaiting vehicle loading", tone: "new" },
  loading: { label: "LOADING", icon: "activity", stage: "Vehicle loading in progress", tone: "loading" },
  loaded: { label: "LOADED", icon: "check", stage: "Loading complete, ready to dispatch", tone: "loaded" },
  dispatched: { label: "DISPATCHED", icon: "truck", stage: "Dispatched from Seller location", tone: "dispatched" }
};
const UNKNOWN_META = { label: "UNKNOWN", icon: "alert", stage: "Status not provided", tone: "unknown" };
const STAGES = ["new", "loading", "loaded", "dispatched"];
const STAGE_LABELS = { new: "Confirmed", loading: "Loading", loaded: "Loaded", dispatched: "Dispatched" };
const UPDATE_OPTIONS = [
  { value: "loading", label: "Loading" },
  { value: "loaded", label: "Loaded" },
  { value: "dispatched", label: "Dispatched" }
];
const LOCKED_ORDER_STATUSES = ["COMPLETED", "COMPLETE", "CANCELLED", "CANCELED", "DELIVERED", "CLOSED"];
const LOG_TONES = {
  confirmed: { tone: "new", icon: "spark" },
  loading_started: { tone: "loading", icon: "activity" },
  loading: { tone: "loading", icon: "activity" },
  loaded: { tone: "loaded", icon: "check" },
  dispatched: { tone: "dispatched", icon: "truck" },
  in_transit: { tone: "dispatched", icon: "truck" }
};

function Icon({ name, size = 18, stroke = 1.8 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: "false" };
  const p = {
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2"/></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z"/><path d="m4 6.5 8 4.5 8-4.5M12 11v9"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.2 1 .4 2 .8 2.8a2 2 0 0 1-.5 2.1l-1.2 1.2a16 16 0 0 0 4.1 4.1l1.2-1.2a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.8a2 2 0 0 1 1.7 1.6Z"/>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    right: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m7 7 10 10M17 7 7 17"/>,
    alert: <><path d="M12 3 3 20h18L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    nav: <path d="m3 11 18-8-8 18-2-8-8-2Z"/>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M15 9h3a2 2 0 0 1 2 2v10"/><path d="M3 21h18M8 7h3M8 11h3M8 15h3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6.3 6.3 2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1"/></>,
    activity: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
    expand: <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
    shield: <><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    hash: <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></>,
    note: <><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    cubesNav: <><path d="M12 2.6 8.4 4.6v4.1L12 10.7l3.6-2V4.6z"/><path d="M7.2 12.3 3.6 14.3v4.1l3.6 2 3.6-2v-4.1z"/><path d="M16.8 12.3l-3.6 2v4.1l3.6 2 3.6-2v-4.1z"/></>,
    docNav: <><path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z"/><path d="M14 3v5h5"/><path d="M8.6 12h6.4M8.6 15.2h6.4M8.6 18.4h3.8"/></>,
    clipboardNav: <><path d="M9 4.4H7.4A2.4 2.4 0 0 0 5 6.8v11.8A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V6.8a2.4 2.4 0 0 0-2.4-2.4H15"/><rect x="9" y="2.6" width="6" height="3.9" rx="1.4"/><path d="m9.4 13.6 2.1 2.1 3.9-3.9"/></>
  };
  return <svg {...c}>{p[name] || p.cube}</svg>;
}

/* ---------------------------- safe helpers ---------------------------- */

function text(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function time(value) {
  if (value === null || value === undefined || value === "") return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

const IST = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
const IST_DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const QTY = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });
const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function fmtDateTime(value) {
  const t = time(value);
  if (t === null) return "";
  const parts = {};
  IST.formatToParts(new Date(t)).forEach(part => { parts[part.type] = part.value; });
  if (!parts.day || !parts.month || !parts.year || !parts.hour || !parts.minute) return "";
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${(parts.dayPeriod || "").toUpperCase()}`.trim();
}

function fmtDate(value) {
  const t = time(value);
  return t === null ? "" : IST_DATE.format(new Date(t));
}

function relative(value, now) {
  const t = time(value);
  if (t === null) return "";
  const mins = Math.max(0, Math.floor((now - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function fmtQty(value, unit) {
  const n = num(value);
  if (n === null) return "";
  const u = text(unit);
  return u ? `${QTY.format(n)} ${u}` : QTY.format(n);
}

function fmtMoney(value, unit) {
  const n = num(value);
  if (n === null) return "";
  const u = text(unit);
  return u ? `₹${INR.format(n)} / ${u}` : `₹${INR.format(n)}`;
}

function normStatus(value) {
  const key = text(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "new") return "new";
  if (key === "loading" || key === "loading_started") return "loading";
  if (key === "loaded") return "loaded";
  if (key === "dispatched" || key === "in_transit") return "dispatched";
  return null;
}

function cleanPhone(value) {
  return text(value).replace(/[^\d+]/g, "");
}

function joinParts(parts) {
  return parts.map(text).filter(Boolean).join(", ");
}

async function copyText(value) {
  if (!value) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) { /* fall through to legacy copy */ }
  try {
    const area = document.createElement("textarea");
    area.value = value;
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

/* --------------------------- data normalizers --------------------------- */

function normalizeMaterial(raw, index) {
  const m = raw && typeof raw === "object" ? raw : {};
  const id = text(m.id) || text(m.materialId) || "";
  return {
    key: `${id || "material"}-${index}`,
    id,
    name: text(m.materialName) || text(m.name),
    requestedQuantity: num(m.requestedQuantity ?? m.quantity),
    unit: text(m.requestedQuantityUnit) || text(m.quantityUnit) || text(m.unit),
    sampleId: text(m.sampleId) || text(m.sourceSampleId),
    sampleCode: text(m.sampleCode) || text(m.referenceId),
    imageUrl: text(m.imageUrl),
    thumbnailUrl: text(m.thumbnailUrl) || text(m.imageUrl),
    materialType: text(m.materialType).toUpperCase(),
    rate: num(m.rate),
    rateUnit: text(m.rateUnit),
    feetPerTon: num(m.feetPerTon),
    convertedRate: num(m.convertedRate),
    convertedRateUnit: text(m.convertedRateUnit),
    permitCost: num(m.permitCost),
    availableQuantity: num(m.availableQuantity),
    availableUnit: text(m.availableQuantityUnit) || text(m.requestedQuantityUnit),
    allocatedQuantity: num(m.allocatedQuantity),
    remainingQuantity: num(m.remainingQuantity ?? m.remainingAllocatableQuantity),
    uploadedBy: text(m.uploadedBy),
    uploadedAt: m.sampleUploadedAt || m.uploadedAt || null,
    expiresAt: m.sampleExpiresAt || m.expiresAt || null
  };
}

function normalizeVehicle(raw, index) {
  const v = raw && typeof raw === "object" ? raw : {};
  const id = text(v.id) || text(v.vehicleId);
  const ids = Array.isArray(v.materialIds) ? v.materialIds.map(text).filter(Boolean) : [];
  return {
    key: `${id || "vehicle"}-${index}`,
    id,
    slot: num(v.slotNumber) ?? index + 1,
    number: text(v.vehicleNumber).toUpperCase(),
    status: normStatus(v.status),
    materialIds: Array.from(new Set(ids)),
    expectedQuantity: num(v.expectedQuantity),
    loadedQuantity: num(v.loadedQuantity),
    unit: text(v.quantityUnit),
    loadingStartedAt: v.loadingStartedAt || null,
    loadedAt: v.loadedAt || null,
    dispatchedAt: v.dispatchedAt || null,
    updatedAt: v.updatedAt || null
  };
}

/* ---------------------------- UI primitives ---------------------------- */

function StatusBadge({ status, compact = false }) {
  const meta = STATUS_META[status] || UNKNOWN_META;
  return <em className={`td-badge t-${meta.tone}${compact ? " compact" : ""}`} title={meta.stage}>
    <Icon name={meta.icon} size={compact ? 10 : 11} stroke={2.2}/>
    <span>{meta.label}</span>
  </em>;
}

function SmartImage({ src, alt, className = "", fit = "cover", onClick, label }) {
  const [state, setState] = useState(src ? "loading" : "error");
  useEffect(() => { setState(src ? "loading" : "error"); }, [src]);
  const body = <>
    {state !== "error" ? <img src={src} alt={alt} loading="lazy" decoding="async" style={{ objectFit: fit }} className={state === "ready" ? "ready" : ""} onLoad={() => setState("ready")} onError={() => setState("error")}/> : null}
    {state === "loading" ? <span className="td-img-shimmer" aria-hidden="true"/> : null}
    {state === "error" ? <span className="td-img-fallback"><Icon name="image" size={20}/><small>Image unavailable</small></span> : null}
  </>;
  if (!onClick) return <div className={`td-img ${className}`}>{body}</div>;
  return <button type="button" className={`td-img ${className}`} onClick={onClick} aria-label={label}>{body}</button>;
}

function Sheet({ title, subtitle, onClose, children, className = "", labelId }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const onKey = event => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [onClose]);
  return <div className="td-overlay" onMouseDown={onClose}>
    <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelId} className={`td-sheet ${className}`} onMouseDown={event => event.stopPropagation()}>
      <div className="td-sheet-head">
        <div><b id={labelId}>{title}</b>{subtitle ? <small>{subtitle}</small> : null}</div>
        <button type="button" aria-label={`Close ${title}`} onClick={onClose}><Icon name="close"/></button>
      </div>
      {children}
    </section>
  </div>;
}

function Row({ label, value, mono = false, fallback = "Not recorded" }) {
  const shown = value === 0 ? "0" : value;
  return <div className="td-row"><dt>{label}</dt><dd className={`${mono ? "mono" : ""}${shown ? "" : " na"}`}>{shown || fallback}</dd></div>;
}

function Skeleton() {
  return <main className="td-width td-main" aria-busy="true" aria-label="Loading Transporter order">
    <span className="td-sr">Loading Transporter active order details</span>
    {[132, 150, 176, 210, 240].map((h, i) => <div className="td-panel td-skel" key={i} style={{ minHeight: h }}>
      <i className="sk" style={{ width: "38%", height: 12 }}/><i className="sk" style={{ width: "72%", height: 10, marginTop: 14 }}/><i className="sk" style={{ width: "100%", height: Math.max(36, h - 90), marginTop: 14 }}/>
    </div>)}
  </main>;
}

/* ================================ PAGE ================================ */

export default function StoneRateAdminTransporterActiveOrderDetails({
  selectedOrder = null,
  loading = false,
  error = "",
  saving = false,

  onBack = NOOP,
  onRefresh = NOOP,
  onRetry = NOOP,

  onUpdateVehicleStatus = ASYNC_NOOP,

  onCallTransporter = NOOP,
  onCallSeller = NOOP,
  onNavigateSeller = NOOP,

  onHome = NOOP,
  onSamples = NOOP,
  onTransporterBidding = NOOP,
  onRateRequests = NOOP,
  onConfirmedOrders = NOOP
}) {
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState({ text: "", tone: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [transporterOpen, setTransporterOpen] = useState(false);
  const [referenceKey, setReferenceKey] = useState(null);
  const [preview, setPreview] = useState(null);

  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loadedQuantity, setLoadedQuantity] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vehicleHint, setVehicleHint] = useState("");

  const toastTimer = useRef(null);
  const mounted = useRef(true);
  const formRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const notify = useCallback((message, tone = "") => {
    setToast({ text: message, tone });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast({ text: "", tone: "" }), 2800);
  }, []);

  /* ------------------------------ derived ------------------------------ */

  const order = selectedOrder && typeof selectedOrder === "object" ? selectedOrder : null;
  const orderStatus = normStatus(order?.status);
  const orderMeta = STATUS_META[orderStatus] || UNKNOWN_META;
  const orderLocked = LOCKED_ORDER_STATUSES.includes(text(order?.status).toUpperCase().replace(/[\s-]+/g, "_"));
  const requestId = text(order?.transporterRequestId);
  const deliveryId = text(order?.transporterDeliveryId) || text(order?.id);

  const transporter = useMemo(() => {
    const t = order?.transporter && typeof order.transporter === "object" ? order.transporter : {};
    return {
      raw: order?.transporter || null,
      id: text(t.id) || text(t.transporterId),
      name: text(t.agencyName) || text(t.name),
      ownerName: text(t.ownerName),
      phone: cleanPhone(t.phone),
      displayPhone: text(t.phone),
      location: text(t.location) || joinParts([t.city, t.state]),
      city: text(t.city),
      state: text(t.state),
      joinedAt: t.joinedAt || null
    };
  }, [order]);

  const seller = useMemo(() => {
    const s = order?.seller && typeof order.seller === "object" ? order.seller : {};
    const lat = num(s.latitude);
    const lng = num(s.longitude);
    const hasCoords = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
    return {
      raw: order?.seller || null,
      id: text(s.id) || text(s.sellerId),
      name: text(s.name) || text(s.sellerName),
      plantName: text(s.plantName) || text(s.businessName),
      phone: cleanPhone(s.phone),
      displayPhone: text(s.phone),
      location: text(s.location) || joinParts([s.city, s.state]),
      address: text(s.address),
      city: text(s.city),
      state: text(s.state),
      pincode: text(s.pincode),
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,
      hasCoords
    };
  }, [order]);

  const materials = useMemo(() => (Array.isArray(order?.materials) ? order.materials : []).map(normalizeMaterial), [order]);
  const vehicles = useMemo(() => (Array.isArray(order?.vehicles) ? order.vehicles : []).map(normalizeVehicle), [order]);
  const materialById = useMemo(() => {
    const map = new Map();
    materials.forEach(m => { if (m.id) map.set(m.id, m); });
    return map;
  }, [materials]);

  const activity = useMemo(() => {
    const list = Array.isArray(order?.activityLog) ? order.activityLog : [];
    return list
      .filter(item => item && typeof item === "object")
      .map((item, index) => ({
        key: `${text(item.id) || "log"}-${index}`,
        type: text(item.type).toLowerCase(),
        title: text(item.title) || "Activity recorded",
        vehicleNumber: text(item.vehicleNumber).toUpperCase(),
        materialName: text(item.materialName),
        quantity: fmtQty(item.quantity, item.quantityUnit),
        note: text(item.note) || text(item.adminNote),
        by: text(item.createdBy) || text(item.actorName),
        at: item.createdAt || null
      }))
      .sort((a, b) => (time(b.at) ?? -Infinity) - (time(a.at) ?? -Infinity));
  }, [order]);

  const stageIndex = orderStatus ? STAGES.indexOf(orderStatus) : -1;
  const vehicleCounts = useMemo(() => {
    const counts = { new: 0, loading: 0, loaded: 0, dispatched: 0, assigned: 0 };
    vehicles.forEach(v => { if (v.status) counts[v.status] += 1; if (v.number) counts.assigned += 1; });
    return counts;
  }, [vehicles]);
  const progressPct = vehicles.length ? Math.round(((vehicleCounts.loaded + vehicleCounts.dispatched) / vehicles.length) * 100) : 0;
  const lastUpdated = order?.updatedAt || activity[0]?.at || null;
  const referenceMaterial = referenceKey ? materials.find(m => m.key === referenceKey) || null : null;

  /* Keep the form in sync with the backend order: drop vanished selections, preselect a single material. */
  useEffect(() => {
    setSelectedVehicleIds(ids => ids.filter(id => vehicles.some(v => v.id === id && v.number)));
    setSelectedMaterialIds(ids => {
      const valid = ids.filter(id => materialById.has(id));
      if (!valid.length && materials.length === 1 && materials[0].id) return [materials[0].id];
      return valid;
    });
  }, [vehicles, materials, materialById]);

  const selectedVehicles = useMemo(() => vehicles.filter(v => selectedVehicleIds.includes(v.id)), [vehicles, selectedVehicleIds]);
  const selectedMaterials = useMemo(() => materials.filter(m => selectedMaterialIds.includes(m.id)), [materials, selectedMaterialIds]);
  const needsQuantity = selectedStatus === "loaded" || selectedStatus === "dispatched";
  const quantityUnit = useMemo(() => {
    const vehicleUnit = selectedVehicles.map(v => v.unit).find(Boolean);
    const materialUnit = selectedMaterials.map(m => m.unit).find(Boolean);
    return vehicleUnit || materialUnit || vehicles.map(v => v.unit).find(Boolean) || materials.map(m => m.unit).find(Boolean) || "";
  }, [selectedVehicles, selectedMaterials, vehicles, materials]);
  const expectedTotal = selectedVehicles.reduce((sum, v) => (v.expectedQuantity === null ? sum : sum + v.expectedQuantity), 0);
  const expectedKnown = selectedVehicles.some(v => v.expectedQuantity !== null);
  const previousLoaded = selectedVehicles.filter(v => v.loadedQuantity !== null);
  const busy = saving || submitting;
  const formDisabled = busy || orderLocked || !order;

  /* ------------------------------ actions ------------------------------ */

  const copy = async (value, label) => {
    const ok = await copyText(value);
    notify(ok ? label : "Copy failed. Please copy manually.", ok ? "ok" : "error");
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
      if (mounted.current) { setNow(Date.now()); notify("Order details refreshed", "ok"); }
    } catch (refreshError) {
      if (mounted.current) notify(refreshError?.message || "Unable to refresh order details", "error");
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  };

  const callTransporter = () => { if (transporter.phone) onCallTransporter(transporter.phone, order.transporter); };
  const callSeller = () => { if (seller.phone) onCallSeller(seller.phone, order.seller); };
  const canNavigate = seller.hasCoords || Boolean(seller.address || seller.location || joinParts([seller.city, seller.state, seller.pincode]));
  const navigateSeller = () => {
    if (!canNavigate) return;
    onNavigateSeller({
      seller: order.seller,
      order,
      destination: {
        sellerName: seller.name || null,
        sellerId: seller.id || null,
        address: seller.address || null,
        location: seller.location || null,
        city: seller.city || null,
        state: seller.state || null,
        pincode: seller.pincode || null,
        latitude: seller.latitude,
        longitude: seller.longitude,
        transporterRequestId: requestId || null,
        transporterDeliveryId: deliveryId || null
      }
    });
  };

  const toggleVehicle = vehicle => {
    if (formDisabled) return;
    if (!vehicle.number) {
      setVehicleHint(vehicle.key);
      return;
    }
    setVehicleHint("");
    setFormErrors(e => ({ ...e, vehicles: "" }));
    setSelectedVehicleIds(ids => (ids.includes(vehicle.id) ? ids.filter(id => id !== vehicle.id) : [...ids, vehicle.id]));
  };

  const toggleMaterial = material => {
    if (formDisabled || !material.id) return;
    setFormErrors(e => ({ ...e, materials: "" }));
    setSelectedMaterialIds(ids => (ids.includes(material.id) ? ids.filter(id => id !== material.id) : [...ids, material.id]));
  };

  const validate = () => {
    const errors = {};
    if (orderLocked) errors.form = "This order is already completed or cancelled and can no longer be updated.";
    if (!selectedVehicles.length) errors.vehicles = "Select at least one vehicle.";
    else if (selectedVehicles.some(v => !v.number)) errors.vehicles = "Assign a vehicle number before updating this vehicle.";
    else if (selectedVehicles.some(v => !v.id)) errors.vehicles = "A selected vehicle has no identifier. Refresh the order and try again.";
    if (!selectedMaterials.length) errors.materials = "Select at least one material.";
    if (!UPDATE_OPTIONS.some(o => o.value === selectedStatus)) errors.status = "Choose a vehicle status.";
    if (needsQuantity) {
      const raw = loadedQuantity.trim();
      if (!raw) errors.quantity = "Loaded quantity is required for this status.";
      else if (!/^\d+(\.\d{1,3})?$/.test(raw)) errors.quantity = "Enter a valid number (up to 3 decimals).";
      else if (Number(raw) <= 0) errors.quantity = "Loaded quantity must be greater than zero.";
    }
    if (!quantityUnit) errors.unit = "Quantity unit is unavailable for the selected vehicles.";
    return errors;
  };

  const resetForm = () => {
    setSelectedVehicleIds([]);
    setSelectedMaterialIds(materials.length === 1 && materials[0].id ? [materials[0].id] : []);
    setSelectedStatus("");
    setLoadedQuantity("");
    setAdminNote("");
    setFormErrors({});
    setSubmitError("");
  };

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setSubmitError("");
    const errors = validate();
    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      const first = formRef.current?.querySelector("[aria-invalid='true']");
      if (first && typeof first.focus === "function") first.focus();
      return;
    }
    const payload = {
      transporterRequestId: order.transporterRequestId ?? null,
      transporterDeliveryId: order.transporterDeliveryId ?? null,
      vehicleIds: selectedVehicles.map(v => v.id),
      vehicleNumbers: selectedVehicles.map(v => v.number),
      materialIds: Array.from(new Set(selectedMaterials.map(m => m.id))),
      status: selectedStatus,
      loadedQuantity: needsQuantity ? Number(loadedQuantity.trim()) : null,
      quantityUnit,
      adminNote: adminNote.trim()
    };
    setSubmitting(true);
    try {
      const result = await onUpdateVehicleStatus(payload);
      if (result && typeof result === "object" && (result.ok === false || result.success === false)) {
        const failed = Array.isArray(result.failedVehicles) && result.failedVehicles.length ? ` Failed: ${result.failedVehicles.map(text).filter(Boolean).join(", ")}.` : "";
        throw new Error(`${text(result.message) || "The vehicle status could not be updated."}${failed}`);
      }
      if (!mounted.current) return;
      notify("Vehicle status updated successfully", "ok");
      resetForm();
      try { await Promise.resolve(onRefresh()); } catch (refreshError) { if (mounted.current) notify("Status saved. Refresh failed — pull latest details manually.", "error"); }
    } catch (saveError) {
      if (mounted.current) setSubmitError(saveError?.message || "Unable to update vehicle status. Please try again.");
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const copyReference = material => {
    const lines = [
      ["Transporter Request ID", requestId],
      ["Transporter Delivery ID", deliveryId],
      ["Material", material.name],
      ["Requested quantity", fmtQty(material.requestedQuantity, material.unit)],
      ["Sample code", material.sampleCode],
      ["Seller name", seller.name],
      ["Seller ID", seller.id],
      ["Seller location", seller.location || seller.address],
      ["Mobile number", seller.displayPhone],
      ["Recorded material rate", fmtMoney(material.rate, material.rateUnit)],
      ["Converter rate", material.feetPerTon !== null ? `1 ton = ${QTY.format(material.feetPerTon)} feet` : ""],
      ["Converted material rate", fmtMoney(material.convertedRate, material.convertedRateUnit)],
      ["Permit cost", fmtMoney(material.permitCost)],
      ["Available quantity", fmtQty(material.availableQuantity, material.availableUnit)],
      ["Sample expiry", fmtDateTime(material.expiresAt)]
    ].map(([label, value]) => `${label}: ${value || "Not recorded"}`).join("\n");
    copy(lines, "Reference information copied");
  };

  const navItems = [
    { key: "samples", label: "Samples", icon: "cubesNav", action: onSamples },
    { key: "bidding", label: "Transport", icon: "truck", action: onTransporterBidding },
    { key: "home", label: "Home", icon: "home", action: onHome },
    { key: "rates", label: "Rates", icon: "docNav", action: onRateRequests },
    { key: "orders", label: "Orders", icon: "clipboardNav", action: onConfirmedOrders }
  ];

  /* ------------------------------ render ------------------------------ */

  const header = <header className="td-header">
    <div className="td-width">
      <div className="td-top">
        <button type="button" className="td-icon" aria-label="Go back" onClick={() => onBack()}><Icon name="back"/></button>
        <div className="td-brand">
          <strong><Icon name="truck" size={17}/></strong>
          <span><b>StoneRate Admin</b><small>Transporter Operations</small></span>
        </div>
        <button type="button" className={`td-icon td-icon-spin${refreshing ? " spinning" : ""}`} aria-label="Refresh order details" onClick={handleRefresh} disabled={refreshing || loading}><Icon name="refresh"/></button>
      </div>
      <div className="td-title">
        <h1>Transporter <span>Active Order</span></h1>
        {order ? <StatusBadge status={orderStatus}/> : null}
      </div>
      <p className="td-sub">Manage vehicle loading, material allocation, and dispatch activity</p>
      {order ? <>
        <div className="td-time">
          <span><Icon name="clock" size={13}/>{lastUpdated ? `Updated ${relative(lastUpdated, now)}` : "Update time not available"}</span>
          <b>{vehicleCounts.loaded + vehicleCounts.dispatched}/{vehicles.length} vehicles loaded</b>
        </div>
        <div className="td-headbar" role="progressbar" aria-label="Vehicles loaded" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}><i style={{ width: `${progressPct}%` }}/></div>
      </> : null}
    </div>
  </header>;

  const bottomNav = <nav className="td-bottom" aria-label="Admin primary navigation">
    {navItems.map(item => <button key={item.key} type="button" className={item.key === "orders" ? "active" : ""} aria-current={item.key === "orders" ? "page" : undefined} onClick={() => item.action()}>
      <span className="td-nav-icon"><Icon name={item.icon} size={17}/></span><span className="td-nav-label">{item.label}</span>
    </button>)}
  </nav>;

  const shell = content => <div className="td-root">
    <style>{CSS}</style>
    <div className="td-bg" aria-hidden="true"><i/><b/><span/><em/></div>
    {header}
    {content}
    {bottomNav}
    <div className={`td-toast${toast.text ? " show" : ""}${toast.tone ? ` ${toast.tone}` : ""}`} role="status" aria-live="polite">{toast.text ? <Icon name={toast.tone === "error" ? "alert" : "check"} size={14}/> : null}{toast.text}</div>
  </div>;

  if (loading && !order) return shell(<Skeleton/>);

  if (error && !order) return shell(<main className="td-width td-main">
    <section className="td-panel td-state error" role="alert">
      <span><Icon name="alert" size={22}/></span>
      <h2>Unable to load Transporter active order</h2>
      <p>{typeof error === "string" ? error : error?.message || "Something went wrong."}</p>
      <div className="td-state-actions"><button type="button" className="td-btn primary" onClick={() => onRetry()}>Retry</button><button type="button" className="td-btn ghost" onClick={() => onBack()}>Go back</button></div>
    </section>
  </main>);

  if (!order) return shell(<main className="td-width td-main">
    <section className="td-panel td-state">
      <span><Icon name="truck" size={22}/></span>
      <h2>No Transporter order selected</h2>
      <p>Open an order from Active Orders → By Transporter to view its details.</p>
      <div className="td-state-actions"><button type="button" className="td-btn primary" onClick={() => onBack()}>Back to Active Orders</button></div>
    </section>
  </main>);

  const confirmedText = fmtDateTime(order.confirmedAt);
  const updatedText = fmtDateTime(lastUpdated);

  return shell(<>
    <main className="td-width td-main">
      {error ? <div className="td-inline-error" role="alert"><Icon name="alert" size={14}/><span>{typeof error === "string" ? error : error?.message}</span><button type="button" onClick={() => onRetry()}>Retry</button></div> : null}

      {/* ------------------------- identity ------------------------- */}
      <section className={`td-panel td-identity t-${orderMeta.tone}`} aria-label="Order identity">
        <span className="td-rail" aria-hidden="true"/>
        <div className="td-ids">
          <div className="td-idbox primary">
            <small><Icon name="hash" size={11}/>Transporter Request</small>
            {requestId ? <b>{requestId}<button type="button" aria-label="Copy Transporter Request ID" onClick={() => copy(requestId, "Request ID copied")}><Icon name="copy" size={11}/></button></b> : <em>Request ID unavailable</em>}
          </div>
          <div className="td-idbox">
            <small><Icon name="truck" size={11}/>Transporter Delivery</small>
            {deliveryId ? <b>{deliveryId}<button type="button" aria-label="Copy Transporter Delivery ID" onClick={() => copy(deliveryId, "Delivery ID copied")}><Icon name="copy" size={11}/></button></b> : <em>Delivery ID unavailable</em>}
          </div>
          <div className="td-idstatus"><StatusBadge status={orderStatus}/></div>
        </div>
        <div className="td-progress" aria-label="Operational stage">
          {STAGES.map((stage, i) => <React.Fragment key={stage}>
            <div className={`td-step ${i < stageIndex ? "done" : i === stageIndex ? "current" : ""}`}>
              <span>{i < stageIndex ? <Icon name="check" size={11} stroke={2.4}/> : i + 1}</span>
              <small>{STAGE_LABELS[stage]}</small>
            </div>
            {i < STAGES.length - 1 ? <i className={i < stageIndex ? "done" : ""}/> : null}
          </React.Fragment>)}
        </div>
        <div className="td-facts">
          <div><Icon name="calendar" size={13}/><span>Confirmed</span><b className={confirmedText ? "" : "na"}>{confirmedText || "Not available"}</b></div>
          <div><Icon name="clock" size={13}/><span>Last updated</span><b className={updatedText ? "" : "na"}>{updatedText || "Not available"}</b></div>
          <div><Icon name="layers" size={13}/><span>Materials</span><b>{materials.length}</b></div>
          <div><Icon name="truck" size={13}/><span>Vehicles</span><b>{vehicles.length}<small> · {vehicleCounts.assigned} assigned</small></b></div>
        </div>
        <div className="td-stage-line"><i/>{orderMeta.stage}</div>
      </section>

      {/* ------------------------- transporter ------------------------- */}
      <section className="td-panel td-party-card" aria-labelledby="td-transporter-h">
        <div className="td-head"><Icon name="truck" size={15}/><b id="td-transporter-h">Transporter</b><small>Registered agency</small></div>
        <div className="td-party">
          <span className="td-avatar teal"><Icon name="truck" size={18}/></span>
          <div className="td-party-main">
            <button type="button" className="td-link" onClick={() => setTransporterOpen(true)} aria-label="Open Transporter details">{transporter.name || "Transporter not available"}<Icon name="right" size={12}/></button>
            {transporter.id ? <button type="button" className="td-chip mono" onClick={() => setTransporterOpen(true)} aria-label={`Open details for Transporter ${transporter.id}`}>{transporter.id}</button> : <small className="na">Transporter ID not available</small>}
          </div>
        </div>
        <div className="td-mini-grid">
          <div><span>Owner</span><b className={transporter.ownerName ? "" : "na"}>{transporter.ownerName || "Not recorded"}</b></div>
          <div><span>Mobile</span><b className={transporter.displayPhone ? "mono" : "na"}>{transporter.displayPhone || "Not recorded"}</b></div>
          <div><span>Location</span><b className={transporter.location ? "" : "na"}>{transporter.location || "Not recorded"}</b></div>
          <div><span>Joined</span><b className={fmtDate(transporter.joinedAt) ? "" : "na"}>{fmtDate(transporter.joinedAt) || "Not recorded"}</b></div>
        </div>
        <button type="button" className="td-btn call wide" disabled={!transporter.phone} onClick={callTransporter}><Icon name="phone" size={14}/>Call Transporter</button>
        {!transporter.phone ? <p className="td-hint">Transporter phone number not available</p> : null}
      </section>

      {/* ------------------------- seller ------------------------- */}
      <section className="td-panel td-party-card" aria-labelledby="td-seller-h">
        <div className="td-head"><Icon name="building" size={15}/><b id="td-seller-h">Seller &amp; Pickup</b><small>Internal use only</small></div>
        <div className="td-party">
          <span className="td-avatar blue"><Icon name="building" size={18}/></span>
          <div className="td-party-main">
            <strong>{seller.name || "Seller not assigned"}</strong>
            <span className="td-party-sub">{seller.id ? <em className="td-chip mono static">{seller.id}</em> : null}{seller.plantName ? <small>{seller.plantName}</small> : null}</span>
          </div>
        </div>
        <div className="td-address">
          <Icon name="pin" size={14}/>
          <span><b className={seller.location ? "" : "na"}>{seller.location || "Location not provided"}</b>{seller.address || seller.pincode ? <small>{joinParts([seller.address, seller.pincode])}</small> : null}</span>
          {seller.address || seller.location ? <button type="button" aria-label="Copy pickup address" onClick={() => copy(joinParts([seller.address, seller.location, seller.pincode]), "Pickup address copied")}><Icon name="copy" size={13}/></button> : null}
        </div>
        <div className="td-mini-grid">
          <div><span>Mobile</span><b className={seller.displayPhone ? "mono" : "na"}>{seller.displayPhone || "Not recorded"}</b></div>
          <div><span>Material supplied</span><b className={materials.some(m => m.name) ? "" : "na"}>{materials.map(m => m.name).filter(Boolean).join(", ") || "Not recorded"}</b></div>
          <div className="span2"><span>Sample code</span><b className={materials.some(m => m.sampleCode) ? "mono" : "na"}>{materials.map(m => m.sampleCode).filter(Boolean).join(", ") || "Not recorded"}</b></div>
        </div>
        <div className="td-actions two">
          <button type="button" className="td-btn primary" disabled={!canNavigate} onClick={navigateSeller}><Icon name="nav" size={14}/>Navigate</button>
          <button type="button" className="td-btn call" disabled={!seller.phone} onClick={callSeller}><Icon name="phone" size={14}/>Call Seller</button>
        </div>
        {!canNavigate || !seller.phone ? <p className="td-hint">{!canNavigate ? "No pickup address or coordinates recorded. " : ""}{!seller.phone ? "Seller phone number not available." : ""}</p> : null}
      </section>

      {/* ------------------------- materials ------------------------- */}
      <section className="td-panel td-materials-panel" aria-labelledby="td-materials-h">
        <div className="td-head"><Icon name="cube" size={15}/><b id="td-materials-h">Materials</b><small>{materials.length} item{materials.length === 1 ? "" : "s"} · tap image for reference</small></div>
        {materials.length ? <div className="td-materials">
          {materials.map(material => <article className="td-material" key={material.key}>
            <SmartImage src={material.thumbnailUrl} alt={`${material.name || "Material"} reference image`} className="td-thumb" onClick={() => setReferenceKey(material.key)} label={`Open reference source for ${material.name || "material"}`}/>
            <div className="td-material-body">
              <div className="td-material-top">
                <b>{material.name || "Material name not provided"}</b>
                <strong className={material.requestedQuantity === null ? "na" : ""}>{fmtQty(material.requestedQuantity, material.unit) || "Quantity not provided"}</strong>
              </div>
              <div className="td-chips">
                <span><small>Rate</small>{fmtMoney(material.rate, material.rateUnit) || "Not recorded"}</span>
                <span><small>Permit</small>{fmtMoney(material.permitCost) || "Not recorded"}</span>
                {material.availableQuantity !== null ? <span><small>Available</small>{fmtQty(material.availableQuantity, material.availableUnit)}</span> : null}
              </div>
              <div className="td-material-foot">
                {material.sampleCode ? <em className="mono">{material.sampleCode}</em> : <em className="na">No sample code</em>}
                <span><Icon name="building" size={11}/>{seller.name || "Seller not assigned"}</span>
              </div>
            </div>
          </article>)}
        </div> : <div className="td-empty"><Icon name="cube" size={18}/>Material details unavailable</div>}
      </section>

      {/* ------------------------- vehicles ------------------------- */}
      <section className="td-panel td-wide" aria-labelledby="td-vehicles-h">
        <div className="td-head"><Icon name="truck" size={15}/><b id="td-vehicles-h">Vehicle Details</b><small>{vehicles.length} slot{vehicles.length === 1 ? "" : "s"}</small></div>
        <p className="td-section-sub">Review assigned vehicles and update each vehicle’s loading and dispatch status.</p>
        <div className="td-vstats">
          {STAGES.map(s => <span key={s} className={`t-${STATUS_META[s].tone}`}><i/>{STATUS_META[s].label}<b>{vehicleCounts[s]}</b></span>)}
        </div>
        {vehicles.length ? <div className="td-vehicles">
          {vehicles.map((v, index) => {
            const meta = STATUS_META[v.status] || UNKNOWN_META;
            const names = v.materialIds.map(id => materialById.get(id)?.name).filter(Boolean);
            const unit = v.unit || quantityUnit;
            return <article className={`td-vehicle t-${meta.tone}`} key={v.key} style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
              <span className="td-rail" aria-hidden="true"/>
              <div className="td-vehicle-head">
                <span className="td-slot">{v.slot}</span>
                <div><small>Vehicle No. {v.slot}</small>{v.number ? <b className="mono">{v.number}</b> : <b className="na">Vehicle number not assigned</b>}</div>
                <StatusBadge status={v.status} compact/>
              </div>
              <div className="td-vehicle-mat"><Icon name="cube" size={12}/>{names.length ? names.join(", ") : <span className="na">No material assigned</span>}</div>
              <div className="td-vehicle-qty">
                <div><span>Expected</span><b className={v.expectedQuantity === null ? "na" : ""}>{fmtQty(v.expectedQuantity, unit) || "Not set"}</b></div>
                <div><span>Loaded</span><b className={v.loadedQuantity === null ? "na" : "ok"}>{fmtQty(v.loadedQuantity, unit) || "Not recorded"}</b></div>
              </div>
              <ol className="td-vtimes">
                <li className={v.loadingStartedAt ? "on" : ""}><span>Loading</span><b>{fmtDateTime(v.loadingStartedAt) || "—"}</b></li>
                <li className={v.loadedAt ? "on" : ""}><span>Loaded</span><b>{fmtDateTime(v.loadedAt) || "—"}</b></li>
                <li className={v.dispatchedAt ? "on" : ""}><span>Dispatched</span><b>{fmtDateTime(v.dispatchedAt) || "—"}</b></li>
              </ol>
              <div className="td-vehicle-foot"><Icon name="clock" size={11}/>{v.updatedAt && relative(v.updatedAt, now) ? `Updated ${relative(v.updatedAt, now)}` : "No updates yet"}</div>
            </article>;
          })}
        </div> : <div className="td-empty"><Icon name="truck" size={18}/>No vehicle slots have been assigned to this order.</div>}
      </section>

      {/* ------------------------- update form ------------------------- */}
      <section className="td-panel td-wide td-form-card" aria-labelledby="td-form-h">
        <div className="td-head"><Icon name="activity" size={15}/><b id="td-form-h">Update Vehicle Status</b>{busy ? <small className="td-saving"><i className="td-spinner"/>Saving…</small> : null}</div>
        <p className="td-section-sub">Select one or more vehicles, choose the assigned material, and record the latest operational status.</p>
        {orderLocked ? <div className="td-inline-error"><Icon name="lock" size={14}/><span>This order is completed or cancelled. Vehicle status can no longer be changed.</span></div> : null}
        <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
          <fieldset disabled={formDisabled}>
            <div className="td-step-label"><span>1</span>Select vehicles</div>
            <div className="td-picks" role="group" aria-label="Vehicles" aria-invalid={Boolean(formErrors.vehicles)} tabIndex={formErrors.vehicles ? -1 : undefined}>
              {vehicles.map(v => {
                const checked = selectedVehicleIds.includes(v.id);
                const names = v.materialIds.map(id => materialById.get(id)?.name).filter(Boolean);
                return <label key={v.key} className={`td-pick${checked ? " on" : ""}${!v.number ? " off" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleVehicle(v)} aria-describedby={!v.number ? `hint-${v.key}` : undefined}/>
                  <span className="td-check"><Icon name="check" size={11} stroke={2.6}/></span>
                  <span className="td-pick-body">
                    <small>Vehicle {v.slot}</small>
                    <b className={v.number ? "mono" : "na"}>{v.number || "Vehicle number not assigned"}</b>
                    <span className="td-pick-meta"><StatusBadge status={v.status} compact/>{names.length ? <em>{names.join(", ")}</em> : null}{v.loadedQuantity !== null ? <em>{fmtQty(v.loadedQuantity, v.unit || quantityUnit)} loaded</em> : null}</span>
                    {!v.number ? <span id={`hint-${v.key}`} className={`td-pick-hint${vehicleHint === v.key ? " flash" : ""}`}>Assign a vehicle number before updating this vehicle.</span> : null}
                  </span>
                </label>;
              })}
              {!vehicles.length ? <div className="td-empty small">No vehicles available to update.</div> : null}
            </div>
            {formErrors.vehicles ? <p className="td-error" role="alert">{formErrors.vehicles}</p> : null}

            <div className="td-step-label"><span>2</span>Select materials</div>
            <div className="td-picks mats" role="group" aria-label="Materials" aria-invalid={Boolean(formErrors.materials)} tabIndex={formErrors.materials ? -1 : undefined}>
              {materials.map(m => {
                const checked = selectedMaterialIds.includes(m.id);
                return <label key={m.key} className={`td-pick${checked ? " on" : ""}${!m.id ? " off" : ""}`}>
                  <input type="checkbox" checked={checked} disabled={!m.id} onChange={() => toggleMaterial(m)}/>
                  <span className="td-check"><Icon name="check" size={11} stroke={2.6}/></span>
                  <span className="td-pick-body">
                    <b>{m.name || "Material name not provided"}</b>
                    <span className="td-pick-meta">
                      <em>Requested {fmtQty(m.requestedQuantity, m.unit) || "not provided"}</em>
                      {m.allocatedQuantity !== null ? <em>Allocated {fmtQty(m.allocatedQuantity, m.unit)}</em> : null}
                      {m.remainingQuantity !== null ? <em className="accent">Remaining {fmtQty(m.remainingQuantity, m.unit)}</em> : null}
                    </span>
                  </span>
                </label>;
              })}
              {!materials.length ? <div className="td-empty small">No materials available.</div> : null}
            </div>
            {formErrors.materials ? <p className="td-error" role="alert">{formErrors.materials}</p> : null}

            <div className="td-step-label"><span>3</span>Status &amp; quantity</div>
            <div className="td-fields">
              <label className="td-field">
                <span>Vehicle Status</span>
                <div className="td-select">
                  <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setFormErrors(x => ({ ...x, status: "", quantity: "" })); }} aria-invalid={Boolean(formErrors.status)}>
                    <option value="">Choose status</option>
                    {UPDATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Icon name="right" size={13}/>
                </div>
                {formErrors.status ? <p className="td-error" role="alert">{formErrors.status}</p> : null}
              </label>
              {needsQuantity ? <label className="td-field">
                <span>Loaded Quantity</span>
                <div className={`td-input-unit${formErrors.quantity ? " bad" : ""}`}>
                  <input inputMode="decimal" value={loadedQuantity} placeholder="0.00" onChange={e => { setLoadedQuantity(e.target.value.replace(/[^\d.]/g, "")); setFormErrors(x => ({ ...x, quantity: "" })); }} aria-invalid={Boolean(formErrors.quantity)}/>
                  <em>{quantityUnit || "unit"}</em>
                </div>
                {formErrors.quantity ? <p className="td-error" role="alert">{formErrors.quantity}</p> : null}
                {formErrors.unit ? <p className="td-error" role="alert">{formErrors.unit}</p> : null}
              </label> : null}
            </div>
            {needsQuantity ? <div className="td-expected">
              <div><span>Expected quantity</span><b>{expectedKnown ? fmtQty(expectedTotal, quantityUnit) : "Not set"}</b></div>
              <div><span>Previously recorded loaded quantity</span><b className={previousLoaded.length ? "" : "na"}>{previousLoaded.length ? previousLoaded.map(v => `${v.number}: ${fmtQty(v.loadedQuantity, v.unit || quantityUnit)}`).join(" · ") : "Not recorded"}</b></div>
            </div> : null}

            <label className="td-field">
              <span>Admin Note <small>Optional</small></span>
              <textarea rows={3} maxLength={NOTE_LIMIT} value={adminNote} placeholder="Add operational notes about loading or dispatch" onChange={e => setAdminNote(e.target.value.slice(0, NOTE_LIMIT))}/>
              <small className={`td-counter${adminNote.length > NOTE_LIMIT - 50 ? " warn" : ""}`}>{adminNote.length}/{NOTE_LIMIT}</small>
            </label>

            <div className="td-summary" aria-live="polite">
              <div><span>Selected vehicles</span><b className={selectedVehicles.length ? "mono" : "na"}>{selectedVehicles.map(v => v.number).join(", ") || "None selected"}</b></div>
              <div><span>Selected materials</span><b className={selectedMaterials.length ? "" : "na"}>{selectedMaterials.map(m => m.name || m.id).join(", ") || "None selected"}</b></div>
              <div><span>New status</span>{selectedStatus ? <StatusBadge status={selectedStatus} compact/> : <b className="na">Not chosen</b>}</div>
              {needsQuantity ? <div><span>Loaded quantity</span><b className={loadedQuantity ? "" : "na"}>{loadedQuantity ? fmtQty(loadedQuantity, quantityUnit) : "Not entered"}</b></div> : null}
            </div>

            {formErrors.form ? <p className="td-error" role="alert">{formErrors.form}</p> : null}
            {submitError ? <div className="td-inline-error" role="alert"><Icon name="alert" size={14}/><span>{submitError}</span></div> : null}

            <div className="td-form-actions">
              <button type="button" className="td-btn ghost" onClick={resetForm}>Reset</button>
              <button type="submit" className="td-btn primary grow">{busy ? <><i className="td-spinner light"/>Saving…</> : <><Icon name="check" size={14} stroke={2.4}/>Save Vehicle Status</>}</button>
            </div>
          </fieldset>
        </form>
      </section>

      {/* ------------------------- activity ------------------------- */}
      <section className="td-panel td-wide" aria-labelledby="td-activity-h">
        <div className="td-head"><Icon name="history" size={15}/><b id="td-activity-h">Activity Log</b><small>{activity.length} event{activity.length === 1 ? "" : "s"}</small></div>
        {activity.length ? <ol className="td-timeline">
          {activity.map(a => {
            const tone = LOG_TONES[a.type] || { tone: "unknown", icon: "note" };
            const when = fmtDateTime(a.at);
            return <li key={a.key} className={`t-${tone.tone}`}>
              <span className="td-dot"><Icon name={tone.icon} size={11} stroke={2.2}/></span>
              <div>
                <div className="td-log-top"><b>{a.title}</b><small>{when ? relative(a.at, now) : ""}</small></div>
                <div className="td-log-meta">
                  {a.vehicleNumber ? <em className="mono">{a.vehicleNumber}</em> : null}
                  {a.materialName ? <em>{a.materialName}</em> : null}
                  {a.quantity ? <em>{a.quantity}</em> : null}
                  {a.by ? <em>By {a.by}</em> : null}
                </div>
                {a.note ? <p>{a.note}</p> : null}
                <small className="td-log-time">{when || "Time not recorded"}</small>
              </div>
            </li>;
          })}
        </ol> : <div className="td-empty"><Icon name="history" size={18}/>No activity recorded yet.</div>}
      </section>
    </main>

    {/* ------------------------- transporter modal ------------------------- */}
    {transporterOpen ? <Sheet title="Transporter Details" subtitle={transporter.id || "Transporter ID not available"} labelId="td-tr-title" onClose={() => setTransporterOpen(false)}>
      <div className="td-modal-hero">
        <span className="td-avatar teal lg"><Icon name="truck" size={22}/></span>
        <div><b>{transporter.name || "Transporter not available"}</b><small>{transporter.ownerName || "Owner not recorded"}</small></div>
        <StatusBadge status={orderStatus} compact/>
      </div>
      <dl className="td-dl">
        <Row label="Agency name" value={transporter.name}/>
        <Row label="Transporter ID" value={transporter.id} mono/>
        <Row label="Owner name" value={transporter.ownerName}/>
        <Row label="Mobile number" value={transporter.displayPhone} mono/>
        <Row label="Registered location" value={transporter.location}/>
        <Row label="City" value={transporter.city}/>
        <Row label="State" value={transporter.state}/>
        <Row label="Joining date" value={fmtDate(transporter.joinedAt)}/>
        <Row label="Request ID" value={requestId} mono fallback="Request ID unavailable"/>
        <Row label="Delivery ID" value={deliveryId} mono fallback="Delivery ID unavailable"/>
        <Row label="Assigned vehicles" value={String(vehicles.length)}/>
        <Row label="Order status" value={orderMeta.label}/>
      </dl>
      <div className="td-actions three">
        <button type="button" className="td-btn call" disabled={!transporter.phone} onClick={callTransporter}><Icon name="phone" size={14}/>Call</button>
        <button type="button" className="td-btn ghost" disabled={!transporter.id} onClick={() => copy(transporter.id, "Transporter ID copied")}><Icon name="copy" size={14}/>Copy ID</button>
        <button type="button" className="td-btn soft" onClick={() => setTransporterOpen(false)}>Close</button>
      </div>
      {!transporter.phone ? <p className="td-hint center">Transporter phone number not available</p> : null}
    </Sheet> : null}

    {/* ------------------------- reference modal ------------------------- */}
    {referenceMaterial ? <Sheet title="Reference Source" subtitle={referenceMaterial.sampleCode || "Sample code not recorded"} labelId="td-ref-title" className="td-ref-sheet" onClose={() => setReferenceKey(null)}>
      <div className="td-ref-image">
        <SmartImage src={referenceMaterial.imageUrl || referenceMaterial.thumbnailUrl} alt={`${referenceMaterial.name || "Material"} reference source image`} fit="contain" className="large" onClick={referenceMaterial.imageUrl || referenceMaterial.thumbnailUrl ? () => setPreview({ src: referenceMaterial.imageUrl || referenceMaterial.thumbnailUrl, alt: `${referenceMaterial.name || "Material"} reference source image` }) : undefined} label="Open full-screen image preview"/>
        {referenceMaterial.imageUrl || referenceMaterial.thumbnailUrl ? <span className="td-ref-expand"><Icon name="expand" size={12}/>Tap to enlarge</span> : null}
        <div className="td-ref-caption"><b>{referenceMaterial.name || "Material name not provided"}</b><span>{fmtQty(referenceMaterial.requestedQuantity, referenceMaterial.unit) || "Quantity not provided"}</span></div>
      </div>
      <div className="td-ref-grid">
        <div className="td-ref-block">
          <h4><Icon name="user" size={12}/>Source</h4>
          <dl className="td-dl">
            <Row label="Uploaded by" value={referenceMaterial.uploadedBy || seller.name}/>
            <Row label="Seller name" value={seller.name}/>
            <Row label="Seller ID" value={seller.id} mono/>
            <Row label="Material type" value={referenceMaterial.materialType}/>
            <Row label="Source sample ID" value={referenceMaterial.sampleId} mono/>
            <Row label="Location" value={seller.location || seller.address}/>
            <Row label="Mobile number" value={seller.displayPhone} mono/>
            <Row label="Uploaded" value={fmtDateTime(referenceMaterial.uploadedAt)}/>
          </dl>
        </div>
        <div className="td-ref-block">
          <h4><Icon name="hash" size={12}/>Pricing &amp; availability</h4>
          <dl className="td-dl">
            <Row label="Recorded rate" value={fmtMoney(referenceMaterial.rate, referenceMaterial.rateUnit)}/>
            <Row label="Converter rate" value={referenceMaterial.feetPerTon !== null ? `1 ton = ${QTY.format(referenceMaterial.feetPerTon)} feet` : ""}/>
            <Row label="Converted rate" value={fmtMoney(referenceMaterial.convertedRate, referenceMaterial.convertedRateUnit)}/>
            <Row label="Sample expiry" value={fmtDateTime(referenceMaterial.expiresAt)}/>
            <Row label="Permit cost" value={fmtMoney(referenceMaterial.permitCost)}/>
            <Row label="Available quantity" value={fmtQty(referenceMaterial.availableQuantity, referenceMaterial.availableUnit)}/>
          </dl>
        </div>
      </div>
      <div className="td-actions two">
        <button type="button" className="td-btn ghost" onClick={() => copyReference(referenceMaterial)}><Icon name="copy" size={14}/>Copy Information</button>
        <button type="button" className="td-btn call" disabled={!seller.phone} onClick={callSeller}><Icon name="phone" size={14}/>Call Seller</button>
      </div>
      <p className="td-notice"><Icon name="shield" size={13}/>Seller information is internal and will not be shown outside StoneRate’s operational workflow.</p>
    </Sheet> : null}

    {preview ? <div className="td-lightbox" role="dialog" aria-modal="true" aria-label="Full-screen image preview" onMouseDown={() => setPreview(null)} onKeyDown={e => { if (e.key === "Escape") setPreview(null); }}>
      <button type="button" autoFocus aria-label="Close preview" onClick={() => setPreview(null)}><Icon name="close"/></button>
      <img src={preview.src} alt={preview.alt} onMouseDown={e => e.stopPropagation()}/>
    </div> : null}
  </>);
}

/* ================================ STYLES ================================ */

const CSS = `
.td-root{
  --o:#f97316;--o2:#c2560b;--o3:#fbbf24;--soft:rgba(249,115,22,.11);
  --green:#1f9463;--green2:#0f7a4c;--red:#d64545;--blue:#2563eb;--teal:#0d9488;--amber:#e08b1e;--violet:#7c3aed;
  --ink:#141a24;--ink2:#3b4658;--muted:#6b7687;--faint:#96a0af;--line:#e9edf3;--line2:#dbe2ec;
  --card:rgba(255,255,255,.86);--glass:saturate(180%) blur(18px);
  --sh-s:0 1px 2px rgba(18,28,45,.05),0 2px 8px rgba(18,28,45,.05);
  --sh-m:0 2px 6px rgba(18,28,45,.05),0 12px 28px -10px rgba(18,28,45,.16);
  --sh-l:0 24px 56px -18px rgba(16,26,44,.35);
  --ring:0 0 0 3px rgba(249,115,22,.18);
  position:relative;min-height:100dvh;padding-bottom:88px;color:var(--ink);background:#eff3f9;overflow-x:hidden;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.td-root *{box-sizing:border-box}
.td-root button,.td-root input,.td-root select,.td-root textarea{font:inherit;color:inherit}
.td-root button{cursor:pointer;transition:transform .18s cubic-bezier(.2,.8,.3,1),box-shadow .18s ease,background .18s ease,border-color .18s ease,color .18s ease,opacity .18s ease}
.td-root button:active:not(:disabled){transform:translateY(1px) scale(.99)}
.td-root button:disabled{cursor:not-allowed;opacity:.5}
.td-root :focus-visible{outline:0;box-shadow:var(--ring);border-radius:10px}
.td-root ::selection{background:rgba(249,115,22,.22)}
.td-root .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.01em}
.td-root .na{color:var(--faint)!important;font-weight:600!important;font-family:inherit!important}
.td-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ambient background */
.td-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.td-bg>i{position:absolute;inset:0;background:linear-gradient(transparent 0 31px,rgba(24,42,72,.045) 31px 32px),linear-gradient(90deg,transparent 0 31px,rgba(24,42,72,.045) 31px 32px);background-size:32px 32px;
  mask-image:radial-gradient(120% 85% at 50% 0%,#000 18%,transparent 76%);-webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 18%,transparent 76%)}
.td-bg>b,.td-bg>span,.td-bg>em{position:absolute;border-radius:50%;filter:blur(62px);opacity:.55}
.td-bg>b{width:46vw;height:46vw;left:-10vw;top:-17vw;background:radial-gradient(circle,rgba(255,168,74,.6),transparent 66%);animation:tdFloatA 22s ease-in-out infinite}
.td-bg>span{width:42vw;height:42vw;right:-11vw;top:-7vw;background:radial-gradient(circle,rgba(80,140,255,.46),transparent 66%);animation:tdFloatB 26s ease-in-out infinite}
.td-bg>em{width:38vw;height:38vw;left:32vw;top:26vw;background:radial-gradient(circle,rgba(13,148,136,.3),transparent 68%);animation:tdFloatA 30s ease-in-out infinite reverse}
@keyframes tdFloatA{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(3vw,2vw,0) scale(1.08)}}
@keyframes tdFloatB{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-3vw,3vw,0) scale(1.06)}}

/* header */
.td-width{width:min(100%,1020px);margin:auto;position:relative;z-index:1}
.td-header{position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(16,28,50,.07);
  background:linear-gradient(180deg,rgba(252,253,255,.9),rgba(239,243,249,.72));backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 10px 26px -22px rgba(16,26,44,.6)}
.td-header .td-width{padding:12px 14px 13px}
.td-top{display:flex;align-items:center;gap:10px}
.td-icon{width:38px;height:38px;display:grid;place-items:center;flex:none;border:1px solid var(--line2);border-radius:12px;background:linear-gradient(180deg,#fff,#f6f8fc);box-shadow:var(--sh-s)}
.td-icon:hover:not(:disabled){border-color:rgba(249,115,22,.45);color:var(--o2);box-shadow:0 6px 16px -8px rgba(194,86,11,.6);transform:translateY(-1px)}
.td-icon-spin:hover svg,.td-icon-spin.spinning svg{animation:tdSpin .8s cubic-bezier(.4,0,.2,1) infinite}
@keyframes tdSpin{to{transform:rotate(360deg)}}
.td-brand{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.td-brand>strong{position:relative;width:38px;height:38px;display:grid;place-items:center;flex:none;border-radius:12px;color:#fff;background:linear-gradient(135deg,var(--o3),var(--o) 45%,var(--o2));box-shadow:0 8px 18px -8px rgba(194,86,11,.85),0 0 0 1px rgba(255,255,255,.35) inset}
.td-brand>strong::after{content:"";position:absolute;inset:0;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.4),transparent 55%)}
.td-brand span{display:flex;flex-direction:column;min-width:0}
.td-brand b{font-size:14.5px;font-weight:800;letter-spacing:-.01em}
.td-brand small{font-size:9.5px;color:var(--o2);font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.td-title{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:13px}
.td-title h1{margin:0;font-size:25px;font-weight:850;letter-spacing:-.038em;line-height:1.08}
.td-title h1 span{background:linear-gradient(100deg,var(--o),var(--o3) 45%,var(--o2));background-size:200% auto;background-clip:text;-webkit-background-clip:text;color:transparent;animation:tdShine 6s linear infinite}
@keyframes tdShine{to{background-position:200% center}}
.td-sub{margin:5px 0 0;font-size:11.5px;color:var(--muted)}
.td-time{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;font-size:10.5px;color:var(--muted);font-weight:600}
.td-time span{display:flex;align-items:center;gap:5px}
.td-time>b{padding:3px 9px;border-radius:999px;color:var(--o2);background:var(--soft);font-size:10px;font-weight:850;white-space:nowrap}
.td-headbar{height:4px;margin-top:8px;border-radius:9px;background:rgba(24,42,72,.09);overflow:hidden}
.td-headbar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--o),var(--o3),var(--o));background-size:200% 100%;transition:width .7s cubic-bezier(.2,.8,.3,1);animation:tdShine 3s linear infinite}

/* status badges */
.td-badge{display:inline-flex;align-items:center;gap:5px;flex:none;padding:6px 10px 6px 8px;border:1px solid transparent;border-radius:999px;font-size:9px;font-weight:850;font-style:normal;letter-spacing:.09em;line-height:1;white-space:nowrap;box-shadow:var(--sh-s)}
.td-badge.compact{padding:4px 7px 4px 5px;font-size:8.5px;box-shadow:none}
.td-badge.t-new{color:#175cd3;background:linear-gradient(180deg,#f0f6ff,#e1ecff);border-color:#bfdbfe}
.td-badge.t-loading{color:#a15c07;background:linear-gradient(180deg,#fff6e6,#fdecd0);border-color:rgba(224,139,30,.3)}
.td-badge.t-loading svg{animation:tdBlink 1.4s ease-in-out infinite}
.td-badge.t-loaded{color:#6d28d9;background:linear-gradient(180deg,#f6f1ff,#ece3ff);border-color:rgba(124,58,237,.26)}
.td-badge.t-dispatched{color:#08776d;background:linear-gradient(180deg,#eefcfa,#dbf6f2);border-color:rgba(13,148,136,.28)}
.td-badge.t-unknown{color:var(--muted);background:#f1f4f8;border-color:var(--line2)}
@keyframes tdBlink{50%{opacity:.35}}

/* layout + panels */
.td-main{padding:14px 14px 30px}
.td-panel{position:relative;overflow:hidden;margin-bottom:12px;padding:14px;border:1px solid rgba(255,255,255,.8);border-radius:18px;background:var(--card);backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);box-shadow:var(--sh-m);transition:box-shadow .25s ease;animation:tdRise .45s both}
.td-panel:hover{box-shadow:0 3px 8px rgba(18,28,45,.06),0 20px 40px -18px rgba(18,28,45,.28)}
@keyframes tdRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.td-head{display:flex;align-items:center;gap:8px;margin-bottom:11px;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.09em}
.td-head>svg{color:var(--o2)}
.td-head small{margin-left:auto;color:var(--faint);font-size:9px;font-weight:700;letter-spacing:.02em;text-transform:none}
.td-section-sub{margin:-5px 0 11px;font-size:11px;color:var(--muted);line-height:1.5}
.td-rail{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(#60a5fa,var(--blue))}
.t-loading>.td-rail{background:linear-gradient(#fbbf24,var(--amber))}
.t-loaded>.td-rail{background:linear-gradient(#a78bfa,var(--violet))}
.t-dispatched>.td-rail{background:linear-gradient(#2dd4bf,var(--teal))}
.t-unknown>.td-rail{background:linear-gradient(#cbd5e1,#94a3b8)}

/* identity */
.td-identity{padding:14px 14px 12px 18px}
.td-identity::after{content:"";position:absolute;right:-60px;top:-70px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.12),transparent 70%);pointer-events:none}
.td-ids{position:relative;display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:center}
.td-idbox{display:flex;flex-direction:column;gap:4px;min-width:0;padding:9px 11px;border:1px solid var(--line);border-radius:13px;background:linear-gradient(135deg,#fff,#f6f8fc)}
.td-idbox.primary{border-color:rgba(249,115,22,.28);background:linear-gradient(135deg,#fff,#fff5ec)}
.td-idbox small{display:flex;align-items:center;gap:5px;font-size:8.5px;font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:var(--faint)}
.td-idbox.primary small{color:var(--o2)}
.td-idbox b{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;font-weight:800;overflow-wrap:anywhere}
.td-idbox b button{width:24px;height:24px;display:grid;place-items:center;flex:none;border:1px solid var(--line2);border-radius:7px;color:var(--faint);background:#fff}
.td-idbox b button:hover{color:var(--o2);border-color:rgba(249,115,22,.4)}
.td-idbox em{font-style:normal;font-size:11px;color:var(--faint);font-weight:600}
.td-progress{position:relative;display:flex;align-items:center;margin-top:13px;padding:10px 6px;border-radius:13px;background:rgba(244,247,251,.8)}
.td-progress>i{height:3px;flex:1;margin:0 3px 14px;border-radius:9px;background:var(--line2)}
.td-progress>i.done{background:linear-gradient(90deg,var(--green),#34c184)}
.td-step{display:flex;flex-direction:column;align-items:center;gap:5px}
.td-step>span{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;color:var(--faint);background:#fff;font-size:10px;font-weight:850;box-shadow:0 0 0 1px var(--line2) inset;transition:.25s}
.td-step small{font-size:8.5px;font-weight:700;color:var(--faint);white-space:nowrap}
.td-step.done>span{color:#fff;background:linear-gradient(135deg,#34c184,var(--green));box-shadow:0 6px 14px -6px rgba(31,148,99,.8)}
.td-step.done small{color:var(--green2)}
.td-step.current>span{color:#fff;background:linear-gradient(135deg,var(--o3),var(--o) 55%,var(--o2));box-shadow:0 0 0 4px var(--soft),0 8px 18px -8px rgba(194,86,11,.9);transform:scale(1.08)}
.td-step.current small{color:var(--o2);font-weight:850}
.td-facts{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}
.td-facts>div{display:grid;grid-template-columns:auto 1fr;align-items:center;column-gap:6px;min-width:0;padding:8px 9px;border:1px solid var(--line);border-radius:11px;background:#fff}
.td-facts svg{grid-row:span 2;color:var(--o2)}
.td-facts span{font-size:8.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
.td-facts b{min-width:0;font-size:11px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-facts b small{font-weight:600;color:var(--muted)}
.td-stage-line{position:relative;display:flex;align-items:center;gap:7px;margin-top:10px;font-size:11px;font-weight:700;color:var(--ink2)}
.td-stage-line i{width:7px;height:7px;border-radius:50%;background:var(--o);box-shadow:0 0 0 4px var(--soft);animation:tdPulse 2.2s ease-out infinite}
@keyframes tdPulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,.35)}70%{box-shadow:0 0 0 7px rgba(249,115,22,0)}100%{box-shadow:0 0 0 0 rgba(249,115,22,0)}}

/* party cards */
.td-party{display:flex;align-items:center;gap:11px}
.td-avatar{width:42px;height:42px;display:grid;place-items:center;flex:none;border-radius:13px;color:#fff;box-shadow:0 8px 18px -10px rgba(16,26,44,.6)}
.td-avatar.teal{background:linear-gradient(135deg,#2dd4bf,var(--teal))}
.td-avatar.blue{background:linear-gradient(135deg,#60a5fa,var(--blue))}
.td-avatar.lg{width:50px;height:50px;border-radius:15px}
.td-party-main{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0}
.td-party-main strong{font-size:15px;font-weight:850;letter-spacing:-.015em}
.td-link{display:inline-flex;align-items:center;gap:4px;max-width:100%;padding:0;border:0;background:none;font-size:15px;font-weight:850;letter-spacing:-.015em;text-align:left}
.td-link:hover{color:var(--o2)}
.td-link svg{flex:none;color:var(--o2)}
.td-chip{display:inline-flex;align-items:center;padding:3px 8px;border:1px solid rgba(249,115,22,.3);border-radius:7px;background:var(--soft);color:var(--o2);font-size:10px;font-weight:800;font-style:normal}
.td-chip:hover:not(.static){background:rgba(249,115,22,.18)}
.td-party-sub{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.td-party-sub small{font-size:10.5px;color:var(--muted);font-weight:600}
.td-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px}
.td-mini-grid>div{display:flex;flex-direction:column;gap:2px;min-width:0;padding:7px 9px;border:1px solid var(--line);border-radius:10px;background:#f8fafc}
.td-mini-grid .span2{grid-column:1/-1}
.td-mini-grid span{font-size:8.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
.td-mini-grid b{font-size:11px;font-weight:750;overflow-wrap:anywhere}
.td-address{display:flex;align-items:flex-start;gap:8px;margin-top:11px;padding:9px 10px;border:1px solid rgba(249,115,22,.2);border-radius:12px;background:linear-gradient(135deg,#fff,#fff7f0);color:var(--o2)}
.td-address>svg{flex:none;margin-top:1px}
.td-address>span{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.td-address b{font-size:12px;color:var(--ink);font-weight:800;overflow-wrap:anywhere}
.td-address small{font-size:10.5px;color:var(--muted);overflow-wrap:anywhere}
.td-address button{width:28px;height:28px;display:grid;place-items:center;flex:none;border:1px solid var(--line2);border-radius:8px;background:#fff;color:var(--muted)}
.td-address button:hover{color:var(--o2);border-color:rgba(249,115,22,.4)}
.td-hint{margin:7px 0 0;font-size:10px;color:var(--faint)}
.td-hint.center{text-align:center}

/* buttons */
.td-btn{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 14px;border:1px solid transparent;border-radius:11px;font-size:12px;font-weight:800;white-space:nowrap}
.td-btn.primary{color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 8px 18px -8px rgba(194,86,11,.8)}
.td-btn.primary:hover:not(:disabled){box-shadow:0 12px 24px -10px rgba(194,86,11,.9);transform:translateY(-1px)}
.td-btn.call{color:var(--green2);background:rgba(31,148,99,.1);border-color:rgba(31,148,99,.28)}
.td-btn.call:hover:not(:disabled){background:rgba(31,148,99,.16)}
.td-btn.ghost{color:var(--o2);background:#fff;border-color:rgba(249,115,22,.36)}
.td-btn.ghost:hover:not(:disabled){background:#fff7f0}
.td-btn.soft{color:var(--ink2);background:#f1f4f8;border-color:var(--line2)}
.td-btn.wide{width:100%;margin-top:11px}
.td-btn.grow{flex:1}
.td-actions{display:grid;gap:8px;margin-top:11px}
.td-actions.two{grid-template-columns:1fr 1fr}
.td-actions.three{grid-template-columns:1fr 1fr 1fr}

/* materials */
.td-materials{display:grid;gap:9px}
.td-material{display:grid;grid-template-columns:72px minmax(0,1fr);gap:11px;padding:9px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#fff,#f7f9fc)}
.td-img{position:relative;display:block;width:100%;aspect-ratio:1;overflow:hidden;padding:0;border:1px solid var(--line2);border-radius:12px;background:linear-gradient(135deg,#eef2f7,#f8fafc)}
button.td-img:hover{border-color:rgba(249,115,22,.5);box-shadow:0 8px 18px -10px rgba(194,86,11,.7)}
.td-img img{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .3s ease,transform .35s ease}
.td-img img.ready{opacity:1}
button.td-img:hover img{transform:scale(1.05)}
.td-img-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:tdShimmer 1.3s linear infinite}
.td-img-fallback{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--faint);text-align:center}
.td-img-fallback small{font-size:8px;font-weight:700}
.td-thumb::after{content:"REF";position:absolute;right:4px;bottom:4px;padding:2px 5px;border-radius:5px;background:rgba(20,26,36,.72);color:#fff;font-size:7.5px;font-weight:850;letter-spacing:.08em}
@keyframes tdShimmer{to{background-position:-220% 0}}
.td-material-body{display:flex;flex-direction:column;gap:7px;min-width:0}
.td-material-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.td-material-top b{font-size:13px;font-weight:850;letter-spacing:-.01em;overflow-wrap:anywhere}
.td-material-top strong{flex:none;padding:3px 8px;border-radius:8px;background:var(--soft);color:var(--o2);font-size:11px;font-weight:850;font-variant-numeric:tabular-nums}
.td-chips{display:flex;flex-wrap:wrap;gap:5px}
.td-chips span{display:inline-flex;align-items:baseline;gap:4px;padding:3px 7px;border:1px solid var(--line);border-radius:7px;background:#fff;font-size:10.5px;font-weight:750;font-variant-numeric:tabular-nums}
.td-chips small{font-size:8px;font-weight:850;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.td-material-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;font-size:10px;color:var(--muted)}
.td-material-foot em{font-style:normal;font-size:9.5px;font-weight:700;color:var(--ink2)}
.td-material-foot span{display:inline-flex;align-items:center;gap:4px}

/* vehicles */
.td-vstats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.td-vstats span{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:9px;font-weight:850;letter-spacing:.06em;color:var(--muted)}
.td-vstats i{width:6px;height:6px;border-radius:50%;background:var(--blue)}
.td-vstats .t-loading i{background:var(--amber)}.td-vstats .t-loaded i{background:var(--violet)}.td-vstats .t-dispatched i{background:var(--teal)}
.td-vstats b{color:var(--ink);font-size:10px}
.td-vehicles{display:grid;gap:9px}
.td-vehicle{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:8px;padding:11px 11px 10px 15px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(160deg,#fff,#f8fafc);box-shadow:var(--sh-s);animation:tdRise .45s both}
.td-vehicle-head{display:flex;align-items:center;gap:9px}
.td-vehicle-head>div{display:flex;flex-direction:column;flex:1;min-width:0}
.td-vehicle-head small{font-size:8.5px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.td-vehicle-head b{font-size:13px;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.td-slot{width:28px;height:28px;display:grid;place-items:center;flex:none;border-radius:9px;background:var(--soft);color:var(--o2);font-size:11px;font-weight:900}
.td-vehicle-mat{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--ink2)}
.td-vehicle-mat svg{flex:none;color:var(--o2)}
.td-vehicle-qty{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.td-vehicle-qty>div{display:flex;flex-direction:column;gap:1px;padding:6px 8px;border-radius:9px;background:#f4f7fb}
.td-vehicle-qty span{font-size:8px;font-weight:850;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
.td-vehicle-qty b{font-size:11.5px;font-weight:850;font-variant-numeric:tabular-nums}
.td-vehicle-qty b.ok{color:var(--green2)}
.td-vtimes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:0;padding:0;list-style:none}
.td-vtimes li{position:relative;display:flex;flex-direction:column;gap:1px;padding:5px 6px 5px 10px;border-radius:8px;font-size:9px;min-width:0}
.td-vtimes li::before{content:"";position:absolute;left:3px;top:8px;width:4px;height:4px;border-radius:50%;background:var(--line2)}
.td-vtimes li.on::before{background:var(--green)}
.td-vtimes span{font-weight:800;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;font-size:7.5px}
.td-vtimes b{font-weight:700;color:var(--ink2);overflow-wrap:anywhere}
.td-vehicle-foot{display:flex;align-items:center;gap:5px;padding-top:7px;border-top:1px dashed var(--line2);font-size:9.5px;color:var(--faint)}

/* form */
.td-form-card::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--o),var(--o3),transparent)}
.td-form-card fieldset{margin:0;padding:0;border:0;min-width:0}
.td-form-card fieldset:disabled{opacity:.72}
.td-saving{display:inline-flex!important;align-items:center;gap:6px;color:var(--o2)!important}
.td-step-label{display:flex;align-items:center;gap:7px;margin:12px 0 7px;font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)}
.td-step-label span{width:18px;height:18px;display:grid;place-items:center;border-radius:6px;background:linear-gradient(135deg,var(--o),var(--o2));color:#fff;font-size:9.5px}
.td-picks{display:grid;gap:7px;outline:0}
.td-pick{position:relative;display:flex;align-items:flex-start;gap:9px;padding:9px 10px;border:1px solid var(--line2);border-radius:12px;background:#fff;cursor:pointer;transition:.18s}
.td-pick:hover{border-color:rgba(249,115,22,.4)}
.td-pick.on{border-color:rgba(249,115,22,.6);background:linear-gradient(135deg,#fff,#fff5ec);box-shadow:0 0 0 3px rgba(249,115,22,.1)}
.td-pick.off{background:#fafbfc;cursor:not-allowed}
.td-pick input{position:absolute;opacity:0;width:1px;height:1px}
.td-pick input:focus-visible+.td-check{box-shadow:var(--ring)}
.td-check{width:18px;height:18px;display:grid;place-items:center;flex:none;margin-top:1px;border:1.5px solid var(--line2);border-radius:6px;background:#fff;color:transparent;transition:.18s}
.td-pick.on .td-check{border-color:var(--o);background:var(--o);color:#fff}
.td-pick-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.td-pick-body small{font-size:8.5px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.td-pick-body b{font-size:12px;font-weight:850}
.td-pick-meta{display:flex;flex-wrap:wrap;align-items:center;gap:5px}
.td-pick-meta em{font-style:normal;font-size:10px;color:var(--muted);font-weight:600}
.td-pick-meta em.accent{color:var(--o2);font-weight:800}
.td-pick-hint{font-size:10px;color:#a15c07;font-weight:650}
.td-pick-hint.flash{animation:tdShake .4s}
@keyframes tdShake{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
.td-fields{display:grid;gap:9px}
.td-field{position:relative;display:flex;flex-direction:column;gap:5px;margin-top:2px}
.td-field>span{font-size:10.5px;font-weight:800;color:var(--ink2)}
.td-field>span small{font-weight:600;color:var(--faint)}
.td-select{position:relative}
.td-select select{width:100%;height:42px;padding:0 34px 0 12px;border:1px solid var(--line2);border-radius:11px;background:#fff;font-size:12.5px;font-weight:700;appearance:none;outline:0}
.td-select svg{position:absolute;right:12px;top:15px;transform:rotate(90deg);color:var(--muted);pointer-events:none}
.td-select select:focus,.td-field textarea:focus,.td-input-unit:focus-within{border-color:rgba(249,115,22,.55);box-shadow:var(--ring)}
.td-input-unit{display:flex;align-items:center;height:42px;border:1px solid var(--line2);border-radius:11px;background:#fff;overflow:hidden}
.td-input-unit.bad,.td-select select[aria-invalid="true"]{border-color:rgba(214,69,69,.6)}
.td-input-unit input{flex:1;min-width:0;height:100%;padding:0 12px;border:0;outline:0;background:transparent;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums}
.td-input-unit em{height:100%;display:grid;place-items:center;padding:0 12px;border-left:1px solid var(--line);background:#f6f8fb;font-style:normal;font-size:11px;font-weight:800;color:var(--o2)}
.td-field textarea{width:100%;min-height:74px;padding:10px 12px;border:1px solid var(--line2);border-radius:11px;background:#fff;font-size:12px;line-height:1.5;resize:vertical;outline:0}
.td-counter{align-self:flex-end;font-size:9.5px;color:var(--faint);font-variant-numeric:tabular-nums}
.td-counter.warn{color:#a15c07}
.td-expected{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:9px}
.td-expected>div{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border:1px dashed rgba(37,99,235,.3);border-radius:10px;background:rgba(37,99,235,.05)}
.td-expected span{font-size:8.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#3f5f9f}
.td-expected b{font-size:11.5px;font-weight:850;overflow-wrap:anywhere}
.td-summary{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin-top:12px;overflow:hidden;border:1px solid var(--line);border-radius:13px;background:var(--line)}
.td-summary>div{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:9px 11px;background:linear-gradient(135deg,#fff,#fafbfd)}
.td-summary span{font-size:8.5px;font-weight:850;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
.td-summary b{font-size:11.5px;font-weight:800;overflow-wrap:anywhere}
.td-error{margin:6px 0 0;font-size:10.5px;font-weight:700;color:var(--red)}
.td-inline-error{display:flex;align-items:center;gap:8px;margin:10px 0 0;padding:9px 11px;border:1px solid rgba(214,69,69,.28);border-radius:11px;background:#fff6f6;color:#b42318;font-size:11px;font-weight:700}
.td-inline-error svg{flex:none}
.td-inline-error span{flex:1}
.td-inline-error button{padding:5px 10px;border:1px solid rgba(214,69,69,.35);border-radius:8px;background:#fff;color:#b42318;font-size:10.5px;font-weight:800}
.td-main>.td-inline-error{margin:0 0 12px}
.td-form-actions{display:flex;gap:8px;margin-top:13px}
.td-spinner{width:13px;height:13px;border:2px solid rgba(194,86,11,.25);border-top-color:var(--o2);border-radius:50%;animation:tdSpin .7s linear infinite}
.td-spinner.light{border-color:rgba(255,255,255,.35);border-top-color:#fff}

/* timeline */
.td-timeline{margin:0;padding:0;list-style:none}
.td-timeline li{position:relative;display:flex;gap:11px;padding:0 0 13px}
.td-timeline li::before{content:"";position:absolute;left:11px;top:24px;bottom:0;width:1.5px;background:var(--line2)}
.td-timeline li:last-child{padding-bottom:0}
.td-timeline li:last-child::before{display:none}
.td-dot{position:relative;z-index:1;width:24px;height:24px;display:grid;place-items:center;flex:none;border-radius:8px;color:#fff;background:linear-gradient(135deg,#60a5fa,var(--blue))}
.td-timeline .t-loading .td-dot{background:linear-gradient(135deg,#fbbf24,var(--amber))}
.td-timeline .t-loaded .td-dot{background:linear-gradient(135deg,#a78bfa,var(--violet))}
.td-timeline .t-dispatched .td-dot{background:linear-gradient(135deg,#2dd4bf,var(--teal))}
.td-timeline .t-unknown .td-dot{background:linear-gradient(135deg,#cbd5e1,#94a3b8)}
.td-timeline li:first-child .td-dot{box-shadow:0 0 0 4px var(--soft)}
.td-timeline li>div{flex:1;min-width:0}
.td-log-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.td-log-top b{font-size:12px;font-weight:800}
.td-log-top small{flex:none;font-size:9.5px;color:var(--faint)}
.td-log-meta{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.td-log-meta em{padding:2px 7px;border:1px solid var(--line);border-radius:6px;background:#fff;font-style:normal;font-size:9.5px;font-weight:700;color:var(--ink2)}
.td-timeline p{margin:5px 0 0;padding:6px 9px;border-left:2px solid rgba(249,115,22,.4);border-radius:0 8px 8px 0;background:#fffaf5;font-size:10.5px;color:var(--ink2);line-height:1.5}
.td-log-time{display:block;margin-top:4px;font-size:9.5px;color:var(--faint);font-variant-numeric:tabular-nums}

/* empty / state / skeleton */
.td-empty{display:flex;align-items:center;justify-content:center;gap:8px;padding:18px;border:1px dashed var(--line2);border-radius:12px;color:var(--faint);font-size:11px;font-weight:650;text-align:center}
.td-empty.small{padding:12px}
.td-state{display:flex;flex-direction:column;align-items:center;padding:34px 20px;text-align:center}
.td-state>span{width:52px;height:52px;display:grid;place-items:center;border-radius:16px;color:#fff;background:linear-gradient(135deg,var(--o),var(--o2));box-shadow:0 10px 22px -10px rgba(194,86,11,.8)}
.td-state.error>span{background:linear-gradient(135deg,#f87171,var(--red))}
.td-state h2{margin:13px 0 6px;font-size:15px}
.td-state p{max-width:360px;margin:0;font-size:11.5px;color:var(--muted);line-height:1.5}
.td-state-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:15px}
.sk{display:block;border-radius:7px;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:tdShimmer 1.3s linear infinite}

/* sheets / modals */
.td-overlay{position:fixed;inset:0;z-index:50;display:grid;align-items:end;background:rgba(12,22,40,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:tdFade .22s ease}
@keyframes tdFade{from{opacity:0}to{opacity:1}}
.td-sheet{width:min(100%,560px);max-height:90vh;margin:auto auto 0;overflow-y:auto;padding:16px 16px 18px;border:1px solid rgba(255,255,255,.7);border-radius:24px 24px 0 0;background:linear-gradient(180deg,#fff,#f6f9fc);box-shadow:var(--sh-l);outline:0;animation:tdUp .3s cubic-bezier(.2,.8,.3,1)}
.td-sheet::before{content:"";display:block;width:42px;height:4px;margin:-4px auto 12px;border-radius:9px;background:var(--line2)}
@keyframes tdUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.td-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.td-sheet-head>div{display:flex;flex-direction:column;min-width:0}
.td-sheet-head b{font-size:16px;font-weight:850;letter-spacing:-.02em}
.td-sheet-head small{margin-top:2px;font-size:10px;color:var(--faint);font-family:ui-monospace,monospace}
.td-sheet-head button{width:36px;height:36px;flex:none;display:grid;place-items:center;border:1px solid var(--line2);border-radius:11px;background:#fff;color:var(--muted)}
.td-sheet-head button:hover{color:#b42318;border-color:rgba(214,69,69,.4);background:#fff6f6}
.td-modal-hero{display:flex;align-items:center;gap:11px;margin-top:14px;padding:12px;border:1px solid rgba(13,148,136,.2);border-radius:14px;background:linear-gradient(135deg,#fff,#effbf9)}
.td-modal-hero>div{display:flex;flex-direction:column;flex:1;min-width:0}
.td-modal-hero b{font-size:14px;font-weight:850;overflow-wrap:anywhere}
.td-modal-hero small{font-size:10.5px;color:var(--muted)}
.td-dl{margin:12px 0 0;padding:2px 12px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.8)}
.td-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:11.5px}
.td-row:last-child{border-bottom:0}
.td-row dt{color:var(--muted);font-weight:600;flex:none}
.td-row dd{margin:0;font-weight:800;text-align:right;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.td-ref-image{position:relative;margin-top:14px;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:#f4f7fb}
.td-ref-image .td-img.large{aspect-ratio:4/3;border:0;border-radius:0;background:repeating-conic-gradient(#f1f4f8 0 25%,#f8fafc 0 50%) 0 0/18px 18px}
.td-ref-image .td-img.large:hover img{transform:none}
.td-ref-expand{position:absolute;right:9px;top:9px;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;background:rgba(20,26,36,.72);color:#fff;font-size:9.5px;font-weight:750;pointer-events:none}
.td-ref-caption{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-top:1px solid var(--line);background:#fff}
.td-ref-caption b{font-size:12.5px;font-weight:850}
.td-ref-caption span{font-size:11px;font-weight:800;color:var(--o2)}
.td-ref-grid{display:grid;gap:10px}
.td-ref-block h4{display:flex;align-items:center;gap:6px;margin:12px 0 0;font-size:9.5px;font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:var(--o2)}
.td-ref-block .td-dl{margin-top:6px}
.td-notice{display:flex;align-items:flex-start;gap:7px;margin:12px 0 0;padding:9px 11px;border-radius:11px;background:#f4f7fb;color:var(--muted);font-size:10px;line-height:1.5}
.td-notice svg{flex:none;margin-top:1px;color:var(--teal)}
.td-lightbox{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:24px;background:rgba(8,12,20,.9);animation:tdFade .2s ease}
.td-lightbox img{max-width:100%;max-height:100%;object-fit:contain;border-radius:12px;box-shadow:0 30px 60px rgba(0,0,0,.5)}
.td-lightbox button{position:absolute;right:16px;top:16px;width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.25);border-radius:12px;background:rgba(255,255,255,.12);color:#fff}

/* bottom nav + toast */
.td-bottom{position:fixed;z-index:30;left:50%;bottom:10px;transform:translateX(-50%);width:min(calc(100% - 18px),540px);height:62px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px;border:1px solid rgba(20,35,58,.11);border-radius:20px;background:rgba(255,255,255,.9);box-shadow:0 12px 30px rgba(16,29,49,.13),inset 0 1px 0 #fff;backdrop-filter:blur(19px) saturate(1.3);-webkit-backdrop-filter:blur(19px) saturate(1.3)}
.td-bottom button{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-radius:15px;background:transparent;color:#69758a}
.td-bottom button:hover{color:#c85c08}
.td-bottom button.active{color:#c85c08;background:linear-gradient(150deg,rgba(255,247,237,.98),rgba(255,237,213,.82));box-shadow:inset 0 0 0 1px rgba(249,115,22,.2)}
.td-nav-icon{width:24px;height:24px;display:grid;place-items:center;border-radius:8px}
.td-bottom button.active .td-nav-icon{color:#fff;background:linear-gradient(145deg,#ff9b42,var(--o))}
.td-nav-label{font-size:8px;font-weight:750;line-height:1}
.td-toast{position:fixed;z-index:80;left:50%;bottom:84px;display:flex;align-items:center;gap:7px;max-width:calc(100% - 28px);transform:translate(-50%,12px) scale(.97);opacity:0;padding:11px 16px;border-radius:12px;color:#fff;background:linear-gradient(135deg,#1d2634,#11161f);border:1px solid rgba(255,255,255,.1);font-size:11px;font-weight:700;pointer-events:none;box-shadow:0 18px 38px -14px rgba(0,0,0,.7);transition:.26s cubic-bezier(.2,.8,.3,1)}
.td-toast.show{opacity:1;transform:translate(-50%,0) scale(1)}
.td-toast.ok svg{color:#4ade80}
.td-toast.error svg{color:#f87171}

/* responsive */
@media(min-width:760px){
  .td-main{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
  .td-panel{margin-bottom:0}
  .td-identity,.td-materials-panel,.td-wide,.td-main>.td-inline-error{grid-column:1/-1}
  .td-main>.td-inline-error{margin:0}
  .td-material{grid-template-columns:90px minmax(0,1fr)}
  .td-materials{grid-template-columns:1fr 1fr}
  .td-vehicles{grid-template-columns:1fr 1fr}
  .td-picks{grid-template-columns:1fr 1fr}
  .td-fields{grid-template-columns:1fr 1fr}
  .td-summary{grid-template-columns:repeat(4,minmax(0,1fr))}
  .td-title h1{font-size:30px}
  .td-overlay{align-items:center}
  .td-sheet{margin:auto;border-radius:22px;animation:tdPop .26s cubic-bezier(.2,.8,.3,1)}
  .td-sheet::before{display:none}
  .td-ref-sheet{width:min(100%,760px)}
  .td-ref-grid{grid-template-columns:1fr 1fr}
}
@keyframes tdPop{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:none}}
@media(min-width:1000px){.td-vehicles{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:560px){
  .td-ids{grid-template-columns:1fr 1fr}
  .td-idstatus{grid-column:1/-1;order:-1;display:flex;justify-content:flex-end;margin-bottom:-2px}
  .td-facts{grid-template-columns:1fr 1fr}
}
@media(max-width:400px){
  .td-ids{grid-template-columns:1fr}
  .td-title h1{font-size:22px}
  .td-title{flex-direction:column;align-items:flex-start;gap:8px}
  .td-actions.three{grid-template-columns:1fr 1fr}
  .td-actions.three .td-btn.soft{grid-column:1/-1}
  .td-vtimes{grid-template-columns:1fr}
  .td-expected,.td-summary{grid-template-columns:1fr}
  .td-step small{font-size:7.5px}
}
@media(prefers-reduced-motion:reduce){.td-root *{transition:none!important;animation:none!important}}
`;
