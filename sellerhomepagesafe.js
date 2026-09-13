import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSellerHomeData } from "../api/sellerHomeApi";
import { getSellerNotifications, markSellerNotificationRead, markAllSellerNotificationsRead } from "../api/sellerNotificationsApi";

/* ============================================================
   STONERATE · SELLER CONSOLE
   Theme: "Obsidian Neon" — dark hi-tech / holographic HUD
   ============================================================ */

/* ============================================================
   DATA
   ============================================================ */

const MARKET_RATES = [];
const PERFORMANCE = [];
const LOADING_ORDERS = [];
const MARKET_PULSE = [];
const ADVANTAGES = [
  { id: "margins", title: "No hidden margins", detail: "Every rupee stays yours", icon: "shield", tone: "green", imageUrl: "https://cdn.jsdelivr.net/gh/Shyam7291/company-document-monitor@main/IMG_20260822_090314.png", imagePosition: "center" },
  { id: "direct", title: "Direct buyer orders", detail: "Zero middlemen in between", icon: "orders", tone: "blue" },
  { id: "live", title: "Live market updates", detail: "Rates refresh every minute", icon: "rates", tone: "orange", imageUrl: "https://cdn.jsdelivr.net/gh/Shyam7291/company-document-monitor@main/Designer-v3.png", imagePosition: "center" },
  { id: "transport", title: "Direct transport network", detail: "Vehicles on demand, nearby", icon: "truck", tone: "purple" },
];


const TICKER = [];
/* ============================================================
   ICONS
   ============================================================ */

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    rates: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /><path d="M2 19h20" /></>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    availability: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    weight: <><path d="M7 8a5 5 0 0 1 10 0" /><path d="M5 8h14l2 13H3L5 8Z" /></>,
    activity: <><path d="M3 12h4l2-6 4 12 2-6h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    truck: <><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    stable: <><path d="M4 12h16" /><path d="m16 8 4 4-4 4" /></>,
    samples: <><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m5 17 4-4 3 3 2-2 5 5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="3" /></>,
    pulse: <><path d="M2 12h4l3-8 4 16 3-8h6" /></>,
  };

  return <svg {...common}>{paths[name] || paths.home}</svg>;
}

/* ============================================================
   HELPERS + HOOKS
   ============================================================ */

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * useTilt — pointer-reactive 3D tilt with a light-follow glare.
 * Writes CSS custom properties so the paint stays on the compositor.
 */
function useTilt({ max = 14, scale = 1.03, glare = true } = {}) {
  const ref = useRef(null);
  const frame = useRef(0);

  const apply = useCallback((rx, ry, px, py, active) => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--rx", `${rx}deg`);
    node.style.setProperty("--ry", `${ry}deg`);
    node.style.setProperty("--px", `${px}%`);
    node.style.setProperty("--py", `${py}%`);
    node.style.setProperty("--tscale", active ? String(scale) : "1");
    node.style.setProperty("--glare", active && glare ? "1" : "0");
  }, [scale, glare]);

  const onMove = useCallback((event) => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    const point = event.touches ? event.touches[0] : event;
    const rect = node.getBoundingClientRect();
    const x = (point.clientX - rect.left) / rect.width;
    const y = (point.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      apply(((0.5 - y) * max).toFixed(2), ((x - 0.5) * max).toFixed(2), (x * 100).toFixed(1), (y * 100).toFixed(1), true);
    });
  }, [apply, max]);

  const onLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    apply(0, 0, 50, 50, false);
  }, [apply]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return {
    ref,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    onTouchStart: onMove,
    onTouchMove: onMove,
    onTouchEnd: onLeave,
  };
}

/** useCountUp — animates a number into view once the element is visible. */
function useCountUp(target, duration = 1100) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }

    let raf = 0;
    const run = () => {
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !done.current) {
            done.current = true;
            run();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return { ref, value };
}

/** Reveal-on-scroll wrapper. */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "in" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Sparkline({ points = [20,20,20,20,20,20,20], tone }) {
  const path = useMemo(() => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * 100;
        const y = 30 - ((p - min) / span) * 26 - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <svg className={`spark ${tone}`} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <path className="spark-fill" d={`${path} L100 30 L0 30 Z`} />
      <path className="spark-line" d={path} />
    </svg>
  );
}

/* ============================================================
   TICKER
   ============================================================ */

