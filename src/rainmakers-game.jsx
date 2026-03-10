import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// PIXEL ART CHARACTERS (CSS-based pixel art)
// ============================================================
const PixelRainmaker = ({ color = "#00ff88", size = 1, animated = false }) => {
  const s = size;
  return (
    <div style={{ display: "inline-block", imageRendering: "pixelated", transform: `scale(${s})`, transformOrigin: "bottom center" }}>
      <svg width="16" height="24" viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
        {/* Briefcase */}
        <rect x="5" y="17" width="6" height="4" fill="#8B6914" />
        <rect x="6" y="16" width="4" height="1" fill="#8B6914" />
        {/* Suit body */}
        <rect x="3" y="10" width="10" height="8" fill="#1a1a2e" />
        <rect x="6" y="10" width="4" height="8" fill="#16213e" />
        {/* Tie */}
        <rect x="7" y="11" width="2" height="5" fill={color} />
        {/* Arms */}
        <rect x="1" y="10" width="2" height="6" fill="#1a1a2e" />
        <rect x="13" y="10" width="2" height="6" fill="#1a1a2e" />
        {/* Hands */}
        <rect x="1" y="16" width="2" height="2" fill="#f4c78f" />
        <rect x="13" y="16" width="2" height="2" fill="#f4c78f" />
        {/* Head */}
        <rect x="4" y="3" width="8" height="7" fill="#f4c78f" />
        {/* Hair */}
        <rect x="4" y="3" width="8" height="2" fill="#2c1810" />
        {/* Eyes */}
        <rect x="5" y="7" width="2" height="1" fill="#000" />
        <rect x="9" y="7" width="2" height="1" fill="#000" />
        {/* Mouth */}
        <rect x="6" y="9" width="4" height="1" fill="#c0392b" />
        {/* Legs */}
        <rect x="4" y="18" width="3" height="5" fill="#2c3e50" />
        <rect x="9" y="18" width="3" height="5" fill="#2c3e50" />
        {/* Shoes */}
        <rect x="3" y="22" width="4" height="2" fill="#1a1a1a" />
        <rect x="9" y="22" width="4" height="2" fill="#1a1a1a" />
        {/* Glow effect */}
        {animated && <rect x="7" y="11" width="2" height="2" fill={color} opacity="0.8" />}
      </svg>
    </div>
  );
};

const PixelEnemy = ({ color = "#ff4444" }) => (
  <svg width="16" height="24" viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
    <rect x="4" y="3" width="8" height="7" fill="#f4c78f" />
    <rect x="4" y="3" width="8" height="2" fill="#8B0000" />
    <rect x="5" y="7" width="2" height="1" fill="#ff0000" />
    <rect x="9" y="7" width="2" height="1" fill="#ff0000" />
    <rect x="6" y="9" width="4" height="1" fill="#000" />
    <rect x="3" y="10" width="10" height="8" fill="#8B0000" />
    <rect x="6" y="10" width="4" height="8" fill="#6B0000" />
    <rect x="7" y="11" width="2" height="5" fill={color} />
    <rect x="1" y="10" width="2" height="6" fill="#8B0000" />
    <rect x="13" y="10" width="2" height="6" fill="#8B0000" />
    <rect x="1" y="16" width="2" height="2" fill="#f4c78f" />
    <rect x="13" y="16" width="2" height="2" fill="#f4c78f" />
    <rect x="4" y="18" width="3" height="5" fill="#4a0000" />
    <rect x="9" y="18" width="3" height="5" fill="#4a0000" />
    <rect x="3" y="22" width="4" height="2" fill="#1a1a1a" />
    <rect x="9" y="22" width="4" height="2" fill="#1a1a1a" />
  </svg>
);

// ============================================================
// GAME CONSTANTS
// ============================================================
const MARKETS = [
  { id: "nyc", name: "New York", icon: "🏙️", baseDeal: 500, competition: 0.9, tier: "enterprise" },
  { id: "sf", name: "San Francisco", icon: "🌉", baseDeal: 450, competition: 0.85, tier: "ai" },
  { id: "chicago", name: "Chicago", icon: "🏛️", baseDeal: 350, competition: 0.7, tier: "consulting" },
  { id: "london", name: "London", icon: "🎡", baseDeal: 480, competition: 0.88, tier: "enterprise" },
  { id: "austin", name: "Austin", icon: "🤠", baseDeal: 300, competition: 0.6, tier: "ai" },
  { id: "dubai", name: "Dubai", icon: "🕌", baseDeal: 600, competition: 0.8, tier: "luxury" },
  { id: "singapore", name: "Singapore", icon: "🦁", baseDeal: 520, competition: 0.82, tier: "enterprise" },
  { id: "miami", name: "Miami", icon: "🌴", baseDeal: 280, competition: 0.55, tier: "boutique" },
];

const DEAL_TYPES = [
  { id: "ai_transform", name: "AI Transformation", multiplier: 2.5, risk: 0.3, duration: 90 },
  { id: "salesforce", name: "Salesforce Architecture", multiplier: 1.8, risk: 0.2, duration: 60 },
  { id: "strategy", name: "Strategy Consulting", multiplier: 2.0, risk: 0.25, duration: 45 },
  { id: "automation", name: "Enterprise Automation", multiplier: 1.6, risk: 0.15, duration: 30 },
  { id: "advisory", name: "C-Suite Advisory", multiplier: 3.0, risk: 0.4, duration: 120 },
];

const RIVAL_FIRMS = [
  { id: "mckinsey", name: "McKnight & Co", aggression: 0.8, budget: 15000, color: "#003366" },
  { id: "deloitte", name: "Delworth Partners", aggression: 0.6, budget: 12000, color: "#86BC25" },
  { id: "accenture", name: "Accelerate Global", aggression: 0.7, budget: 18000, color: "#A100FF" },
  { id: "bain", name: "Bane Consulting", aggression: 0.9, budget: 10000, color: "#CC0000" },
];

