export const STORAGE_KEY = "rainmakers-v2";
export const TICK_MS = 1000;
export const OFFLINE_CAP_SEC = 60 * 60 * 8; // 8 hours max offline

export const MARKETS = [
  { id: "sf",  name: "San Francisco", icon: "🌉", region: "N. America", type: "AI",         clientValue: 180000, prestige: 22, rivalPressure: 16, locked: false },
  { id: "chi", name: "Chicago",       icon: "🏛️", region: "N. America", type: "Strategy",   clientValue: 120000, prestige: 14, rivalPressure: 11, locked: false },
  { id: "nyc", name: "New York",      icon: "🏙️", region: "N. America", type: "Data",       clientValue: 225000, prestige: 28, rivalPressure: 20, locked: false },
  { id: "lon", name: "London",        icon: "🎡", region: "Europe",     type: "Salesforce", clientValue: 240000, prestige: 26, rivalPressure: 19, locked: true },
  { id: "blr", name: "Bangalore",     icon: "🇮🇳", region: "Asia",       type: "Automation", clientValue: 200000, prestige: 24, rivalPressure: 18, locked: true },
  { id: "sin", name: "Singapore",     icon: "🦁", region: "Asia",       type: "AI",         clientValue: 260000, prestige: 30, rivalPressure: 22, locked: true },
  { id: "dub", name: "Dubai",         icon: "🕌", region: "Middle East",type: "Strategy",   clientValue: 210000, prestige: 25, rivalPressure: 18, locked: true },
  { id: "syd", name: "Sydney",        icon: "🦘", region: "Oceania",    type: "Salesforce", clientValue: 175000, prestige: 18, rivalPressure: 15, locked: true },
];

export const BASE_CONTRACTS = [
  { id: "c1", title: "Fortune 500 AI Readiness Sprint",        segment: "Enterprise AI",  value: 350000, duration: 90,  difficulty: 20, requiredInfluence: 0  },
  { id: "c2", title: "Global Salesforce Architecture Overhaul",segment: "Salesforce",     value: 500000, duration: 140, difficulty: 28, requiredInfluence: 15 },
  { id: "c3", title: "Revenue Automation Transformation",       segment: "RevOps",         value: 275000, duration: 80,  difficulty: 18, requiredInfluence: 10 },
  { id: "c4", title: "Autonomous Services Pilot",              segment: "Automation",     value: 650000, duration: 180, difficulty: 35, requiredInfluence: 30 },
  { id: "c5", title: "Board-Level AI Strategy Retainer",       segment: "Strategy",       value: 900000, duration: 240, difficulty: 40, requiredInfluence: 45 },
];

export const BASE_UPGRADES = [
  { id: "u1", name: "Partner Flywheel",         desc: "+25% rainmaker deal flow",                    cost: 250000, bought: false, type: "multiplier" },
  { id: "u2", name: "Solution Blueprint Library",desc: "+20% architect efficiency",                   cost: 180000, bought: false, type: "multiplier" },
  { id: "u3", name: "Agentic Build Pipeline",   desc: "+30% engineer throughput",                    cost: 320000, bought: false, type: "multiplier" },
  { id: "u4", name: "Delivery Command Center",  desc: "+25% turf defense and contract speed",        cost: 300000, bought: false, type: "defense"    },
  { id: "u5", name: "Open Europe Desk",         desc: "Unlocks London — high-value Salesforce market", cost: 600000, bought: false, type: "unlock"     },
  { id: "u6", name: "Open APAC Desk",           desc: "Unlocks Bangalore, Singapore, Sydney",        cost: 1200000,bought: false, type: "unlock"     },
  { id: "u7", name: "Open Middle East Desk",    desc: "Unlocks Dubai — luxury strategy market",      cost: 900000, bought: false, type: "unlock"     },
];

export const ECONOMIC_EVENTS = [
  { id: "ai_boom",     name: "🚀 AI Investment Surge",    effect: "deal_multiplier", value: 1.5,  duration: 30, desc: "AI deals worth 50% more for 30s" },
  { id: "recession",   name: "📉 White-Collar Recession", effect: "client_churn",   value: 0.3,  duration: 60, desc: "Rival pressure +30% for 60s"     },
  { id: "regulation",  name: "⚖️ AI Regulation Wave",     effect: "cost_increase",  value: 1.4,  duration: 45, desc: "Payroll costs +40% for 45s"      },
  { id: "talent_war",  name: "💰 Talent War Erupts",      effect: "payroll_spike",  value: 1.6,  duration: 30, desc: "Hire costs +60% for 30s"         },
  { id: "client_boom", name: "🏢 Enterprise Boom",        effect: "deal_frequency", value: 1.5,  duration: 20, desc: "Deal flow +50% for 20s"          },
  { id: "market_crash",name: "💥 Market Crash",           effect: "deal_freeze",    value: 0.4,  duration: 45, desc: "Contract speed -60% for 45s"     },
];

export const RIVAL_FIRMS = [
  { id: "apex",    name: "Apex Advisory",      color: "#FF6B6B", aggression: 0.85 },
  { id: "signal",  name: "Signal Forge",       color: "#4ECDC4", aggression: 0.7  },
  { id: "vector",  name: "Vector North",       color: "#45B7D1", aggression: 0.75 },
  { id: "mercury", name: "Mercury Stack",      color: "#96CEB4", aggression: 0.6  },
];

export const HIRE_BASE_COSTS = { rainmaker: 450000, architect: 250000, engineer: 160000, ops: 140000 };

export const ROLE_COLORS = {
  rainmaker: "#ffbb33",
  architect: "#00aaff",
  engineer: "#bb88ff",
  ops: "#00ff88",
};

export const $ = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const fmt = (n) => new Intl.NumberFormat("en-US").format(Math.floor(n));
