import { useState, useEffect, useRef, useMemo, useCallback } from "react";

import { STORAGE_KEY, TICK_MS, OFFLINE_CAP_SEC, ECONOMIC_EVENTS, RIVAL_FIRMS, HIRE_BASE_COSTS, $, fmt } from "./constants.js";
import { createInitialState, computeProduction, tickGame } from "./engine.js";
import { hire, startContract, attackMarket, defendMarket, buyUpgrade, prestigeReset, newGame } from "./actions.js";
import { PixelFigure, PixelRival, ROLE_COLORS } from "./components/PixelCharacters.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

// ============================================================
// WEB AUDIO SOUND EFFECTS HOOK
// ============================================================
function useSounds(muted) {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctxRef.current = new AC();
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq, type, duration, volume = 0.4, startTime = 0) => {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
    return osc;
  }, [muted, getCtx]);

  const sounds = useMemo(() => ({
    win: () => {
      // Ascending 3-note chime: C5, E5, G5 — 80ms each
      playTone(523.25, "sine", 0.08, 0.4, 0);
      playTone(659.25, "sine", 0.08, 0.4, 0.08);
      playTone(783.99, "sine", 0.08, 0.4, 0.16);
    },
    lose: () => {
      // Descending 2-note tone: A3, F3 — 120ms each
      playTone(220, "sawtooth", 0.12, 0.3, 0);
      playTone(174.61, "sawtooth", 0.12, 0.3, 0.12);
    },
    attack: () => {
      // Short sharp click: noise burst 30ms
      playTone(220, "square", 0.03, 0.35, 0);
    },
    upgrade: () => {
      // Rising sweep: freq ramp 300→900Hz over 200ms
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    },
    warning: () => {
      // Low pulse: 60ms at 180Hz, volume 0.3
      playTone(180, "sine", 0.06, 0.3, 0);
    },
  }), [muted, playTone, getCtx]);

  return sounds;
}

