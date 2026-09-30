// page1updated.js - Responsive Fixed - Backend Not Changed
import React, { useEffect, useMemo, useState } from "react";

export default function FullScreen3DFeatureCarouselLandingPage({
  goToPage2,
  goToPage3,
}) {
  const viewport = useViewport();
  const styles = useMemo(() => createStyles(viewport), [viewport.width, viewport.height]);

  const slides = useMemo(
    () => [
      {
        title: "Total Quantity",
        subtitle: "Auto-calculated tonnage from selected materials and trucks.",
        icon: "🚛",
        main: "42t",
        chip: "20mm + 40mm",
        color: "#f59e0b",
      },
      {
        title: "Best Rate Check",
        subtitle: "Compare seller prices before buyer confirms the order.",
        icon: "₹",
        main: "Best",
        chip: "Seller Rate",
        color: "#22c55e",
      },
      {
        title: "Multi Material",
        subtitle: "Add separate trucks for every stone material type.",
        icon: "🪨",
        main: "5+",
        chip: "Materials",
        color: "#a855f7",
      },
      {
        title: "Fast Order Flow",
        subtitle: "Request, compare, confirm, dispatch, and track easily.",
        icon: "📍",
        main: "24h",
        chip: "Follow-up",
        color: "#38bdf8",
      },
    ],
    []
  );

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [slides.length]);

  const getSlide = (offset) => {
    return slides[(activeSlide + offset + slides.length) % slides.length];
  };

  const centerSlide = getSlide(0);
  const leftSlide = getSlide(-1);
  const rightSlide = getSlide(1);

  return (
    <div style={styles.page}>
      <div style={styles.phone}>
        <section style={styles.hero}>
          <div style={styles.bgOrbOne} />
          <div style={styles.bgOrbTwo} />
          <div style={styles.bgOrbThree} />
          <div style={styles.gridOverlay} />

          <nav style={styles.nav}>
            <div style={styles.brandWrap}>
              <div style={styles.logo3d}>🪨</div>
              <div>
                <p style={styles.brandName}>StoneRate</p>
                <p style={styles.brandSub}>Crushed Stone Marketplace</p>
              </div>
            </div>
            <button style={styles.skipBtn}>Skip</button>
          </nav>

          <div style={styles.heroText}>
            <div style={styles.heroBadge}>SMART STONE BOOKING</div>
            <h1 style={styles.mainTitle}>
              Book Stone.
              <br />
              Get Best Rate.
            </h1>
            <p style={styles.mainSub}>
              Select material, choose trucks, and request seller rates in minutes.
            </p>
          </div>

          <div style={styles.carouselStage}>
            <div style={styles.orbitLarge} />
            <div style={styles.orbitSmall} />
            <div style={{ ...styles.sideCard, ...styles.leftCard }}>
              <MiniFeatureCard slide={leftSlide} styles={styles} />
            </div>
            <div style={{ ...styles.sideCard, ...styles.rightCard }}>
              <MiniFeatureCard slide={rightSlide} styles={styles} />
            </div>
            <div
              style={{
                ...styles.mainCard3d,
                boxShadow: `0 ${styles.dynamic.shadowY}px ${styles.dynamic.shadowBlur}px ${centerSlide.color}40`,
                borderColor: `${centerSlide.color}aa`,
              }}
            >
              <div style={styles.mockTopBar} />
              <div style={styles.mainMetricCard}>
                <div style={{ minWidth: 0 }}>
                  <p style={styles.mockLabel}>{centerSlide.title}</p>
                  <p style={styles.mockValue}>{centerSlide.main}</p>
                </div>
                <div style={{ ...styles.mockIcon, background: centerSlide.color }}>
                  {centerSlide.icon}
                </div>
              </div>
              <div style={styles.featureTextCard}>
                <span style={{ ...styles.mockDot, background: centerSlide.color }} />
                <div style={{ minWidth: 0 }}>
                  <p style={styles.mockTextStrong}>{centerSlide.chip}</p>
                  <p style={styles.mockTextLight}>{centerSlide.subtitle}</p>
                </div>
              </div>
              <div style={styles.previewCardDark}>
                <span style={styles.mockDotAmber} />
                <div style={{ minWidth: 0 }}>
                  <p style={styles.mockTextStrongWhite}>Live 3D Preview</p>
                  <p style={styles.mockTextLightWhite}>Features slide automatically</p>
                </div>
              </div>
            </div>
            <div style={{ ...styles.floatChipTop, color: centerSlide.color }}>
              {centerSlide.chip}
            </div>
            <div style={styles.floatChipLeft}>Buyer App</div>
            <div style={{ ...styles.floatIcon, background: centerSlide.color }}>
              {centerSlide.icon}
            </div>
          </div>

          <div style={styles.slideTitleBlock}>
            <h2 style={styles.slideTitle}>{centerSlide.title}</h2>
            <p style={styles.slideSub}>{centerSlide.subtitle}</p>
          </div>

          <div style={styles.dotsRow}>
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                onClick={() => setActiveSlide(index)}
                style={{
                  ...styles.dot,
                  ...(index === activeSlide
                    ? { ...styles.activeDot, background: slide.color }
                    : {}),
                }}
              />
            ))}
          </div>

          <div style={styles.authCard}>
            <button style={styles.signInBtn} onClick={goToPage3}>
              Sign In
            </button>
            <button style={styles.signUpBtn} onClick={goToPage2}>
              Create Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniFeatureCard({ slide, styles }) {
  return (
    <div style={styles.miniInner}>
      <div style={{ ...styles.miniIcon, background: slide.color }}>{slide.icon}</div>
      <p style={styles.miniMain}>{slide.main}</p>
      <p style={styles.miniChip}>{slide.chip}</p>
    </div>
  );
}