const ECONOMIC_EVENTS = [
  { id: "ai_boom", name: "🚀 AI Investment Surge", effect: "deal_multiplier", value: 1.5, duration: 30, desc: "AI spending explodes — deals worth 50% more for 30 days" },
  { id: "recession", name: "📉 White-Collar Recession", effect: "client_churn", value: 0.3, duration: 60, desc: "Hiring freezes hit clients — 30% higher churn risk" },
  { id: "regulation", name: "⚖️ AI Regulation Wave", effect: "cost_increase", value: 1.4, duration: 45, desc: "Compliance costs surge — operations 40% pricier" },
  { id: "talent_war", name: "💰 Talent War Erupts", effect: "payroll_spike", value: 1.6, duration: 30, desc: "Top engineers demand 60% more — poaching wars begin" },
  { id: "client_boom", name: "🏢 Enterprise Spending Boom", effect: "deal_frequency", value: 2.0, duration: 20, desc: "Fortune 500s flush with cash — double the deal frequency" },
  { id: "market_crash", name: "💥 Market Crash", effect: "deal_freeze", value: 0.4, duration: 45, desc: "Deals dry up — only 40% normal deal flow" },
];

// ============================================================
// INITIAL STATE
// ============================================================
const createInitialState = () => ({
  // Core metrics
  revenue: 0,
  cash: 500, // starting cash in $k
  reputation: 50,
  level: 1,
  xp: 0,
  xpToNext: 1000,
  day: 1,

  // Team
  team: {
    rainmakers: 1,
    architects: 0,
    engineers: 0,
    ops: 0,
  },

  // Markets (turf)
  markets: MARKETS.map(m => ({
    ...m,
    owned: m.id === "austin", // start with Austin
    control: m.id === "austin" ? 60 : 0,
    clients: m.id === "austin" ? 3 : 0,
    contested: false,
    rivalControl: m.id === "austin" ? 20 : Math.floor(Math.random() * 60 + 20),
  })),

  // Active deals pipeline
  deals: [
    {
      id: 1, marketId: "austin", type: DEAL_TYPES[3],
      value: 150, progress: 40, clientName: "AustinTech Inc",
      atRisk: false, daysLeft: 18
    }
  ],
  nextDealId: 2,

  // Active events
  activeEvent: null,
  eventDaysLeft: 0,

  // Rivals
  rivals: RIVAL_FIRMS.map(r => ({ ...r, markets: [] })),

  // Notifications
  notifications: [
    { id: 1, msg: "🎯 Welcome to Rainmakers! You have a foothold in Austin.", type: "info" }
  ],
  nextNotifId: 2,

  // Stats
  totalDealsWon: 0,
  totalDealsLost: 0,
  marketsLost: 0,
  marketsWon: 1,

  // Leaderboard (global simulation)
  leaderboard: [
    { name: "You", revenue: 0, rank: 4 },
    { name: "S. Nakamura", revenue: 8200, rank: 1 },
    { name: "M. Chen", revenue: 6100, rank: 2 },
    { name: "A. Patel", revenue: 4800, rank: 3 },
    { name: "R. Okafor", revenue: 1200, rank: 5 },
  ],

  // Offline calculation
  lastTick: Date.now(),
  tickInterval: 5000, // 5 seconds = 1 game day
  paused: false,

  // UI state
  activeTab: "empire",
  showCombat: false,
  combatTarget: null,
  combatResult: null,
});