// ============================================================
// MAIN GAME COMPONENT
// ============================================================
function RainmakersGame() {
  const [game, setGame] = useState(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [offlineMsg, setOfflineMsg] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [muted, setMuted] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const tickRef = useRef(null);
  const lastNotifIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const attackTicksRef = useRef({});
  const claimedMilestonesRef = useRef({});
  const sounds = useSounds(muted);

  const addToast = useCallback((msg, type, ttl = 4000) => {
    setToasts(prev => {
      const next = [...prev, { id: ++toastIdRef.current, msg, type, ttl, maxTtl: ttl }];
      return next.length > 4 ? next.slice(next.length - 4) : next;
    });
  }, []);

  // ── Splash screen auto-dismiss ──────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  // ── Mobile detection (Fix 02) ─────────────────────────────
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Toast TTL countdown ──────────────────────────────────
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setInterval(() => {
      setToasts(prev => prev.map(t => ({ ...t, ttl: t.ttl - 100 })).filter(t => t.ttl > 0));
    }, 100);
    return () => clearInterval(timer);
  }, [toasts.length > 0]);

  // ── Load from localStorage + offline catch-up (Fix 01 + 06) ─
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const elapsedSec = Math.min(OFFLINE_CAP_SEC, Math.floor((Date.now() - parsed.lastActive) / 1000));
        const progressed = elapsedSec > 3 ? tickGame(parsed, elapsedSec) : parsed;
        setGame(progressed);
        if (elapsedSec > 10) {
          const gameDays = Math.floor(elapsedSec / 86.4);
          setOfflineMsg(`⏰ Welcome back! Your firm ran for ~${fmt(elapsedSec)}s (${gameDays} game-days) while you were away.`);
        }
      }
    } catch {
      setGame(createInitialState());
    }
    setHydrated(true);
  }, []);

  // ── Save to localStorage (Fix 01) ────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 800);
      return () => clearTimeout(t);
    } catch { /* storage full */ }
  }, [game, hydrated]);

  // ── Game tick loop ────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    tickRef.current = setInterval(() => {
      setGame(prev => prev.paused ? prev : tickGame(prev, prev.cycleSpeed));
    }, TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [hydrated]);

  // ── Sound + toast triggers for tick-based events ─────────
  useEffect(() => {
    if (!hydrated) return;
    const newNotifs = game.notifications.filter(n => n.id > lastNotifIdRef.current);
    if (newNotifs.length > 0) {
      lastNotifIdRef.current = Math.max(...game.notifications.map(n => n.id));
      for (const n of newNotifs) {
        if (n.msg.startsWith("✅ CONTRACT WON:")) {
          sounds.win();
          addToast(n.msg, "success");
          break;
        }
        if (n.msg.startsWith("🏆 TURF CAPTURED:")) {
          sounds.win();
          addToast(n.msg, "success");
          break;
        }
        if (n.msg.startsWith("💀 TURF LOST:")) {
          sounds.lose();
          addToast(n.msg, "danger", 6000);
          break;
        }
        if (n.msg.startsWith("⚠️ CASH CRITICAL:")) {
          sounds.warning();
          addToast(n.msg, "warning");
          break;
        }
        if (n.msg.includes("BANKRUPTCY")) {
          sounds.lose();
          addToast(n.msg, "danger", 8000);
          break;
        }
      }
    }

    // Track consecutive "under attack" ticks for sustained-attack toast
    const attackedIds = game.markets.filter(m => m.underAttack && !m.locked).map(m => m.id);
    const nextTicks = {};
    for (const id of attackedIds) {
      nextTicks[id] = (attackTicksRef.current[id] || 0) + 1;
      if (nextTicks[id] === 3) {
        const market = game.markets.find(m => m.id === id);
        if (market) addToast(`⚔️ ${market.name} under sustained attack!`, "warning");
      }
    }
    attackTicksRef.current = nextTicks;
  }, [game.notifications, game.markets, hydrated, sounds, addToast]);

  // ── Win condition milestones ────────────────────────────
  const naMarketIds = ["sf", "chi", "nyc"];
  const ownedNACount = game.markets.filter(m => naMarketIds.includes(m.id) && m.control >= 100).length;
  const uniqueOwnedRegions = [...new Set(game.markets.filter(m => m.control >= 100).map(m => m.region))].length;

  const milestones = [
    { id: "m1", title: "Regional Dominance", goal: "Control all 3 N. America markets (SF, Chicago, NYC)", progress: ownedNACount, target: 3, reward: "+Unlock Europe Desk discount 20%" },
    { id: "m2", title: "Contract Machine", goal: "Win 3 contracts", progress: Math.min(game.resources.wins, 3), target: 3, reward: "+500k bonus cash" },
    { id: "m3", title: "Global Firm", goal: "Own turf in 3 different regions", progress: Math.min(uniqueOwnedRegions, 3), target: 3, reward: "+Prestige multiplier x1.5 on next reset" },
    { id: "m4", title: "Rainmaker Empire", goal: "Reach global score 5,000", progress: Math.min(game.resources.globalScore, 5000), target: 5000, reward: "🏆 PRESTIGE RESET UNLOCKED" },
  ];

  // ── Milestone reward auto-claim (fire once per milestone) ──
  useEffect(() => {
    if (!hydrated) return;
    for (const ms of milestones) {
      if (ms.progress >= ms.target && !claimedMilestonesRef.current[ms.id]) {
        claimedMilestonesRef.current[ms.id] = true;
        addToast(`🎯 MILESTONE: ${ms.title} complete!`, "success", 6000);
        sounds.win();
        if (ms.id === "m1") {
          // Discount Europe Desk by 20%
          setGame(prev => ({
            ...prev,
            upgrades: prev.upgrades.map(u => u.id === "u5" && !u.bought ? { ...u, cost: Math.floor(u.cost * 0.8) } : u),
            notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: "🎯 MILESTONE: Regional Dominance — Europe Desk 20% off!", type: "success" }],
            nextNotifId: prev.nextNotifId + 1,
          }));
        }
        if (ms.id === "m2") {
          // Grant 500k bonus cash
          setGame(prev => ({
            ...prev,
            resources: { ...prev.resources, cash: prev.resources.cash + 500000 },
            notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: "🎯 MILESTONE: Contract Machine — +$500,000 bonus!", type: "success" }],
            nextNotifId: prev.nextNotifId + 1,
          }));
        }
        if (ms.id === "m3") {
          // Store prestige multiplier flag for next reset
          setGame(prev => ({
            ...prev,
            prestigeMultiplier: 1.5,
            notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: "🎯 MILESTONE: Global Firm — Prestige x1.5 on next reset!", type: "success" }],
            nextNotifId: prev.nextNotifId + 1,
          }));
        }
        if (ms.id === "m4") {
          setGame(prev => ({
            ...prev,
            notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: "🎯 MILESTONE: Rainmaker Empire — 🏆 PRESTIGE RESET UNLOCKED!", type: "success" }],
            nextNotifId: prev.nextNotifId + 1,
          }));
        }
      }
    }
  }, [hydrated, milestones, addToast, sounds]);

  const prod = useMemo(() => computeProduction(game), [game]);
  const g = game;

  const togglePause = () => setGame(prev => ({ ...prev, paused: !prev.paused }));
  const toggleSpeed = () => setGame(prev => ({ ...prev, cycleSpeed: prev.cycleSpeed === 1 ? 2 : prev.cycleSpeed === 2 ? 4 : 1 }));

  // ── Derived values ────────────────────────────────────────
  const ownedMarkets = g.markets.filter(m => m.control >= 100);
  const totalTeam = Object.values(g.team).reduce((a, b) => a + b, 0);
  const myRank = g.leaderboard.findIndex(l => l.name === "Your Firm") + 1;
  const annualPayroll = (g.team.rainmaker * 450000 + g.team.architect * 250000 + g.team.engineer * 160000 + g.team.ops * 140000);
  const runwayDays = prod.payrollCostPerSec > 0 ? Math.floor(g.resources.cash / (prod.payrollCostPerSec * 86400)) : 999;

  // ── Styles helpers ────────────────────────────────────────
  const S = {
    page:    { fontFamily: "'Courier New', monospace", background: "#0a0a0f", minHeight: "100vh", color: "#e0e0e0" },
    header:  { background: "linear-gradient(135deg,#0d1117 0%,#161b22 50%,#0d1117 100%)", borderBottom: "2px solid #00ff88", padding: isMobile ? "10px 12px" : "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", boxShadow: "0 0 30px rgba(0,255,136,0.1)" },
    card:    (color = "#223") => ({ background: "#0d1117", border: `1px solid ${color}`, borderRadius: "8px", padding: "14px" }),
    btn:     (color = "#00ff88", bg = "#0d2a0d", disabled = false) => ({ background: disabled ? "#1a1a1a" : bg, border: `1px solid ${disabled ? "#333" : color}`, color: disabled ? "#444" : color, padding: "6px 14px", cursor: disabled ? "not-allowed" : "pointer", borderRadius: "4px", fontFamily: "inherit", fontSize: "11px", letterSpacing: "1px", transition: "filter 0.15s" }),
    tab:     (active) => ({ background: "none", border: "none", color: active ? "#00ff88" : "#555", borderBottom: active ? "2px solid #00ff88" : "2px solid transparent", padding: isMobile ? "8px 10px" : "10px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "1px", marginBottom: "-1px", whiteSpace: "nowrap" }),
    notif:   (type) => ({ background: type==="success"?"#0d1f0d":type==="danger"?"#1f0d0d":type==="warning"?"#1a1000":"#0d1117", border:`1px solid ${type==="success"?"#00ff88":type==="danger"?"#ff4444":type==="warning"?"#ffaa00":"#223"}`, borderRadius:"4px", padding:"8px", fontSize:"11px", lineHeight:"1.4", color:type==="success"?"#88ff88":type==="danger"?"#ff8888":type==="warning"?"#ffcc88":"#aaa" }),
  };

  const TABS = [
    { id: "turf",        label: "⚔️ TURF"      },
    { id: "contracts",   label: "💼 CONTRACTS"  },
    { id: "team",        label: "👥 TEAM"       },
    { id: "upgrades",    label: "🔧 UPGRADES"   },
    { id: "leaderboard", label: "🏆 BOARD"      },
    { id: "intel",       label: "📊 INTEL"      },
  ];

  return (
    <div style={S.page}>
      {/* ── SPLASH SCREEN ─────────────────────────────────── */}
      {showSplash && (
        <div
          onClick={() => setShowSplash(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "radial-gradient(ellipse at center, #0d1117 0%, #050508 70%, #000 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            fontFamily: "'Courier New', monospace",
            cursor: "pointer",
            animation: "splashFadeIn 0.6s ease-out",
          }}
        >
          {/* Pixel character */}
          <div style={{ animation: "splashFloat 2s ease-in-out infinite", marginBottom: "8px" }}>
            <PixelFigure size={4} color="#00ff88" animated />
          </div>

          {/* Game title */}
          <div style={{
            fontSize: isMobile ? "28px" : "42px",
            fontWeight: "bold",
            color: "#00ff88",
            letterSpacing: "8px",
            textShadow: "0 0 30px rgba(0,255,136,0.5), 0 0 60px rgba(0,255,136,0.2)",
            textAlign: "center",
          }}>
            RAINMAKERS
          </div>
          <div style={{
            fontSize: isMobile ? "10px" : "13px",
            color: "#555",
            letterSpacing: "6px",
            marginTop: "-8px",
            textAlign: "center",
          }}>
            CONSULTING EMPIRE
          </div>

          {/* Welcome message */}
          <div style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "#0d2a0d",
            border: "1px solid #00ff8844",
            borderRadius: "6px",
            fontSize: isMobile ? "12px" : "14px",
            color: "#88ff88",
            letterSpacing: "2px",
            textAlign: "center",
            animation: "pulse 2s infinite",
          }}>
            Thanks for playing!
          </div>

          {/* Credits */}
          <div style={{
            marginTop: "28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}>
            <div style={{ fontSize: "12px", color: "#666", letterSpacing: "2px" }}>CREATED BY</div>
            <div style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", color: "#e0e0e0", letterSpacing: "2px" }}>
              Tyler Perleberg
            </div>
            <div style={{ fontSize: "11px", color: "#555", letterSpacing: "2px", marginTop: "4px" }}>A PRODUCT OF</div>
            <a
              href="https://aisymmetricsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: isMobile ? "14px" : "18px",
                fontWeight: "bold",
                color: "#00aaff",
                letterSpacing: "3px",
                textDecoration: "none",
                textShadow: "0 0 10px rgba(0,170,255,0.3)",
                transition: "color 0.2s, text-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.color = "#44ccff"; e.target.style.textShadow = "0 0 20px rgba(0,170,255,0.6)"; }}
              onMouseLeave={(e) => { e.target.style.color = "#00aaff"; e.target.style.textShadow = "0 0 10px rgba(0,170,255,0.3)"; }}
            >
              AISymmetric
            </a>
          </div>

          {/* Contact */}
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ fontSize: "10px", color: "#444", letterSpacing: "1px" }}>CONTACT</div>
            <a
              href="mailto:tyler.perleberg@aisymmetricsolutions.com"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "12px",
                color: "#ffaa00",
                textDecoration: "none",
                letterSpacing: "1px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.color = "#ffcc44"; }}
              onMouseLeave={(e) => { e.target.style.color = "#ffaa00"; }}
            >
              tyler.perleberg@aisymmetricsolutions.com
            </a>
          </div>

          {/* Click to continue */}
          <div style={{
            marginTop: "32px",
            fontSize: "10px",
            color: "#333",
            letterSpacing: "3px",
            animation: "pulse 1.5s infinite",
          }}>
            CLICK ANYWHERE TO CONTINUE
          </div>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────── */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <PixelFigure size={isMobile ? 1.5 : 2} animated color="#00ff88" />
          {!isMobile && (
            <div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#00ff88", letterSpacing: "3px", textShadow: "0 0 10px #00ff88" }}>RAINMAKERS</div>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "2px" }}>CONSULTING EMPIRE</div>
            </div>
          )}
          <div style={{ background: "#1a2a1a", border: "1px solid #00ff88", borderRadius: "4px", padding: "3px 10px", fontSize: "11px", color: "#00ff88" }}>
            DAY {Math.floor(g.day)} • LVL {g.prestigeLevel} • #{myRank}
          </div>
          {g.activeEvent && (
            <div style={{ background: "#2a1a00", border: "1px solid #ffaa00", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", color: "#ffaa00", animation: "pulse 1s infinite" }}>
              ⚡ {g.activeEvent.name} ({g.eventSecondsLeft}s)
            </div>
          )}
          {savedFlash && <div style={{ fontSize: "10px", color: "#00ff88", opacity: 0.8 }}>SAVED ✓</div>}
        </div>

        <div style={{ display: "flex", gap: isMobile ? "8px" : "16px", flexWrap: "wrap", alignItems: "center" }}>
          {!isMobile && [
            { label: "CASH",    value: $(g.resources.cash),       color: g.resources.cash < 100000 ? "#ff4444" : "#88ff88" },
            { label: "REVENUE", value: $(g.resources.globalScore * 10000), color: "#00ff88" },
            { label: "REP",     value: fmt(g.resources.reputation), color: "#88aaff" },
            { label: "INFLUENCE",value: fmt(g.resources.influence), color: "#ffaa00" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "9px", color: "#555", letterSpacing: "1px" }}>{s.label}</div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: s.color }}>{s.value}</div>
            </div>
          ))}
          {isMobile && (
            <div style={{ fontSize: "12px", fontWeight: "bold", color: g.resources.cash < 100000 ? "#ff4444" : "#88ff88" }}>
              {$(g.resources.cash)}
            </div>
          )}
          <button onClick={toggleSpeed} style={S.btn("#ffaa00", "#2a1a00")}>⚡ x{g.cycleSpeed}</button>
          <button onClick={togglePause} style={S.btn(g.paused ? "#00ff88" : "#ff4444", g.paused ? "#0d2a0d" : "#2a0d0d")}>{g.paused ? "▶" : "⏸"}</button>
          <button onClick={() => setMuted(m => !m)} style={S.btn(muted ? "#666" : "#00ff88", muted ? "#1a1a1a" : "#0d2a0d")}>{muted ? "🔇" : "🔊"}</button>
          {!isMobile && <button onClick={() => setGame(prev => newGame())} style={S.btn("#888", "#1a1a1a")}>NEW</button>}
          {isMobile && (
            <button onClick={() => setGame(prev => ({ ...prev, showFeed: !prev.showFeed }))} style={S.btn("#888", "#1a1a1a")}>📡</button>
          )}
        </div>
      </div>

      {/* ── OFFLINE MESSAGE ──────────────────────────────── */}
      {offlineMsg && (
        <div style={{ background: "#0d1a0d", border: "1px solid #00aa44", padding: "10px 20px", fontSize: "12px", color: "#88ff88", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {offlineMsg}
          <button onClick={() => setOfflineMsg("")} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "14px" }}>✕</button>
        </div>
      )}

      {/* ── XP / PRESTIGE BAR ────────────────────────────── */}
      <div style={{ background: "#111", height: "3px" }}>
        <div style={{ background: "linear-gradient(90deg,#00ff88,#00aaff)", height: "100%", width: `${Math.min(100, (g.resources.globalScore % 500) / 5)}%`, transition: "width 0.5s" }} />
      </div>

      {/* ── MOBILE STAT ROW ──────────────────────────────── */}
      {isMobile && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1px", background: "#111" }}>
          {[
            { label: "REP", value: fmt(g.resources.reputation), color: "#88aaff" },
            { label: "INF", value: fmt(g.resources.influence),  color: "#ffaa00" },
            { label: "TURF", value: `${ownedMarkets.length}/${g.markets.filter(m=>!m.locked).length}`, color: "#00ff88" },
            { label: "RANK", value: `#${myRank}`, color: "#ffcc00" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0d1117", padding: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#555" }}>{s.label}</div>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        {/* ── MAIN CONTENT ─────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tabs */}
          <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "0 16px", display: "flex", overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setGame(prev => ({ ...prev, activeTab: t.id }))} style={S.tab(g.activeTab === t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>

            {/* ── TURF TAB ────────────────────────────── */}
            {g.activeTab === "turf" && (
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>
                  GLOBAL CLIENT TURF — {ownedMarkets.length} FULLY CONTROLLED
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "160px" : "220px"}, 1fr))`, gap: "10px" }}>
                  {g.markets.map(market => {
                    const isOwned = market.control >= 100;
                    const borderColor = market.locked ? "#222" : isOwned ? "#00ff88" : market.underAttack ? "#ff4444" : "#334";
                    return (
                      <div key={market.id} style={{ ...S.card(borderColor), opacity: market.locked ? 0.5 : 1, position: "relative", boxShadow: isOwned ? "0 0 10px rgba(0,255,136,0.1)" : market.underAttack ? "0 0 10px rgba(255,68,68,0.2)" : "none" }}>
                        {market.underAttack && !market.locked && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", fontSize: "9px", background: "#3a0000", color: "#ff6666", padding: "2px 6px", borderRadius: "3px" }}>⚔️ UNDER ATTACK</div>
                        )}
                        <div style={{ fontSize: "18px" }}>{market.icon}</div>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: market.locked ? "#444" : isOwned ? "#00ff88" : "#e0e0e0", marginTop: "4px" }}>{market.name}</div>
                        <div style={{ fontSize: "10px", color: "#666", marginBottom: "8px" }}>{market.region} · {market.type}</div>
                        {!market.locked && (
                          <>
                            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Client Value: {$(market.clientValue)}</div>
                            <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px" }}>Prestige: {market.prestige} · Rival: {market.rivalPressure}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#555", marginBottom: "3px" }}>
                              <span>CONTROL</span><span>{market.control.toFixed(0)}%</span>
                            </div>
                            <div style={{ background: "#1a1a1a", height: "6px", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                              <div style={{ background: isOwned ? "#00ff88" : "#00aaff", height: "100%", width: `${market.control}%`, transition: "width 0.3s" }} />
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => { sounds.attack(); setGame(prev => attackMarket(prev, market.id)); }} style={{ ...S.btn("#00aaff", "#0d1a2a"), flex: 1, padding: isMobile ? "4px" : "6px", fontSize: "9px" }}>
                                ⚔️ PURSUE
                              </button>
                              <button onClick={() => { sounds.attack(); setGame(prev => defendMarket(prev, market.id)); }} style={{ ...S.btn("#00ff88", "#0d2a0d"), flex: 1, padding: isMobile ? "4px" : "6px", fontSize: "9px" }}>
                                🛡️ DEFEND
                              </button>
                            </div>
                          </>
                        )}
                        {market.locked && <div style={{ fontSize: "11px", color: "#555", marginTop: "8px" }}>🔒 Unlock via Upgrades tab</div>}
                        {isOwned && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", opacity: 0.4 }}>
                            <PixelFigure size={0.7} color="#00ff88" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CONTRACTS TAB ───────────────────────── */}
            {g.activeTab === "contracts" && (
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>
                  HIGH-VALUE CLIENT CHALLENGES — {g.contracts.filter(c=>c.active).length}/{Math.max(1,g.team.ops)} ACTIVE SLOTS
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile?"280px":"300px"}, 1fr))`, gap: "12px" }}>
                  {g.contracts.map(contract => {
                    const done = contract.progress >= contract.duration;
                    const pct  = (contract.progress / contract.duration) * 100;
                    const canStart = !contract.active && !done && g.resources.influence >= contract.requiredInfluence && g.contracts.filter(c=>c.active).length < Math.max(1,g.team.ops);
                    const borderColor = done ? "#00ff88" : contract.active ? "#00aaff" : "#334";
                    return (
                      <div key={contract.id} style={S.card(borderColor)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: "bold", color: "#e0e0e0", marginBottom: "2px" }}>{contract.title}</div>
                            <div style={{ fontSize: "10px", color: "#888" }}>{contract.segment}</div>
                          </div>
                          <div style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: done?"#0d2a0d":contract.active?"#0d1a2a":"#1a1a1a", color: done?"#00ff88":contract.active?"#00aaff":"#666", border: `1px solid ${done?"#00ff88":contract.active?"#00aaff":"#333"}`, whiteSpace: "nowrap" }}>
                            {done ? "✅ WON" : contract.active ? "⚡ ACTIVE" : "IDLE"}
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span>Value</span><span style={{ color: "#00ff88" }}>{$(contract.value)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span>Difficulty</span><span>{contract.difficulty}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span>Required Influence</span>
                            <span style={{ color: g.resources.influence >= contract.requiredInfluence ? "#88ff88" : "#ff8888" }}>
                              {contract.requiredInfluence} (have {Math.floor(g.resources.influence)})
                            </span>
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#555", marginBottom: "3px" }}>
                              <span>PROGRESS</span><span>{contract.progress.toFixed(0)}/{contract.duration}</span>
                            </div>
                            <div style={{ background: "#1a1a1a", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{ background: done?"#00ff88":contract.active?"linear-gradient(90deg,#00aaff,#00ff88)":"#334", height: "100%", width: `${pct}%`, transition: "width 0.3s" }} />
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setGame(prev => startContract(prev, contract.id))} disabled={!canStart} style={{ ...S.btn("#00aaff","#0d1a2a",!canStart), width: "100%", marginTop: "4px" }}>
                          {done ? "COMPLETED" : contract.active ? "IN PROGRESS" : g.resources.influence < contract.requiredInfluence ? `NEED ${contract.requiredInfluence} INFLUENCE` : "START CONTRACT"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TEAM TAB ────────────────────────────── */}
            {g.activeTab === "team" && (
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>
                  BUILD YOUR TEAM — RUNWAY: <span style={{ color: runwayDays < 10 ? "#ff4444" : runwayDays < 30 ? "#ffaa00" : "#00ff88" }}>{runwayDays > 999 ? "∞" : `${runwayDays}d`}</span>
                </div>

                {/* Production stats */}
                <div style={{ ...S.card(), marginBottom: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: "10px" }}>
                  {[
                    { label: "DEAL FLOW/s",    value: prod.dealFlow.toFixed(2),      color: "#ffaa00" },
                    { label: "DELIVERY PWR",   value: prod.deliveryPower.toFixed(2), color: "#00aaff" },
                    { label: "DEFENSE PWR",    value: prod.defensePower.toFixed(2),  color: "#00ff88" },
                    { label: "PAYROLL/YEAR",   value: $(annualPayroll),              color: "#ff8888" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#555", letterSpacing: "1px" }}>{s.label}</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "12px", marginBottom: "16px" }}>
                  {(["rainmaker","architect","engineer","ops"]).map(role => {
                    const cost = HIRE_BASE_COSTS[role] * (1 + g.team[role] * 0.12) * (g.activeEvent?.effect === "talent_war" ? 1.6 : 1);
                    const canAfford = g.resources.cash >= cost;
                    const labels = { rainmaker: "Rainmaker", architect: "Tech Architect", engineer: "Forward Engineer", ops: "Ops Manager" };
                    const descs  = { rainmaker: "Drives deal flow, relationships, and market gravity.", architect: "Technical credibility and solution design for large deals.", engineer: "Builds automations, integrations, and implementations.", ops: "Protects delivery quality and turf control." };
                    return (
                      <div key={role} style={S.card()}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <PixelFigure size={1.8} color={ROLE_COLORS[role]} />
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#e0e0e0" }}>{labels[role]}</div>
                            <div style={{ fontSize: "10px", color: "#666" }}>{g.team[role]} hired</div>
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "#999", marginBottom: "8px" }}>{descs[role]}</div>
                        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "10px" }}>
                          {Array.from({ length: Math.min(g.team[role], 8) }).map((_, i) => (
                            <PixelFigure key={i} size={0.8} color={ROLE_COLORS[role]} />
                          ))}
                          {g.team[role] > 8 && <span style={{ fontSize: "10px", color: "#888", alignSelf: "center" }}>+{g.team[role]-8}</span>}
                        </div>
                        <button onClick={() => setGame(prev => hire(prev, role))} disabled={!canAfford} style={{ ...S.btn(ROLE_COLORS[role], "#0d1117", !canAfford), width: "100%" }}>
                          HIRE — {$(cost)}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Prestige reset */}
                <div style={{ ...S.card("#553"), padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ffcc00", marginBottom: "6px" }}>🌟 PRESTIGE RESET</div>
                  <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "10px" }}>
                    Reset your run for a permanent prestige bonus. More prestige = better starting position. Current: {g.prestigeLevel} prestige.
                  </div>
                  <div style={{ fontSize: "11px", color: "#ffcc00", marginBottom: "10px" }}>
                    Estimated gain: +{Math.max(1, Math.floor((g.resources.globalScore + ownedMarkets.length * 60) / 500))} prestige
                  </div>
                  <button onClick={() => setGame(prev => prestigeReset(prev))} style={S.btn("#ffcc00", "#2a2200")}>🔄 PRESTIGE RESET</button>
                </div>
              </div>
            )}

            {/* ── UPGRADES TAB ────────────────────────── */}
            {g.activeTab === "upgrades" && (
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>FIRM UPGRADES — PERMANENT MULTIPLIERS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: "12px" }}>
                  {g.upgrades.map(upgrade => {
                    const canBuy = !upgrade.bought && g.resources.cash >= upgrade.cost;
                    const typeColor = upgrade.type === "unlock" ? "#ffaa00" : upgrade.type === "defense" ? "#00aaff" : "#00ff88";
                    return (
                      <div key={upgrade.id} style={{ ...S.card(upgrade.bought ? "#00ff8822" : "#334"), opacity: upgrade.bought ? 0.7 : 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "bold", color: upgrade.bought ? "#00ff88" : "#e0e0e0" }}>{upgrade.name}</div>
                          <div style={{ fontSize: "9px", color: typeColor, background: typeColor + "22", padding: "2px 6px", borderRadius: "3px", border: `1px solid ${typeColor}33` }}>
                            {upgrade.type.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "12px" }}>{upgrade.desc}</div>
                        <div style={{ fontSize: "12px", color: "#00ff88", marginBottom: "10px" }}>{$(upgrade.cost)}</div>
                        <button onClick={() => { sounds.upgrade(); setGame(prev => buyUpgrade(prev, upgrade.id)); }} disabled={!canBuy} style={{ ...S.btn(typeColor, "#0d1117", !canBuy), width: "100%" }}>
                          {upgrade.bought ? "✅ PURCHASED" : canBuy ? "BUY UPGRADE" : $(upgrade.cost) + " needed"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LEADERBOARD TAB ─────────────────────── */}
            {g.activeTab === "leaderboard" && (
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>GLOBAL CONSULTING DOMINANCE BOARD</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {g.leaderboard.map((entry, i) => {
                    const isMe = entry.name === "Your Firm";
                    const rankColors = ["#FFD700","#C0C0C0","#CD7F32","#888","#888","#888"];
                    return (
                      <div key={entry.name} style={{ ...S.card(isMe ? "#00ff88" : "#223"), display: "flex", alignItems: "center", gap: "14px", boxShadow: isMe ? "0 0 15px rgba(0,255,136,0.1)" : "none" }}>
                        <div style={{ fontSize: "22px", fontWeight: "bold", color: rankColors[i]||"#666", width: "36px", textAlign: "center" }}>#{i+1}</div>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                          {isMe ? <PixelFigure size={1.3} color="#00ff88" animated /> : <PixelRival color={RIVAL_FIRMS[i % RIVAL_FIRMS.length]?.color || "#888"} />}
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "bold", color: isMe ? "#00ff88" : "#ccc" }}>{entry.name}{isMe && " ← YOU"}</div>
                            <div style={{ fontSize: "10px", color: "#555" }}>Consulting dominance score</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "18px", fontWeight: "bold", color: isMe ? "#00ff88" : "#888" }}>{fmt(entry.score)}</div>
                        </div>
                        <div style={{ width: "80px" }}>
                          <div style={{ background: "#1a1a1a", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ background: isMe ? "#00ff88" : "#444", height: "100%", width: `${Math.min(100, (entry.score / Math.max(...g.leaderboard.map(l=>l.score))) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ ...S.card(), display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "12px" }}>
                  {[
                    { label: "GLOBAL SCORE",  value: fmt(g.resources.globalScore),  color: "#ffcc00" },
                    { label: "INFLUENCE",     value: fmt(g.resources.influence),     color: "#ffaa00" },
                    { label: "REPUTATION",    value: fmt(g.resources.reputation),    color: "#88aaff" },
                    { label: "CONTRACTS WON", value: g.resources.wins,               color: "#00ff88" },
                    { label: "TURF LOST",     value: g.resources.losses,             color: "#ff8888" },
                    { label: "PRESTIGE",      value: g.prestigeLevel,               color: "#ffcc00" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#555", letterSpacing: "1px" }}>{s.label}</div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* ── WIN CONDITIONS ──────────────────── */}
                <div style={{ marginTop: "20px" }}>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>🎯 WIN CONDITIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "260px" : "280px"}, 1fr))`, gap: "12px" }}>
                    {milestones.map(ms => {
                      const complete = ms.progress >= ms.target;
                      const pct = Math.min(100, (ms.progress / ms.target) * 100);
                      return (
                        <div key={ms.id} style={{
                          background: "#0d1117",
                          border: `1px solid ${complete ? "#00ff88" : "#334"}`,
                          borderRadius: "8px",
                          padding: "14px",
                          boxShadow: complete ? "0 0 12px rgba(0,255,136,0.1)" : "none",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <div style={{ fontSize: "13px", fontWeight: "bold", color: complete ? "#00ff88" : "#e0e0e0" }}>{ms.title}</div>
                            {complete && <span style={{ fontSize: "16px" }}>✅</span>}
                          </div>
                          <div style={{ fontSize: "11px", color: "#888", marginBottom: "10px" }}>{ms.goal}</div>
                          {!complete ? (
                            <>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#ffaa00", marginBottom: "4px" }}>
                                <span>PROGRESS</span>
                                <span>{ms.target >= 1000 ? `${fmt(ms.progress)} / ${fmt(ms.target)}` : `${ms.progress} / ${ms.target}`}</span>
                              </div>
                              <div style={{ background: "#1a1a1a", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
                                <div style={{ background: "linear-gradient(90deg, #ffaa00, #ffcc00)", height: "100%", width: `${pct}%`, transition: "width 0.3s", borderRadius: "4px" }} />
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: "11px", color: "#00ff88", marginBottom: "10px", fontWeight: "bold" }}>COMPLETE</div>
                          )}
                          <div style={{
                            fontSize: "10px",
                            color: complete ? "#88ff88" : "#666",
                            background: complete ? "#0d1f0d" : "#111",
                            border: `1px solid ${complete ? "#00ff8833" : "#222"}`,
                            borderRadius: "4px",
                            padding: "6px 10px",
                          }}>
                            {complete ? "✓ " : "🔒 "}{ms.reward}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── INTEL TAB ───────────────────────────── */}
            {g.activeTab === "intel" && (
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "12px" }}>MARKET INTELLIGENCE</div>

                {g.activeEvent ? (
                  <div style={{ background: "#1a1000", border: "2px solid #ffaa00", borderRadius: "8px", padding: "16px", marginBottom: "16px", boxShadow: "0 0 20px rgba(255,170,0,0.15)" }}>
                    <div style={{ fontSize: "15px", fontWeight: "bold", color: "#ffaa00", marginBottom: "6px" }}>⚡ ACTIVE: {g.activeEvent.name}</div>
                    <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>{g.activeEvent.desc}</div>
                    <div style={{ fontSize: "11px", color: "#ffaa00" }}>{g.eventSecondsLeft}s remaining</div>
                  </div>
                ) : (
                  <div style={{ border: "1px dashed #333", borderRadius: "8px", padding: "16px", marginBottom: "16px", color: "#444", textAlign: "center" }}>
                    No active market event. Markets are calm. For now.
                  </div>
                )}

                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "10px" }}>POSSIBLE UPCOMING EVENTS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px", marginBottom: "20px" }}>
                  {ECONOMIC_EVENTS.map(evt => (
                    <div key={evt.id} style={S.card()}>
                      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>{evt.name}</div>
                      <div style={{ fontSize: "11px", color: "#888" }}>{evt.desc}</div>
                      <div style={{ fontSize: "10px", color: "#555", marginTop: "6px" }}>Duration: {evt.duration}s</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "10px" }}>RIVAL FIRMS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {RIVAL_FIRMS.map(rival => (
                    <div key={rival.id} style={{ ...S.card("#3a1a1a"), display: "flex", alignItems: "center", gap: "14px" }}>
                      <PixelRival color={rival.color} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ff8888" }}>{rival.name}</div>
                        <div style={{ fontSize: "11px", color: "#888" }}>
                          Aggression: {"█".repeat(Math.floor(rival.aggression * 10))}{"░".repeat(10-Math.floor(rival.aggression*10))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* War Log */}
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", margin: "20px 0 10px" }}>WAR ROOM LOG</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {g.log.map((entry, i) => (
                    <div key={i} style={{ background: "#0d1117", border: "1px solid #1a1a2a", borderRadius: "4px", padding: "8px 12px", fontSize: "11px", color: "#888" }}>
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DESKTOP SIDEBAR ────────────────────────────── */}
        {!isMobile && (
          <div style={{ width: "240px", background: "#0a0a10", borderLeft: "1px solid #1a1a2a", padding: "14px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "10px" }}>📡 LIVE FEED</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
              {[...g.notifications].reverse().map(n => (
                <div key={n.id} style={S.notif(n.type)}>{n.msg}</div>
              ))}
              {g.notifications.length === 0 && <div style={{ fontSize: "11px", color: "#333" }}>No activity yet...</div>}
            </div>
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1a1a2a" }}>
              <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px" }}>YOUR FIRM</div>
              <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                {Array.from({ length: Math.min(totalTeam, 16) }).map((_, i) => {
                  const role = i < g.team.rainmaker ? "rainmaker" : i < g.team.rainmaker + g.team.architect ? "architect" : i < g.team.rainmaker + g.team.architect + g.team.engineer ? "engineer" : "ops";
                  return <PixelFigure key={i} size={0.8} color={ROLE_COLORS[role]} />;
                })}
                {totalTeam > 16 && <span style={{ fontSize: "10px", color: "#888", alignSelf: "center" }}>+{totalTeam-16}</span>}
              </div>
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>
                {g.team.rainmaker}💼 {g.team.architect}🏗️ {g.team.engineer}⚙️ {g.team.ops}📋
              </div>
              <div style={{ marginTop: "10px" }}>
                <button onClick={() => setGame(prev => newGame())} style={{ ...S.btn("#666","#1a1a1a"), width: "100%", marginBottom: "6px" }}>NEW GAME</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE FEED DRAWER (Fix 02) ────────────────── */}
      {isMobile && g.showFeed && (
        <>
          <div onClick={() => setGame(prev=>({...prev,showFeed:false}))} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "75vh", background: "#0a0a10", border: "1px solid #1a1a2a", borderRadius: "12px 12px 0 0", zIndex: 50, padding: "16px", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#555", letterSpacing: "2px" }}>📡 LIVE FEED</div>
              <button onClick={() => setGame(prev=>({...prev,showFeed:false}))} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[...g.notifications].reverse().map(n => (
                <div key={n.id} style={S.notif(n.type)}>{n.msg}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TOAST NOTIFICATIONS ──────────────────────────── */}
      <div style={{
        position: "fixed",
        top: isMobile ? "auto" : "80px",
        bottom: isMobile ? "16px" : "auto",
        right: isMobile ? "50%" : "20px",
        transform: isMobile ? "translateX(50%)" : "none",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
        width: isMobile ? "90vw" : "320px",
        maxWidth: "360px",
      }}>
        {toasts.map(t => {
          const colors = {
            success: { border: "#00ff88", bg: "#0d1f0d", text: "#88ff88", bar: "#00ff88" },
            danger:  { border: "#ff4444", bg: "#1f0d0d", text: "#ff8888", bar: "#ff4444" },
            warning: { border: "#ffaa00", bg: "#1a1000", text: "#ffcc88", bar: "#ffaa00" },
            info:    { border: "#00aaff", bg: "#0d1117", text: "#88ccff", bar: "#00aaff" },
          };
          const c = colors[t.type] || colors.info;
          const pct = (t.ttl / t.maxTtl) * 100;
          return (
            <div key={t.id} style={{
              background: c.bg,
              border: `1px solid ${c.border}33`,
              borderLeft: `4px solid ${c.border}`,
              borderRadius: "6px",
              padding: "10px 14px 8px",
              fontSize: "12px",
              color: c.text,
              fontFamily: "'Courier New', monospace",
              boxShadow: `0 4px 20px ${c.border}22`,
              animation: "toastSlideIn 0.2s ease-out",
              pointerEvents: "auto",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <span>{t.msg}</span>
                <button
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                  style={{ background: "none", border: "none", color: c.text, cursor: "pointer", fontSize: "14px", padding: 0, lineHeight: 1, opacity: 0.6, flexShrink: 0 }}
                >✕</button>
              </div>
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: "2px",
                width: `${pct}%`,
                background: c.bar,
                opacity: 0.6,
                transition: "width 0.1s linear",
              }} />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes toastSlideIn { from { transform: translateX(120px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes splashFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splashFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        button:not(:disabled):hover { filter: brightness(1.25); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <RainmakersGame />
    </ErrorBoundary>
  );
}