function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 390,
    height: typeof window !== "undefined" ? window.innerHeight : 844,
  });
  useEffect(() => {
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return viewport;
}

function createStyles(viewport) {
  const vw = viewport.width || 390;
  const vh = viewport.height || 844;
  const isDesktop = vw >= 768;
  const mobileW = isDesktop ? 390 : vw;
  const mobileH = vh;
  const scale = Math.max(0.58, Math.min(1, Math.min(mobileW / 390, mobileH / 844)));
  const tightHeight = mobileH < 700;
  const veryTightHeight = mobileH < 560;
  const tinyWidth = mobileW < 340;
  const px = (value) => Math.round(value * scale);
  const cardW = veryTightHeight ? px(178) : px(220);
  const cardH = veryTightHeight ? px(210) : px(260);
  const sideW = veryTightHeight ? px(88) : px(118);
  const sideH = veryTightHeight ? px(112) : px(150);

  return {
    dynamic: { shadowY: px(34), shadowBlur: px(70) },
    page: {
      width: "100%",
      minHeight: "100dvh",
      background: "#020617",
      display: "flex",
      justifyContent: "center",
      alignItems: isDesktop ? "center" : "flex-start",
      fontFamily: "Arial, sans-serif",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: isDesktop ? "24px" : 0,
    },
    phone: {
      width: "100%",
      maxWidth: isDesktop ? 430 : "100%",
      minHeight: isDesktop ? "calc(100dvh - 48px)" : "100dvh",
      height: "auto",
      background: "#020617",
      borderRadius: isDesktop ? 32 : 0,
      overflow: "visible",
      boxShadow: isDesktop ? "0 25px 50px rgba(0,0,0,0.5)" : "none",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    },
    hero: {
      position: "relative",
      width: "100%",
      minHeight: isDesktop ? "calc(100dvh - 48px)" : "100dvh",
      height: "auto",
      padding: `${px(tightHeight ? 14 : 22)}px ${px(tinyWidth ? 14 : 20)}px ${px(tightHeight ? 14 : 24)}px`,
      color: "white",
      background: "radial-gradient(circle at 20% 8%, rgba(245,158,11,0.38), transparent 28%), linear-gradient(145deg, #020617 0%, #1c1917 52%, #92400e 100%)",
      overflow: "visible",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      borderRadius: isDesktop ? 32 : 0,
    },
    bgOrbOne: { position: "absolute", top: px(-75), right: px(-80), width: px(230), height: px(230), borderRadius: "50%", background: "rgba(251,191,36,0.25)", filter: `blur(${px(38)}px)` },
    bgOrbTwo: { position: "absolute", bottom: px(170), left: px(-95), width: px(210), height: px(210), borderRadius: "50%", background: "rgba(255,255,255,0.11)", filter: `blur(${px(46)}px)` },
    bgOrbThree: { position: "absolute", bottom: px(-70), right: px(-50), width: px(180), height: px(180), borderRadius: "50%", background: "rgba(34,197,94,0.16)", filter: `blur(${px(42)}px)` },
    gridOverlay: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: `${px(34)}px ${px(34)}px`, maskImage: "linear-gradient(to bottom, black, transparent 82%)", borderRadius: isDesktop ? 32 : 0 },
    nav: { position: "relative", zIndex: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 },
    brandWrap: { display: "flex", alignItems: "center", gap: px(12), minWidth: 0 },
    logo3d: { width: px(tightHeight ? 42 : 50), height: px(tightHeight ? 42 : 50), borderRadius: px(18), background: "linear-gradient(145deg, rgba(255,255,255,0.24), rgba(255,255,255,0.08))", display: "grid", placeItems: "center", fontSize: px(tightHeight ? 20 : 24), boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 14px 26px rgba(0,0,0,0.25)", flexShrink: 0 },
    brandName: { margin: 0, fontSize: px(tightHeight ? 15 : 18), fontWeight: 950, lineHeight: 1 },
    brandSub: { margin: `${px(3)}px 0 0`, color: "#d6d3d1", fontSize: px(tightHeight ? 8 : 10), fontWeight: 700, whiteSpace: "nowrap" },
    skipBtn: { border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "white", padding: `${px(8)}px ${px(13)}px`, fontSize: px(12), fontWeight: 900, cursor: "pointer", flexShrink: 0 },
    heroText: { position: "relative", zIndex: 3, textAlign: "center", marginTop: px(veryTightHeight ? 14 : tightHeight ? 18 : 24), flexShrink: 0 },
    heroBadge: { display: "inline-block", padding: `${px(6)}px ${px(11)}px`, borderRadius: 999, background: "rgba(245,158,11,0.16)", border: "1px solid rgba(245,158,11,0.35)", color: "#fde68a", fontSize: px(veryTightHeight ? 8 : 10), letterSpacing: veryTightHeight ? 1.1 : 1.8, fontWeight: 950 },
    mainTitle: { margin: `${px(veryTightHeight ? 10 : 14)}px 0 0`, fontSize: px(veryTightHeight ? 27 : tightHeight ? 32 : 38), lineHeight: 1.02, fontWeight: 950, letterSpacing: -1.1 },
    mainSub: { margin: `${px(veryTightHeight ? 8 : 10)}px auto 0`, maxWidth: px(330), color: "#e7e5e4", fontSize: px(veryTightHeight ? 10 : 13), lineHeight: veryTightHeight ? 1.3 : 1.5, fontWeight: 600 },
    carouselStage: {
      position: "relative",
      zIndex: 3,
      flex: "1 1 auto",
      minHeight: veryTightHeight ? px(210) : tightHeight ? px(260) : px(320),
      maxHeight: px(360),
      marginTop: px(veryTightHeight ? 10 : 16),
      marginBottom: px(8),
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      perspective: 1200,
      flexShrink: 0,
    },
    orbitLarge: { position: "absolute", width: px(340), height: px(210), borderRadius: "50%", border: "1px solid rgba(255,255,255,0.16)", transform: "rotateX(66deg) rotateZ(-12deg)" },
    orbitSmall: { position: "absolute", width: px(250), height: px(250), borderRadius: "50%", border: "1px solid rgba(245,158,11,0.33)", transform: "rotateX(64deg) rotateZ(12deg)" },
    mainCard3d: { position: "relative", zIndex: 4, width: cardW, height: cardH, borderRadius: px(36), background: "linear-gradient(145deg, rgba(255,255,255,0.30), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.28)", backdropFilter: "blur(14px)", transform: "rotateX(8deg) rotateY(-12deg) rotateZ(1deg)", padding: px(veryTightHeight ? 12 : 18), transition: "all 450ms ease", boxSizing: "border-box", overflow: "hidden" },
    sideCard: { position: "absolute", zIndex: 2, width: sideW, height: sideH, borderRadius: px(28), background: "linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(10px)", boxShadow: "0 18px 34px rgba(0,0,0,0.24)", overflow: "hidden" },
    leftCard: { left: tinyWidth ? px(-8) : px(4), transform: "rotateY(28deg) rotateZ(-8deg) scale(0.92)", opacity: 0.75 },
    rightCard: { right: tinyWidth ? px(-8) : px(4), transform: "rotateY(-28deg) rotateZ(8deg) scale(0.92)", opacity: 0.75 },
    miniInner: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: px(12), textAlign: "center", boxSizing: "border-box" },
    miniIcon: { width: px(42), height: px(42), borderRadius: px(16), display: "grid", placeItems: "center", fontSize: px(22), boxShadow: "0 12px 22px rgba(0,0,0,0.24)" },
    miniMain: { margin: `${px(13)}px 0 0`, fontSize: px(22), fontWeight: 950 },
    miniChip: { margin: `${px(4)}px 0 0`, color: "#d6d3d1", fontSize: px(10), fontWeight: 700 },
    mockTopBar: { width: px(70), height: px(7), borderRadius: 999, background: "rgba(255,255,255,0.58)", marginBottom: px(veryTightHeight ? 10 : 16) },
    mainMetricCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: px(veryTightHeight ? 10 : 14), borderRadius: px(22), background: "rgba(0,0,0,0.22)", gap: px(8) },
    mockLabel: { margin: 0, color: "#d6d3d1", fontSize: px(veryTightHeight ? 9 : 11), fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    mockValue: { margin: `${px(5)}px 0 0`, color: "white", fontSize: px(veryTightHeight ? 24 : 30), fontWeight: 950, lineHeight: 1 },
    mockIcon: { width: px(veryTightHeight ? 38 : 46), height: px(veryTightHeight ? 38 : 46), display: "grid", placeItems: "center", borderRadius: px(17), fontSize: px(veryTightHeight ? 20 : 24), transition: "all 450ms ease", flexShrink: 0 },
    featureTextCard: { marginTop: px(veryTightHeight ? 8 : 12), display: "flex", alignItems: "center", gap: px(10), padding: px(veryTightHeight ? 9 : 12), borderRadius: px(18), background: "rgba(255,255,255,0.20)", minHeight: 0 },
    previewCardDark: { marginTop: px(veryTightHeight ? 7 : 10), display: "flex", alignItems: "center", gap: px(10), padding: px(veryTightHeight ? 9 : 12), borderRadius: px(18), background: "rgba(0,0,0,0.22)", minHeight: 0 },
    mockDot: { width: px(12), height: px(12), borderRadius: "50%", flexShrink: 0 },
    mockDotAmber: { width: px(12), height: px(12), borderRadius: "50%", background: "#f59e0b", flexShrink: 0 },
    mockTextStrong: { margin: 0, color: "white", fontSize: px(veryTightHeight ? 10 : 12), fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    mockTextLight: { margin: `${px(3)}px 0 0`, color: "#e7e5e4", fontSize: px(veryTightHeight ? 8 : 10), lineHeight: 1.25, fontWeight: 700, display: "-webkit-box", WebkitLineClamp: veryTightHeight ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
    mockTextStrongWhite: { margin: 0, color: "white", fontSize: px(veryTightHeight ? 10 : 12), fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    mockTextLightWhite: { margin: `${px(3)}px 0 0`, color: "#d6d3d1", fontSize: px(veryTightHeight ? 8 : 10), fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    floatChipTop: { position: "absolute", top: px(veryTightHeight ? 12 : 24), right: px(veryTightHeight ? 10 : 26), zIndex: 5, padding: `${px(8)}px ${px(11)}px`, borderRadius: px(18), background: "rgba(255,255,255,0.93)", fontSize: px(veryTightHeight ? 9 : 12), fontWeight: 950, boxShadow: "0 16px 30px rgba(0,0,0,0.25)", transition: "all 450ms ease", maxWidth: px(120), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    floatChipLeft: { position: "absolute", bottom: px(veryTightHeight ? 28 : 48), left: px(veryTightHeight ? 10 : 26), zIndex: 5, padding: `${px(8)}px ${px(11)}px`, borderRadius: px(18), background: "rgba(255,255,255,0.92)", color: "#92400e", fontSize: px(veryTightHeight ? 9 : 12), fontWeight: 950, boxShadow: "0 16px 30px rgba(0,0,0,0.24)" },
    floatIcon: { position: "absolute", bottom: px(veryTightHeight ? 58 : 84), right: px(veryTightHeight ? 14 : 30), zIndex: 5, width: px(veryTightHeight ? 42 : 54), height: px(veryTightHeight ? 42 : 54), borderRadius: px(20), display: "grid", placeItems: "center", fontSize: px(veryTightHeight ? 22 : 28), boxShadow: "0 18px 32px rgba(0,0,0,0.28)", transition: "all 450ms ease" },
    slideTitleBlock: { position: "relative", zIndex: 4, textAlign: "center", marginTop: px(4), minHeight: veryTightHeight ? px(42) : px(60), flexShrink: 0 },
    slideTitle: { margin: 0, color: "white", fontSize: px(veryTightHeight ? 17 : 22), fontWeight: 950, lineHeight: 1.05 },
    slideSub: { margin: `${px(veryTightHeight ? 5 : 6)}px auto 0`, maxWidth: px(310), color: "#d6d3d1", fontSize: px(veryTightHeight ? 9 : 12), lineHeight: veryTightHeight ? 1.25 : 1.4, fontWeight: 650, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
    dotsRow: { position: "relative", zIndex: 4, display: "flex", justifyContent: "center", gap: px(8), marginTop: px(8), marginBottom: px(12), flexShrink: 0 },
    dot: { width: px(8), height: px(8), borderRadius: 999, border: 0, background: "rgba(255,255,255,0.32)", cursor: "pointer", transition: "all 250ms ease", padding: 0 },
    activeDot: { width: px(30) },
    authCard: { position: "relative", zIndex: 4, padding: px(veryTightHeight ? 10 : 14), borderRadius: px(28), background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", flexShrink: 0, marginTop: "auto" },
    signInBtn: { width: "100%", height: px(veryTightHeight ? 44 : 52), border: 0, borderRadius: px(21), background: "#f59e0b", color: "#111827", fontSize: px(veryTightHeight ? 14 : 16), fontWeight: 950, cursor: "pointer", boxShadow: "0 16px 30px rgba(245,158,11,0.30)" },
    signUpBtn: { width: "100%", height: px(veryTightHeight ? 42 : 50), marginTop: px(veryTightHeight ? 7 : 10), borderRadius: px(21), border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "white", fontSize: px(veryTightHeight ? 13 : 15), fontWeight: 900, cursor: "pointer" },
  };
}