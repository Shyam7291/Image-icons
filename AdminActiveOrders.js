import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminActiveOrders } from "../api/adminApi";

const DEMO_NOW = Date.now();
const minutesAgo = (minutes) => new Date(DEMO_NOW - minutes * 60 * 1000).toISOString();


const DEMO_ORDERS = [
  {
    deliveryId: "SD-260804-014",
    requestId: "SR-260804-021",
    status: "NEW",
    buyer: "Sri Venkateshwara Infra",
    deliveryArea: "Hoskote",
    seller: null,
    transporter: null,
    vehicleCount: 0,
    materials: [
      { materialName: "40mm Crushed Stone", totalTons: 30, finalRate: 1450 },
      { materialName: "20mm Crushed Stone", totalTons: 15, finalRate: 1320 },
      { materialName: "GSB", totalTons: 17, finalRate: 980 }
    ],
    confirmedAt: minutesAgo(24),
    loadingStartedAt: null,
    dispatchedAt: null,
    deliveredAt: null,
    updatedAt: minutesAgo(24),
    feedback: null
  },
  {
    deliveryId: "SD-260804-013",
    requestId: "SR-260804-019",
    status: "NEW",
    buyer: "Prestige Buildtech",
    deliveryArea: "Whitefield",
    seller: "StoneHub Supplies",
    transporter: null,
    vehicleCount: 0,
    materials: [{ materialName: "M-Sand", totalTons: 42, finalRate: 1175 }],
    confirmedAt: minutesAgo(58),
    loadingStartedAt: null,
    dispatchedAt: null,
    deliveredAt: null,
    updatedAt: minutesAgo(58),
    feedback: null
  },
  {
    deliveryId: "SD-260804-012",
    requestId: "SR-260804-017",
    status: "LOADING",
    buyer: "Anand Constructions",
    deliveryArea: "Sarjapur",
    seller: "BuildRock Aggregates",
    transporter: "Metro Fleet",
    vehicleCount: 2,
    materials: [
      { materialName: "River Sand", totalTons: 18, finalRate: 1620 },
      { materialName: "12mm Aggregate", totalTons: 16, finalRate: 1380 }
    ],
    confirmedAt: minutesAgo(190),
    loadingStartedAt: minutesAgo(37),
    dispatchedAt: null,
    deliveredAt: null,
    updatedAt: minutesAgo(37),
    feedback: null
  },
  {
    deliveryId: "SD-260804-010",
    requestId: "SR-260804-014",
    status: "IN_TRANSIT",
    buyer: "Nakshatra Developers",
    deliveryArea: "KR Puram",
    seller: "Eastern Stone Works",
    transporter: "Rapid Route Logistics",
    vehicleCount: 3,
    materials: [
      { materialName: "20mm Aggregate", totalTons: 24, finalRate: 1365 },
      { materialName: "Manufactured Sand", totalTons: 28, finalRate: 1190 }
    ],
    confirmedAt: minutesAgo(410),
    loadingStartedAt: minutesAgo(260),
    dispatchedAt: minutesAgo(86),
    deliveredAt: null,
    updatedAt: minutesAgo(22),
    feedback: null
  },
  {
    deliveryId: "SD-260803-009",
    requestId: "SR-260803-028",
    status: "IN_TRANSIT",
    buyer: "GreenField Estates",
    deliveryArea: "Devanahalli",
    seller: "Prime Earth Materials",
    transporter: "NorthGate Transport",
    vehicleCount: 4,
    materials: [
      { materialName: "Red Soil", totalTons: 50, finalRate: 740 },
      { materialName: "Quarry Dust", totalTons: 12, finalRate: 910 }
    ],
    confirmedAt: minutesAgo(920),
    loadingStartedAt: minutesAgo(760),
    dispatchedAt: minutesAgo(540),
    deliveredAt: null,
    updatedAt: minutesAgo(185),
    feedback: null
  },
  {
    deliveryId: "SD-260803-007",
    requestId: "SR-260803-022",
    status: "DELIVERED",
    buyer: "Highway Works Div. 4",
    deliveryArea: "Yelahanka",
    seller: "RoadBase Minerals",
    transporter: "Bengaluru Heavy Movers",
    vehicleCount: 4,
    materials: [{ materialName: "WMM", totalTons: 65, finalRate: 1050 }],
    confirmedAt: minutesAgo(1600),
    loadingStartedAt: minutesAgo(1420),
    dispatchedAt: minutesAgo(1190),
    deliveredAt: minutesAgo(455),
    updatedAt: minutesAgo(455),
    feedback: { rating: 4.8, comment: "Delivered on time" }
  },
  {
    deliveryId: "SD-260802-006",
    requestId: "SR-260802-019",
    status: "DELIVERED",
    buyer: "Urbanline Projects",
    deliveryArea: "Electronic City",
    seller: "Crestline Materials",
    transporter: "South City Carriers",
    vehicleCount: 3,
    materials: [
      { materialName: "6mm Chips", totalTons: 10, finalRate: 1540 },
      { materialName: "Plastering Sand", totalTons: 22, finalRate: 1260 }
    ],
    confirmedAt: minutesAgo(2860),
    loadingStartedAt: minutesAgo(2640),
    dispatchedAt: minutesAgo(2410),
    deliveredAt: minutesAgo(1780),
    updatedAt: minutesAgo(1780),
    feedback: { rating: 4.4, comment: "Material quality was good" }
  }
];