// ============================================================
// GAME ENGINE
// ============================================================
function calculateTick(state) {
  const newState = JSON.parse(JSON.stringify(state));
  newState.day += 1;

  const team = newState.team;
  const totalStaff = team.rainmakers + team.architects + team.engineers + team.ops;
  const deliveryCapacity = (team.engineers * 1.5 + team.architects * 1.2) * 500; // $k per day capacity

  // Daily payroll
  const payroll = (team.rainmakers * 2.5 + team.architects * 2.0 + team.engineers * 1.5 + team.ops * 1.0);
  // in $k/day
  const dailyCost = payroll * (newState.activeEvent?.effect === "payroll_spike" ? newState.activeEvent.value : 1);

  // Deal progress & revenue
  let dailyRevenue = 0;
  const completedDeals = [];
  const lostDeals = [];

  newState.deals = newState.deals.map(deal => {
    const d = { ...deal };

    // Check if at risk due to event
    if (newState.activeEvent?.effect === "client_churn" && Math.random() < newState.activeEvent.value * 0.01) {
      d.atRisk = true;
    }

    // Rival poaching
    const market = newState.markets.find(m => m.id === d.marketId);
    if (market && Math.random() < 0.03 * (market.rivalControl / 100)) {
      d.atRisk = true;
    }

    // Deal progress
    let progressRate = (team.engineers * 3 + team.architects * 2);
    if (newState.activeEvent?.effect === "deal_freeze") progressRate *= newState.activeEvent.value;

    d.progress = Math.min(100, d.progress + progressRate * (1 / d.type.duration) * 10);
    d.daysLeft = Math.max(0, d.daysLeft - 1);

    if (d.progress >= 100 || d.daysLeft === 0) {
      if (d.atRisk && Math.random() < 0.4) {
        lostDeals.push(d);
        return null;
      }
      completedDeals.push(d);
      return null;
    }

    return d;
  }).filter(Boolean);

  completedDeals.forEach(deal => {
    let dealValue = deal.value;
    if (newState.activeEvent?.effect === "deal_multiplier") dealValue *= newState.activeEvent.value;
    dailyRevenue += dealValue;
    newState.totalDealsWon += 1;
    newState.xp += Math.floor(dealValue * 0.5);
    newState.notifications.push({
      id: newState.nextNotifId++,
      msg: `✅ DEAL CLOSED: ${deal.clientName} — $${dealValue}k`,
      type: "success"
    });
  });

  lostDeals.forEach(deal => {
    newState.totalDealsLost += 1;
    const mkt = newState.markets.find(m => m.id === deal.marketId);
    if (mkt) mkt.clients = Math.max(0, mkt.clients - 1);
    newState.notifications.push({
      id: newState.nextNotifId++,
      msg: `❌ DEAL LOST: ${deal.clientName} poached by rival — -$${Math.floor(deal.value * 0.5)}k reputation hit`,
      type: "danger"
    });
    newState.reputation = Math.max(0, newState.reputation - 3);
  });

  // Spontaneous new deals (rainmaker activity)
  const dealFrequency = (team.rainmakers * 0.15 * newState.reputation / 50) * (newState.activeEvent?.effect === "deal_frequency" ? newState.activeEvent.value : 1);
  if (Math.random() < dealFrequency) {
    const ownedMarkets = newState.markets.filter(m => m.owned);
    if (ownedMarkets.length > 0) {
      const mkt = ownedMarkets[Math.floor(Math.random() * ownedMarkets.length)];
      const dealType = DEAL_TYPES[Math.floor(Math.random() * DEAL_TYPES.length)];
      const baseValue = mkt.baseDeal * dealType.multiplier * (0.7 + Math.random() * 0.6);
      const clientNames = ["TechCorp", "Global Systems", "InnovateCo", "NexGen Partners", "Digital First", "CloudScale", "AI Ventures"];
      const clientName = clientNames[Math.floor(Math.random() * clientNames.length)] + " " + mkt.name;
      newState.deals.push({
        id: newState.nextDealId++,
        marketId: mkt.id,
        type: dealType,
        value: Math.floor(baseValue),
        progress: 0,
        clientName,
        atRisk: false,
        daysLeft: dealType.duration
      });
      mkt.clients = (mkt.clients || 0) + 1;
      newState.notifications.push({
        id: newState.nextNotifId++,
        msg: `📋 NEW DEAL: ${clientName} — $${Math.floor(baseValue)}k ${dealType.name}`,
        type: "info"
      });
    }
  }

  // Market control fluctuation
  newState.markets = newState.markets.map(mkt => {
    const m = { ...mkt };
    if (m.owned) {
      // Passive control gain
      const controlGain = (team.ops * 0.5 + team.rainmakers * 0.3);
      m.control = Math.min(100, m.control + controlGain * 0.1);
      // Rival pressure
      if (m.rivalControl > 20 && Math.random() < 0.1) {
        m.control = Math.max(10, m.control - 2);
        m.rivalControl = Math.min(90, m.rivalControl + 1);
      }
      if (m.control < 30) {
        m.contested = true;
      }
    }
    return m;
  });

  // Economic events (random trigger)
  if (!newState.activeEvent && Math.random() < 0.02) {
    const event = ECONOMIC_EVENTS[Math.floor(Math.random() * ECONOMIC_EVENTS.length)];
    newState.activeEvent = event;
    newState.eventDaysLeft = event.duration;
    newState.notifications.push({
      id: newState.nextNotifId++,
      msg: `⚡ MARKET EVENT: ${event.name} — ${event.desc}`,
      type: "warning"
    });
  } else if (newState.activeEvent) {
    newState.eventDaysLeft -= 1;
    if (newState.eventDaysLeft <= 0) {
      newState.notifications.push({
        id: newState.nextNotifId++,
        msg: `📊 EVENT ENDED: ${newState.activeEvent.name}`,
        type: "info"
      });
      newState.activeEvent = null;
    }
  }

  // Rival AI actions
  if (newState.day % 7 === 0) {
    const ownedMarkets = newState.markets.filter(m => m.owned);
    if (ownedMarkets.length > 0 && Math.random() < 0.4) {
      const targetMarket = ownedMarkets[Math.floor(Math.random() * ownedMarkets.length)];
      const rival = newState.rivals[Math.floor(Math.random() * newState.rivals.length)];
      const mktIdx = newState.markets.findIndex(m => m.id === targetMarket.id);
      newState.markets[mktIdx].rivalControl = Math.min(90, newState.markets[mktIdx].rivalControl + 10);
      newState.markets[mktIdx].contested = true;
      newState.notifications.push({
        id: newState.nextNotifId++,
        msg: `⚔️ ${rival.name} is challenging your ${targetMarket.name} territory!`,
        type: "danger"
      });
    }
  }

  // Financials
  newState.cash = newState.cash - dailyCost + dailyRevenue * 0.3; // 30% margin
  newState.revenue += dailyRevenue;

  // XP & Leveling
  if (newState.xp >= newState.xpToNext) {
    newState.level += 1;
    newState.xp = newState.xp - newState.xpToNext;
    newState.xpToNext = Math.floor(newState.xpToNext * 1.5);
    newState.reputation = Math.min(100, newState.reputation + 10);
    newState.notifications.push({
      id: newState.nextNotifId++,
      msg: `🌟 LEVEL UP! You are now Level ${newState.level} Rainmaker!`,
      type: "success"
    });
  }

  // Leaderboard update
  newState.leaderboard = newState.leaderboard.map(l => {
    if (l.name === "You") return { ...l, revenue: newState.revenue };
    return { ...l, revenue: l.revenue + Math.floor(Math.random() * 200 + 50) };
  }).sort((a, b) => b.revenue - a.revenue).map((l, i) => ({ ...l, rank: i + 1 }));

  // Trim notifications
  if (newState.notifications.length > 10) {
    newState.notifications = newState.notifications.slice(-10);
  }

  return newState;
}

