import { MARKETS, BASE_CONTRACTS, BASE_UPGRADES, ECONOMIC_EVENTS, $ } from "./constants.js";

// ============================================================
// INITIAL STATE
// ============================================================
export const createInitialState = () => ({
  resources: { cash: 250000, reputation: 5, influence: 0, wins: 0, losses: 0, globalScore: 0 },
  team: { rainmaker: 1, architect: 1, engineer: 2, ops: 1 },
  markets: MARKETS.map(m => ({ ...m, control: 0, underAttack: false, rivalControl: Math.floor(Math.random() * 40 + 20) })),
  contracts: BASE_CONTRACTS.map(c => ({ ...c, progress: 0, active: false })),
  upgrades: BASE_UPGRADES.map(u => ({ ...u })),
  activeEvent: null,
  eventSecondsLeft: 0,
  prestigeLevel: 0,
  cycleSpeed: 1,
  season: 1,
  day: 1,
  log: ["🎯 Firm launched. First mandate: dominate client turf."],
  notifications: [],
  nextNotifId: 1,
  lastCashWarningDay: 0,
  lastActive: Date.now(),
  leaderboard: [
    { name: "Apex Advisory",    score: 2210 },
    { name: "Signal Forge",     score: 1935 },
    { name: "Vector North",     score: 1702 },
    { name: "Your Firm",        score: 0    },
    { name: "Blue Orbit Partners", score: 1415 },
    { name: "Mercury Stack",    score: 1329 },
  ],
  paused: false,
  activeTab: "turf",
  showFeed: false,
});

// ============================================================
// PRODUCTION ENGINE (from prototype)
// ============================================================
export function computeProduction(state) {
  const u = Object.fromEntries(state.upgrades.map(x => [x.id, x.bought]));
  const rainmakerBoost = u.u1 ? 1.25 : 1;
  const architectBoost = u.u2 ? 1.20 : 1;
  const engineerBoost  = u.u3 ? 1.30 : 1;
  const opsBoost       = u.u4 ? 1.25 : 1;

  const eventMult = state.activeEvent?.effect === "deal_freeze" ? state.activeEvent.value : 1;

  const dealFlow     = state.team.rainmaker  * 5  * rainmakerBoost * eventMult;
  const designPower  = state.team.architect  * 4  * architectBoost;
  const buildPower   = state.team.engineer   * 6  * engineerBoost;
  const opsPower     = state.team.ops        * 3  * opsBoost;

  const activeTurfCount = state.markets.filter(m => m.control > 0).length;
  const territoryBonus  = 1 + activeTurfCount * 0.03;

  const deliveryPower = (designPower + buildPower + opsPower) * territoryBonus;
  const defensePower  = (designPower * 0.6 + opsPower * 1.6 + buildPower * 0.3) * territoryBonus;

  const payrollCostPerSec = (
    state.team.rainmaker * 450000 +
    state.team.architect * 250000 +
    state.team.engineer  * 160000 +
    state.team.ops       * 140000
  ) / (365 * 24 * 3600); // annualized → per second

  const payrollMult = state.activeEvent?.effect === "payroll_spike" ? state.activeEvent.value
                    : state.activeEvent?.effect === "cost_increase"  ? state.activeEvent.value : 1;

  return { dealFlow, designPower, buildPower, opsPower, deliveryPower, defensePower, payrollCostPerSec: payrollCostPerSec * payrollMult };
}