const FILTERS = ["ALL", "NEW", "LOADING", "IN_TRANSIT", "DELIVERED"];
const FILTER_LABELS = { ALL: "All", NEW: "New", LOADING: "Loading", IN_TRANSIT: "In Transit", DELIVERED: "Delivered" };
const STATUS_CLASS = { NEW: "new", LOADING: "loading", IN_TRANSIT: "transit", DELIVERED: "delivered" };

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.6-2.6L20 9"/><path d="m4 15 2.3 2.6A7 7 0 0 0 18 15"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    close: <><path d="m7 7 10 10"/><path d="m17 7-10 10"/></>,
    sort: <><path d="M8 6h12M8 12h9M8 18h6"/><path d="m3 8 2-2 2 2M5 6v12"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.2"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    orders: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    samples: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M8 15h8"/></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1"/></>,
    cube: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z"/><path d="m4 6.5 8 4.5 8-4.5M12 11v9"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    volume: <><path d="M4 15V9M8 18V6M12 20V4M16 16V8M20 13v-2"/></>,
    star: <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.5-4.4 6.2-.9L12 2.8Z"/>,
    activity: <><path d="M3 12h4l2-6 4 12 2-6h6"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    inbox: <><path d="M4 5h16v14H4z"/><path d="M4 14h4l2 2h4l2-2h4"/></>,
    cubesNav: <><path d="M12 2.6 8.4 4.6v4.1L12 10.7l3.6-2V4.6z"/><path d="m8.4 4.6 3.6 2 3.6-2M12 6.6v4.1"/><path d="M7.2 12.3 3.6 14.3v4.1l3.6 2 3.6-2v-4.1z"/><path d="m3.6 14.3 3.6 2 3.6-2M7.2 16.3v4.1"/><path d="M16.8 12.3l-3.6 2v4.1l3.6 2 3.6-2v-4.1z"/><path d="m13.2 14.3 3.6 2 3.6-2M16.8 16.3v4.1"/></>,
    truckNav: <><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    docNav: <><path d="M14 3H7.4A2.4 2.4 0 0 0 5 5.4v13.2A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V8z"/><path d="M14 3v5h5"/><path d="M8.6 12h6.4M8.6 15.2h6.4M8.6 18.4h3.8"/></>,
    clipboardCheckNav: <><path d="M9 4.4H7.4A2.4 2.4 0 0 0 5 6.8v11.8A2.4 2.4 0 0 0 7.4 21h9.2a2.4 2.4 0 0 0 2.4-2.4V6.8a2.4 2.4 0 0 0-2.4-2.4H15"/><rect x="9" y="2.6" width="6" height="3.9" rx="1.4"/><path d="m9.4 13.6 2.1 2.1 3.9-3.9"/></>
  };
  return <svg {...common}>{paths[name] || paths.orders}</svg>;
}

function relativeTime(iso, now) {
  if (!iso) return "--";
  const delta = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function totalTons(order) { return order.materials.reduce((sum, item) => sum + item.totalTons, 0); }
function money(value) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value); }
function statusTime(order) {
  if (order.status === "DELIVERED") return { label: "Delivered", value: order.deliveredAt };
  if (order.status === "IN_TRANSIT") return { label: "Last updated", value: order.updatedAt || order.dispatchedAt };
  if (order.status === "LOADING") return { label: "Loading started", value: order.loadingStartedAt };
  return { label: "Confirmed", value: order.confirmedAt };
}
function matchesDateFilter(order, dateFilter, now) {
  if (dateFilter === "ALL") return true;
  const created = new Date(order.confirmedAt).getTime();
  if (!Number.isFinite(created)) return false;
  const current = new Date(now);
  if (dateFilter === "TODAY") {
    const value = new Date(created);
    return value.getFullYear() === current.getFullYear() && value.getMonth() === current.getMonth() && value.getDate() === current.getDate();
  }
  const days = { "7_DAYS": 7, "30_DAYS": 30, "90_DAYS": 90 }[dateFilter];
  return !days || (created >= now - days * 86400000 && created <= now);
}

function Metric({ icon, label, value, unit, hint, tone, bars }) {
  return <article className={`ao-metric tone-${tone}`}>
    <div className="ao-metric-head"><span className="ao-metric-icon"><Icon name={icon} size={14}/></span><span className="ao-metric-label">{label}</span></div>
    <div className="ao-metric-value">{value}{unit ? <em>{unit}</em> : null}</div>
    <div className="ao-metric-foot"><span>{hint}</span><span className="ao-bars">{bars.map((bar, index) => <i key={index} style={{ height: `${bar}%` }}/>)}</span></div>
  </article>;
}

