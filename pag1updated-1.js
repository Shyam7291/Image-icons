// pag1updated.js - Fully Responsive (Mobile, Tablet, Desktop) - Backend & API Unchanged
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";

export default function FullScreen3DFeatureCarouselLandingPage({
  goToPage2,
  goToPage3,
}) {
  const viewport = useViewport();
  const styles = useMemo(() => createStyles(viewport), [viewport.width, viewport.height, viewport.isTouch]);

  const slides = useMemo(
    () => [
      {
        id: "qty",
        title: "Total Quantity",
        subtitle: "Auto-calculated tonnage from selected materials and trucks.",
        icon: "🚛",
        main: "42t",
        chip: "20mm + 40mm",
        color: "#f59e0b",
      },
      {
        id: "rate",
        title: "Best Rate Check",
        subtitle: "Compare seller prices before buyer confirms the order.",
        icon: "₹",
        main: "Best",
        chip: "Seller Rate",
        color: "#22c55e",
      },
      {
        id: "material",
        title: "Multi Material",
        subtitle: "Add separate trucks for every stone material type.",
        icon: "🪨",
        main: "5+",
        chip: "Materials",
        color: "#a855f7",
      },
      {
        id: "flow",
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
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(null);

  // Auto-play feature with pause on user interaction
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const getSlide = useCallback(
    (offset) => {
      return slides[(activeSlide + offset + slides.length) % slides.length];
    },
    [activeSlide, slides]
  );

  const centerSlide = getSlide(0);
  const leftSlide = getSlide(-1);
  const rightSlide = getSlide(1);

  // Swipe support for mobile & tablet
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe right -> previous slide
        setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
      } else {
        // swipe left -> next slide
        setActiveSlide((current) => (current + 1) % slides.length);
      }
    }
    touchStartXRef.current = null;
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <div style={styles.page}>
      <div style={styles.phone}>
        <section
          style={styles.hero}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Ambient Glowing Orbs */}
          <div style={styles.bgOrbOne} />
          <div style={styles.bgOrbTwo} />
          <div style={styles.bgOrbThree} />
          <div style={styles.gridOverlay} />

          {/* Navigation Bar */}
          <nav style={styles.nav}>
            <div style={styles.brandWrap}>
              <div style={styles.logo3d}>🪨</div>
              <div>
                <p style={styles.brandName}>StoneRate</p>
                <p style={styles.brandSub}>Crushed Stone Marketplace</p>
              </div>
            </div>
            <button
              style={styles.skipBtn}
              onClick={goToPage3 || goToPage2}
              aria-label="Skip to main application"
            >
              Skip
            </button>
          </nav>

          {/* Hero Typography */}
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

          {/* 3D Carousel Stage */}
          <div
            style={styles.carouselStage}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Background Orbits */}
            <div style={styles.orbitLarge} />
            <div style={styles.orbitSmall} />

            {/* Left Preview Card */}
            <button
              type="button"
              onClick={() => setActiveSlide((c) => (c - 1 + slides.length) % slides.length)}
              style={{ ...styles.sideCard, ...styles.leftCard }}
              aria-label={`Previous feature: ${leftSlide.title}`}
            >
              <MiniFeatureCard slide={leftSlide} styles={styles} />
            </button>

            {/* Right Preview Card */}
            <button
              type="button"
              onClick={() => setActiveSlide((c) => (c + 1) % slides.length)}
              style={{ ...styles.sideCard, ...styles.rightCard }}
              aria-label={`Next feature: ${rightSlide.title}`}
            >
              <MiniFeatureCard slide={rightSlide} styles={styles} />
            </button>

            {/* Main Interactive 3D Card */}
            <div
              style={{
                ...styles.mainCard3d,
                boxShadow: `0 ${styles.dynamic.shadowY}px ${styles.dynamic.shadowBlur}px ${centerSlide.color}38`,
                borderColor: `${centerSlide.color}99`,
              }}
            >
              <div style={styles.mockTopBar} />

              <div style={styles.mainMetricCard}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={styles.mockLabel}>{centerSlide.title}</p>
                  <p style={styles.mockValue}>{centerSlide.main}</p>
                </div>
                <div style={{ ...styles.mockIcon, background: centerSlide.color }}>
                  {centerSlide.icon}
                </div>
              </div>

              <div style={styles.featureTextCard}>
                <span style={{ ...styles.mockDot, background: centerSlide.color }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={styles.mockTextStrong}>{centerSlide.chip}</p>
                  <p style={styles.mockTextLight}>{centerSlide.subtitle}</p>
                </div>
              </div>

              <div style={styles.previewCardDark}>
                <span style={styles.mockDotAmber} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={styles.mockTextStrongWhite}>Live 3D Preview</p>
                  <p style={styles.mockTextLightWhite}>Features slide automatically</p>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div
              style={{
                ...styles.floatChipTop,
                color: centerSlide.color,
                borderColor: `${centerSlide.color}44`,
              }}
            >
              {centerSlide.chip}
            </div>
            <div style={styles.floatChipLeft}>Buyer App</div>
            <div style={{ ...styles.floatIcon, background: centerSlide.color }}>
              {centerSlide.icon}
            </div>
          </div>

          {/* Slide Description Block */}
          <div style={styles.slideTitleBlock}>
            <h2 style={styles.slideTitle}>{centerSlide.title}</h2>
            <p style={styles.slideSub}>{centerSlide.subtitle}</p>
          </div>

          {/* Pagination Indicators */}
          <div style={styles.dotsRow} role="tablist" aria-label="Feature slides">
            {slides.map((slide, index) => {
              const isActive = index === activeSlide;
              return (
                <button
                  key={slide.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Slide ${index + 1}: ${slide.title}`}
                  onClick={() => setActiveSlide(index)}
                  style={{
                    ...styles.dotWrapper,
                  }}
                >
                  <span
                    style={{
                      ...styles.dot,
                      ...(isActive
                        ? { ...styles.activeDot, background: slide.color }
                        : {}),
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
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
    isTouch: typeof window !== "undefined" ? ("ontouchstart" in window || navigator.maxTouchPoints > 0) : false,
  });

  useEffect(() => {
    let timeoutId = null;
    const update = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      });
    };

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(update, 60);
    };

    update();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return viewport;
}

function createStyles(viewport) {
  const vw = viewport.width || 390;
  const vh = viewport.height || 844;

  // Responsive device classification
  const isSmallMobile = vw < 360;
  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;
  const isDesktop = vw >= 1024;

  // Height constraints (for short screens like iPhone SE, landscape, or browser URL bars)
  const isShortScreen = vh < 720;
  const isVeryShortScreen = vh < 600;

  // Proportional scaling factor with safe bounds (never unreadably small)
  const targetW = isDesktop ? 420 : isTablet ? Math.min(480, vw - 64) : vw;
  const widthRatio = targetW / 390;
  const heightRatio = vh / 844;
  
  // Safe scaling between 0.82 and 1.15 so text remains crystal clear
  const scale = isDesktop
    ? 1
    : isTablet
    ? Math.min(1.1, Math.max(0.95, widthRatio * 0.9))
    : Math.min(1.05, Math.max(0.82, Math.min(widthRatio, heightRatio)));

  const px = (val) => Math.round(val * scale);

  // Card dimensions tailored for each screen size
  const cardW = isVeryShortScreen ? px(180) : isShortScreen ? px(205) : isTablet ? px(240) : px(220);
  const cardH = isVeryShortScreen ? px(215) : isShortScreen ? px(245) : isTablet ? px(280) : px(260);
  const sideW = isVeryShortScreen ? px(80) : isShortScreen ? px(95) : isTablet ? px(125) : px(108);
  const sideH = isVeryShortScreen ? px(105) : isShortScreen ? px(125) : isTablet ? px(155) : px(140);

  // Horizontal spacing for side cards
  const sideCardOffset = isSmallMobile ? px(-14) : isMobile ? px(-4) : px(12);

  return {
    dynamic: {
      shadowY: px(isShortScreen ? 24 : 32),
      shadowBlur: px(isShortScreen ? 48 : 64),
    },

    page: {
      width: "100%",
      minHeight: "100dvh",
      background: "#020617",
      display: "flex",
      justifyContent: "center",
      alignItems: isDesktop || isTablet ? "center" : "stretch",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: isDesktop ? "32px 24px" : isTablet ? "24px 20px" : 0,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },

    phone: {
      width: "100%",
      maxWidth: isDesktop ? 430 : isTablet ? 480 : "100%",
      minHeight: isDesktop || isTablet ? "auto" : "100dvh",
      height: isDesktop || isTablet ? "auto" : "100%",
      background: "#020617",
      borderRadius: isDesktop || isTablet ? 32 : 0,
      overflow: "hidden",
      boxShadow:
        isDesktop || isTablet
          ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)"
          : "none",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    },

    hero: {
      position: "relative",
      width: "100%",
      minHeight: isDesktop || isTablet ? (isVeryShortScreen ? "auto" : 760) : "100dvh",
      height: "auto",
      paddingTop: `max(${px(isVeryShortScreen ? 12 : isShortScreen ? 16 : 22)}px, env(safe-area-inset-top, ${px(16)}px))`,
      paddingBottom: `max(${px(isVeryShortScreen ? 14 : isShortScreen ? 18 : 24)}px, env(safe-area-inset-bottom, ${px(20)}px))`,
      paddingLeft: `max(${px(isSmallMobile ? 14 : 20)}px, env(safe-area-inset-left, 16px))`,
      paddingRight: `max(${px(isSmallMobile ? 14 : 20)}px, env(safe-area-inset-right, 16px))`,
      color: "white",
      background:
        "radial-gradient(circle at 20% 8%, rgba(245,158,11,0.35), transparent 32%), radial-gradient(circle at 80% 90%, rgba(146,64,14,0.3), transparent 40%), linear-gradient(150deg, #020617 0%, #1c1917 55%, #0f172a 100%)",
      overflow: "hidden",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      borderRadius: isDesktop || isTablet ? 32 : 0,
      userSelect: "none",
    },

    bgOrbOne: {
      position: "absolute",
      top: px(-60),
      right: px(-60),
      width: px(220),
      height: px(220),
      borderRadius: "50%",
      background: "rgba(251,191,36,0.22)",
      filter: `blur(${px(42)}px)`,
      pointerEvents: "none",
    },
    bgOrbTwo: {
      position: "absolute",
      bottom: px(160),
      left: px(-80),
      width: px(200),
      height: px(200),
      borderRadius: "50%",
      background: "rgba(255,255,255,0.08)",
      filter: `blur(${px(48)}px)`,
      pointerEvents: "none",
    },
    bgOrbThree: {
      position: "absolute",
      bottom: px(-50),
      right: px(-40),
      width: px(170),
      height: px(170),
      borderRadius: "50%",
      background: "rgba(34,197,94,0.14)",
      filter: `blur(${px(40)}px)`,
      pointerEvents: "none",
    },
    gridOverlay: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      backgroundSize: `${px(28)}px ${px(28)}px`,
      maskImage: "linear-gradient(to bottom, black 20%, transparent 92%)",
      WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 92%)",
      pointerEvents: "none",
    },

    // Navigation
    nav: {
      position: "relative",
      zIndex: 5,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0,
    },
    brandWrap: {
      display: "flex",
      alignItems: "center",
      gap: px(10),
      minWidth: 0,
    },
    logo3d: {
      width: px(isShortScreen ? 38 : 44),
      height: px(isShortScreen ? 38 : 44),
      borderRadius: px(14),
      background: "linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
      border: "1px solid rgba(255,255,255,0.25)",
      display: "grid",
      placeItems: "center",
      fontSize: px(isShortScreen ? 18 : 22),
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 10px 20px rgba(0,0,0,0.25)",
      flexShrink: 0,
    },
    brandName: {
      margin: 0,
      fontSize: Math.max(15, px(isShortScreen ? 15 : 17)),
      fontWeight: 800,
      letterSpacing: -0.3,
      lineHeight: 1.1,
    },
    brandSub: {
      margin: `${px(2)}px 0 0`,
      color: "#d6d3d1",
      fontSize: Math.max(10, px(isShortScreen ? 9 : 10)),
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    skipBtn: {
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: 999,
      background: "rgba(255,255,255,0.08)",
      color: "#f8fafc",
      padding: `${px(6)}px ${px(14)}px`,
      minHeight: 32,
      fontSize: Math.max(12, px(12)),
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      transition: "background 0.2s, transform 0.15s",
      touchAction: "manipulation",
    },

    // Hero Text Header
    heroText: {
      position: "relative",
      zIndex: 5,
      textAlign: "center",
      marginTop: px(isVeryShortScreen ? 10 : isShortScreen ? 14 : 20),
      flexShrink: 0,
    },
    heroBadge: {
      display: "inline-block",
      padding: `${px(4)}px ${px(10)}px`,
      borderRadius: 999,
      background: "rgba(245,158,11,0.15)",
      border: "1px solid rgba(245,158,11,0.38)",
      color: "#fde68a",
      fontSize: Math.max(9, px(isVeryShortScreen ? 8.5 : 9.5)),
      letterSpacing: 1.2,
      fontWeight: 800,
      textTransform: "uppercase",
    },
    mainTitle: {
      margin: `${px(isVeryShortScreen ? 6 : 10)}px 0 0`,
      fontSize: Math.max(24, px(isVeryShortScreen ? 24 : isShortScreen ? 28 : 34)),
      lineHeight: 1.08,
      fontWeight: 900,
      letterSpacing: -0.8,
    },
    mainSub: {
      margin: `${px(isVeryShortScreen ? 4 : 8)}px auto 0`,
      maxWidth: px(310),
      color: "#cbd5e1",
      fontSize: Math.max(11, px(isVeryShortScreen ? 11 : 12.5)),
      lineHeight: 1.35,
      fontWeight: 500,
    },

    // 3D Carousel Stage
    carouselStage: {
      position: "relative",
      zIndex: 4,
      flex: "1 1 auto",
      minHeight: cardH + px(20),
      maxHeight: px(380),
      marginTop: px(isVeryShortScreen ? 8 : isShortScreen ? 12 : 18),
      marginBottom: px(isVeryShortScreen ? 4 : 8),
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      perspective: 1000,
      flexShrink: 0,
      touchAction: "pan-y",
    },

    orbitLarge: {
      position: "absolute",
      width: px(330),
      height: px(200),
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,0.14)",
      transform: "rotateX(66deg) rotateZ(-12deg)",
      pointerEvents: "none",
    },
    orbitSmall: {
      position: "absolute",
      width: px(240),
      height: px(240),
      borderRadius: "50%",
      border: "1px solid rgba(245,158,11,0.28)",
      transform: "rotateX(64deg) rotateZ(12deg)",
      pointerEvents: "none",
    },

    // Interactive 3D Main Card
    mainCard3d: {
      position: "relative",
      zIndex: 4,
      width: cardW,
      height: cardH,
      borderRadius: px(28),
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 100%)",
      border: "1px solid rgba(255,255,255,0.25)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      transform: "rotateX(6deg) rotateY(-10deg) rotateZ(1deg)",
      padding: px(isVeryShortScreen ? 11 : isShortScreen ? 14 : 16),
      transition: "all 450ms cubic-bezier(0.16, 1, 0.3, 1)",
      boxSizing: "border-box",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },

    // Side Preview Cards
    sideCard: {
      position: "absolute",
      zIndex: 2,
      width: sideW,
      height: sideH,
      borderRadius: px(22),
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)",
      border: "1px solid rgba(255,255,255,0.15)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
      overflow: "hidden",
      cursor: "pointer",
      padding: 0,
      color: "inherit",
      transition: "all 350ms ease",
    },
    leftCard: {
      left: sideCardOffset,
      transform: "rotateY(24deg) rotateZ(-6deg) scale(0.92)",
      opacity: 0.72,
    },
    rightCard: {
      right: sideCardOffset,
      transform: "rotateY(-24deg) rotateZ(6deg) scale(0.92)",
      opacity: 0.72,
    },

    miniInner: {
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: px(8),
      textAlign: "center",
      boxSizing: "border-box",
    },
    miniIcon: {
      width: px(isShortScreen ? 34 : 38),
      height: px(isShortScreen ? 34 : 38),
      borderRadius: px(12),
      display: "grid",
      placeItems: "center",
      fontSize: px(isShortScreen ? 17 : 20),
      boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    },
    miniMain: {
      margin: `${px(8)}px 0 0`,
      fontSize: Math.max(15, px(isShortScreen ? 16 : 18)),
      fontWeight: 900,
      color: "#ffffff",
    },
    miniChip: {
      margin: `${px(2)}px 0 0`,
      color: "#d6d3d1",
      fontSize: Math.max(9, px(9)),
      fontWeight: 700,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
    },

    mockTopBar: {
      width: px(56),
      height: px(5),
      borderRadius: 999,
      background: "rgba(255,255,255,0.45)",
      marginBottom: px(isVeryShortScreen ? 6 : 10),
      flexShrink: 0,
    },
    mainMetricCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: `${px(isVeryShortScreen ? 6 : 9)}px ${px(isVeryShortScreen ? 8 : 11)}px`,
      borderRadius: px(16),
      background: "rgba(0,0,0,0.25)",
      gap: px(8),
      border: "1px solid rgba(255,255,255,0.06)",
    },
    mockLabel: {
      margin: 0,
      color: "#cbd5e1",
      fontSize: Math.max(9.5, px(isVeryShortScreen ? 9 : 10.5)),
      fontWeight: 700,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    mockValue: {
      margin: `${px(2)}px 0 0`,
      color: "white",
      fontSize: Math.max(20, px(isVeryShortScreen ? 20 : isShortScreen ? 23 : 26)),
      fontWeight: 900,
      lineHeight: 1,
    },
    mockIcon: {
      width: px(isVeryShortScreen ? 34 : isShortScreen ? 38 : 42),
      height: px(isVeryShortScreen ? 34 : isShortScreen ? 38 : 42),
      display: "grid",
      placeItems: "center",
      borderRadius: px(14),
      fontSize: px(isVeryShortScreen ? 18 : isShortScreen ? 20 : 22),
      transition: "background 450ms ease",
      flexShrink: 0,
      boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
    },

    featureTextCard: {
      marginTop: px(isVeryShortScreen ? 5 : 8),
      display: "flex",
      alignItems: "center",
      gap: px(8),
      padding: `${px(isVeryShortScreen ? 6 : 8)}px ${px(isVeryShortScreen ? 8 : 10)}px`,
      borderRadius: px(14),
      background: "rgba(255,255,255,0.16)",
      border: "1px solid rgba(255,255,255,0.08)",
      minHeight: 0,
    },
    previewCardDark: {
      marginTop: px(isVeryShortScreen ? 5 : 7),
      display: "flex",
      alignItems: "center",
      gap: px(8),
      padding: `${px(isVeryShortScreen ? 6 : 8)}px ${px(isVeryShortScreen ? 8 : 10)}px`,
      borderRadius: px(14),
      background: "rgba(0,0,0,0.28)",
      border: "1px solid rgba(255,255,255,0.04)",
      minHeight: 0,
    },
    mockDot: {
      width: px(9),
      height: px(9),
      borderRadius: "50%",
      flexShrink: 0,
    },
    mockDotAmber: {
      width: px(9),
      height: px(9),
      borderRadius: "50%",
      background: "#f59e0b",
      flexShrink: 0,
    },
    mockTextStrong: {
      margin: 0,
      color: "white",
      fontSize: Math.max(10, px(isVeryShortScreen ? 9.5 : 11)),
      fontWeight: 800,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    mockTextLight: {
      margin: `${px(2)}px 0 0`,
      color: "#e2e8f0",
      fontSize: Math.max(9, px(isVeryShortScreen ? 8.5 : 9.5)),
      lineHeight: 1.25,
      fontWeight: 600,
      display: "-webkit-box",
      WebkitLineClamp: isVeryShortScreen ? 1 : 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    },
    mockTextStrongWhite: {
      margin: 0,
      color: "white",
      fontSize: Math.max(10, px(isVeryShortScreen ? 9.5 : 11)),
      fontWeight: 800,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    mockTextLightWhite: {
      margin: `${px(2)}px 0 0`,
      color: "#cbd5e1",
      fontSize: Math.max(9, px(isVeryShortScreen ? 8.5 : 9.5)),
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    // Floating Decorative Badges
    floatChipTop: {
      position: "absolute",
      top: px(isVeryShortScreen ? 6 : isShortScreen ? 12 : 18),
      right: px(isSmallMobile ? 4 : isShortScreen ? 10 : 16),
      zIndex: 5,
      padding: `${px(5)}px ${px(10)}px`,
      borderRadius: 999,
      background: "rgba(255,255,255,0.95)",
      fontSize: Math.max(10, px(11)),
      fontWeight: 800,
      boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
      transition: "all 450ms ease",
      maxWidth: px(130),
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      border: "1px solid rgba(255,255,255,0.3)",
      backdropFilter: "blur(6px)",
    },
    floatChipLeft: {
      position: "absolute",
      bottom: px(isVeryShortScreen ? 16 : isShortScreen ? 28 : 36),
      left: px(isSmallMobile ? 4 : isShortScreen ? 10 : 16),
      zIndex: 5,
      padding: `${px(5)}px ${px(10)}px`,
      borderRadius: 999,
      background: "rgba(255,255,255,0.95)",
      color: "#92400e",
      fontSize: Math.max(10, px(11)),
      fontWeight: 800,
      boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
      border: "1px solid rgba(255,255,255,0.3)",
      backdropFilter: "blur(6px)",
    },
    floatIcon: {
      position: "absolute",
      bottom: px(isVeryShortScreen ? 42 : isShortScreen ? 60 : 72),
      right: px(isSmallMobile ? 8 : isShortScreen ? 14 : 22),
      zIndex: 5,
      width: px(isVeryShortScreen ? 36 : isShortScreen ? 42 : 48),
      height: px(isVeryShortScreen ? 36 : isShortScreen ? 42 : 48),
      borderRadius: px(15),
      display: "grid",
      placeItems: "center",
      fontSize: px(isVeryShortScreen ? 19 : isShortScreen ? 22 : 25),
      boxShadow: "0 12px 26px rgba(0,0,0,0.28)",
      transition: "background 450ms ease",
    },

    // Slide Description Block
    slideTitleBlock: {
      position: "relative",
      zIndex: 5,
      textAlign: "center",
      marginTop: px(2),
      minHeight: px(isVeryShortScreen ? 38 : isShortScreen ? 46 : 54),
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    slideTitle: {
      margin: 0,
      color: "white",
      fontSize: Math.max(16, px(isVeryShortScreen ? 16 : isShortScreen ? 18 : 21)),
      fontWeight: 800,
      lineHeight: 1.15,
    },
    slideSub: {
      margin: `${px(4)}px auto 0`,
      maxWidth: px(310),
      color: "#cbd5e1",
      fontSize: Math.max(11, px(isVeryShortScreen ? 10.5 : 12)),
      lineHeight: 1.35,
      fontWeight: 500,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    },

    // Touch-friendly Dots Row
    dotsRow: {
      position: "relative",
      zIndex: 5,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: px(6),
      marginTop: px(6),
      marginBottom: px(isVeryShortScreen ? 6 : 10),
      flexShrink: 0,
    },
    dotWrapper: {
      padding: "8px 4px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      touchAction: "manipulation",
    },
    dot: {
      display: "block",
      width: px(8),
      height: px(8),
      borderRadius: 999,
      background: "rgba(255,255,255,0.28)",
      transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
    },
    activeDot: {
      width: px(26),
      borderRadius: 999,
    },

    // Bottom Action Area
    authCard: {
      position: "relative",
      zIndex: 5,
      padding: px(isVeryShortScreen ? 8 : 12),
      borderRadius: px(22),
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      flexShrink: 0,
      marginTop: "auto",
      display: "flex",
      flexDirection: "column",
      gap: px(isVeryShortScreen ? 6 : 8),
    },
    signInBtn: {
      width: "100%",
      height: px(isVeryShortScreen ? 42 : isShortScreen ? 46 : 50),
      minHeight: 44,
      border: 0,
      borderRadius: px(16),
      background: "#f59e0b",
      color: "#0f172a",
      fontSize: Math.max(14, px(15)),
      fontWeight: 800,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(245,158,11,0.28)",
      transition: "transform 0.15s, opacity 0.15s",
      touchAction: "manipulation",
    },
    signUpBtn: {
      width: "100%",
      height: px(isVeryShortScreen ? 40 : isShortScreen ? 44 : 48),
      minHeight: 42,
      borderRadius: px(16),
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.10)",
      color: "#f8fafc",
      fontSize: Math.max(13, px(14)),
      fontWeight: 700,
      cursor: "pointer",
      transition: "background 0.2s, transform 0.15s",
      touchAction: "manipulation",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    },
  };
}