// ============================================================
// GAME TICK ENGINE
// ============================================================
export function tickGame(state, seconds = 1) {
  let next = JSON.parse(JSON.stringify(state));
  const prod = computeProduction(next);

  for (let s = 0; s < seconds; s++) {
    next.day += 1 / 86.4; // ~1 real second ≈ fractional game-day

    // ── Contracts ──────────────────────────────────────────
    next.contracts = next.contracts.map(contract => {
      if (!contract.active || contract.progress >= contract.duration) return contract;
      const speed = Math.max(0.35, prod.deliveryPower / (contract.difficulty * 15));
      const newProgress = Math.min(contract.duration, contract.progress + speed);
      if (newProgress >= contract.duration && contract.progress < contract.duration) {
        const bonus = next.activeEvent?.effect === "deal_multiplier" ? next.activeEvent.value : 1;
        const earned = Math.floor(contract.value * bonus);
        next.resources.cash       += earned;
        next.resources.reputation += Math.ceil(contract.value / 100000);
        next.resources.influence  += Math.ceil(contract.difficulty / 3);
        next.resources.globalScore+= Math.ceil(contract.value / 10000);
        next.resources.wins       += 1;
        next.log = [`✅ WON: ${contract.title} — ${$(earned)}`, ...next.log].slice(0, 14);
        next.notifications = [...next.notifications, { id: next.nextNotifId++, msg: `✅ CONTRACT WON: ${contract.title} — ${$(earned)}`, type: "success" }].slice(-12);
      }
      return { ...contract, progress: newProgress };
    });

    // ── Markets / Turf ──────────────────────────────────────
    next.markets = next.markets.map(market => {
      if (market.locked) return market;
      const eventRivalMult = next.activeEvent?.effect === "client_churn" ? (1 + next.activeEvent.value) : 1;
      const rivalHitBase = market.underAttack
        ? market.rivalPressure / Math.max(3, prod.defensePower)
        : market.rivalPressure / Math.max(8, prod.defensePower * 1.5);
      const rivalHit  = rivalHitBase * eventRivalMult;
      const passiveGrowth = market.control > 0
        ? (prod.dealFlow * 0.08 + prod.opsPower * 0.04) / Math.max(6, market.prestige)
        : prod.dealFlow / Math.max(20, market.prestige * 2);
      const nextControl = Math.max(0, Math.min(100, market.control + passiveGrowth - rivalHit));
      const freshAttack = Math.random() < 0.015 + market.prestige / 4000;
      const underAttack = freshAttack ? true : Math.random() < 0.88 ? market.underAttack : false;

      if (nextControl >= 100 && market.control < 100) {
        next.resources.cash       += market.clientValue * 0.12;
        next.resources.influence  += Math.ceil(market.prestige / 2);
        next.resources.globalScore+= Math.ceil(market.clientValue / 25000);
        next.log = [`🏆 CAPTURED: ${market.name}`, ...next.log].slice(0, 14);
        next.notifications = [...next.notifications, { id: next.nextNotifId++, msg: `🏆 TURF CAPTURED: ${market.name} — ${$(market.clientValue * 0.12)} earned!`, type: "success" }].slice(-12);
      }
      if (nextControl === 0 && market.control > 20) {
        next.resources.losses += 1;
        next.log = [`💀 LOST: ${market.name} to rival firm`, ...next.log].slice(0, 14);
        next.notifications = [...next.notifications, { id: next.nextNotifId++, msg: `💀 TURF LOST: ${market.name} taken by rivals!`, type: "danger" }].slice(-12);
      }
      return { ...market, control: nextControl, underAttack };
    });

    // ── Passive income from fully owned markets ─────────────
    const fullyOwned = next.markets.filter(m => m.control >= 100).length;
    next.resources.cash        += fullyOwned * 1200;
    next.resources.globalScore += fullyOwned * 0.2;

    // ── Payroll ─────────────────────────────────────────────
    next.resources.cash -= prod.payrollCostPerSec;

    // ── Cash floor / Bankruptcy (Fix 04) ───────────────────
    if (next.resources.cash < -500000) {
      next.resources.cash = 50000;
      next.resources.reputation = Math.max(0, next.resources.reputation - 5);
      const roles = ["engineer","ops","architect","rainmaker"];
      for (const role of roles) {
        if (next.team[role] > (role === "rainmaker" ? 1 : 0)) {
          next.team[role] -= 1;
          break;
        }
      }
      next.log = ["💸 BANKRUPTCY: Emergency bridge loan. Staff cut.", ...next.log].slice(0, 14);
      next.notifications = [...next.notifications, { id: next.nextNotifId++, msg: "💸 BANKRUPTCY EVENT: Bridge loan secured. Staff cut.", type: "danger" }].slice(-12);
    }

    // ── Cash low warning ────────────────────────────────────
    if (next.resources.cash < 100000 && next.day - next.lastCashWarningDay > 10) {
      next.lastCashWarningDay = next.day;
      next.notifications = [...next.notifications, { id: next.nextNotifId++, msg: "⚠️ CASH CRITICAL: Cover payroll or risk bankruptcy!", type: "warning" }].slice(-12);
    }

    // ── Economic events ─────────────────────────────────────
    if (!next.activeEvent && Math.random() < 0.003) {
      const evt = ECONOMIC_EVENTS[Math.floor(Math.random() * ECONOMIC_EVENTS.length)];
      next.activeEvent = evt;
      next.eventSecondsLeft = evt.duration;
      next.log = [`⚡ EVENT: ${evt.name} — ${evt.desc}`, ...next.log].slice(0, 14);
      next.notifications = [...next.notifications, { id: next.nextNotifId++, msg: `⚡ MARKET EVENT: ${evt.name} — ${evt.desc}`, type: "warning" }].slice(-12);
    } else if (next.activeEvent) {
      next.eventSecondsLeft -= 1;
      if (next.eventSecondsLeft <= 0) {
        next.log = [`📊 EVENT ENDED: ${next.activeEvent.name}`, ...next.log].slice(0, 14);
        next.activeEvent = null;
      }
    }

    // ── Leaderboard ──────────────────────────────────────────
    const myScore = Math.floor(next.resources.globalScore + next.resources.reputation * 15 + next.resources.influence * 10);
    next.leaderboard = next.leaderboard.map(l => {
      if (l.name === "Your Firm") return { ...l, score: myScore };
      return { ...l, score: l.score + (Math.random() < 0.01 ? Math.floor(Math.random() * 5 + 1) : 0) };
    }).sort((a, b) => b.score - a.score);
  }

  next.lastActive = Date.now();
  return next;
}