// ============================================================
// COMBAT SYSTEM
// ============================================================
function runCombat(state, targetMarketId) {
  const market = state.markets.find(m => m.id === targetMarketId);
  if (!market) return { success: false, message: "Market not found" };

  const team = state.team;
  // Attack power = rainmakers * reputation + architects * 2
  const attackPower = (team.rainmakers * state.reputation) + (team.architects * 20) + (team.engineers * 10);
  const attackCost = Math.floor(market.baseDeal * 0.3); // cost to attack in $k

  if (state.cash < attackCost) {
    return { success: false, message: `Need $${attackCost}k to launch campaign`, cashNeeded: attackCost };
  }

  const defendPower = market.rivalControl * 1.5;
  const roll = Math.random();
  const winChance = attackPower / (attackPower + defendPower);
  const success = roll < winChance;

  return {
    success,
    message: success
      ? `🏆 Victory! ${market.name} market secured! (+${Math.floor(market.baseDeal * 0.5)}k revenue)`
      : `💀 Defeated! ${market.name} held by rivals. Regroup and try again.`,
    attackPower: Math.floor(attackPower),
    defendPower: Math.floor(defendPower),
    winChance: Math.floor(winChance * 100),
    cost: attackCost,
    marketId: targetMarketId,
    marketName: market.name,
  };
}

// ============================================================
// HIRE COSTS
// ============================================================
const HIRE_COSTS = {
  rainmakers: 800,
  architects: 600,
  engineers: 400,
  ops: 300,
};
const HIRE_LABELS = {
  rainmakers: "Rainmaker",
  architects: "Tech Architect",
  engineers: "Forward Engineer",
  ops: "Ops Manager",
};