function OrderCard({ order, now, onOpen, index }) {
  const timing = statusTime(order);
  const assignmentMissing = !order.seller || !order.transporter;
  const handleKeyDown = event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(order); }
  };
  return <article className={`ao-card status-${STATUS_CLASS[order.status]}`} style={{ animationDelay: `${index * 55}ms` }} role="button" tabIndex="0" onClick={() => onOpen(order)} onKeyDown={handleKeyDown} aria-label={`Open delivery ${order.deliveryId}`}>
    <span className="ao-card-rail"/><span className="ao-card-mesh"/>
    <header className="ao-card-head">
      <div className="ao-ids"><strong>{order.deliveryId}</strong><span><Icon name="link" size={11}/> {order.requestId}</span></div>
      <span className={`ao-badge ${STATUS_CLASS[order.status]}`}><i/>{FILTER_LABELS[order.status]}</span>
    </header>
    <div className="ao-buyer"><Icon name="user" size={14}/><span>{order.buyer}</span></div>
    <div className="ao-materials">
      {order.materials.map((material, materialIndex) => <div className="ao-material" key={`${material.materialName}-${materialIndex}`}>
        <span className="ao-material-icon"><Icon name="cube" size={13}/></span>
        <span className="ao-material-name">{material.materialName}</span>
        <strong>₹{money(material.finalRate)}<small>/t</small></strong>
      </div>)}
    </div>
    <div className="ao-order-meta">
      <div><Icon name="volume" size={14}/><span>Total quantity</span><strong>{totalTons(order)} t</strong></div>
      <div><Icon name="pin" size={14}/><span>Delivery</span><strong>{order.deliveryArea}</strong></div>
    </div>
    <div className="ao-assignments">
    <div>
  <span>Material Source</span>

  <strong>
    {order.materials
      .map(
        (material) =>
          material.sourceArea
      )
      .filter(Boolean)
      .join(", ") ||
      "Not recorded"}
  </strong>
</div>
      <div className={!order.transporter ? "missing" : ""}><span>Transporter</span><strong>{order.transporter || "Not assigned"}</strong></div>
    </div>
    <footer className="ao-card-foot">
      <div className="ao-stage-time"><Icon name="clock" size={14}/><span>{timing.label}</span><strong>{relativeTime(timing.value, now)}</strong>{assignmentMissing ? <em>Assignment pending</em> : null}</div>
      <span className="ao-open">View Order <Icon name="arrow" size={15}/></span>
    </footer>
  </article>;
}

function SkeletonCard() {
  return <div className="ao-card ao-skeleton" aria-hidden="true"><span className="ao-card-rail"/><i className="sk sk-id"/><i className="sk sk-badge"/><i className="sk sk-line"/><i className="sk sk-chips"/><i className="sk sk-meta"/><i className="sk sk-foot"/></div>;
}