function RateTicker({ items = [] }) {
  const safeItems = items.length ? items : [{ label: "Local market", value: "Stable", dir: "stable" }];
  const feed = [...safeItems, ...safeItems];
  return (
    <div className="ticker" aria-label="Live market ticker">
      <span className="ticker-tag">
        <i />
        LIVE
      </span>
      <div className="ticker-window">
        <div className="ticker-track">
          {feed.map((item, index) => (
            <span className={`ticker-item ${item.dir}`} key={`${item.label}-${index}`}>
              <b>{item.label}</b>
              <em>{item.value}</em>
              <i>{item.dir === "up" ? "▲" : item.dir === "down" ? "▼" : "•"}</i>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HERO
   ============================================================ */

function SellerAdvantageCard({ onExplore }) {
  const tilt = useTilt({ max: 10, scale: 1.01 });

  return (
    <section className="advantage-card tilt" {...tilt}>
      <span className="feature-glare" aria-hidden="true" />
      <div className="advantage-grid" aria-hidden="true" />
      <div className="advantage-mesh" aria-hidden="true" />
      <div className="advantage-orb advantage-orb-one" aria-hidden="true" />
      <div className="advantage-orb advantage-orb-two" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />

      <div className="advantage-copy layer-3">
        <span className="advantage-eyebrow">
          <i className="eyebrow-dot" />
          STONERATE ADVANTAGE
        </span>
        <h1>
          Sell direct.
          <br />
          <span className="grad-text">Grow stronger.</span>
        </h1>
        <p>Transparent business tools built for modern material sellers.</p>

        <button type="button" className="hero-action" onClick={onExplore}>
          <span>Explore Opportunities</span>
          <Icon name="arrow" size={16} />
        </button>

        <div className="hero-stats">
          <span>
            <b>₹0</b>
            <small>Commission</small>
          </span>
          <i />
          <span>
            <b>24/7</b>
            <small>Live rates</small>
          </span>
          <i />
          <span>
            <b>1.2k+</b>
            <small>Buyers</small>
          </span>
        </div>
      </div>

      <div className="hero-hud" aria-hidden="true">
        <span className="hud-ring hud-ring-a" />
        <span className="hud-ring hud-ring-b" />
        <span className="hud-core">
          <i />
        </span>
        <span className="hud-bars">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
    </section>
  );
}

/* ============================================================
   FEATURES — ROTATING 3D COVERFLOW CAROUSEL
   ============================================================ */

/** Returns the shortest circular distance from `index` to `active`. */
function circularOffset(index, active, total) {
  let offset = index - active;
  const half = total / 2;
  if (offset > half) offset -= total;
  if (offset < -half) offset += total;
  return offset;
}

function FeatureDeck() {
  const total = ADVANTAGES.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef({ x: 0, dragging: false, moved: false });

  const go = useCallback(
    (step) => setActive((prev) => (prev + step + total) % total),
    [total]
  );

  useEffect(() => {
    if (paused || prefersReducedMotion()) return undefined;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, 3200);
    return () => clearInterval(timer);
  }, [paused, total]);

  const onDown = useCallback((event) => {
    const point = event.touches ? event.touches[0] : event;
    dragRef.current = { x: point.clientX, dragging: true, moved: false };
    setPaused(true);
  }, []);

  const onMove = useCallback(
    (event) => {
      const state = dragRef.current;
      if (!state.dragging || state.moved) return;
      const point = event.touches ? event.touches[0] : event;
      const delta = point.clientX - state.x;
      if (Math.abs(delta) > 40) {
        state.moved = true;
        go(delta < 0 ? 1 : -1);
      }
    },
    [go]
  );

  const onUp = useCallback(() => {
    dragRef.current.dragging = false;
    setPaused(false);
  }, []);

  return (
    <section className="section-block feature-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">WHY STONERATE</span>
          <h2>Built for your advantage</h2>
        </div>
        <span className="chip-3d">
          <Icon name="spark" size={13} /> 3D
        </span>
      </div>

      <Reveal>
        <div
          className="feature-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            dragRef.current.dragging = false;
            setPaused(false);
          }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          <span className="stage-glow" aria-hidden="true" />
          <span className="stage-ring ring-a" aria-hidden="true" />
          <span className="stage-ring ring-b" aria-hidden="true" />

          <div className="feature-orbit">
            {ADVANTAGES.map((item, index) => {
              const offset = circularOffset(index, active, total);
              const distance = Math.abs(offset);
              const isActive = offset === 0;
              return (
                <article
                  key={item.id}
                  className={`orbit-card ${item.tone} ${isActive ? "is-active" : ""}`}
                  style={{
                    "--offset": offset,
                    "--distance": distance,
                    zIndex: 20 - distance,
                    opacity: distance > 1.6 ? 0 : 1,
                    pointerEvents: distance > 1.6 ? "none" : "auto",
                  }}
                  onClick={() => {
                    if (!dragRef.current.moved && !isActive) setActive(index);
                  }}
                >
                  <span className="orbit-sheen" aria-hidden="true" />
                  <span className="orbit-edge" aria-hidden="true" />

                  {item.imageUrl ? (
                    <div className="orbit-photo-wrap">
                      <img
                        className="orbit-photo"
                        src={item.imageUrl}
                        alt={item.title}
                        draggable="false"
                        loading="eager"
                        style={{ objectPosition: item.imagePosition || "center" }}
                      />
                    </div>
                  ) : (
                    <>
                      <span className="orbit-icon">
                        <i className="orbit-icon-ring" />
                        <Icon name={item.icon} size={25} />
                      </span>
                      <b className="orbit-title">{item.title}</b>
                      <small className="orbit-detail">{item.detail}</small>
                    </>
                  )}

                  <span className="orbit-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>

                  <span className="orbit-reflection" aria-hidden="true" />
                </article>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="feature-pager" role="tablist" aria-label="Advantages">
        {ADVANTAGES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={item.title}
            className={`pager-dot ${item.tone} ${index === active ? "on" : ""}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   QUICK ACTIONS
   ============================================================ */

function QuickActions({ onNavigate }) {
  const actions = [
    { id: "upload", label: "Upload Sample", icon: "upload", tone: "orange" },
    { id: "rates", label: "Update Rates", icon: "rates", tone: "cyan" },
    { id: "orders", label: "View Orders", icon: "orders", tone: "violet" },
    { id: "availability", label: "Set Availability", icon: "availability", tone: "green" },
  ];

  return (
    <section className="quick-actions" aria-label="Seller quick actions">
      {actions.map((action, index) => (
        <button
          type="button"
          key={action.id}
          className={action.tone}
          style={{ "--i": index }}
          onClick={() => onNavigate?.(action.id)}
        >
          <span>
            <Icon name={action.icon} size={19} />
          </span>
          <b>{action.label}</b>
        </button>
      ))}
    </section>
  );
}

/* ============================================================
   MARKET RATES
   ============================================================ */

function RateCard({ rate }) {
  const tilt = useTilt({ max: 14, scale: 1.04 });

  return (
    <article className={`rate-card tilt ${rate.tint}`} {...tilt}>
      <span className="feature-glare" aria-hidden="true" />
      <span className="card-edge" aria-hidden="true" />
      <div className="rate-top layer-2">
        <span className="stone-mark">
          <i /><b /><em />
        </span>
        <small>{rate.updated}</small>
      </div>
      <h3 className="layer-3">{rate.name}</h3>
      <p>{rate.fullName}</p>
      <span className="starting-label">STARTING AT</span>
      <strong className="layer-3">
        {formatMoney(rate.rate)}
        <small>/ton</small>
      </strong>
      <Sparkline
        points={rate.hasComparison ? rate.spark : [20,22,20.5,24,21.5,19.5,22]}
        tone={rate.tint}
      />
      <div className={`movement ${rate.hasComparison ? rate.direction : "stable"} ${rate.tint}`}>
        {!rate.hasComparison
          ? "• Stable"
          : rate.direction === "up"
          ? `↑ ${formatMoney(rate.movement)} / 24h`
          : rate.direction === "down"
          ? `↓ ${formatMoney(rate.movement)} / 24h`
          : "• Stable / 24h"}
      </div>
    </article>
  );
}

function MarketRates({ onViewAll, rates = [] }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <span className="section-kicker">LIVE PRICING</span>
          <h2>Today&apos;s Market Rates</h2>
        </div>
        <button type="button" onClick={onViewAll}>
          View all
        </button>
      </div>

      {rates.length ? <div className="rate-scroll">
        {rates.map((rate) => <RateCard key={rate.id} rate={rate} />)}
      </div> : <div className="home-empty">No active ton-based market rates are available for your location.</div>}
    </section>
  );
}

/* ============================================================
   PERFORMANCE
   ============================================================ */

function PerformanceCard({ metric, index }) {
  const tilt = useTilt({ max: 16, scale: 1.05 });
  const counter = useCountUp(metric.num);

  return (
    <Reveal delay={index * 70}>
      <article className="performance-card tilt" {...tilt}>
        <span className="feature-glare" aria-hidden="true" />
        <span className="card-edge" aria-hidden="true" />
        <span className="metric-wave" aria-hidden="true" />
        <div className={`metric-icon layer-3 ${metric.change < 0 ? "negative" : ""}`}>
          <Icon name={metric.icon} size={17} />
        </div>
        <strong ref={counter.ref} className="layer-2">
          {counter.value}
          {metric.suffix}
        </strong>
        <span>{metric.label}</span>
<small className="up">Live from Seller records</small>
      </article>
    </Reveal>
  );
}

function PerformanceDashboard({ metrics = [] }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <span className="section-kicker">BUSINESS OVERVIEW</span>
          <h2>This Month Performance</h2>
        </div>
        <span className="live-pill">
          <i /> Live
        </span>
      </div>

      <div className="performance-grid">
        {metrics.map((metric, index) => (
          <PerformanceCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   LOADING TODAY
   ============================================================ */

function LoadingSoon({ orders = [], onViewAll, onOpenOrder }) {
  return <section className="section-block">
    <div className="section-heading"><div><span className="section-kicker">UPCOMING OPERATIONS</span><h2>Loading Soon</h2></div><button type="button" onClick={onViewAll}>View all</button></div>
    {orders.length ? <div className="loading-stack">{orders.map((order,index)=><Reveal key={order.id || order.deliveryId} delay={index*80}><button type="button" className="loading-card" onClick={()=>onOpenOrder?.(order.raw || order)}><span className={`loading-icon ${order.tone}`}><Icon name="truck" size={21}/><i/></span><span className="loading-copy"><small>{order.deliveryId}</small><b>{order.material}</b><em>{order.quantity} {order.unit}</em></span><span className="loading-time"><small className={order.tone}>{order.status}</small></span><Icon name="chevron" size={16}/></button></Reveal>)}</div> : <div className="loading-empty loading-empty-premium"><span className="loading-empty-icon"><Icon name="truck" size={25}/></span><span className="loading-empty-orbit" aria-hidden="true"/><b>You will get a new order soon</b><span>Always upload clear sample pictures and keep your rates competitive to attract more buyer orders.</span><button type="button" onClick={onViewAll}>View all orders</button></div>}
  </section>;
}
/* ============================================================
   ORDER OVERVIEW
   ============================================================ */

function OrderOverview({ onViewOrders }) {
  const entries = [
    { label: "New Orders", value: 3, tone: "blue" },
    { label: "Confirmed", value: 5, tone: "green" },
    { label: "Loading", value: 2, tone: "amber" },
    { label: "In Transit", value: 4, tone: "purple" },
  ];
  const tilt = useTilt({ max: 8, scale: 1.01 });

  return (
    <section className="order-overview tilt" {...tilt}>
      <span className="feature-glare" aria-hidden="true" />
      <div className="overview-mesh" aria-hidden="true" />
      <div className="overview-copy layer-2">
        <span className="section-kicker">ORDER OVERVIEW</span>
        <h2>Business in motion</h2>
        <p>Track every active order from confirmation to delivery.</p>
        <button type="button" onClick={onViewOrders}>
          View All Orders <Icon name="arrow" size={15} />
        </button>
      </div>
      <div className="overview-grid layer-3">
        {entries.map((entry, index) => (
          <div
            className={`overview-metric ${entry.tone}`}
            key={entry.label}
            style={{ "--i": index }}
          >
            <strong>{entry.value}</strong>
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   MARKET PULSE
   ============================================================ */

function PulseCard({ item, index }) {
  const tilt = useTilt({ max: 12, scale: 1.03 });

  return (
    <Reveal delay={index * 80}>
      <article className={`pulse-card tilt ${item.tone}`} {...tilt}>
        <span className="feature-glare" aria-hidden="true" />
        <span className="layer-3">
          <Icon name={item.icon} size={18} />
        </span>
        <div className="layer-2">
          <b>{item.title}</b>
          <small>{item.detail}</small>
        </div>
      </article>
    </Reveal>
  );
}

function MarketPulse({ items = [] }) {
  const visibleItems = items.length ? items : [
    {title:"Keep sample rates competitive",detail:"Buyers compare active material rates before requesting a quotation.",icon:"trend",tone:"green"},
    {title:"Clear sample photos improve selection",detail:"Upload a bright and recent material image so buyers can compare quality.",icon:"samples",tone:"blue"},
    {title:"Update availability regularly",detail:"Accurate quantity information helps Admin and buyers plan orders faster.",icon:"availability",tone:"amber"}
  ];
  return (
    <section className="section-block last-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">MARKET INTELLIGENCE</span>
          <h2>Market Pulse</h2>
        </div>
        <span className="chip-3d">
          <Icon name="pulse" size={13} /> AI
        </span>
      </div>
      <div className="pulse-grid">{visibleItems.map((item,index)=><PulseCard key={`${item.title}-${index}`} item={item} index={index}/>)}</div>
      {!items.length ? <small className="pulse-source-note">General guidance shown until location-specific Market Pulse is published from Seller Information.</small> : null}
    </section>
  );
}


function NotificationSheet({ open, notifications, loading, error, onClose, onRead, onReadAll, onNavigate }) {
  if (!open) return null;
  const time = value => value ? new Intl.DateTimeFormat("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", hour12:true }).format(new Date(value)) : "";
  const iconName = item => item.category === "order" ? "orders" : item.category === "market" ? "rates" : "samples";
  return <div className="notification-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="notification-sheet" aria-modal="true" role="dialog" aria-label="Seller notifications">
      <i className="notification-handle" />
      <header><div><small>SELLER UPDATES</small><h2>Notifications</h2><p>Latest 25 messages</p></div><button type="button" onClick={onClose}>×</button></header>
      <div className="notification-toolbar"><span>{notifications.filter(item => !item.isRead).length} unread</span><button type="button" onClick={onReadAll}>Mark all as read</button></div>
      <main>
        {loading ? <div className="notification-empty">Loading notifications...</div> : error ? <div className="notification-empty error">{error}</div> : !notifications.length ? <div className="notification-empty"><Icon name="bell" size={28}/><b>No notifications yet</b><span>Order, sample and market-rate updates will appear here.</span></div> : notifications.map(item =>
          <button type="button" className={`notification-item ${item.isRead ? "read" : "unread"} ${item.category}`} key={item.id} onClick={async()=>{await onRead(item.id);onClose();onNavigate(item.actionTarget || "home")}}>
            <i><Icon name={iconName(item)} size={18}/></i><span><b>{item.title}</b><em>{item.message}</em><small>{time(item.createdAt)}</small></span>{!item.isRead && <u />}
          </button>)}
      </main>
    </section>
  </div>;
}

/* ============================================================
   BOTTOM NAV
   ============================================================ */

function BottomNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: "samples", label: "Samples", icon: "samples" },
    { id: "orders", label: "Orders", icon: "orders" },
    { id: "home", label: "Home", icon: "home" },
    { id: "mySamples", label: "My Samples", icon: "upload" },
    { id: "profile", label: "Profile", icon: "profile" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Seller navigation">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          className={activeTab === tab.id ? "active" : ""}
          onClick={() => onTabChange?.(tab.id)}
        >
          <span>
            <Icon name={tab.icon} size={19} />
          </span>
          <small>{tab.label}</small>
        </button>
      ))}
    </nav>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function SellerHomePage({
  sellerName = "Venkateshwara Aggregates",
  onNavigate,
  onOpenOrder,
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationOpen,setNotificationOpen]=useState(false);
  const [notifications,setNotifications]=useState([]);
  const [notificationLoading,setNotificationLoading]=useState(false);
  const [notificationError,setNotificationError]=useState("");
  const notificationCount=notifications.filter(item=>!item.isRead).length;
  const [scrolled, setScrolled] = useState(false);
  const [homeData,setHomeData]=useState({ticker:[],marketRates:[],performance:[],loadingOrders:[],marketPulse:[]});
  const [homeLoading,setHomeLoading]=useState(true);
  const [homeError,setHomeError]=useState("");
  const loadNotifications=useCallback(async({showLoading=false}={})=>{try{if(showLoading)setNotificationLoading(true);const result=await getSellerNotifications();setNotifications(result.notifications||[]);setNotificationError("")}catch(error){setNotificationError(error.message||"Unable to load notifications.")}finally{if(showLoading)setNotificationLoading(false)}},[]);
  useEffect(()=>{loadNotifications();const timer=window.setInterval(()=>loadNotifications(),5*60*1000);return()=>window.clearInterval(timer)},[loadNotifications]);
  const openNotifications=()=>{setNotificationOpen(true);loadNotifications({showLoading:true})};
  const readNotification=async id=>{await markSellerNotificationRead(id);setNotifications(items=>items.map(item=>item.id===id?{...item,isRead:true}:item))};
  const readAllNotifications=async()=>{await markAllSellerNotificationsRead();setNotifications(items=>items.map(item=>({...item,isRead:true})))};

  const loadHomeData=useCallback(async({silent=false}={})=>{if(!silent)setHomeLoading(true);try{const result=await getSellerHomeData();setHomeData(result);setHomeError("")}catch(error){setHomeError(error.message||"Unable to load Seller Home data.")}finally{if(!silent)setHomeLoading(false)}},[]);
  useEffect(()=>{loadHomeData();const timer=window.setInterval(()=>loadHomeData({silent:true}),5*60*1000);return()=>window.clearInterval(timer)},[loadHomeData]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const navigate = (target) => {
    if (["samples", "orders", "home", "mySamples", "profile"].includes(target)) {
      setActiveTab(target);
    }
    onNavigate?.(target);
  };

  const drawerNavigate = (target) => {
    setDrawerOpen(false);
    navigate(target);
  };

  const handleScroll = (event) => {
    const next = event.currentTarget.scrollTop > 8;
    setScrolled((prev) => (prev === next ? prev : next));
  };

  return (
    <div className="seller-app">
      <style>{CSS}</style>
      <main className="seller-phone">
        <div className="aurora" aria-hidden="true">
          <i className="aurora-one" />
          <i className="aurora-two" />
          <i className="aurora-three" />
        </div>
        <div className="grid-floor" aria-hidden="true" />
        <div className="noise" aria-hidden="true" />

        <header className={`seller-header ${scrolled ? "condensed" : ""}`}>
          <button type="button" className="header-icon" aria-label={drawerOpen ? "Close menu" : "Open menu"} aria-expanded={drawerOpen} aria-controls="seller-menu" onClick={() => setDrawerOpen((open) => !open)}>
            <Icon name="menu" size={20} />
          </button>

          <div className="seller-identity">
            <span>Good morning,</span>
            <b>{sellerName}</b>
          </div>

          <button type="button" className="header-icon notification" aria-label="Notifications" onClick={openNotifications}>
            <Icon name="bell" size={19} />
            {notificationCount > 0 ? <b>{notificationCount}</b> : null}
          </button>
        </header>

        <button type="button" className={`drawer-backdrop ${drawerOpen ? "open" : ""}`} aria-label="Close navigation menu" tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />

        <aside id="seller-menu" className={`seller-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
          <div className="drawer-profile">
            <div className="drawer-avatar" aria-hidden="true">VA</div>
            <div className="drawer-profile-copy">
              <b>{sellerName}</b>
              <span className="verified-badge"><i><Icon name="check" size={10} /></i>Verified Seller</span>
              <button type="button" onClick={() => drawerNavigate("profile")}>View Profile</button>
            </div>
            <button type="button" className="drawer-close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>×</button>
          </div>
          <div className="drawer-scroll">
            <section className="drawer-group"><span>BUSINESS</span>
              <button type="button" className={activeTab === "home" ? "active" : ""} onClick={() => drawerNavigate("home")}><i><Icon name="home" size={18} /></i><b>Dashboard</b></button>
              <button type="button" className={activeTab === "orders" ? "active" : ""} onClick={() => drawerNavigate("orders")}><i><Icon name="orders" size={18} /></i><b>Current Orders</b><em>{homeData.loadingOrders.length}</em></button>
              <button type="button" onClick={() => drawerNavigate("orderHistory")}><i><Icon name="activity" size={18} /></i><b>Order History</b></button>
              <button type="button" onClick={() => drawerNavigate("salesReport")}><i><Icon name="rates" size={18} /></i><b>Sales Report</b></button>
            </section>
            <section className="drawer-group"><span>MANAGE</span>
              <button type="button" onClick={() => drawerNavigate("upload")}><i className="orange"><Icon name="upload" size={18} /></i><b>Upload New Sample</b></button>
              <button type="button" onClick={() => drawerNavigate("rates")}><i className="cyan"><Icon name="rates" size={18} /></i><b>Update Market Rates</b></button>
            </section>
            <section className="drawer-group"><span>ACCOUNT</span>
              <button type="button" onClick={() => drawerNavigate("transporterContacts")}><i className="green"><Icon name="truck" size={18} /></i><b>Transporter Contact Details</b></button>
            </section>
            <section className="drawer-group"><span>STONERATE</span>
              <button type="button" onClick={() => drawerNavigate("about")}><i><Icon name="spark" size={18} /></i><b>About StoneRate</b></button>
              <button type="button" onClick={() => drawerNavigate("howItWorks")}><i className="purple"><Icon name="pulse" size={18} /></i><b>How StoneRate Works</b></button>
              <button type="button" onClick={() => drawerNavigate("sellerGuide")}><i><Icon name="samples" size={18} /></i><b>Seller Guide</b></button>
            </section>
            <section className="drawer-group"><span>SUPPORT &amp; LEGAL</span>
              <button type="button" onClick={() => drawerNavigate("support")}><i className="green"><Icon name="profile" size={18} /></i><b>Contact Support</b></button>
              <button type="button" onClick={() => drawerNavigate("terms")}><i><Icon name="shield" size={18} /></i><b>Terms &amp; Privacy</b></button>
            </section>
          </div>
        </aside>

        <div className="seller-scroll" onScroll={handleScroll}>
          <div className="seller-content">
            <RateTicker items={homeData.ticker}/>
            
            <FeatureDeck />
            <QuickActions onNavigate={navigate} />
            <MarketRates rates={homeData.marketRates} onViewAll={() => navigate("samples")} />
            <PerformanceDashboard metrics={homeData.performance}/>
            <LoadingSoon orders={homeData.loadingOrders} onViewAll={() => navigate("orders")} onOpenOrder={onOpenOrder}/>
            <MarketPulse items={homeData.marketPulse}/>
          </div>
        </div>

        <NotificationSheet open={notificationOpen} notifications={notifications} loading={notificationLoading} error={notificationError} onClose={()=>setNotificationOpen(false)} onRead={readNotification} onReadAll={readAllNotifications} onNavigate={navigate}/>
        <BottomNavigation activeTab={activeTab} onTabChange={navigate} />
      </main>
    </div>
  );
}

/* ============================================================
   STYLES — OBSIDIAN NEON
   ============================================================ */

const CSS_CORE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
html,body,#root{margin:0;width:100%;min-height:100%;
  font-family:"Space Grotesk",Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}

.seller-app{
  --bg-0:#05070f;--bg-1:#080b17;--bg-2:#0c1120;
  --ink:#eaf1ff;--muted:#8b9ac0;--dim:#63719a;
  --line:rgba(140,170,255,.14);--line-hi:rgba(140,170,255,.28);
  --cyan:#22d3ee;--violet:#8b5cf6;--orange:#fb923c;--amber:#fbbf24;
  --green:#34d399;--blue:#60a5fa;--purple:#a78bfa;--red:#fb7185;
  --card:rgba(16,22,40,.72);--glass:rgba(20,27,48,.6);
  --shadow-sm:0 2px 10px rgba(0,0,0,.45);
  --shadow-md:0 14px 34px rgba(0,0,0,.55);
  --shadow-lg:0 30px 70px rgba(0,0,0,.65);
  --glow-cyan:0 0 26px rgba(34,211,238,.35);
  --glow-violet:0 0 26px rgba(139,92,246,.35);
  width:100%;height:100dvh;display:flex;align-items:center;justify-content:center;
  overflow:hidden;color:var(--ink);
  background:
    radial-gradient(900px 520px at 50% -12%,rgba(34,211,238,.12),transparent 70%),
    radial-gradient(700px 480px at 90% 110%,rgba(139,92,246,.14),transparent 70%),
    #03050c}
.seller-app button{font:inherit}
.seller-app ::selection{background:rgba(34,211,238,.3);color:#fff}

.seller-phone{position:relative;width:min(100%,430px);height:100dvh;overflow:hidden;
  color:var(--ink);isolation:isolate;
  background:
    radial-gradient(620px 320px at 12% 0%,rgba(34,211,238,.14),transparent 66%),
    radial-gradient(560px 340px at 100% 32%,rgba(139,92,246,.16),transparent 68%),
    linear-gradient(180deg,#070a14,#05070f 55%,#04060d)}

/* ---------- ambient layers ---------- */
.aurora{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.aurora i{position:absolute;display:block;border-radius:50%;filter:blur(56px);opacity:.55}
.aurora-one{width:300px;height:300px;top:-100px;left:-80px;
  background:radial-gradient(circle,rgba(34,211,238,.42),transparent 68%);
  animation:auroraA 18s ease-in-out infinite}
.aurora-two{width:340px;height:340px;top:32%;right:-130px;
  background:radial-gradient(circle,rgba(139,92,246,.38),transparent 68%);
  animation:auroraB 22s ease-in-out infinite}
.aurora-three{width:280px;height:280px;bottom:-90px;left:-70px;
  background:radial-gradient(circle,rgba(251,146,60,.28),transparent 68%);
  animation:auroraA 26s ease-in-out infinite reverse}
.grid-floor{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.5;
  background-image:linear-gradient(rgba(120,170,255,.09) 1px,transparent 1px),
    linear-gradient(90deg,rgba(120,170,255,.09) 1px,transparent 1px);
  background-size:34px 34px;
  -webkit-mask-image:radial-gradient(circle at 50% 22%,#000,transparent 78%);
  mask-image:radial-gradient(circle at 50% 22%,#000,transparent 78%)}
.noise{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:radial-gradient(rgba(255,255,255,.6) .5px,transparent .5px);
  background-size:3px 3px}

/* ---------- header ---------- */
.seller-header{position:absolute;z-index:40;top:0;left:0;right:0;height:90px;
  display:grid;grid-template-columns:40px minmax(0,1fr) 40px;align-items:start;gap:10px;
  padding:14px 15px 10px;border-bottom:1px solid var(--line);
  background:linear-gradient(180deg,rgba(8,12,24,.88),rgba(8,12,24,.55));
  backdrop-filter:blur(22px) saturate(160%);
  -webkit-backdrop-filter:blur(22px) saturate(160%);
  transition:box-shadow .3s,background .3s}
.seller-header.condensed{background:linear-gradient(180deg,rgba(6,9,19,.96),rgba(6,9,19,.82));
  box-shadow:0 14px 34px rgba(0,0,0,.55)}
.seller-header::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(34,211,238,.85),rgba(139,92,246,.75),transparent);
  opacity:.9;animation:lineSlide 6s ease-in-out infinite}
.header-icon{position:relative;width:38px;height:38px;display:grid;place-items:center;
  border:1px solid var(--line-hi);border-radius:13px;color:#cfe0ff;cursor:pointer;
  background:linear-gradient(160deg,rgba(30,41,70,.9),rgba(14,20,38,.9));
  box-shadow:var(--shadow-sm),inset 0 1px 0 rgba(255,255,255,.06);
  transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s,border-color .22s}
.header-icon:hover{transform:translateY(-2px) scale(1.04);border-color:rgba(34,211,238,.55);
  box-shadow:var(--shadow-md),var(--glow-cyan)}
.header-icon:active{transform:scale(.94)}
.header-icon.notification b{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;
  display:grid;place-items:center;padding:0 4px;border-radius:999px;border:2px solid #070a14;
  background:linear-gradient(135deg,#fb7185,#f43f5e);color:#fff;font-size:9px;font-weight:800;
  box-shadow:0 3px 12px rgba(244,63,94,.6);animation:badgePop 2.6s ease-in-out infinite}
.seller-identity{min-width:0;padding-top:1px}
.seller-identity>span{display:block;color:var(--dim);font-size:10px;letter-spacing:.02em}
.seller-identity>b{display:block;margin-top:2px;overflow:hidden;font-size:14px;color:#f2f7ff;
  text-overflow:ellipsis;white-space:nowrap;letter-spacing:-.01em}
.availability-control{position:relative;display:inline-block}
.availability-button{display:inline-flex;align-items:center;gap:5px;margin-top:7px;
  padding:4px 9px;border-radius:999px;font-size:8.5px;font-weight:850;cursor:pointer;
  border:1px solid currentColor;background:rgba(10,16,30,.7);
  transition:transform .2s,filter .2s,box-shadow .2s}
.availability-button:hover{transform:translateY(-1px);filter:brightness(1.12)}
.availability-button i{width:6px;height:6px;border-radius:50%;background:currentColor;
  box-shadow:0 0 0 0 currentColor;animation:dotPing 2.2s ease-out infinite}
.availability-button.green{color:#34d399;box-shadow:0 0 14px rgba(52,211,153,.28)}
.availability-button.amber{color:#fbbf24;box-shadow:0 0 14px rgba(251,191,36,.28)}
.availability-button.red{color:#fb7185;box-shadow:0 0 14px rgba(251,113,133,.28)}
.availability-menu{position:absolute;z-index:70;top:36px;left:0;width:215px;padding:6px;
  border:1px solid var(--line-hi);border-radius:15px;background:rgba(12,18,34,.96);
  backdrop-filter:blur(16px);box-shadow:var(--shadow-lg);animation:menuIn .22s ease both}
.availability-menu button{width:100%;display:flex;align-items:center;gap:9px;padding:9px 10px;
  border:0;border-radius:11px;background:transparent;color:#d7e3ff;font-size:11.5px;
  font-weight:650;text-align:left;cursor:pointer;transition:background .18s,transform .18s}
.availability-menu button:hover{background:rgba(56,86,150,.25);transform:translateX(2px)}
.availability-menu i{width:8px;height:8px;border-radius:50%;flex:0 0 auto}
.availability-menu i.green{background:var(--green);box-shadow:0 0 10px var(--green)}
.availability-menu i.amber{background:var(--amber);box-shadow:0 0 10px var(--amber)}
.availability-menu i.red{background:var(--red);box-shadow:0 0 10px var(--red)}
.availability-menu span{flex:1}
.availability-menu b{color:var(--green);font-size:12px}

/* ---------- scroll shell ---------- */
.seller-scroll{position:absolute;z-index:10;top:90px;bottom:66px;left:0;right:0;
  overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}
.seller-scroll::-webkit-scrollbar{width:0}
.seller-content{display:flex;flex-direction:column;gap:20px;padding:14px 15px 26px}

/* ---------- reveal ---------- */
.reveal{opacity:0;transform:translateY(16px) scale(.985);
  transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1)}
.reveal.in{opacity:1;transform:none}

/* ---------- shared 3D tilt ---------- */
.tilt{--rx:0deg;--ry:0deg;--px:50%;--py:50%;--tscale:1;--glare:0;
  transform-style:preserve-3d;perspective:900px;will-change:transform;
  transform:perspective(900px) rotateX(var(--rx)) rotateY(var(--ry)) scale(var(--tscale));
  transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s}
.layer-2{transform:translateZ(22px)}
.layer-3{transform:translateZ(42px)}
.feature-glare{position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  opacity:var(--glare);transition:opacity .3s;z-index:4;
  background:radial-gradient(240px circle at var(--px) var(--py),rgba(120,200,255,.28),transparent 62%);
  mix-blend-mode:screen}
.card-edge{position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
  background:linear-gradient(150deg,rgba(34,211,238,.55),transparent 42%,transparent 62%,rgba(139,92,246,.5));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;opacity:.55;transition:opacity .35s}

/* ---------- ticker ---------- */
.ticker{position:relative;display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;
  border:1px solid var(--line);border-radius:12px;overflow:hidden;
  background:linear-gradient(90deg,rgba(13,19,36,.95),rgba(15,22,42,.75));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.ticker-tag{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:3px 8px;
  border-radius:999px;background:rgba(52,211,153,.12);color:#34d399;
  font-size:8px;font-weight:900;letter-spacing:.14em}
.ticker-tag i{width:5px;height:5px;border-radius:50%;background:#34d399;
  box-shadow:0 0 8px #34d399;animation:livePulse 1.8s ease-in-out infinite}
.ticker-window{position:relative;flex:1;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.ticker-track{display:flex;align-items:center;gap:22px;width:max-content;
  animation:tickerRun 13s linear infinite}
.ticker-item{display:inline-flex;align-items:center;gap:6px;font-size:9.5px;white-space:nowrap}
.ticker-item b{color:var(--dim);font-weight:700;letter-spacing:.04em}
.ticker-item em{font-style:normal;font-weight:850;color:#e6efff;font-variant-numeric:tabular-nums}
.ticker-item i{font-style:normal;font-size:7.5px}
.ticker-item.up i{color:var(--green)}
.ticker-item.down i{color:var(--orange)}
.ticker-item.stable i{color:var(--blue)}

/* ---------- hero ---------- */
.advantage-card{position:relative;overflow:hidden;min-height:340px;padding:20px;
  border:1px solid var(--line-hi);border-radius:26px;
  background:
    radial-gradient(420px 260px at 88% 18%,rgba(139,92,246,.22),transparent 70%),
    linear-gradient(150deg,rgba(19,27,49,.95),rgba(9,13,26,.95));
  box-shadow:var(--shadow-md),inset 0 1px 0 rgba(255,255,255,.07)}
.advantage-card:hover{box-shadow:var(--shadow-lg),0 0 40px rgba(34,211,238,.16)}
.advantage-grid{position:absolute;inset:0;opacity:.6;
  background-image:linear-gradient(rgba(34,211,238,.11) 1px,transparent 1px),
    linear-gradient(90deg,rgba(34,211,238,.11) 1px,transparent 1px);
  background-size:26px 26px;
  -webkit-mask-image:radial-gradient(circle at 72% 42%,#000,transparent 74%);
  mask-image:radial-gradient(circle at 72% 42%,#000,transparent 74%)}
.advantage-mesh{position:absolute;inset:-30%;opacity:.6;pointer-events:none;
  background:conic-gradient(from 0deg at 72% 48%,rgba(34,211,238,.24),rgba(139,92,246,.22),
    rgba(251,146,60,.18),rgba(34,211,238,.24));
  filter:blur(46px);animation:meshSpin 26s linear infinite}
.advantage-orb{position:absolute;border-radius:50%;filter:blur(.5px);pointer-events:none}
.advantage-orb-one{width:11px;height:11px;top:20%;left:7%;
  background:radial-gradient(circle,#a5f3fc,#22d3ee);opacity:.9;
  box-shadow:0 0 22px rgba(34,211,238,.8);animation:orbFloat 6s ease-in-out infinite}
.advantage-orb-two{width:8px;height:8px;bottom:26%;left:15%;
  background:radial-gradient(circle,#ddd6fe,#8b5cf6);opacity:.85;
  box-shadow:0 0 20px rgba(139,92,246,.75);animation:orbFloat 8s ease-in-out infinite reverse}
.scan-line{position:absolute;left:0;right:0;height:80px;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(34,211,238,.16),transparent);
  animation:scanMove 7s linear infinite}
.advantage-copy{position:relative;z-index:3;width:66%}
.advantage-eyebrow{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
  border:1px solid rgba(34,211,238,.4);border-radius:999px;background:rgba(34,211,238,.1);
  color:#67e8f9;font-size:8px;font-weight:900;letter-spacing:.13em;
  box-shadow:0 0 18px rgba(34,211,238,.2)}
.eyebrow-dot{width:5px;height:5px;border-radius:50%;background:#22d3ee;
  box-shadow:0 0 0 0 rgba(34,211,238,.7);animation:dotPing 2s ease-out infinite}
.advantage-copy h1{margin:12px 0 8px;font-size:28px;line-height:1.12;letter-spacing:-.04em;
  font-weight:850;color:#f5f9ff;text-shadow:0 0 30px rgba(120,180,255,.25)}
.grad-text{background:linear-gradient(100deg,#22d3ee,#8b5cf6 45%,#fb923c);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  background-size:220% 100%;animation:gradShift 6s ease-in-out infinite;
  filter:drop-shadow(0 0 18px rgba(139,92,246,.35))}
.advantage-copy p{margin:0 0 16px;max-width:230px;color:var(--muted);font-size:11.5px;
  line-height:1.55}
.hero-action{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:8px;
  padding:11px 17px;border:1px solid rgba(255,255,255,.16);border-radius:14px;
  background:linear-gradient(120deg,#22d3ee,#3b82f6 52%,#8b5cf6);color:#04121c;
  font-size:11.5px;font-weight:850;cursor:pointer;
  box-shadow:0 14px 30px rgba(34,211,238,.28),0 0 24px rgba(139,92,246,.24);
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
.hero-action::after{content:"";position:absolute;top:0;left:-140%;width:60%;height:100%;
  transform:skewX(-22deg);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);
  animation:shimmer 3.4s ease-in-out infinite}
.hero-action:hover{transform:translateY(-2px) scale(1.02);
  box-shadow:0 20px 40px rgba(34,211,238,.36),0 0 34px rgba(139,92,246,.32)}
.hero-action:active{transform:scale(.97)}
.hero-action svg{transition:transform .25s}
.hero-action:hover svg{transform:translateX(3px)}
.hero-stats{display:flex;align-items:center;gap:10px;margin-top:16px}
.hero-stats span{display:flex;flex-direction:column;gap:1px}
.hero-stats b{font-size:13px;font-weight:850;letter-spacing:-.02em;color:#e8f2ff}
.hero-stats small{color:var(--dim);font-size:7.5px;font-weight:750;letter-spacing:.07em;
  text-transform:uppercase}
.hero-stats>i{width:1px;height:22px;background:linear-gradient(180deg,transparent,
  rgba(140,170,255,.35),transparent)}

/* ---------- hero HUD ---------- */
.hero-hud{position:absolute;z-index:2;right:-14px;bottom:24px;width:172px;height:172px;
  pointer-events:none}
.hud-ring{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%)}
.hud-ring-a{width:158px;height:158px;border:1.4px dashed rgba(34,211,238,.45);
  animation:ringSpin 16s linear infinite}
.hud-ring-b{width:112px;height:112px;border:1.4px solid rgba(139,92,246,.4);
  border-right-color:transparent;border-bottom-color:transparent;
  animation:ringSpin 9s linear infinite reverse}
.hud-core{position:absolute;left:50%;top:50%;width:62px;height:62px;border-radius:50%;
  transform:translate(-50%,-50%);display:grid;place-items:center;
  background:radial-gradient(circle,rgba(34,211,238,.4),rgba(139,92,246,.16) 60%,transparent 72%);
  box-shadow:0 0 40px rgba(34,211,238,.4);animation:corePulse 4s ease-in-out infinite}
.hud-core i{width:20px;height:20px;border-radius:6px;
  background:linear-gradient(140deg,#a5f3fc,#8b5cf6);
  box-shadow:0 0 22px rgba(165,243,252,.8);animation:cubeFloat 7s ease-in-out infinite}
.hud-bars{position:absolute;left:50%;bottom:8px;display:flex;align-items:flex-end;gap:5px;
  height:34px;transform:translateX(-50%)}
.hud-bars i{width:5px;border-radius:2px;background:linear-gradient(180deg,#22d3ee,#3b82f6);
  box-shadow:0 0 12px rgba(34,211,238,.55);animation:barGlow 2.6s ease-in-out infinite}
.hud-bars i:nth-child(1){height:12px}
.hud-bars i:nth-child(2){height:24px;animation-delay:.3s}
.hud-bars i:nth-child(3){height:17px;animation-delay:.6s}
.hud-bars i:nth-child(4){height:30px;animation-delay:.9s}
`;

const CSS_SECTIONS = `
/* ---------- section shell ---------- */
.section-block{display:flex;flex-direction:column;gap:12px}
.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
.section-heading h2{margin:0;font-size:15.5px;font-weight:850;letter-spacing:-.03em;color:#eef4ff}
.section-kicker{display:block;margin-bottom:3px;color:#5f7099;font-size:8px;font-weight:900;
  letter-spacing:.16em}
.section-heading>button{padding:5px 11px;border:1px solid var(--line-hi);border-radius:999px;
  background:rgba(18,25,45,.85);color:#b9caf0;font-size:10px;font-weight:750;cursor:pointer;
  box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s,color .2s,border-color .2s}
.section-heading>button:hover{transform:translateY(-1px);color:#67e8f9;
  border-color:rgba(34,211,238,.5);box-shadow:var(--glow-cyan)}
.chip-3d{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:999px;
  border:1px solid rgba(139,92,246,.45);background:rgba(139,92,246,.13);color:#c4b5fd;
  font-size:9px;font-weight:900;letter-spacing:.08em;box-shadow:0 0 16px rgba(139,92,246,.22)}
.live-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;
  border:1px solid rgba(52,211,153,.4);background:rgba(52,211,153,.12);color:#6ee7b7;
  font-size:9px;font-weight:850}
.live-pill i{width:6px;height:6px;border-radius:50%;background:#34d399;
  box-shadow:0 0 10px #34d399;animation:livePulse 1.9s ease-in-out infinite}

/* ---------- FEATURE COVERFLOW (rotating 3D deck) ---------- */
.performance-grid>.reveal{height:100%}
.feature-stage{position:relative;height:250px;margin:2px -15px 0;overflow:hidden;
  perspective:1000px;perspective-origin:50% 46%;
  cursor:grab;user-select:none;-webkit-user-select:none;touch-action:pan-y}
.feature-stage:active{cursor:grabbing}
.stage-glow{position:absolute;left:50%;top:52%;width:340px;height:340px;pointer-events:none;
  transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(34,211,238,.26),rgba(139,92,246,.18) 44%,transparent 70%);
  filter:blur(28px);animation:stageGlow 8s ease-in-out infinite}
.stage-ring{position:absolute;left:50%;bottom:26px;border-radius:50%;pointer-events:none;
  border:1.5px solid rgba(34,211,238,.35);
  transform:translateX(-50%) rotateX(72deg)}
.stage-ring.ring-a{width:210px;height:210px;animation:stageRing 5.5s ease-in-out infinite}
.stage-ring.ring-b{width:290px;height:290px;border-color:rgba(139,92,246,.28);
  animation:stageRing 5.5s ease-in-out infinite .9s}
.feature-orbit{position:absolute;inset:0;transform-style:preserve-3d}

.orbit-card{position:absolute;left:50%;top:50%;width:158px;height:206px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;
  padding:18px 14px;border-radius:24px;border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(158deg,var(--tone-hi),rgba(12,17,33,.96) 48%,var(--tone-lo));
  box-shadow:0 22px 46px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);
  text-align:center;cursor:pointer;backface-visibility:hidden;
  transform-origin:50% 50%;
  transform:translate(-50%,-50%)
    translateX(calc(var(--offset) * 118px))
    translateY(calc(var(--distance) * 6px))
    translateZ(calc(var(--distance) * -180px))
    rotateY(calc(var(--offset) * -38deg))
    scale(calc(1 - var(--distance) * .12));
  transition:transform .62s cubic-bezier(.22,1,.36,1),opacity .45s ease,
    box-shadow .45s ease,filter .45s ease;
  filter:saturate(.55) brightness(.72)}
.orbit-card.green{--tone:#34d399;--tone-hi:rgba(52,211,153,.22);--tone-lo:rgba(52,211,153,.1);
  --tone-soft:rgba(52,211,153,.26)}
.orbit-card.blue{--tone:#60a5fa;--tone-hi:rgba(96,165,250,.22);--tone-lo:rgba(96,165,250,.1);
  --tone-soft:rgba(96,165,250,.26)}
.orbit-card.orange{--tone:#fb923c;--tone-hi:rgba(251,146,60,.22);--tone-lo:rgba(251,146,60,.1);
  --tone-soft:rgba(251,146,60,.26)}
.orbit-card.purple{--tone:#a78bfa;--tone-hi:rgba(167,139,250,.22);--tone-lo:rgba(167,139,250,.1);
  --tone-soft:rgba(167,139,250,.26)}
.orbit-card.is-active{cursor:default;filter:none;
  box-shadow:0 34px 68px rgba(0,0,0,.7),0 0 0 1px var(--tone-soft),
    0 0 42px var(--tone-soft),inset 0 1px 0 rgba(255,255,255,.12);
  animation:orbitFloat 4.6s ease-in-out .62s infinite}
.orbit-edge{position:absolute;inset:0;border-radius:inherit;padding:1.2px;pointer-events:none;
  background:linear-gradient(150deg,var(--tone),transparent 45%,transparent 60%,var(--tone));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;opacity:.35;transition:opacity .45s}
.orbit-card.is-active .orbit-edge{opacity:.95}
.orbit-sheen{position:absolute;top:-70%;left:-45%;width:55%;height:240%;pointer-events:none;
  border-radius:inherit;transform:rotate(20deg);opacity:0;
  background:linear-gradient(90deg,transparent,rgba(190,230,255,.35),transparent)}
.orbit-card.is-active .orbit-sheen{opacity:1;animation:orbitSheen 4.2s ease-in-out infinite}
.orbit-icon{position:relative;width:52px;height:52px;display:grid;place-items:center;
  border-radius:18px;color:var(--tone);background:var(--tone-soft);
  box-shadow:0 0 26px var(--tone-soft),inset 0 1px 0 rgba(255,255,255,.14)}
.orbit-icon-ring{position:absolute;inset:-6px;border:1.5px dashed var(--tone);border-radius:22px;
  opacity:.45;animation:ringSpin 11s linear infinite}
.orbit-title{max-width:100%;color:#f0f6ff;font-size:14px;font-weight:850;
  letter-spacing:-.02em;line-height:1.22}
.orbit-detail{max-width:130px;color:var(--muted);font-size:10px;line-height:1.45}
.orbit-dots{display:flex;gap:5px;margin-top:2px}
.orbit-dots i{width:5px;height:5px;border-radius:50%;background:var(--tone);opacity:.35}
.orbit-card.is-active .orbit-dots i{animation:dotBlink 1.5s ease-in-out infinite}
.orbit-card.is-active .orbit-dots i:nth-child(2){animation-delay:.2s}
.orbit-card.is-active .orbit-dots i:nth-child(3){animation-delay:.4s}
.orbit-reflection{position:absolute;left:8%;right:8%;bottom:-16px;height:18px;border-radius:50%;
  pointer-events:none;background:radial-gradient(ellipse,var(--tone-soft),transparent 72%);
  filter:blur(8px);opacity:0;transition:opacity .45s}
.orbit-card.is-active .orbit-reflection{opacity:1}

.feature-pager{display:flex;justify-content:center;gap:7px;margin-top:6px}
.pager-dot{width:7px;height:7px;padding:0;border:0;border-radius:999px;cursor:pointer;
  background:rgba(140,170,255,.28);transition:width .35s cubic-bezier(.22,1,.36,1),background .35s,
  box-shadow .35s}
.pager-dot.on{width:22px}
.pager-dot.on.green{background:var(--green);box-shadow:0 0 12px var(--green)}
.pager-dot.on.blue{background:var(--blue);box-shadow:0 0 12px var(--blue)}
.pager-dot.on.orange{background:var(--orange);box-shadow:0 0 12px var(--orange)}
.pager-dot.on.purple{background:var(--purple);box-shadow:0 0 12px var(--purple)}

/* ---------- quick actions ---------- */
.quick-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.quick-actions button{position:relative;overflow:hidden;display:flex;flex-direction:column;
  align-items:center;gap:7px;padding:13px 5px;border:1px solid var(--line);
  border-radius:17px;cursor:pointer;color:inherit;
  background:linear-gradient(160deg,rgba(22,30,53,.92),rgba(11,16,31,.92));
  box-shadow:var(--shadow-sm),inset 0 1px 0 rgba(255,255,255,.05);
  transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s,border-color .28s}
.quick-actions button::after{content:"";position:absolute;inset:auto 0 0 0;height:2px;
  background:linear-gradient(90deg,var(--qa),transparent);transform:scaleX(0);
  transform-origin:left;transition:transform .35s}
.quick-actions button.orange{--qa:#fb923c;--qa-soft:rgba(251,146,60,.16)}
.quick-actions button.cyan{--qa:#22d3ee;--qa-soft:rgba(34,211,238,.16)}
.quick-actions button.violet{--qa:#a78bfa;--qa-soft:rgba(167,139,250,.16)}
.quick-actions button.green{--qa:#34d399;--qa-soft:rgba(52,211,153,.16)}
.quick-actions button:hover{transform:translateY(-4px);border-color:var(--qa);
  box-shadow:var(--shadow-md),0 0 24px var(--qa-soft)}
.quick-actions button:hover::after{transform:scaleX(1)}
.quick-actions button:active{transform:translateY(-1px) scale(.97)}
.quick-actions span{width:36px;height:36px;display:grid;place-items:center;border-radius:12px;
  color:var(--qa);background:var(--qa-soft);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 0 18px var(--qa-soft);
  transition:transform .35s}
.quick-actions button:hover span{transform:rotateY(180deg)}
.quick-actions b{color:#b7c6e6;font-size:8px;font-weight:800;text-align:center;line-height:1.25}

/* ---------- market rates ---------- */
.rate-scroll{display:flex;gap:11px;overflow-x:auto;padding:6px 15px 10px;margin:0 -15px;
  scroll-snap-type:x mandatory}
.rate-scroll::-webkit-scrollbar{height:0}
.rate-card{position:relative;overflow:hidden;flex:0 0 150px;padding:14px 13px 13px;
  border:1px solid var(--line);border-radius:19px;scroll-snap-align:start;
  background:linear-gradient(160deg,rgba(21,29,52,.95),rgba(10,15,29,.95));
  box-shadow:var(--shadow-md);cursor:default}
.rate-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2.5px;z-index:3;
  background:var(--accent);box-shadow:0 0 16px var(--dot)}
.rate-card.green{--accent:linear-gradient(90deg,#34d399,#a7f3d0);--dot:#34d399}
.rate-card.orange{--accent:linear-gradient(90deg,#fb923c,#fdba74);--dot:#fb923c}
.rate-card.blue{--accent:linear-gradient(90deg,#60a5fa,#c7d2fe);--dot:#60a5fa}
.rate-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.stone-mark{position:relative;width:26px;height:22px;display:block}
.stone-mark i,.stone-mark b,.stone-mark em{position:absolute;border-radius:3px;
  background:var(--dot);box-shadow:0 0 10px var(--dot)}
.stone-mark i{width:11px;height:11px;left:0;bottom:0;opacity:.5}
.stone-mark b{width:9px;height:9px;left:9px;bottom:6px;opacity:.75}
.stone-mark em{width:7px;height:7px;left:17px;bottom:0;opacity:.95}
.rate-top small{color:var(--dim);font-size:7.5px;font-weight:650}
.rate-card h3{margin:0;font-size:16px;font-weight:850;letter-spacing:-.03em;color:#f0f6ff}
.rate-card p{margin:2px 0 9px;color:var(--muted);font-size:9px}
.starting-label{display:block;color:#5f7099;font-size:7.5px;font-weight:800;letter-spacing:.12em}
.rate-card strong{display:block;margin-top:2px;font-size:19px;font-weight:850;
  letter-spacing:-.035em;color:#fff;font-variant-numeric:tabular-nums}
.rate-card strong small{margin-left:2px;color:var(--muted);font-size:9px;font-weight:650}
.spark{width:100%;height:26px;margin:7px 0 2px;display:block}
.spark-line{fill:none;stroke-width:2;vector-effect:non-scaling-stroke;stroke-linecap:round}
.spark.up .spark-line{stroke:#34d399;filter:drop-shadow(0 0 5px rgba(52,211,153,.8))}
.spark.down .spark-line{stroke:#fb923c;filter:drop-shadow(0 0 5px rgba(251,146,60,.8))}
.spark.stable .spark-line{stroke:#60a5fa;filter:drop-shadow(0 0 5px rgba(96,165,250,.8))}
.spark-fill{stroke:none;opacity:.2}
.spark.up .spark-fill{fill:#34d399}
.spark.down .spark-fill{fill:#fb923c}
.spark.stable .spark-fill{fill:#60a5fa}
.movement{margin-top:5px;padding:4px 8px;border-radius:999px;font-size:8.5px;font-weight:850;
  display:inline-block;border:1px solid currentColor}
.movement.up{color:#6ee7b7;background:rgba(52,211,153,.12)}
.movement.down{color:#fdba74;background:rgba(251,146,60,.12)}
.movement.stable{color:#93c5fd;background:rgba(96,165,250,.12)}

/* ---------- performance ---------- */
.performance-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.performance-card{position:relative;overflow:hidden;height:100%;padding:14px 13px;
  border:1px solid var(--line);border-radius:19px;
  background:linear-gradient(155deg,rgba(21,29,52,.95),rgba(10,15,29,.95));
  box-shadow:var(--shadow-md);transform-style:preserve-3d}
.metric-wave{position:absolute;left:0;right:0;bottom:0;height:40px;pointer-events:none;
  background:radial-gradient(120% 100% at 50% 130%,rgba(34,211,238,.22),transparent 70%)}
.metric-icon{width:33px;height:33px;display:grid;place-items:center;border-radius:11px;
  color:#34d399;background:rgba(52,211,153,.14);
  box-shadow:0 0 20px rgba(52,211,153,.24),inset 0 1px 0 rgba(255,255,255,.1)}
.metric-icon.negative{color:#fb923c;background:rgba(251,146,60,.14);
  box-shadow:0 0 20px rgba(251,146,60,.24),inset 0 1px 0 rgba(255,255,255,.1)}
.performance-card strong{display:block;margin-top:11px;font-size:22px;font-weight:850;
  letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:#fff;
  text-shadow:0 0 22px rgba(120,180,255,.28)}
.performance-card>span{display:block;margin-top:1px;color:var(--muted);font-size:10px;
  font-weight:650}
.performance-card small{display:block;margin-top:7px;font-size:8.5px;font-weight:800}
.performance-card small.up{color:#6ee7b7}
.performance-card small.down{color:#fdba74}

/* ---------- loading today ---------- */
.loading-stack{display:flex;flex-direction:column;gap:10px}
.loading-card{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;
  align-items:center;gap:11px;padding:13px 12px;border:1px solid var(--line);
  border-radius:18px;color:var(--ink);text-align:left;cursor:pointer;
  background:linear-gradient(160deg,rgba(20,28,50,.92),rgba(10,15,29,.92));
  box-shadow:var(--shadow-sm);
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s,border-color .25s}
.loading-card:hover{transform:translateY(-3px) scale(1.008);border-color:rgba(34,211,238,.4);
  box-shadow:var(--shadow-md),0 0 26px rgba(34,211,238,.14)}
.loading-card:active{transform:scale(.99)}
.loading-card>svg{color:#4d5c82;flex:0 0 auto;transition:transform .25s,color .25s}
.loading-card:hover>svg{transform:translateX(3px);color:#22d3ee}
.loading-icon{position:relative;width:42px;height:42px;display:grid;place-items:center;
  border-radius:14px}
.loading-icon.amber{color:#fbbf24;background:rgba(251,191,36,.13);
  box-shadow:0 0 22px rgba(251,191,36,.2)}
.loading-icon.blue{color:#60a5fa;background:rgba(96,165,250,.13);
  box-shadow:0 0 22px rgba(96,165,250,.2)}
.loading-icon i{position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;
  border:2px solid #0a0f1d;background:currentColor;animation:livePulse 2.1s ease-in-out infinite}
.loading-copy{min-width:0}
.loading-copy small{display:block;color:#5f7099;font-size:8px;font-weight:750;
  letter-spacing:.07em}
.loading-copy b{display:block;margin-top:2px;overflow:hidden;font-size:11.5px;font-weight:800;
  text-overflow:ellipsis;white-space:nowrap;color:#eaf1ff}
.loading-copy em{display:block;margin-top:2px;color:var(--muted);font-size:9px;font-style:normal}
.loading-time{text-align:right}
.loading-time b{display:block;font-size:11px;font-weight:850;color:#eaf1ff}
.loading-time small{display:inline-block;margin-top:3px;padding:2px 7px;border-radius:999px;
  font-size:7.5px;font-weight:850;white-space:nowrap;border:1px solid currentColor}
.loading-time small.amber{color:#fbbf24;background:rgba(251,191,36,.12)}
.loading-time small.blue{color:#93c5fd;background:rgba(96,165,250,.12)}

/* ---------- order overview ---------- */
.order-overview{position:relative;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;
  gap:14px;padding:18px 16px;border:1px solid var(--line-hi);border-radius:24px;
  background:
    radial-gradient(400px 240px at 12% 10%,rgba(34,211,238,.18),transparent 70%),
    linear-gradient(140deg,rgba(19,27,49,.96),rgba(9,13,26,.96));
  box-shadow:var(--shadow-md),inset 0 1px 0 rgba(255,255,255,.07)}
.overview-mesh{position:absolute;inset:-40%;pointer-events:none;opacity:.55;filter:blur(48px);
  background:conic-gradient(from 90deg at 30% 60%,rgba(34,211,238,.24),rgba(139,92,246,.22),
    rgba(251,146,60,.16),rgba(34,211,238,.24));animation:meshSpin 30s linear infinite reverse}
.overview-copy{position:relative;z-index:2}
.overview-copy h2{margin:0 0 5px;font-size:16px;font-weight:850;letter-spacing:-.03em;
  color:#f2f7ff}
.overview-copy p{margin:0 0 13px;color:var(--muted);font-size:10px;line-height:1.5}
.overview-copy button{display:inline-flex;align-items:center;gap:6px;padding:9px 13px;
  border:1px solid rgba(34,211,238,.45);border-radius:12px;
  background:linear-gradient(120deg,rgba(34,211,238,.18),rgba(139,92,246,.18));color:#d7f6ff;
  font-size:10px;font-weight:850;cursor:pointer;box-shadow:0 0 22px rgba(34,211,238,.2);
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s}
.overview-copy button:hover{transform:translateY(-2px);box-shadow:0 0 32px rgba(34,211,238,.36)}
.overview-copy button:active{transform:scale(.97)}
.overview-grid{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:9px}
.overview-metric{padding:11px 10px;border:1px solid var(--line);border-radius:15px;
  background:rgba(10,15,29,.7);backdrop-filter:blur(8px);box-shadow:var(--shadow-sm);
  transition:transform .25s,box-shadow .25s,border-color .25s}
.overview-metric:hover{transform:translateY(-3px) rotateX(6deg);border-color:var(--om);
  box-shadow:0 0 22px var(--om-soft)}
.overview-metric strong{display:block;font-size:19px;font-weight:850;letter-spacing:-.04em}
.overview-metric span{display:block;margin-top:1px;color:var(--muted);font-size:8.5px;
  font-weight:700}
.overview-metric.blue{--om:#60a5fa;--om-soft:rgba(96,165,250,.25)}
.overview-metric.green{--om:#34d399;--om-soft:rgba(52,211,153,.25)}
.overview-metric.amber{--om:#fbbf24;--om-soft:rgba(251,191,36,.25)}
.overview-metric.purple{--om:#a78bfa;--om-soft:rgba(167,139,250,.25)}
.overview-metric strong{color:var(--om);text-shadow:0 0 18px var(--om-soft)}

/* ---------- market pulse ---------- */
.pulse-grid{display:flex;flex-direction:column;gap:10px}
.pulse-card{position:relative;overflow:hidden;display:flex;align-items:center;gap:11px;
  padding:13px 12px;border:1px solid var(--line);border-radius:17px;
  background:linear-gradient(160deg,rgba(20,28,50,.92),rgba(10,15,29,.92));
  box-shadow:var(--shadow-sm);transform-style:preserve-3d}
.pulse-card::before{content:"";position:absolute;top:0;bottom:0;left:0;width:2.5px;
  background:var(--pulse);box-shadow:0 0 16px var(--pulse)}
.pulse-card.green{--pulse:#34d399;--pulse-soft:rgba(52,211,153,.14)}
.pulse-card.blue{--pulse:#60a5fa;--pulse-soft:rgba(96,165,250,.14)}
.pulse-card.amber{--pulse:#fbbf24;--pulse-soft:rgba(251,191,36,.14)}
.pulse-card>span{width:35px;height:35px;display:grid;place-items:center;border-radius:12px;
  flex:0 0 auto;color:var(--pulse);background:var(--pulse-soft);
  box-shadow:0 0 20px var(--pulse-soft)}
.pulse-card b{display:block;font-size:11.5px;font-weight:800;letter-spacing:-.015em;
  color:#eaf1ff}
.pulse-card small{display:block;margin-top:2px;color:var(--muted);font-size:9.5px}
.last-section{padding-bottom:4px}

/* ---------- bottom nav ---------- */
.bottom-nav{position:absolute;z-index:40;bottom:0;left:0;right:0;height:66px;
  display:grid;grid-template-columns:repeat(5,1fr);align-items:center;padding:0 6px 4px;
  border-top:1px solid var(--line);
  background:linear-gradient(0deg,rgba(6,9,19,.96),rgba(9,13,26,.7));
  backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);
  box-shadow:0 -10px 30px rgba(0,0,0,.5)}
.bottom-nav::before{content:"";position:absolute;left:0;right:0;top:-1px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(34,211,238,.6),rgba(139,92,246,.5),transparent)}
.bottom-nav button{position:relative;display:flex;flex-direction:column;align-items:center;
  gap:3px;padding:6px 2px;border:0;background:transparent;color:#5f7099;cursor:pointer;
  transition:color .22s}
.bottom-nav button span{width:34px;height:30px;display:grid;place-items:center;border-radius:11px;
  transition:transform .3s cubic-bezier(.34,1.56,.64,1),background .3s,box-shadow .3s}
.bottom-nav button small{font-size:8px;font-weight:750}
.bottom-nav button:hover{color:#9fb3dd}
.bottom-nav button.active{color:#67e8f9}
.bottom-nav button.active span{transform:translateY(-3px) scale(1.06);
  background:linear-gradient(150deg,rgba(34,211,238,.2),rgba(139,92,246,.16));
  box-shadow:0 0 22px rgba(34,211,238,.35)}
.bottom-nav button.active::after{content:"";position:absolute;top:0;width:18px;height:2.5px;
  border-radius:999px;background:linear-gradient(90deg,#22d3ee,#8b5cf6);
  box-shadow:0 0 12px rgba(34,211,238,.8)}
`;

const CSS_MOTION = `
/* ---------- keyframes ---------- */
@keyframes auroraA{0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(18px,26px,0) scale(1.12)}}
@keyframes auroraB{0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(-24px,-18px,0) scale(1.08)}}
@keyframes meshSpin{to{transform:rotate(360deg)}}
@keyframes scanMove{0%{top:-80px;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:100%;opacity:0}}
@keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes shimmer{0%{left:-140%}55%,100%{left:140%}}
@keyframes lineSlide{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes tickerRun{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes ringSpin{to{transform:rotate(360deg)}}
@keyframes corePulse{0%,100%{opacity:.85;transform:translate(-50%,-50%) scale(1)}
  50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
@keyframes stageGlow{0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1)}
  50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
@keyframes stageRing{0%,100%{opacity:.3;transform:translateX(-50%) rotateX(72deg) scale(.94)}
  50%{opacity:.8;transform:translateX(-50%) rotateX(72deg) scale(1.05)}}
@keyframes orbitFloat{0%,100%{transform:translate(-50%,-50%) translateX(0) translateZ(0)
    rotateY(0deg) scale(1)}
  50%{transform:translate(-50%,-52.5%) translateX(0) translateZ(14px)
    rotateY(4deg) scale(1.015)}}
@keyframes orbitSheen{0%{transform:translateX(0) rotate(20deg);opacity:0}
  16%{opacity:.9}48%{transform:translateX(330%) rotate(20deg);opacity:0}
  100%{transform:translateX(330%) rotate(20deg);opacity:0}}
@keyframes dotBlink{0%,100%{opacity:.28;transform:scale(1)}
  50%{opacity:1;transform:scale(1.25)}}
@keyframes badgePop{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
@keyframes dotPing{0%{box-shadow:0 0 0 0 currentColor;opacity:.9}
  70%{box-shadow:0 0 0 6px transparent;opacity:1}100%{box-shadow:0 0 0 0 transparent;opacity:.9}}
@keyframes menuIn{from{opacity:0;transform:translateY(-6px) scale(.97)}
  to{opacity:1;transform:none}}
@keyframes orbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes barGlow{0%,100%{opacity:.6;filter:brightness(.85)}
  50%{opacity:1;filter:brightness(1.45)}}
@keyframes cubeFloat{0%,100%{transform:translateY(0) rotate(30deg)}
  50%{transform:translateY(-8px) rotate(52deg)}}
@keyframes livePulse{0%,100%{opacity:.6}
  50%{opacity:1;box-shadow:0 0 0 6px rgba(52,211,153,.1)}}

/* ---------- responsive ---------- */
@media(min-width:700px){
  .seller-phone{height:min(900px,calc(100dvh - 24px));border:1px solid rgba(140,170,255,.18);
    border-radius:30px;
    box-shadow:0 40px 100px rgba(0,0,0,.75),0 0 70px rgba(34,211,238,.12)}
}
@media(max-width:370px){
  .advantage-card{min-height:318px;padding:17px}
  .advantage-copy{width:64%}
  .advantage-copy h1{font-size:23px}
  .hero-stats{gap:8px}
  .hero-hud{width:150px;height:150px;right:-22px}
  .feature-stage{height:228px}
  .orbit-card{width:144px;height:190px;padding:16px 12px;
    transform:translate(-50%,-50%)
      translateX(calc(var(--offset) * 104px))
      translateY(calc(var(--distance) * 6px))
      translateZ(calc(var(--distance) * -170px))
      rotateY(calc(var(--offset) * -38deg))
      scale(calc(1 - var(--distance) * .12))}
  .orbit-title{font-size:13px}
  .quick-actions button b{font-size:7px}
  .loading-card{grid-template-columns:auto minmax(0,1fr) auto}
  .loading-card>svg{display:none}
  .loading-time small{max-width:65px}
  .order-overview{grid-template-columns:1fr}
}
@media(hover:none){
  .tilt{transform:none!important}
}
@media(prefers-reduced-motion:reduce){
  .seller-app *{animation:none!important;transition:none!important}
  .tilt{transform:none!important}
  .reveal{opacity:1!important;transform:none!important}
}
`;


const CSS_LIGHT = `
/* ============================================================
   LIGHT LAVENDER THEME - inspired by the supplied elevated-card reference
   ============================================================ */
:root{color-scheme:light}
.seller-app{
  --bg-0:#f9f8ff;--bg-1:#f3f0ff;--bg-2:#ece7ff;
  --ink:#182037;--muted:#697189;--dim:#8b91a7;
  --line:rgba(100,82,170,.13);--line-hi:rgba(111,82,210,.23);
  --card:rgba(255,255,255,.84);--glass:rgba(255,255,255,.72);
  --shadow-sm:0 5px 16px rgba(69,50,125,.09);
  --shadow-md:0 15px 34px rgba(74,55,135,.13);
  --shadow-lg:0 25px 55px rgba(73,51,140,.17);
  --glow-cyan:0 0 24px rgba(55,188,178,.16);
  --glow-violet:0 15px 32px rgba(112,73,225,.20);
  color:var(--ink);
  background:linear-gradient(145deg,#fff 0%,#f8f5ff 42%,#eee9ff 100%);
}
.seller-app ::selection{background:rgba(116,78,225,.20);color:#20183d}
.seller-phone{
  color:var(--ink);
  background:
    radial-gradient(420px 300px at 88% 15%,rgba(111,78,229,.14),transparent 72%),
    radial-gradient(360px 300px at 8% 58%,rgba(96,207,195,.10),transparent 72%),
    linear-gradient(165deg,#ffffff 0%,#f8f6ff 48%,#eee9ff 100%);
}
.aurora i{filter:blur(72px);opacity:.28}
.aurora-one{background:radial-gradient(circle,rgba(119,91,235,.30),transparent 68%)}
.aurora-two{background:radial-gradient(circle,rgba(93,207,197,.22),transparent 68%)}
.aurora-three{background:radial-gradient(circle,rgba(255,160,72,.20),transparent 68%)}
.grid-floor{opacity:.17;background-image:linear-gradient(rgba(111,82,210,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(111,82,210,.10) 1px,transparent 1px)}
.noise{opacity:.025;mix-blend-mode:multiply}
.seller-header{height:72px;align-items:center;padding:12px 15px;border-bottom:1px solid rgba(103,82,170,.12);background:rgba(255,255,255,.76);box-shadow:0 8px 26px rgba(73,54,125,.07)}
.seller-header.condensed{background:rgba(255,255,255,.92);box-shadow:0 12px 30px rgba(70,51,128,.12)}
.seller-header::after{background:linear-gradient(90deg,transparent,rgba(255,155,65,.45),rgba(112,72,225,.65),rgba(69,190,181,.45),transparent)}
.header-icon{border-color:rgba(105,82,176,.16);color:#5d5874;background:linear-gradient(155deg,#fff,#f1edff);box-shadow:0 7px 18px rgba(72,52,130,.11),inset 0 1px 0 #fff}
.header-icon:hover{border-color:rgba(112,72,225,.38);box-shadow:0 12px 24px rgba(72,52,130,.15),0 0 20px rgba(112,72,225,.12)}
.header-icon.notification b{border-color:#fff}
.seller-identity{padding-top:0;align-self:center}
.seller-identity>span{color:#8b91a7;font-size:10px}
.seller-identity>b{color:#20263a;font-size:14px}
.seller-scroll{top:72px}
.seller-content{gap:20px;background:transparent}
.ticker,.quick-actions button,.rate-card,.performance-card,.loading-card,.pulse-card{border-color:rgba(105,82,176,.12);background:linear-gradient(150deg,rgba(255,255,255,.96),rgba(246,243,255,.90));box-shadow:0 12px 28px rgba(72,52,130,.10),inset 0 1px 0 #fff}
.ticker-item b,.starting-label,.section-kicker{color:#8c91a5}
.ticker-item em,.rate-card h3,.rate-card strong,.performance-card strong,.loading-copy b,.loading-time b,.pulse-card b{color:#20263a;text-shadow:none}
.section-heading h2{color:#1d2438}
.section-heading>button{border-color:rgba(105,82,176,.16);background:#fff;color:#625d75;box-shadow:var(--shadow-sm)}
.chip-3d{border-color:rgba(112,72,225,.20);background:rgba(112,72,225,.08);color:#6f49d9;box-shadow:none}
.live-pill{background:rgba(52,180,145,.10);color:#238b70}
.feature-stage{border-radius:26px;background:radial-gradient(ellipse at 50% 92%,rgba(119,77,231,.20),transparent 48%)}
.stage-glow{background:radial-gradient(circle,rgba(118,77,229,.18),rgba(238,232,255,.25) 46%,transparent 70%);filter:blur(24px)}
.stage-ring{border-color:rgba(118,77,229,.18)}
.stage-ring.ring-b{border-color:rgba(70,188,179,.15)}
.orbit-card{border-color:rgba(105,82,176,.13);background:linear-gradient(160deg,#fff 0%,#fbfaff 52%,#f1edff 100%);box-shadow:0 22px 45px rgba(71,51,132,.16),inset 0 1px 0 #fff;filter:saturate(.75) brightness(.98)}
.orbit-card.is-active{box-shadow:0 28px 58px rgba(75,52,145,.20),0 0 0 1px var(--tone-soft),0 18px 35px var(--tone-soft),inset 0 1px 0 #fff}
.orbit-title{color:#20263a}
.orbit-detail{color:#686f85}
.orbit-icon{background:linear-gradient(145deg,var(--tone-soft),rgba(255,255,255,.9));box-shadow:0 10px 24px var(--tone-soft),inset 0 1px 0 #fff}
.orbit-icon-ring{opacity:.22}
.quick-actions b{color:#565d72}
.rate-card p,.performance-card>span,.loading-copy em,.pulse-card small,.overview-copy p,.overview-metric span{color:#6d748a}
.card-edge{opacity:.24}
.order-overview{border-color:rgba(105,82,176,.13);background:radial-gradient(360px 220px at 10% 5%,rgba(116,80,226,.11),transparent 70%),linear-gradient(145deg,#fff,#f2eeff);box-shadow:0 17px 38px rgba(72,52,130,.13),inset 0 1px 0 #fff}
.overview-mesh{opacity:.18}
.overview-copy h2{color:#20263a}
.overview-copy button{border-color:rgba(112,72,225,.28);background:linear-gradient(120deg,rgba(112,72,225,.11),rgba(94,203,193,.10));color:#5d3ec2;box-shadow:none}
.overview-metric{border-color:rgba(105,82,176,.12);background:rgba(255,255,255,.78);box-shadow:var(--shadow-sm)}
.bottom-nav{border-top-color:rgba(105,82,176,.12);background:rgba(255,255,255,.90);box-shadow:0 -10px 28px rgba(72,52,130,.10)}
.bottom-nav::before{background:linear-gradient(90deg,transparent,rgba(255,155,65,.35),rgba(112,72,225,.52),rgba(69,190,181,.35),transparent)}
.bottom-nav button{color:#9297a9}
.bottom-nav button:hover{color:#665f7b}
.bottom-nav button.active{color:#7048df}
.bottom-nav button.active span{background:linear-gradient(145deg,rgba(112,72,225,.13),rgba(255,255,255,.92));box-shadow:0 8px 20px rgba(112,72,225,.18)}
.bottom-nav button.active::after{background:linear-gradient(90deg,#ff9e45,#754be4,#46bdb4);box-shadow:none}
@media(min-width:700px){.seller-phone{border-color:rgba(105,82,176,.13);box-shadow:0 35px 90px rgba(66,48,115,.23),0 0 65px rgba(115,77,225,.10)}}

/* Feature icon badges: solid circles, white symbols, reference-matched depth */
.orbit-icon{
  width:66px;height:66px;border-radius:50%;
  color:#fff;
  background:linear-gradient(145deg,var(--icon-light),var(--icon-dark));
  border:1px solid rgba(255,255,255,.72);
  box-shadow:
    0 13px 25px var(--icon-shadow),
    inset 0 2px 2px rgba(255,255,255,.34),
    inset 0 -3px 8px rgba(30,18,80,.14);
}
.orbit-icon svg{width:30px;height:30px;stroke-width:2;filter:drop-shadow(0 2px 2px rgba(40,25,90,.16))}
.orbit-icon-ring{display:none}
.orbit-card.green{--icon-light:#58d7c5;--icon-dark:#239d91;--icon-shadow:rgba(43,174,159,.28)}
.orbit-card.blue{--icon-light:#8d67f2;--icon-dark:#6131d5;--icon-shadow:rgba(102,55,218,.32)}
.orbit-card.orange{--icon-light:#ffb052;--icon-dark:#ff7d27;--icon-shadow:rgba(245,132,48,.30)}
.orbit-card.purple{--icon-light:#936cf5;--icon-dark:#6332d8;--icon-shadow:rgba(103,57,216,.34)}
.orbit-card.is-active .orbit-icon{
  width:72px;height:72px;
  box-shadow:
    0 16px 30px var(--icon-shadow),
    0 0 0 7px rgba(116,77,226,.055),
    inset 0 2px 2px rgba(255,255,255,.38),
    inset 0 -4px 9px rgba(30,18,80,.16);
}
.orbit-card.is-active .orbit-icon svg{width:32px;height:32px}
`;

const CSS_REFINEMENTS = `
/* ============================================================
   FEATURE DECK AND MARKET RATE REFINEMENTS
   ============================================================ */

/* Approximately 10% larger feature cards with more breathing room. */
.orbit-card{
  width:174px;
  height:227px;
  padding:20px 15px;
  gap:10px;
  transform:translate(-50%,-50%)
    translateX(calc(var(--offset) * 128px))
    translateY(calc(var(--distance) * 5px))
    translateZ(calc(var(--distance) * -168px))
    rotateY(calc(var(--offset) * -32deg))
    scale(calc(1 - var(--distance) * .105));
  transition:
    transform .95s cubic-bezier(.22,.72,.22,1),
    opacity .72s ease,
    box-shadow .72s ease,
    filter .72s ease;
}
.feature-stage{height:272px}

/* Smaller, balanced icon badges. */
.orbit-icon{
  width:54px;
  height:54px;
  box-shadow:
    0 10px 20px var(--icon-shadow),
    inset 0 2px 2px rgba(255,255,255,.34),
    inset 0 -3px 7px rgba(30,18,80,.12);
}
.orbit-icon svg{width:25px;height:25px;stroke-width:1.9}
.orbit-card.is-active .orbit-icon{
  width:58px;
  height:58px;
  box-shadow:
    0 12px 23px var(--icon-shadow),
    0 0 0 5px rgba(116,77,226,.045),
    inset 0 2px 2px rgba(255,255,255,.36),
    inset 0 -3px 7px rgba(30,18,80,.13);
}
.orbit-card.is-active .orbit-icon svg{width:27px;height:27px}

/* Gentler active-card floating motion. */
@keyframes orbitFloat{
  0%,100%{
    transform:translate(-50%,-50%) translateX(0) translateZ(0)
      rotateY(0deg) scale(1)
  }
  50%{
    transform:translate(-50%,-51.2%) translateX(0) translateZ(6px)
      rotateY(1.5deg) scale(1.006)
  }
}
.orbit-card.is-active{animation-duration:6.8s;animation-delay:.95s}

/* Align first market-rate card with the quick-action cards instead of the screen edge. */
.rate-scroll{
  margin-left:-15px;
  margin-right:-15px;
  padding:6px 20px 10px 28px;
  scroll-padding-left:28px;
}
.rate-card:first-child{scroll-margin-left:28px}

@media(max-width:370px){
  .feature-stage{height:252px}
  .orbit-card{
    width:158px;
    height:209px;
    padding:18px 13px;
    transform:translate(-50%,-50%)
      translateX(calc(var(--offset) * 114px))
      translateY(calc(var(--distance) * 5px))
      translateZ(calc(var(--distance) * -158px))
      rotateY(calc(var(--offset) * -32deg))
      scale(calc(1 - var(--distance) * .105));
  }
}
`;


const CSS_FINAL_FIXES = `
/* ============================================================
   FINAL MOTION AND ALIGNMENT FIXES
   ============================================================ */

/*
 * The old orbitFloat animation and the carousel transition both changed
 * transform. That conflict caused the active card to jump during rotation.
 * Keep transform under carousel transition control only.
 */
.orbit-card,
.orbit-card.is-active{
  animation:none !important;
  will-change:transform,opacity;
  transition:
    transform .82s cubic-bezier(.22,.61,.36,1),
    opacity .58s ease,
    box-shadow .68s ease,
    filter .68s ease;
}

/* Keep decorative elements animated without moving the card itself. */
.orbit-card.is-active .orbit-icon{
  transition:width .55s cubic-bezier(.22,.61,.36,1),
    height .55s cubic-bezier(.22,.61,.36,1),
    box-shadow .65s ease;
}
.orbit-card.is-active .orbit-reflection{transition:opacity .6s ease}

/*
 * Exact alignment: rate-scroll now starts at the seller-content edge.
 * Quick Actions already starts at this same edge, so 20mm and Upload Sample
 * share the same left alignment without extra estimated padding.
 */
.rate-scroll{
  margin-left:0;
  margin-right:0;
  padding:6px 15px 10px 0;
  scroll-padding-left:0;
}
.rate-card:first-child{scroll-margin-left:0}
`;


const CSS_READABILITY = `
/* ============================================================
   SMALL STATUS TEXT READABILITY
   Stronger contrast for rate movement and performance changes
   ============================================================ */

/* Market-rate increase/decrease badges */
.movement{
  margin-top:7px;
  min-height:28px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:5px 11px;
  border-width:1.5px;
  font-size:10px;
  line-height:1;
  font-weight:900;
  letter-spacing:.005em;
  text-shadow:none;
  box-shadow:0 4px 10px rgba(45,38,75,.06);
}
.movement.up{
  color:#087f61;
  border-color:#35c99f;
  background:#dff9f0;
}
.movement.down{
  color:#b74708;
  border-color:#ff8a3d;
  background:#fff0e3;
}
.movement.stable{
  color:#245fa8;
  border-color:#68a8ee;
  background:#e8f3ff;
}

/* This Month Performance increase/decrease labels */
.performance-card small{
  width:max-content;
  max-width:100%;
  margin-top:8px;
  padding:5px 8px;
  border-radius:999px;
  font-size:9px;
  line-height:1.15;
  font-weight:900;
  letter-spacing:0;
}
.performance-card small.up{
  color:#087f61;
  border:1px solid #52cba8;
  background:#e1f8f0;
}
.performance-card small.down{
  color:#b74708;
  border:1px solid #ff9a56;
  background:#fff0e5;
}

/* Preserve clarity on narrow mobile screens. */
@media(max-width:370px){
  .movement{font-size:9.5px;padding:5px 9px}
  .performance-card small{font-size:8.5px;padding:5px 7px}
}
`;


const CSS_PERFORMANCE_RESET = `
/* ============================================================
   PERFORMANCE CHANGE LABEL RESET
   Keep enhanced pills only for Today's Market Rates.
   ============================================================ */
.performance-card small{
  width:auto;
  max-width:none;
  display:block;
  margin-top:7px;
  padding:0;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
  font-size:8.5px;
  line-height:1.2;
  font-weight:800;
  letter-spacing:0;
}
.performance-card small.up{
  color:#087f61;
  border:0;
  background:transparent;
}
.performance-card small.down{
  color:#b74708;
  border:0;
  background:transparent;
}
@media(max-width:370px){
  .performance-card small{
    padding:0;
    font-size:8.5px;
  }
}
`;


const CSS_TYPOGRAPHY_BALANCE = `
/* ============================================================
   TYPOGRAPHY BALANCE
   Remove excessive bold styling across the interface.
   The small market-rate movement pills remain emphasized.
   ============================================================ */

/* Main section headings */
.section-heading h2,
.feature-section .section-heading h2{
  font-weight:700;
  letter-spacing:-.02em;
}
.section-kicker{
  font-weight:700;
  letter-spacing:.14em;
}

/* Feature carousel */
.orbit-title{font-weight:700}
.orbit-detail{font-weight:400}

/* Quick actions */
.quick-actions b{font-weight:600}

/* Market-rate cards */
.rate-card h3{font-weight:700}
.rate-card strong{font-weight:700}
.rate-card strong small{font-weight:500}
.starting-label{font-weight:650}
.rate-top small{font-weight:500}
.rate-card p{font-weight:400}

/* Keep only these tiny rate changes strongly emphasized. */
.movement{font-weight:850}

/* This Month Performance */
.performance-card strong{font-weight:700}
.performance-card>span{font-weight:500}
.performance-card small,
.performance-card small.up,
.performance-card small.down{
  font-weight:600;
}

/* Loading Today */
.loading-copy small{font-weight:600}
.loading-copy b{font-weight:700}
.loading-copy em{font-weight:400}
.loading-time b{font-weight:700}
.loading-time small{font-weight:650}

/* Order Overview and lower sections */
.overview-copy h2{font-weight:700}
.overview-copy p{font-weight:400}
.overview-copy button{font-weight:650}
.overview-metric strong{font-weight:700}
.overview-metric span{font-weight:500}
.pulse-card b{font-weight:700}
.pulse-card small{font-weight:400}

/* Header, buttons, ticker and navigation */
.seller-identity>b{font-weight:700}
.section-heading>button{font-weight:600}
.ticker-tag{font-weight:700}
.ticker-item b{font-weight:600}
.ticker-item em{font-weight:700}
.live-pill,.chip-3d{font-weight:700}
.bottom-nav button small{font-weight:600}
`;

const CSS_DRAWER = `
.drawer-backdrop{position:absolute;z-index:47;inset:0;border:0;padding:0;pointer-events:none;opacity:0;background:rgba(29,24,50,.28);backdrop-filter:blur(0);transition:opacity .34s ease,backdrop-filter .34s ease}
.drawer-backdrop.open{pointer-events:auto;opacity:1;backdrop-filter:blur(5px)}
.seller-drawer{position:absolute;z-index:50;top:0;bottom:0;left:0;width:min(86%,356px);display:flex;flex-direction:column;overflow:hidden;border-right:1px solid rgba(111,82,210,.17);border-radius:0 26px 26px 0;color:#21273a;background:radial-gradient(270px 190px at 0 0,rgba(122,83,231,.14),transparent 72%),linear-gradient(165deg,rgba(255,255,255,.99),rgba(247,244,255,.99));box-shadow:24px 0 60px rgba(55,37,105,.20);transform:translateX(-104%);visibility:hidden;transition:transform .46s cubic-bezier(.22,.72,.22,1),visibility 0s linear .46s}
.seller-drawer.open{transform:translateX(0);visibility:visible;transition-delay:0s}
.drawer-profile{position:relative;display:grid;grid-template-columns:52px minmax(0,1fr) 30px;gap:12px;align-items:start;padding:24px 17px 18px;border-bottom:1px solid rgba(105,82,176,.11);background:linear-gradient(135deg,rgba(255,255,255,.72),rgba(238,232,255,.64))}
.drawer-avatar{width:52px;height:52px;display:grid;place-items:center;border-radius:17px;color:#fff;font-size:15px;font-weight:700;background:linear-gradient(145deg,#956cf1,#6738d7);box-shadow:0 12px 25px rgba(102,57,214,.25),inset 0 1px 1px rgba(255,255,255,.4)}
.drawer-profile-copy{min-width:0}.drawer-profile-copy>b{display:block;overflow:hidden;color:#20263a;font-size:14px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
.verified-badge{display:flex;align-items:center;gap:6px;width:max-content;margin-top:5px;color:#128069;font-size:9px;font-weight:650}.verified-badge i{width:16px;height:16px;display:grid;place-items:center;border-radius:50%;color:#fff;background:linear-gradient(145deg,#52d4b8,#20a58b)}
.drawer-profile-copy>button{margin-top:7px;padding:0;border:0;background:transparent;color:#7048df;font-size:10px;font-weight:650;cursor:pointer}.drawer-close{width:29px;height:29px;display:grid;place-items:center;border:1px solid rgba(105,82,176,.13);border-radius:10px;background:rgba(255,255,255,.72);color:#777188;font-size:21px;cursor:pointer}
.drawer-scroll{flex:1;overflow-y:auto;padding:12px 12px 24px;scrollbar-width:none}.drawer-scroll::-webkit-scrollbar{width:0}.drawer-group{display:flex;flex-direction:column;gap:3px;padding:9px 0 12px;border-bottom:1px solid rgba(105,82,176,.09)}.drawer-group:last-child{border-bottom:0}.drawer-group>span{padding:0 10px 6px;color:#969bad;font-size:8px;font-weight:700;letter-spacing:.15em}
.drawer-group>button{width:100%;min-height:44px;display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px;padding:5px 10px;border:0;border-radius:14px;color:#4e556b;background:transparent;text-align:left;cursor:pointer;transition:background .22s,color .22s,transform .22s}.drawer-group>button:hover{color:#3d2e7b;background:rgba(116,76,224,.07);transform:translateX(2px)}.drawer-group>button.active{color:#6338d2;background:linear-gradient(90deg,rgba(116,76,224,.13),rgba(116,76,224,.045));box-shadow:inset 3px 0 #754be4}
.drawer-group>button>i{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;color:#7456ca;background:#f0ebff;font-style:normal}.drawer-group>button>i.orange{color:#e97825;background:#fff0e3}.drawer-group>button>i.cyan{color:#1599aa;background:#e1f8fb}.drawer-group>button>i.green{color:#188f79;background:#e1f8f1}.drawer-group>button>i.purple{color:#7048df;background:#eee8ff}.drawer-group>button>b{overflow:hidden;font-size:11px;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.drawer-group>button>em{min-width:23px;height:20px;display:grid;place-items:center;padding:0 6px;border-radius:999px;color:#fff;background:linear-gradient(145deg,#8a61eb,#6740d8);font-size:9px;font-weight:700;font-style:normal}
@media(max-width:370px){.seller-drawer{width:89%}.drawer-profile{padding:20px 14px 15px}.drawer-group>button{min-height:42px}}@media(prefers-reduced-motion:reduce){.seller-drawer,.drawer-backdrop{transition:none!important}}
`;


const CSS_QUICK_ACTIONS_ALWAYS_ACTIVE = `
/* ============================================================
   QUICK ACTION CARDS - PERMANENT ENHANCED APPEARANCE
   All four cards retain their individual accent color at rest.
   ============================================================ */
.quick-actions button{
  border-color:var(--qa);
  background:
    radial-gradient(
      75px 55px at 50% 12%,
      var(--qa-soft),
      transparent 76%
    ),
    linear-gradient(
      155deg,
      rgba(255,255,255,.99),
      rgba(246,243,255,.96)
    );
  box-shadow:
    0 12px 24px rgba(72,52,130,.10),
    0 0 10px var(--qa-soft),
    inset 0 1px 0 #fff;
}
.quick-actions button::after{
  height:2.5px;
  background:linear-gradient(90deg,transparent,var(--qa),transparent);
  transform:scaleX(1);
  transform-origin:center;
  opacity:.92;
}
.quick-actions button>span{
  color:var(--qa);
  background:var(--qa-soft);
  box-shadow:
    0 8px 18px var(--qa-soft),
    inset 0 1px 0 rgba(255,255,255,.85);
}
.quick-actions button>b{
  color:#4e556a;
  font-weight:600;
}

/* Hover adds only a gentle lift; the visual quality is already present at rest. */
.quick-actions button:hover{
  transform:translateY(-2px);
  border-color:var(--qa);
  box-shadow:
    0 18px 34px rgba(72,52,130,.16),
    0 0 24px var(--qa-soft),
    inset 0 1px 0 #fff;
}
.quick-actions button:hover span{transform:none}
.quick-actions button:active{
  transform:translateY(0) scale(.985);
  box-shadow:
    0 9px 20px rgba(72,52,130,.12),
    0 0 15px var(--qa-soft),
    inset 0 1px 0 #fff;
}
.quick-actions button:focus-visible{
  outline:2px solid var(--qa);
  outline-offset:3px;
}
`;

const CSS_FEATURE_IMAGES = `
.orbit-card:has(.orbit-photo-wrap){justify-content:flex-start;gap:0;padding:0;overflow:hidden;background:#fff}
.orbit-photo-wrap{position:relative;width:100%;height:68%;min-height:0;overflow:hidden;border-radius:23px 23px 14px 14px;background:linear-gradient(145deg,#f4efff,#fff)}
.orbit-photo{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.015);filter:saturate(.92) contrast(.98) brightness(1.03);transition:transform .72s cubic-bezier(.22,.61,.36,1),filter .72s ease;pointer-events:none;user-select:none}
.orbit-card.is-active .orbit-photo{transform:scale(1.045);filter:saturate(1) contrast(1) brightness(1.02)}
.orbit-photo-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.02) 52%,rgba(247,243,255,.24) 78%,rgba(255,255,255,.92) 100%),linear-gradient(120deg,rgba(117,75,228,.06),transparent 45%)}
.orbit-photo-badge{position:absolute;top:10px;left:10px;width:34px;height:34px;display:grid;place-items:center;border-radius:11px;color:#fff;background:linear-gradient(145deg,var(--icon-light),var(--icon-dark));border:1px solid rgba(255,255,255,.72);box-shadow:0 8px 18px var(--icon-shadow),inset 0 1px 1px rgba(255,255,255,.35)}
.orbit-photo-copy{position:relative;z-index:2;width:100%;min-height:32%;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;padding:9px 13px 13px;text-align:left;background:linear-gradient(180deg,rgba(255,255,255,.95),#fff)}
.orbit-photo-copy .orbit-title{max-width:100%;font-size:12.5px;line-height:1.18;color:#20263a}.orbit-photo-copy .orbit-detail{max-width:100%;font-size:8.7px;line-height:1.32;color:#777d91}
.orbit-card:has(.orbit-photo-wrap) .orbit-dots{position:absolute;right:12px;bottom:10px;margin:0}.orbit-card:has(.orbit-photo-wrap) .orbit-reflection{bottom:-14px}
@media(max-width:370px){.orbit-photo-wrap{height:67%}.orbit-photo-copy{min-height:33%;padding:8px 11px 12px}.orbit-photo-copy .orbit-title{font-size:12px}.orbit-photo-copy .orbit-detail{font-size:8.3px}}
`;

const CSS_IMAGE_ONLY_CARDS = `
/* ============================================================
   IMAGE-ONLY FEATURE CARDS
   Preserve each uploaded image exactly, with no overlaid UI content.
   ============================================================ */
.orbit-card:has(.orbit-photo-wrap){
  display:block;
  padding:0;
  gap:0;
  overflow:hidden;
  background:#fff;
}
.orbit-photo-wrap{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  overflow:hidden;
  border-radius:inherit;
  background:#fff;
}
.orbit-photo{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
  transform:none;
  filter:none;
  pointer-events:none;
  user-select:none;
}
.orbit-card.is-active .orbit-photo{
  transform:none;
  filter:none;
}
.orbit-card:has(.orbit-photo-wrap) .orbit-sheen,
.orbit-card:has(.orbit-photo-wrap) .orbit-edge,
.orbit-card:has(.orbit-photo-wrap) .orbit-dots,
.orbit-card:has(.orbit-photo-wrap) .orbit-reflection,
.orbit-card:has(.orbit-photo-wrap) .orbit-photo-shade,
.orbit-card:has(.orbit-photo-wrap) .orbit-photo-badge,
.orbit-card:has(.orbit-photo-wrap) .orbit-photo-copy{
  display:none !important;
}
`;
const CSS_LARGER_IMAGE_CARDS = `
/* ============================================================
   FEATURE CARDS: EXACT HEIGHT:WIDTH RATIO = 2:3
   200px height x 300px width on standard mobile screens.
   ============================================================ */
.feature-section{
  gap:8px;
}

.feature-section > .reveal{
  width:100%;
  overflow:visible;
}

/* 16px total vertical breathing space around the 200px card. */
.feature-stage{
  height:216px;
  min-height:216px;
  margin:0 -15px;
  overflow:hidden;
  perspective:1100px;
  perspective-origin:50% 50%;
}

.feature-orbit{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  min-height:216px;
  overflow:visible;
  transform-style:preserve-3d;
}

/* Exact height:width ratio of 2:3. */
.orbit-card{
  top:8px;
  width:300px;
  height:200px;
  min-height:200px;
  max-height:200px;
  padding:16px 18px;
  border-radius:24px;
  transform:
    translateX(-50%)
    translateX(calc(var(--offset) * 205px))
    translateY(calc(var(--distance) * 3px))
    translateZ(calc(var(--distance) * -175px))
    rotateY(calc(var(--offset) * -27deg))
    scale(calc(1 - var(--distance) * .105));
}

/* Image cards show only the uploaded artwork. */
.orbit-card:has(.orbit-photo-wrap){
  display:block;
  padding:0;
  overflow:hidden;
  background:#fff;
}

.orbit-photo-wrap{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  overflow:hidden;
  border-radius:inherit;
  background:#fff;
}

/*
 * The card is landscape while the uploaded artwork is portrait.
 * contain preserves the complete artwork without cutting it.
 */
.orbit-photo{
  position:absolute;
  inset:0;
  display:block;
  width:100%;
  height:100%;
  max-width:none;
  object-fit:contain;
  object-position:center;
  transform:none;
  filter:none;
  pointer-events:none;
  user-select:none;
}

.orbit-card.is-active .orbit-photo{
  transform:none;
  filter:none;
}

/* No generated content over image cards. */
.orbit-card:has(.orbit-photo-wrap) .orbit-sheen,
.orbit-card:has(.orbit-photo-wrap) .orbit-edge,
.orbit-card:has(.orbit-photo-wrap) .orbit-dots,
.orbit-card:has(.orbit-photo-wrap) .orbit-reflection,
.orbit-card:has(.orbit-photo-wrap) .orbit-photo-shade,
.orbit-card:has(.orbit-photo-wrap) .orbit-photo-badge,
.orbit-card:has(.orbit-photo-wrap) .orbit-photo-copy{
  display:none !important;
}

/* Balance the existing non-image cards inside the new landscape shape. */
.orbit-card:not(:has(.orbit-photo-wrap)){
  justify-content:center;
  gap:8px;
}

.orbit-card:not(:has(.orbit-photo-wrap)) .orbit-icon{
  width:50px;
  height:50px;
}

.orbit-card:not(:has(.orbit-photo-wrap)) .orbit-icon svg{
  width:23px;
  height:23px;
}

.orbit-card:not(:has(.orbit-photo-wrap)) .orbit-title{
  max-width:250px;
  font-size:14px;
  line-height:1.2;
}

.orbit-card:not(:has(.orbit-photo-wrap)) .orbit-detail{
  max-width:245px;
  font-size:10px;
  line-height:1.35;
}

.feature-pager{
  margin-top:0;
}

/* Narrow phones use 270 x 180, which is also exactly 2:3. */
@media(max-width:370px){
  .feature-stage{
    height:196px;
    min-height:196px;
  }

  .feature-orbit{
    min-height:196px;
  }

  .orbit-card{
    top:8px;
    width:270px;
    height:180px;
    min-height:180px;
    max-height:180px;
    padding:14px 16px;
    transform:
      translateX(-50%)
      translateX(calc(var(--offset) * 184px))
      translateY(calc(var(--distance) * 3px))
      translateZ(calc(var(--distance) * -165px))
      rotateY(calc(var(--offset) * -27deg))
      scale(calc(1 - var(--distance) * .105));
  }
}
`;


const CSS_HOME_LIVE=`
.home-status,.home-empty,.loading-empty{padding:14px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.82);color:#656d83;font-size:10px;line-height:1.5;box-shadow:var(--shadow-sm)}
.home-status{text-align:center}.home-error{width:100%;padding:11px 13px;border:1px solid rgba(251,113,133,.35);border-radius:14px;background:#fff0f4;color:#a93651;font-size:10px;font-weight:650;cursor:pointer}
.loading-empty{display:flex;flex-direction:column;gap:6px;text-align:center}.loading-empty-premium{position:relative;overflow:hidden;align-items:center;padding:24px 20px;background:radial-gradient(180px 90px at 50% 0,rgba(112,72,225,.14),transparent 72%),linear-gradient(145deg,#fff,#f4f0ff);border-color:rgba(112,72,225,.17);box-shadow:0 16px 34px rgba(76,54,135,.13),inset 0 1px 0 #fff}
.loading-empty-icon{position:relative;z-index:2;width:54px;height:54px;display:grid;place-items:center;border-radius:18px;color:#fff!important;background:linear-gradient(145deg,#9169ef,#6136d2);box-shadow:0 13px 27px rgba(105,60,215,.29)}.loading-empty-orbit{position:absolute;top:14px;width:92px;height:92px;border:1px dashed rgba(112,72,225,.25);border-radius:50%;animation:ringSpin 14s linear infinite}.loading-empty-premium b{position:relative;z-index:2;margin-top:5px;font-size:13px;color:#222a3d}.loading-empty-premium>span:last-of-type{position:relative;z-index:2;max-width:310px;color:#737b91;font-size:9.5px}.loading-empty-premium button{position:relative;z-index:2;margin-top:7px;padding:8px 13px;border:1px solid rgba(112,72,225,.22);border-radius:999px;background:rgba(112,72,225,.08);color:#6338d2;font-size:9px;font-weight:700;cursor:pointer}.pulse-source-note{display:block;margin-top:8px;color:#858ca1;font-size:8.5px;line-height:1.4;text-align:center}
`;

const CSS_MARKET_CARD_COLOUR_FIX = `
/* Stable graph shape and badge use the material card colour. */
.movement.stable.green{color:#087f61;border-color:#35c99f;background:#dff9f0}
.movement.stable.orange{color:#b74708;border-color:#ff8a3d;background:#fff0e3}
.movement.stable.blue{color:#245fa8;border-color:#68a8ee;background:#e8f3ff}
.spark.green .spark-line{stroke:#34d399;filter:drop-shadow(0 0 5px rgba(52,211,153,.8))}
.spark.green .spark-fill{fill:#34d399;opacity:.20}
.spark.orange .spark-line{stroke:#fb923c;filter:drop-shadow(0 0 5px rgba(251,146,60,.8))}
.spark.orange .spark-fill{fill:#fb923c;opacity:.20}
.spark.blue .spark-line{stroke:#60a5fa;filter:drop-shadow(0 0 5px rgba(96,165,250,.8))}
.spark.blue .spark-fill{fill:#60a5fa;opacity:.20}
`;

const CSS_NOTIFICATIONS = `
.notification-backdrop{position:absolute;z-index:120;inset:0;display:flex;align-items:flex-end;background:rgba(37,29,67,.38);backdrop-filter:blur(6px);animation:notificationFade .25s ease}
.notification-sheet{position:relative;width:100%;height:min(82%,720px);display:flex;flex-direction:column;overflow:hidden;border-radius:26px 26px 0 0;background:linear-gradient(165deg,#fff,#f6f2ff);box-shadow:0 -25px 65px rgba(57,38,108,.26);animation:notificationRise .36s cubic-bezier(.22,.75,.22,1)}
.notification-handle{position:absolute;top:8px;left:50%;width:42px;height:4px;border-radius:99px;background:#d7d1e5;transform:translateX(-50%)}
.notification-sheet>header{display:flex;align-items:center;justify-content:space-between;padding:23px 16px 12px;border-bottom:1px solid rgba(105,82,176,.11)}
.notification-sheet header small{color:#9297aa;font-size:7px;font-weight:700;letter-spacing:.15em}.notification-sheet header h2{margin:2px 0;font-size:18px;color:#20263a}.notification-sheet header p{margin:0;color:#858ba0;font-size:9px}.notification-sheet header button{width:34px;height:34px;border:1px solid rgba(105,82,176,.14);border-radius:11px;background:#fff;color:#716b80;font-size:21px}
.notification-toolbar{display:flex;align-items:center;justify-content:space-between;padding:9px 16px;background:rgba(240,236,250,.66)}.notification-toolbar span{color:#7048df;font-size:9px;font-weight:700}.notification-toolbar button{padding:5px 9px;border:0;border-radius:99px;background:#ebe5ff;color:#6338d2;font-size:8.5px;font-weight:700}
.notification-sheet>main{flex:1;overflow-y:auto;padding:10px 12px 22px}.notification-item{position:relative;width:100%;display:grid;grid-template-columns:39px minmax(0,1fr) 7px;align-items:start;gap:10px;margin-bottom:8px;padding:11px;border:1px solid rgba(105,82,176,.11);border-radius:15px;color:#252b3e;text-align:left;background:#fff}.notification-item.unread{background:linear-gradient(145deg,#fff,#f2edff);border-color:rgba(112,72,225,.22)}.notification-item>i{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;color:#7048df;background:#eee8ff;font-style:normal}.notification-item.order>i{color:#d87525;background:#fff0e3}.notification-item.sample>i{color:#188f79;background:#e1f8f1}.notification-item.market>i{color:#245fa8;background:#e8f3ff}.notification-item span{min-width:0}.notification-item b,.notification-item em,.notification-item small{display:block}.notification-item b{font-size:10.5px;font-weight:700}.notification-item em{margin-top:3px;color:#6d7488;font-size:9px;line-height:1.4;font-style:normal}.notification-item small{margin-top:5px;color:#999eae;font-size:7.5px}.notification-item u{width:7px;height:7px;margin-top:5px;border-radius:50%;background:#754be4;text-decoration:none}.notification-item.read{opacity:.72}.notification-empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:20px;color:#72798d;text-align:center;font-size:10px}.notification-empty b{color:#283044;font-size:13px}.notification-empty span{max-width:260px}.notification-empty.error{color:#b23e58}
@keyframes notificationRise{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes notificationFade{from{opacity:0}to{opacity:1}}
`;
const CSS =
  CSS_CORE +
  CSS_SECTIONS +
  CSS_MOTION +
  CSS_LIGHT +
  CSS_REFINEMENTS +
  CSS_FINAL_FIXES +
  CSS_READABILITY +
  CSS_PERFORMANCE_RESET +
  CSS_TYPOGRAPHY_BALANCE +
  CSS_DRAWER +
  CSS_QUICK_ACTIONS_ALWAYS_ACTIVE +
  CSS_FEATURE_IMAGES +
  CSS_IMAGE_ONLY_CARDS +
  CSS_LARGER_IMAGE_CARDS +
  CSS_HOME_LIVE +
  CSS_MARKET_CARD_COLOUR_FIX +
  CSS_NOTIFICATIONS;