// ============================================================
// MAIN GAME COMPONENT
// ============================================================
export default function RainmakersGame() {
  const [game, setGame] = useState(createInitialState);
  const tickRef = useRef(null);

  // Game loop
  const tick = useCallback(() => {
    setGame(prev => {
      if (prev.paused) return prev;
      return calculateTick(prev);
    });
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(tick, 5000);
    return () => clearInterval(tickRef.current);
  }, [tick]);

  // Actions
  const hireStaff = (role) => {
    const cost = HIRE_COSTS[role];
    setGame(prev => {
      if (prev.cash < cost) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        team: { ...prev.team, [role]: prev.team[role] + 1 },
        notifications: [...prev.notifications.slice(-9), {
          id: prev.nextNotifId, msg: `👔 Hired ${HIRE_LABELS[role]} for $${cost}k`, type: "info"
        }],
        nextNotifId: prev.nextNotifId + 1
      };
    });
  };

  const attackMarket = (marketId) => {
    setGame(prev => {
      const result = runCombat(prev, marketId);
      if (!result.success && result.cashNeeded) {
        return {
          ...prev,
          showCombat: true,
          combatTarget: marketId,
          combatResult: result
        };
      }
      const newMarkets = prev.markets.map(m => {
        if (m.id !== marketId) return m;
        if (result.success) {
          return { ...m, owned: true, control: 55, rivalControl: 20, contested: false };
        } else {
          return { ...m, rivalControl: Math.min(90, m.rivalControl + 10) };
        }
      });
      return {
        ...prev,
        cash: prev.cash - result.cost,
        markets: newMarkets,
        reputation: result.success ? Math.min(100, prev.reputation + 5) : Math.max(0, prev.reputation - 2),
        marketsWon: result.success ? prev.marketsWon + 1 : prev.marketsWon,
        showCombat: true,
        combatTarget: marketId,
        combatResult: result,
        xp: prev.xp + (result.success ? 200 : 50),
        notifications: [...prev.notifications.slice(-9), {
          id: prev.nextNotifId, msg: result.message, type: result.success ? "success" : "danger"
        }],
        nextNotifId: prev.nextNotifId + 1
      };
    });
  };

  const defenseBoost = (marketId) => {
    const cost = 100;
    setGame(prev => {
      if (prev.cash < cost) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        markets: prev.markets.map(m =>
          m.id === marketId ? { ...m, control: Math.min(100, m.control + 20), contested: false } : m
        ),
        notifications: [...prev.notifications.slice(-9), {
          id: prev.nextNotifId, msg: `🛡️ Deployed defense in ${prev.markets.find(m=>m.id===marketId)?.name}`, type: "info"
        }],
        nextNotifId: prev.nextNotifId + 1
      };
    });
  };

  const togglePause = () => setGame(prev => ({ ...prev, paused: !prev.paused }));

  const g = game;
  const totalStaff = g.team.rainmakers + g.team.architects + g.team.engineers + g.team.ops;
  const ownedMarkets = g.markets.filter(m => m.owned);
  const totalClients = g.markets.reduce((sum, m) => sum + m.clients, 0);
  const payroll = g.team.rainmakers * 2.5 + g.team.architects * 2.0 + g.team.engineers * 1.5 + g.team.ops * 1.0;
  const myRank = g.leaderboard.find(l => l.name === "You")?.rank || "-";

  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#e0e0e0",
      padding: "0",
      userSelect: "none",
    }}>
      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
        borderBottom: "2px solid #00ff88",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        boxShadow: "0 0 30px rgba(0,255,136,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <PixelRainmaker size={2} animated color="#00ff88" />
          <div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#00ff88", letterSpacing: "3px", textShadow: "0 0 10px #00ff88" }}>
              RAINMAKERS
            </div>
            <div style={{ fontSize: "10px", color: "#888", letterSpacing: "2px" }}>CONSULTING EMPIRE</div>
          </div>
          <div style={{
            background: "#1a2a1a", border: "1px solid #00ff88", borderRadius: "4px",
            padding: "4px 12px", fontSize: "12px", color: "#00ff88"
          }}>
            DAY {g.day} • LVL {g.level} • RANK #{myRank}
          </div>
          {g.activeEvent && (
            <div style={{
              background: "#2a1a00", border: "1px solid #ffaa00",
              borderRadius: "4px", padding: "4px 10px", fontSize: "11px", color: "#ffaa00",
              animation: "pulse 1s infinite"
            }}>
              ⚡ {g.activeEvent.name} ({g.eventDaysLeft}d)
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "REVENUE", value: `$${(g.revenue/1000).toFixed(1)}M`, color: "#00ff88" },
            { label: "CASH", value: `$${g.cash.toFixed(0)}k`, color: g.cash < 500 ? "#ff4444" : "#88ff88" },
            { label: "REPUTATION", value: `${g.reputation}%`, color: "#88aaff" },
            { label: "CLIENTS", value: totalClients, color: "#ffaa00" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px" }}>{stat.label}</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
          <button
            onClick={togglePause}
            style={{
              background: g.paused ? "#1a3a1a" : "#3a1a1a",
              border: `1px solid ${g.paused ? "#00ff88" : "#ff4444"}`,
              color: g.paused ? "#00ff88" : "#ff4444",
              padding: "6px 16px", cursor: "pointer", borderRadius: "4px",
              fontFamily: "inherit", fontSize: "12px", letterSpacing: "1px"
            }}
          >
            {g.paused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>

      {/* XP BAR */}
      <div style={{ background: "#111", height: "4px", position: "relative" }}>
        <div style={{
          background: "linear-gradient(90deg, #00ff88, #00aaff)",
          height: "100%",
          width: `${(g.xp / g.xpToNext) * 100}%`,
          transition: "width 0.5s"
        }} />
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", background: "#111",
        borderBottom: "1px solid #222", padding: "0 20px"
      }}>
        {[
          { id: "empire", label: "🗺️ EMPIRE" },
          { id: "deals", label: "💼 DEALS" },
          { id: "team", label: "👥 TEAM" },
          { id: "leaderboard", label: "🏆 BOARD" },
          { id: "intel", label: "📊 INTEL" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setGame(prev => ({ ...prev, activeTab: tab.id, showCombat: false }))}
            style={{
              background: "none", border: "none", color: g.activeTab === tab.id ? "#00ff88" : "#666",
              borderBottom: g.activeTab === tab.id ? "2px solid #00ff88" : "2px solid transparent",
              padding: "10px 16px", cursor: "pointer", fontFamily: "inherit",
              fontSize: "11px", letterSpacing: "2px", marginBottom: "-1px"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0", minHeight: "calc(100vh - 120px)" }}>
        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: "16px", overflow: "auto" }}>

          {/* ===== EMPIRE TAB ===== */}
          {g.activeTab === "empire" && (
            <div>
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "12px" }}>
                GLOBAL TERRITORY CONTROL
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "12px"
              }}>
                {g.markets.map(market => (
                  <div
                    key={market.id}
                    style={{
                      background: market.owned
                        ? "linear-gradient(135deg, #0d1f0d, #0d2a0d)"
                        : "linear-gradient(135deg, #1a0d0d, #1f1010)",
                      border: `1px solid ${market.owned ? (market.contested ? "#ffaa00" : "#00ff88") : "#ff3333"}`,
                      borderRadius: "6px",
                      padding: "14px",
                      position: "relative",
                      boxShadow: market.contested
                        ? "0 0 15px rgba(255,170,0,0.3)"
                        : market.owned ? "0 0 10px rgba(0,255,136,0.1)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "18px" }}>{market.icon}</div>
                        <div style={{ fontSize: "13px", fontWeight: "bold", color: market.owned ? "#00ff88" : "#ff6666" }}>
                          {market.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
                          {market.tier.toUpperCase()} • ${market.baseDeal}k avg deal
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {market.owned ? (
                          <div style={{ fontSize: "10px", color: "#00ff88" }}>
                            {market.clients} CLIENTS
                          </div>
                        ) : (
                          <div style={{ fontSize: "10px", color: "#ff6666" }}>HOSTILE</div>
                        )}
                        {market.contested && (
                          <div style={{
                            fontSize: "9px", color: "#ffaa00",
                            background: "#2a1a00", padding: "2px 6px", borderRadius: "3px", marginTop: "4px"
                          }}>
                            ⚔️ CONTESTED
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Control bars */}
                    <div style={{ marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#666", marginBottom: "3px" }}>
                        <span>YOUR CONTROL</span>
                        <span>{Math.floor(market.control)}%</span>
                      </div>
                      <div style={{ background: "#1a1a1a", height: "6px", borderRadius: "3px", overflow: "hidden", marginBottom: "4px" }}>
                        <div style={{ background: "#00ff88", height: "100%", width: `${market.control}%`, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#666", marginBottom: "3px" }}>
                        <span>RIVAL PRESSURE</span>
                        <span>{Math.floor(market.rivalControl)}%</span>
                      </div>
                      <div style={{ background: "#1a1a1a", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ background: "#ff4444", height: "100%", width: `${market.rivalControl}%`, transition: "width 0.5s" }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                      {!market.owned ? (
                        <button
                          onClick={() => attackMarket(market.id)}
                          style={{
                            flex: 1, background: "#3a0000", border: "1px solid #ff4444",
                            color: "#ff4444", padding: "6px", cursor: "pointer",
                            borderRadius: "4px", fontFamily: "inherit", fontSize: "10px",
                            letterSpacing: "1px"
                          }}
                        >
                          ⚔️ ATTACK (${Math.floor(market.baseDeal * 0.3)}k)
                        </button>
                      ) : (
                        <button
                          onClick={() => defenseBoost(market.id)}
                          style={{
                            flex: 1, background: "#001a1a", border: "1px solid #00aaff",
                            color: "#00aaff", padding: "6px", cursor: "pointer",
                            borderRadius: "4px", fontFamily: "inherit", fontSize: "10px",
                            letterSpacing: "1px"
                          }}
                        >
                          🛡️ FORTIFY ($100k)
                        </button>
                      )}
                    </div>

                    {/* Pixel characters decorating owned markets */}
                    {market.owned && (
                      <div style={{ position: "absolute", top: "8px", right: "8px", opacity: 0.3 }}>
                        <PixelRainmaker size={0.8} color="#00ff88" />
                      </div>
                    )}
                    {!market.owned && (
                      <div style={{ position: "absolute", top: "8px", right: "8px", opacity: 0.3 }}>
                        <PixelEnemy />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Combat result modal */}
              {g.showCombat && g.combatResult && (
                <div style={{
                  marginTop: "20px",
                  background: g.combatResult.success ? "#0d1f0d" : "#1f0d0d",
                  border: `2px solid ${g.combatResult.success ? "#00ff88" : "#ff4444"}`,
                  borderRadius: "8px", padding: "20px",
                  boxShadow: `0 0 30px ${g.combatResult.success ? "rgba(0,255,136,0.3)" : "rgba(255,68,68,0.3)"}`
                }}>
                  <div style={{ fontSize: "18px", marginBottom: "12px" }}>
                    {g.combatResult.success ? "🏆 VICTORY" : "💀 DEFEAT"}
                  </div>
                  <div style={{ color: g.combatResult.success ? "#00ff88" : "#ff6666", marginBottom: "8px" }}>
                    {g.combatResult.message}
                  </div>
                  {g.combatResult.attackPower !== undefined && (
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      Your Power: {g.combatResult.attackPower} vs Rival Defense: {g.combatResult.defendPower}
                      (Win chance was {g.combatResult.winChance}%) • Cost: ${g.combatResult.cost}k
                    </div>
                  )}
                  <button
                    onClick={() => setGame(prev => ({ ...prev, showCombat: false, combatResult: null }))}
                    style={{
                      marginTop: "12px", background: "#111", border: "1px solid #444",
                      color: "#aaa", padding: "6px 16px", cursor: "pointer",
                      borderRadius: "4px", fontFamily: "inherit", fontSize: "11px"
                    }}
                  >
                    DISMISS
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== DEALS TAB ===== */}
          {g.activeTab === "deals" && (
            <div>
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "12px" }}>
                ACTIVE PIPELINE — {g.deals.length} DEALS
              </div>

              {g.deals.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "40px", color: "#444",
                  border: "1px dashed #333", borderRadius: "8px"
                }}>
                  No active deals. Hire Rainmakers to generate deal flow.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {g.deals.map(deal => {
                    const market = g.markets.find(m => m.id === deal.marketId);
                    return (
                      <div
                        key={deal.id}
                        style={{
                          background: deal.atRisk ? "#1f1000" : "#0d1117",
                          border: `1px solid ${deal.atRisk ? "#ff8800" : "#223"}`,
                          borderRadius: "6px", padding: "14px",
                          display: "flex", alignItems: "center", gap: "14px",
                          flexWrap: "wrap"
                        }}
                      >
                        <PixelRainmaker size={1.5} color={deal.atRisk ? "#ff8800" : "#00ff88"} />
                        <div style={{ flex: 1, minWidth: "160px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#e0e0e0" }}>
                            {deal.clientName}
                            {deal.atRisk && <span style={{ color: "#ff8800", fontSize: "11px", marginLeft: "8px" }}>⚠️ AT RISK</span>}
                          </div>
                          <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                            {deal.type.name} • {market?.icon} {market?.name} • ${deal.value}k
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginBottom: "3px" }}>
                              <span>PROGRESS</span>
                              <span>{Math.floor(deal.progress)}% • {deal.daysLeft}d left</span>
                            </div>
                            <div style={{ background: "#1a1a1a", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{
                                background: deal.atRisk
                                  ? "linear-gradient(90deg, #ff8800, #ffaa00)"
                                  : "linear-gradient(90deg, #00ff88, #00aaff)",
                                height: "100%", width: `${deal.progress}%`, transition: "width 0.5s"
                              }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#00ff88" }}>
                            ${deal.value}k
                          </div>
                          <div style={{ fontSize: "10px", color: "#888" }}>
                            {deal.type.multiplier}x mult
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Revenue stats */}
              <div style={{
                marginTop: "20px",
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px"
              }}>
                {[
                  { label: "PIPELINE VALUE", value: `$${g.deals.reduce((s, d) => s + d.value, 0)}k` },
                  { label: "DEALS WON", value: g.totalDealsWon },
                  { label: "DEALS LOST", value: g.totalDealsLost },
                  { label: "WIN RATE", value: `${g.totalDealsWon + g.totalDealsLost > 0 ? Math.floor(g.totalDealsWon / (g.totalDealsWon + g.totalDealsLost) * 100) : 0}%` },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: "#0d1117", border: "1px solid #223",
                    borderRadius: "6px", padding: "14px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: "9px", color: "#666", letterSpacing: "1px" }}>{stat.label}</div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: "#00ff88", marginTop: "4px" }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== TEAM TAB ===== */}
          {g.activeTab === "team" && (
            <div>
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "12px" }}>
                BUILD YOUR TEAM — CASH: ${g.cash.toFixed(0)}k
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                {[
                  {
                    role: "rainmakers",
                    icon: "💼",
                    desc: "Generate deal flow. Each one adds $5-15M pipeline capacity.",
                    stat: `${g.team.rainmakers} hired`,
                    bonus: "+15% deal frequency per head"
                  },
                  {
                    role: "architects",
                    icon: "🏗️",
                    desc: "Win larger deals. Critical for $500k+ engagements.",
                    stat: `${g.team.architects} hired`,
                    bonus: "+20 combat power, unlocks enterprise tier"
                  },
                  {
                    role: "engineers",
                    icon: "⚙️",
                    desc: "Build and deliver. More engineers = faster deal completion.",
                    stat: `${g.team.engineers} hired`,
                    bonus: "+3% deal progress per day each"
                  },
                  {
                    role: "ops",
                    icon: "📋",
                    desc: "Protect clients. Reduce churn and control territory.",
                    stat: `${g.team.ops} hired`,
                    bonus: "+0.5% control per market per day"
                  },
                ].map(item => (
                  <div
                    key={item.role}
                    style={{
                      background: "#0d1117", border: "1px solid #223",
                      borderRadius: "8px", padding: "16px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <PixelRainmaker size={2} color={
                        item.role === "rainmakers" ? "#00ff88"
                          : item.role === "architects" ? "#00aaff"
                            : item.role === "engineers" ? "#ffaa00" : "#aa88ff"
                      } />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#e0e0e0" }}>
                          {item.icon} {HIRE_LABELS[item.role]}
                        </div>
                        <div style={{ fontSize: "10px", color: "#888" }}>{item.stat}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px" }}>{item.desc}</div>
                    <div style={{ fontSize: "10px", color: "#00aaff", marginBottom: "12px", fontStyle: "italic" }}>
                      {item.bonus}
                    </div>

                    {/* Current count indicator */}
                    <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                      {Array.from({ length: Math.min(g.team[item.role], 10) }).map((_, i) => (
                        <div key={i} style={{
                          width: "8px", height: "8px", background: "#00ff88", borderRadius: "1px"
                        }} />
                      ))}
                      {g.team[item.role] > 10 && (
                        <span style={{ fontSize: "10px", color: "#888" }}>+{g.team[item.role] - 10}</span>
                      )}
                    </div>

                    <button
                      onClick={() => hireStaff(item.role)}
                      disabled={g.cash < HIRE_COSTS[item.role]}
                      style={{
                        width: "100%",
                        background: g.cash >= HIRE_COSTS[item.role] ? "#0d2a0d" : "#1a1a1a",
                        border: `1px solid ${g.cash >= HIRE_COSTS[item.role] ? "#00ff88" : "#333"}`,
                        color: g.cash >= HIRE_COSTS[item.role] ? "#00ff88" : "#444",
                        padding: "8px", cursor: g.cash >= HIRE_COSTS[item.role] ? "pointer" : "not-allowed",
                        borderRadius: "4px", fontFamily: "inherit", fontSize: "11px",
                        letterSpacing: "1px"
                      }}
                    >
                      HIRE — ${HIRE_COSTS[item.role]}k
                    </button>
                  </div>
                ))}
              </div>

              {/* Revenue model */}
              <div style={{
                marginTop: "20px", background: "#0d1117",
                border: "1px solid #223", borderRadius: "8px", padding: "16px"
              }}>
                <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "12px" }}>
                  REVENUE MODEL HEALTH
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                  {[
                    { label: "DAILY PAYROLL", value: `-$${payroll.toFixed(1)}k`, color: "#ff6666" },
                    { label: "STAFF COUNT", value: totalStaff, color: "#88aaff" },
                    { label: "DELIVERY CAP", value: `$${((g.team.engineers * 1.5 + g.team.architects * 1.2) * 500).toFixed(0)}k`, color: "#ffaa00" },
                    { label: "MARKETS HELD", value: `${ownedMarkets.length}/${g.markets.length}`, color: "#00ff88" },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "#666", letterSpacing: "1px" }}>{stat.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: stat.color, marginTop: "4px" }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== LEADERBOARD TAB ===== */}
          {g.activeTab === "leaderboard" && (
            <div>
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "12px" }}>
                GLOBAL RAINMAKER LEADERBOARD
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {g.leaderboard.map((player, i) => {
                  const isMe = player.name === "You";
                  const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#888", "#888"];
                  return (
                    <div
                      key={player.name}
                      style={{
                        background: isMe ? "#0d1f0d" : "#0d1117",
                        border: `1px solid ${isMe ? "#00ff88" : "#223"}`,
                        borderRadius: "6px", padding: "14px",
                        display: "flex", alignItems: "center", gap: "16px",
                        boxShadow: isMe ? "0 0 15px rgba(0,255,136,0.15)" : "none"
                      }}
                    >
                      <div style={{
                        fontSize: "24px", fontWeight: "bold",
                        color: colors[i] || "#666", width: "40px", textAlign: "center"
                      }}>
                        #{player.rank}
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                        <PixelRainmaker size={1.5} color={isMe ? "#00ff88" : "#888"} />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "bold", color: isMe ? "#00ff88" : "#aaa" }}>
                            {player.name} {isMe && "← YOU"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#666" }}>
                            Rainmaker Empire
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "20px", fontWeight: "bold", color: isMe ? "#00ff88" : "#888" }}>
                          ${(player.revenue / 1000).toFixed(2)}M
                        </div>
                        <div style={{ fontSize: "10px", color: "#666" }}>TOTAL REVENUE</div>
                      </div>

                      {/* Revenue bar */}
                      <div style={{ width: "100px" }}>
                        <div style={{ background: "#1a1a1a", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{
                            background: isMe ? "#00ff88" : "#444",
                            height: "100%",
                            width: `${Math.min(100, (player.revenue / Math.max(...g.leaderboard.map(l => l.revenue))) * 100)}%`
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                marginTop: "20px", background: "#0d1117",
                border: "1px solid #223", borderRadius: "8px", padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>YOUR STATS</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#00ff88" }}>{g.marketsWon}</div>
                    <div style={{ fontSize: "10px", color: "#666" }}>MARKETS TAKEN</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ffaa00" }}>{g.totalDealsWon}</div>
                    <div style={{ fontSize: "10px", color: "#666" }}>DEALS CLOSED</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#88aaff" }}>{g.level}</div>
                    <div style={{ fontSize: "10px", color: "#666" }}>LEVEL</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ff8888" }}>{g.totalDealsLost}</div>
                    <div style={{ fontSize: "10px", color: "#666" }}>DEALS LOST</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== INTEL TAB ===== */}
          {g.activeTab === "intel" && (
            <div>
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "12px" }}>
                MARKET INTELLIGENCE & ECONOMIC CONDITIONS
              </div>

              {/* Current event */}
              {g.activeEvent ? (
                <div style={{
                  background: "#1a1000", border: "2px solid #ffaa00",
                  borderRadius: "8px", padding: "16px", marginBottom: "16px",
                  boxShadow: "0 0 20px rgba(255,170,0,0.2)"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#ffaa00", marginBottom: "6px" }}>
                    ⚡ ACTIVE: {g.activeEvent.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px" }}>{g.activeEvent.desc}</div>
                  <div style={{ fontSize: "11px", color: "#ffaa00" }}>
                    {g.eventDaysLeft} days remaining
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "#0d1117", border: "1px dashed #333",
                  borderRadius: "8px", padding: "16px", marginBottom: "16px",
                  color: "#444", textAlign: "center"
                }}>
                  No active market event. Markets are calm. For now.
                </div>
              )}

              {/* Economic scenarios */}
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "10px" }}>
                UPCOMING ECONOMIC SCENARIOS TO MONITOR
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px", marginBottom: "20px" }}>
                {ECONOMIC_EVENTS.map(evt => (
                  <div key={evt.id} style={{
                    background: "#0d1117", border: "1px solid #223",
                    borderRadius: "6px", padding: "12px"
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>{evt.name}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{evt.desc}</div>
                    <div style={{ fontSize: "10px", color: "#666", marginTop: "6px" }}>
                      Duration: {evt.duration} days
                    </div>
                  </div>
                ))}
              </div>

              {/* Rival intel */}
              <div style={{ fontSize: "11px", color: "#666", letterSpacing: "2px", marginBottom: "10px" }}>
                RIVAL FIRMS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {RIVAL_FIRMS.map(rival => (
                  <div key={rival.id} style={{
                    background: "#1a0d0d", border: "1px solid #3a1a1a",
                    borderRadius: "6px", padding: "12px",
                    display: "flex", alignItems: "center", gap: "14px"
                  }}>
                    <PixelEnemy color={rival.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ff8888" }}>{rival.name}</div>
                      <div style={{ fontSize: "11px", color: "#888" }}>
                        Aggression: {"█".repeat(Math.floor(rival.aggression * 10))}{"░".repeat(10 - Math.floor(rival.aggression * 10))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", color: "#ff6666" }}>${(rival.budget / 1000).toFixed(0)}M war chest</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS SIDEBAR */}
        <div style={{
          width: "260px", background: "#0a0a10",
          borderLeft: "1px solid #1a1a2a", padding: "14px",
          overflow: "auto", display: "flex", flexDirection: "column"
        }}>
          <div style={{ fontSize: "10px", color: "#666", letterSpacing: "2px", marginBottom: "10px" }}>
            📡 LIVE FEED
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[...g.notifications].reverse().map(notif => (
              <div
                key={notif.id}
                style={{
                  background: notif.type === "success" ? "#0d1f0d"
                    : notif.type === "danger" ? "#1f0d0d"
                      : notif.type === "warning" ? "#1a1000"
                        : "#0d1117",
                  border: `1px solid ${notif.type === "success" ? "#00ff88"
                    : notif.type === "danger" ? "#ff4444"
                      : notif.type === "warning" ? "#ffaa00" : "#223"}`,
                  borderRadius: "4px", padding: "8px",
                  fontSize: "11px", lineHeight: "1.4",
                  color: notif.type === "success" ? "#88ff88"
                    : notif.type === "danger" ? "#ff8888"
                      : notif.type === "warning" ? "#ffcc88" : "#aaa"
                }}
              >
                {notif.msg}
              </div>
            ))}
          </div>

          {/* Mini team display */}
          <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid #1a1a2a" }}>
            <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px", marginBottom: "8px" }}>YOUR FIRM</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {Array.from({ length: Math.min(totalStaff, 12) }).map((_, i) => (
                <PixelRainmaker
                  key={i}
                  size={0.9}
                  color={
                    i < g.team.rainmakers ? "#00ff88"
                      : i < g.team.rainmakers + g.team.architects ? "#00aaff"
                        : i < g.team.rainmakers + g.team.architects + g.team.engineers ? "#ffaa00" : "#aa88ff"
                  }
                />
              ))}
              {totalStaff > 12 && (
                <div style={{ fontSize: "11px", color: "#888", alignSelf: "center" }}>+{totalStaff - 12}</div>
              )}
            </div>
            <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>
              {g.team.rainmakers}💼 {g.team.architects}🏗️ {g.team.engineers}⚙️ {g.team.ops}📋
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.6 } }
        button:hover { filter: brightness(1.2); }
      `}</style>
    </div>
  );
}