export default function AdminActiveOrders({ onBack, onOpenOrder, onHome, onOrders, onSamples, onTransporterBidding, onRateRequests, onConfirmedOrders }) {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [activeNav, setActiveNav] = useState("Orders");
  const [sort, setSort] = useState("attention");
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(() => Date.now());
  const toastTimer = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    let isActive = true;
  
    async function loadActiveOrders() {
      setLoading(true);
      setError("");
  
      try {
        const liveOrders =
          await getAdminActiveOrders();
  
        if (isActive) {
          setOrders(liveOrders);
          setRefreshedAt(Date.now());
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError.message ||
              "Unable to load active orders."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
  
    loadActiveOrders();
  
    return () => {
      isActive = false;
    };
  }, []);
  
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const visible = () => { if (!document.hidden) setNow(Date.now()); };
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);
  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  const showToast = useCallback(message => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const dateOrders = useMemo(() => orders.filter(order => matchesDateFilter(order, dateFilter, now)), [orders, dateFilter, now]);
  const counts = useMemo(() => {
    const result = { ALL: dateOrders.length, NEW: 0, LOADING: 0, IN_TRANSIT: 0, DELIVERED: 0 };
    dateOrders.forEach(order => { result[order.status] += 1; });
    return result;
  }, [dateOrders]);

  const stats = useMemo(() => {
    const active = orders.filter(order => order.status !== "DELIVERED");
    const assignmentPending = active.filter(order => !order.seller || !order.transporter).length;
    const dispatchAttention = active.filter(order => {
      if (order.status === "NEW") return Date.now() - new Date(order.confirmedAt).getTime() > 45 * 60000;
      if (order.status === "LOADING") return Date.now() - new Date(order.loadingStartedAt).getTime() > 90 * 60000;
      if (order.status === "IN_TRANSIT") return Date.now() - new Date(order.updatedAt).getTime() > 120 * 60000;
      return false;
    }).length;
    const volume = active.reduce((sum, order) => sum + totalTons(order), 0);
    const ratings = orders.filter(order => order.feedback?.rating).map(order => order.feedback.rating);
    const feedback = ratings.length ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1) : "--";
    return { assignmentPending, dispatchAttention, volume, feedback, ratingCount: ratings.length };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = dateOrders.filter(order => {
      const statusMatch = filter === "ALL" || order.status === filter;
      const text = [order.deliveryId, order.requestId, order.buyer, order.deliveryArea, order.seller || "", order.transporter || "", ...order.materials.map(item => item.materialName)].join(" ").toLowerCase();
      return statusMatch && (!normalized || text.includes(normalized));
    });
    const statusRank = { NEW: 0, LOADING: 1, IN_TRANSIT: 2, DELIVERED: 3 };
    return [...matched].sort((a, b) => {
      if (sort === "newest") return new Date(b.confirmedAt) - new Date(a.confirmedAt);
      if (sort === "oldest") return new Date(a.confirmedAt) - new Date(b.confirmedAt);
      if (sort === "volume") return totalTons(b) - totalTons(a);
      if (sort === "status") return statusRank[a.status] - statusRank[b.status];
      const aMissing = !a.seller || !a.transporter ? 0 : 1;
      const bMissing = !b.seller || !b.transporter ? 0 : 1;
      return aMissing - bMissing || new Date(a.updatedAt) - new Date(b.updatedAt);
    });
  }, [dateOrders, query, filter, sort]);

  const handleRefresh = async () => {
    setLoading(true);
    setError("");
  
    try {
      const liveOrders =
        await getAdminActiveOrders();
  
      const refreshed = Date.now();
  
      setOrders(liveOrders);
      setNow(refreshed);
      setRefreshedAt(refreshed);
      showToast("Active orders synced");
    } catch (refreshError) {
      setError(
        refreshError.message ||
          "Unable to refresh active orders."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleOpen = order => onOpenOrder ? onOpenOrder(order) : showToast(`Opening ${order.deliveryId}`);
  const handleNav = (key, callback, label) => { setActiveNav(key); callback ? callback() : showToast(`${label} selected`); };
  const navItems = [
    { key: "Samples", label: "Samples", icon: "cubesNav", action: onSamples },
    { key: "Bidding", label: "Transport", icon: "truckNav", action: onTransporterBidding, dot: true },
    { key: "Home", label: "Home", icon: "home", action: onHome },
    { key: "Requests", label: "Rates", icon: "docNav", action: onRateRequests, dot: true },
    { key: "Orders", label: "Orders", icon: "clipboardCheckNav", action: onConfirmedOrders || onOrders }
  ];
  const activeNavIndex = Math.max(0, navItems.findIndex(item => item.key === activeNav));
  const retry = async () => {
    setError("");
    setLoading(true);
  
    try {
      const liveOrders =
        await getAdminActiveOrders();
  
      const refreshed = Date.now();
  
      setOrders(liveOrders);
      setNow(refreshed);
      setRefreshedAt(refreshed);
    } catch (retryError) {
      setError(
        retryError.message ||
          "Unable to load active orders."
      );
    } finally {
      setLoading(false);
    }
  };

  return <div className="ao-root">
    <style>{STYLES}</style>
    <div className="ao-bg" aria-hidden="true"><span className="ao-bg-grid"/><span className="ao-bg-orb one"/><span className="ao-bg-orb two"/><span className="ao-bg-teal"/></div>
    <header className="ao-header"><div className="ao-header-inner">
      <div className="ao-header-row">
        <button type="button" className="ao-iconbtn" onClick={() => onBack ? onBack() : showToast("Back navigation")} aria-label="Go back"><Icon name="back"/></button>
        <div className="ao-brand"><span className="ao-brand-mark"><Icon name="truck" size={18}/><i/></span><span><strong>StoneRate Admin</strong><small>Delivery Operations</small></span></div>
        <span className="ao-live"><i/>LIVE</span>
        <button type="button" className={`ao-iconbtn ao-refresh${loading ? " spinning" : ""}`} onClick={handleRefresh} disabled={loading} aria-label="Refresh active orders"><Icon name="refresh"/></button>
      </div>
      <div className="ao-hero"><h1>Active <span>Orders</span></h1><p>Manage assignments, loading, transit, and delivery.</p><small><i/> Updated {relativeTime(new Date(refreshedAt).toISOString(), now)}</small></div>
      <section className="ao-metrics" aria-label="Active order summary">
        <Metric icon="user" label="Assignment Pending" value={stats.assignmentPending} hint="Seller or transporter missing" tone="orange" bars={[42,58,72,54,84]}/>
        <Metric icon="alert" label="Dispatch Attention" value={stats.dispatchAttention} hint="Delayed operational updates" tone="red" bars={[32,65,46,78,60]}/>
        <Metric icon="volume" label="Active Volume" value={stats.volume} unit="t" hint="New, loading and in transit" tone="blue" bars={[38,50,68,61,88]}/>
        <Metric icon="star" label="Overall Feedback" value={stats.feedback} unit="★" hint={`${stats.ratingCount} buyer ratings`} tone="green" bars={[58,70,82,76,92]}/>
      </section>
    </div></header>

    <main className="ao-shell">
      <section className="ao-toolbar">
        <div className="ao-toolbar-top">
          <label className="ao-search"><Icon name="search" size={16}/><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search delivery, request, material or area" aria-label="Search active orders"/>{query ? <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Clear search"><Icon name="close" size={13}/></button> : null}</label>
          <label className="ao-sort" aria-label="Sort active orders"><Icon name="sort" size={14}/><select value={sort} onChange={event => setSort(event.target.value)}><option value="attention">Attention first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="volume">Highest volume</option><option value="status">Status order</option></select></label>
        </div>
        <div className="ao-filters" role="tablist" aria-label="Delivery status">
          {FILTERS.map(item => <button key={item} type="button" role="tab" aria-selected={filter === item} className={`ao-filter s-${STATUS_CLASS[item] || "all"}${filter === item ? " active" : ""}`} onClick={() => setFilter(item)}><i/>{FILTER_LABELS[item]}<span>{counts[item]}</span></button>)}
          <label className={`ao-date${dateFilter !== "ALL" ? " active" : ""}`}><Icon name="calendar" size={14}/><select value={dateFilter} onChange={event => setDateFilter(event.target.value)} aria-label="Filter by confirmation date"><option value="ALL">Any date</option><option value="TODAY">Today</option><option value="7_DAYS">Last 7 days</option><option value="30_DAYS">Last 30 days</option><option value="90_DAYS">Last 3 months</option></select></label>
        </div>
      </section>
      <div className="ao-result"><strong><Icon name="activity" size={13}/>{loading ? "Loading orders" : `${visibleOrders.length} order${visibleOrders.length === 1 ? "" : "s"}`}</strong><span>{filter === "ALL" ? "All statuses" : FILTER_LABELS[filter]} · {sort === "attention" ? "Attention first" : "Sorted"}</span></div>
      {error ? <section className="ao-state error"><span><Icon name="alert" size={22}/></span><h2>Could not load active orders</h2><p>{error}</p><button type="button" onClick={retry}>Retry</button></section> : loading ? <section className="ao-list"><SkeletonCard/><SkeletonCard/><SkeletonCard/><SkeletonCard/></section> : visibleOrders.length === 0 ? <section className="ao-state"><span><Icon name="inbox" size={22}/></span><h2>{query ? `No orders found for “${query}”.` : "No active orders match this filter."}</h2><p>Try another status, date range, or search term.</p>{query ? <button type="button" onClick={() => setQuery("")}>Clear search</button> : null}</section> : <section className="ao-list" aria-label="Active orders">{visibleOrders.map((order, index) => <OrderCard key={order.deliveryId} order={order} now={now} onOpen={handleOpen} index={index}/>)}</section>}
    </main>
    <nav className="ao-bottom" aria-label="Admin primary navigation">
      <span className="ao-nav-selection" style={{ transform: `translateX(${activeNavIndex * 100}%)` }} aria-hidden="true"/>
      {navItems.map(item => { const isActive = activeNav === item.key; return <button key={item.key} type="button" className={isActive ? "active" : ""} aria-current={isActive ? "page" : undefined} onClick={() => handleNav(item.key, item.action, item.label)}><span className="ao-nav-icon"><Icon name={item.icon} size={17} strokeWidth={1.8}/>{item.dot ? <i className="ao-nav-notice" aria-hidden="true"/> : null}</span><span className="ao-nav-label">{item.label}</span></button>; })}
    </nav>
    <div className={`ao-toast${toast ? " show" : ""}`} role="status"><i/>{toast}</div>
  </div>;
}

const STYLES = `
.ao-root{--orange:#f97316;--orange2:#c2560b;--orangeSoft:rgba(249,115,22,.11);--blue:#2563eb;--teal:#0d9488;--green:#1f9463;--red:#d64545;--amber:#e08b1e;--ink:#141a24;--ink2:#3b4658;--muted:#6b7687;--faint:#96a0af;--line:#e9edf3;--line2:#dbe2ec;--glass:rgba(255,255,255,.78);--paper:rgba(255,255,255,.93);position:relative;isolation:isolate;min-height:100dvh;padding-bottom:86px;color:var(--ink);background:#f4f7fb;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}.ao-root *{box-sizing:border-box}.ao-root button,.ao-root input,.ao-root select{font-family:inherit}
.ao-bg{position:fixed;inset:0;z-index:-1;overflow:hidden;background:#f4f7fb;pointer-events:none}.ao-bg-grid{position:absolute;inset:0;background:linear-gradient(transparent 0 31px,rgba(24,42,72,.035) 31px 32px),linear-gradient(90deg,transparent 0 31px,rgba(24,42,72,.035) 31px 32px);background-size:32px 32px;-webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%);mask-image:radial-gradient(120% 85% at 50% 0%,#000 20%,transparent 78%)}.ao-bg-orb,.ao-bg-teal{position:absolute;border-radius:50%;filter:blur(58px);opacity:.5}.ao-bg-orb.one{width:44vw;height:44vw;max-width:520px;max-height:520px;left:-9vw;top:-16vw;background:radial-gradient(circle,rgba(255,168,74,.55),transparent 66%)}.ao-bg-orb.two{width:40vw;height:40vw;max-width:470px;max-height:470px;right:-10vw;top:-6vw;background:radial-gradient(circle,rgba(80,140,255,.42),transparent 66%)}.ao-bg-teal{width:36vw;height:36vw;max-width:420px;max-height:420px;left:34vw;top:26vw;background:radial-gradient(circle,rgba(13,148,136,.26),transparent 68%)}
.ao-header{position:relative;border-bottom:1px solid rgba(16,28,50,.06);background:linear-gradient(180deg,rgba(244,247,251,.24),rgba(244,247,251,.05));backdrop-filter:blur(2px)}.ao-header-inner{width:min(100%,1080px);margin:auto;padding:12px 14px 16px}.ao-header-row{display:flex;align-items:center;gap:10px}.ao-iconbtn{width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;border:1px solid var(--line2);border-radius:11px;background:var(--paper);color:var(--ink2);box-shadow:0 2px 8px rgba(20,26,36,.05);cursor:pointer;transition:.18s}.ao-iconbtn:hover{transform:translateY(-1px);color:var(--orange2);border-color:rgba(249,115,22,.4)}.ao-iconbtn:disabled{opacity:.55}.ao-refresh svg{transition:.35s}.ao-refresh:hover svg{transform:rotate(120deg)}.ao-refresh.spinning svg{animation:aoSpin .8s linear infinite}.ao-brand{display:flex;align-items:center;gap:9px;min-width:0;flex:1}.ao-brand-mark{position:relative;width:36px;height:36px;display:grid;place-items:center;border-radius:11px;color:#fff;background:linear-gradient(135deg,var(--orange),var(--orange2));box-shadow:0 6px 16px rgba(249,115,22,.3)}.ao-brand-mark i{position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;background:#22c55e;border:2px solid #fff}.ao-brand>span:last-child{display:flex;flex-direction:column;min-width:0}.ao-brand strong{font-size:14px}.ao-brand small{font-size:10px;color:var(--orange2);font-weight:700;letter-spacing:.1em;text-transform:uppercase}.ao-live{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;color:#0f7a4c;background:rgba(31,148,99,.12);font-size:9px;font-weight:800}.ao-live i{width:5px;height:5px;border-radius:50%;background:var(--green)}.ao-hero{padding:16px 2px 0}.ao-hero h1{margin:0;font-size:28px;line-height:1.08;letter-spacing:-.035em}.ao-hero h1 span{background:linear-gradient(100deg,var(--orange),#fbbf24 55%,var(--orange2));background-clip:text;color:transparent}.ao-hero p{margin:7px 0 0;font-size:12.5px;color:var(--muted)}.ao-hero>small{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:5px 10px;border-radius:999px;color:var(--orange2);background:var(--orangeSoft);font-size:10px;font-weight:650}.ao-hero>small i{width:5px;height:5px;border-radius:50%;background:var(--orange)}
.ao-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:16px}.ao-metric{--tone:var(--orange);--soft:var(--orangeSoft);position:relative;overflow:hidden;padding:11px 12px 10px;border:1px solid var(--line);border-radius:14px;background:var(--paper);box-shadow:0 4px 14px rgba(20,26,36,.05);transition:.2s}.ao-metric:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(20,26,36,.09)}.ao-metric:before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--tone)}.ao-metric.tone-red{--tone:var(--red);--soft:rgba(214,69,69,.11)}.ao-metric.tone-blue{--tone:var(--blue);--soft:rgba(37,99,235,.11)}.ao-metric.tone-green{--tone:var(--green);--soft:rgba(31,148,99,.11)}.ao-metric-head{display:flex;align-items:center;gap:6px}.ao-metric-icon{width:22px;height:22px;display:grid;place-items:center;border-radius:7px;color:var(--tone);background:var(--soft)}.ao-metric-label{font-size:9.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ao-metric-value{margin-top:8px;font-size:23px;font-weight:750;line-height:1}.ao-metric-value em{font-style:normal;font-size:11px;color:var(--muted);margin-left:3px}.ao-metric-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:6px;margin-top:8px;font-size:9.5px;color:var(--faint)}.ao-bars{display:flex;align-items:flex-end;gap:2px;height:18px}.ao-bars i{width:3px;border-radius:2px;background:var(--tone);opacity:.45}
.ao-shell{width:min(100%,1080px);margin:auto;padding:16px 14px 24px}.ao-toolbar{position:relative;padding:11px;border:1px solid var(--line);border-radius:16px;background:var(--glass);backdrop-filter:blur(16px);box-shadow:0 8px 26px rgba(20,26,36,.06)}.ao-toolbar-top{display:grid;grid-template-columns:minmax(0,4fr) minmax(95px,1fr);gap:8px}.ao-search{height:42px;display:flex;align-items:center;gap:8px;min-width:0;padding:0 10px;border:1px solid var(--line2);border-radius:12px;background:#fff;color:var(--faint)}.ao-search:focus-within{border-color:rgba(249,115,22,.55);box-shadow:0 0 0 3px rgba(249,115,22,.14);color:var(--orange2)}.ao-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font-size:13px;color:var(--ink)}.ao-search button{width:23px;height:23px;display:grid;place-items:center;border:0;border-radius:7px;background:#eef1f6;color:var(--muted);cursor:pointer}.ao-sort{position:relative;display:block;min-width:0}.ao-sort svg{position:absolute;left:9px;top:14px;color:var(--muted);pointer-events:none}.ao-sort select{width:100%;height:42px;padding:0 7px 0 29px;border:1px solid var(--line2);border-radius:12px;background:#fff;color:var(--ink);font-size:10.5px;font-weight:700;outline:0;appearance:none}.ao-filters{display:flex;gap:6px;margin-top:9px;padding:2px;overflow-x:auto;scrollbar-width:none}.ao-filters::-webkit-scrollbar{display:none}.ao-filter,.ao-date{height:33px;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:0 10px;border:1px solid var(--line2);border-radius:10px;background:#fff;color:var(--muted);font-size:11.5px;font-weight:700;white-space:nowrap;cursor:pointer}.ao-filter>i{width:5px;height:5px;border-radius:50%;background:#c3cbd6}.ao-filter.s-new>i{background:var(--blue)}.ao-filter.s-loading>i{background:var(--amber)}.ao-filter.s-transit>i{background:var(--teal)}.ao-filter.s-delivered>i{background:var(--green)}.ao-filter span{padding:1px 5px;border-radius:5px;background:#f1f4f8;color:var(--faint);font-size:10px}.ao-filter.active,.ao-date.active{color:var(--orange2);border-color:rgba(249,115,22,.5);background:linear-gradient(135deg,rgba(249,115,22,.14),rgba(251,191,36,.10));box-shadow:inset 0 -2px 0 var(--orange)}.ao-date select{height:30px;max-width:110px;border:0;outline:0;background:transparent;color:inherit;font-size:11px;font-weight:700;cursor:pointer}
.ao-result{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 3px 10px;font-size:11px;color:var(--faint)}.ao-result strong{display:flex;align-items:center;gap:6px;color:var(--ink)}.ao-result strong svg{color:var(--orange)}.ao-list{display:grid;gap:11px}.ao-card{position:relative;overflow:hidden;padding:13px 13px 11px 16px;border:1px solid var(--line);border-radius:16px;background:var(--paper);box-shadow:0 4px 16px rgba(20,26,36,.055);cursor:pointer;transition:.22s;animation:aoRise .5s both}.ao-card:hover{transform:translateY(-3px);border-color:rgba(249,115,22,.34);box-shadow:0 18px 38px rgba(20,26,36,.11)}.ao-card-rail{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(var(--blue),#60a5fa)}.ao-card.status-loading .ao-card-rail{background:linear-gradient(#fbbf24,var(--amber))}.ao-card.status-transit .ao-card-rail{background:linear-gradient(#2dd4bf,var(--teal))}.ao-card.status-delivered .ao-card-rail{background:linear-gradient(#34d399,var(--green))}.ao-card-mesh{position:absolute;inset:0;pointer-events:none;opacity:.42;background-image:linear-gradient(rgba(20,26,36,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(20,26,36,.035) 1px,transparent 1px);background-size:22px 22px;mask-image:radial-gradient(ellipse 70% 90% at 100% 0%,#000,transparent 72%)}.ao-card-head{position:relative;display:flex;justify-content:space-between;gap:8px}.ao-ids{display:flex;flex-direction:column;min-width:0}.ao-ids strong{font-family:ui-monospace,monospace;font-size:12.5px}.ao-ids span{display:flex;align-items:center;gap:4px;margin-top:3px;color:var(--faint);font-size:9.5px}.ao-badge{display:inline-flex;align-items:center;gap:5px;align-self:flex-start;padding:4px 8px;border:1px solid;border-radius:7px;font-size:9px;font-weight:850;letter-spacing:.07em}.ao-badge i{width:4px;height:4px;border-radius:50%;background:currentColor}.ao-badge.new{color:#175cd3;background:#eff6ff;border-color:#bfdbfe}.ao-badge.loading{color:#a15c07;background:rgba(224,139,30,.12);border-color:rgba(224,139,30,.32)}.ao-badge.transit{color:#08776d;background:#eafbf8;border-color:#99e6db}.ao-badge.delivered{color:#0f7a4c;background:rgba(31,148,99,.12);border-color:rgba(31,148,99,.3)}.ao-buyer{position:relative;display:flex;align-items:center;gap:6px;margin-top:8px;color:var(--muted);font-size:11.5px;font-weight:600}.ao-materials{position:relative;display:grid;gap:5px;margin-top:10px}.ao-material{display:grid;grid-template-columns:22px minmax(0,1fr) auto;align-items:center;gap:6px;padding:5px 7px 5px 5px;border:1px solid var(--line);border-radius:9px;background:linear-gradient(135deg,#fbfcfe,#f4f7fa);font-size:11px}.ao-material-icon{width:20px;height:20px;display:grid;place-items:center;border-radius:6px;color:var(--orange2);background:var(--orangeSoft)}.ao-material-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ao-material strong{font-family:ui-monospace,monospace;font-size:10.5px}.ao-material small{font-size:8.5px;color:var(--muted)}.ao-order-meta{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px;padding:8px 0;border-top:1px dashed var(--line2);border-bottom:1px dashed var(--line2)}.ao-order-meta div{display:flex;align-items:center;gap:5px;min-width:0;color:var(--muted);font-size:10.5px}.ao-order-meta strong{color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ao-assignments{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.ao-assignments div{display:flex;flex-direction:column;gap:2px;min-width:0;padding:7px 8px;border:1px solid var(--line);border-radius:9px;background:#f8fafc}.ao-assignments span{font-size:8.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}.ao-assignments strong{font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ao-assignments .missing{background:#fff8eb;border-color:rgba(224,139,30,.28)}.ao-assignments .missing strong{color:#a15c07}.ao-card-foot{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}.ao-stage-time{display:flex;align-items:center;gap:5px;min-width:0;color:var(--muted);font-size:10px}.ao-stage-time strong{color:var(--ink);white-space:nowrap}.ao-stage-time em{display:none}.ao-open{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:8px 11px;border-radius:10px;color:#fff;background:linear-gradient(135deg,var(--orange),var(--orange2));box-shadow:0 4px 14px rgba(249,115,22,.3);font-size:11px;font-weight:800;white-space:nowrap}.ao-card:hover .ao-open svg{transform:translateX(3px)}
.ao-skeleton{min-height:270px;pointer-events:none}.sk{display:block;border-radius:7px;background:linear-gradient(90deg,#eef1f5 25%,#f8fafc 45%,#eef1f5 65%);background-size:220% 100%;animation:aoShimmer 1.3s linear infinite}.sk-id{width:38%;height:13px}.sk-badge{position:absolute;top:13px;right:13px;width:74px;height:19px}.sk-line{width:52%;height:10px;margin-top:16px}.sk-chips{width:88%;height:64px;margin-top:12px}.sk-meta{width:100%;height:34px;margin-top:12px}.sk-foot{width:100%;height:36px;margin-top:12px}.ao-state{min-height:248px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;border:1px dashed var(--line2);border-radius:16px;background:var(--glass);color:var(--muted)}.ao-state>span{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;color:var(--orange2);background:var(--orangeSoft)}.ao-state h2{margin:12px 0 6px;font-size:14.5px;color:var(--ink)}.ao-state p{margin:0;font-size:12px}.ao-state button{margin-top:14px;padding:9px 16px;border:0;border-radius:10px;color:#fff;background:linear-gradient(135deg,var(--orange),var(--orange2));font-weight:750;cursor:pointer}.ao-bottom{position:fixed;z-index:30;left:50%;bottom:10px;transform:translateX(-50%);width:min(calc(100% - 18px),540px);height:62px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:5px;border:1px solid rgba(20,35,58,.11);border-radius:20px;background:rgba(255,255,255,.90);box-shadow:0 12px 30px rgba(16,29,49,.13),inset 0 1px 0 rgba(255,255,255,.96);-webkit-backdrop-filter:blur(19px) saturate(1.3);backdrop-filter:blur(19px) saturate(1.3);overflow:hidden}.ao-nav-selection{position:absolute;z-index:0;left:5px;top:5px;width:calc((100% - 10px)/5);height:50px;border:1px solid rgba(249,115,22,.20);border-radius:15px;background:linear-gradient(150deg,rgba(255,247,237,.98),rgba(255,237,213,.82));box-shadow:0 4px 12px rgba(249,115,22,.10),inset 0 1px 0 #fff;transition:transform .32s cubic-bezier(.25,1.12,.45,1);will-change:transform}.ao-bottom button{position:relative;z-index:1;min-width:0;height:50px;padding:0 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-radius:15px;color:#69758a;background:transparent;cursor:pointer;transition:color .2s ease,transform .16s ease}.ao-nav-icon{position:relative;width:24px;height:24px;display:grid;place-items:center;border-radius:8px;transition:color .2s ease,background .2s ease,transform .2s ease}.ao-nav-label{width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:inherit;font-size:8px;font-weight:750;line-height:1;text-align:center}.ao-bottom button:hover{color:#c85c08}.ao-bottom button:hover .ao-nav-icon{transform:translateY(-1px);background:rgba(249,115,22,.06)}.ao-bottom button.active{color:#c85c08}.ao-bottom button.active .ao-nav-icon{color:#fff;background:linear-gradient(145deg,#ff9b42,var(--orange));box-shadow:0 3px 8px rgba(249,115,22,.18)}.ao-bottom button:active{transform:scale(.95)}.ao-nav-notice{position:absolute;right:-2px;top:-2px;width:6px;height:6px;border:1.5px solid #fff;border-radius:50%;background:var(--orange);box-shadow:0 1px 4px rgba(249,115,22,.25)}.ao-toast{position:fixed;z-index:60;left:50%;bottom:80px;display:flex;align-items:center;gap:8px;transform:translate(-50%,12px);opacity:0;padding:10px 15px;border-radius:12px;color:#fff;background:#161d29;font-size:12px;font-weight:650;white-space:nowrap;pointer-events:none;transition:.26s}.ao-toast.show{opacity:1;transform:translate(-50%,0)}.ao-toast i{width:6px;height:6px;border-radius:50%;background:var(--orange)}
@keyframes aoSpin{to{transform:rotate(360deg)}}@keyframes aoRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes aoShimmer{to{background-position:-220% 0}}
@media(min-width:520px){.ao-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(min-width:820px){.ao-list{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.ao-toolbar{padding:12px}}@media(max-width:390px){.ao-bottom{width:calc(100% - 12px);height:60px;bottom:7px;padding:4px;border-radius:18px}.ao-nav-selection{left:4px;top:4px;width:calc((100% - 8px)/5);height:50px;border-radius:14px}.ao-bottom button{height:50px;gap:2px;padding:0 1px}.ao-nav-label{font-size:7.5px}.ao-nav-icon{width:23px;height:23px}.ao-toolbar-top{grid-template-columns:minmax(0,4fr) minmax(88px,1fr);gap:6px}.ao-sort select{font-size:9.5px;padding-left:25px}.ao-order-meta,.ao-assignments{grid-template-columns:1fr}.ao-card-foot{align-items:flex-end}.ao-stage-time{flex-wrap:wrap}.ao-live{display:none}}@media(prefers-reduced-motion:reduce){.ao-root *{animation:none!important;transition:none!important}}
`;
