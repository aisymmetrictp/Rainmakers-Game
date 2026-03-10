import { HIRE_BASE_COSTS, STORAGE_KEY, $ } from "./constants.js";
import { createInitialState, computeProduction } from "./engine.js";

export function hire(prev, role) {
  const cost = HIRE_BASE_COSTS[role] * (1 + prev.team[role] * 0.12) * (prev.activeEvent?.effect === "talent_war" ? 1.6 : 1);
  if (prev.resources.cash < cost) return prev;
  const warn = prev.resources.cash - cost < 100000;
  return {
    ...prev,
    resources: { ...prev.resources, cash: prev.resources.cash - cost },
    team: { ...prev.team, [role]: prev.team[role] + 1 },
    log: [`👔 Hired ${role}.`, ...prev.log].slice(0, 14),
    notifications: [...prev.notifications.slice(-11), {
      id: prev.nextNotifId,
      msg: warn ? `👔 Hired ${role} — ⚠️ Cash now critical!` : `👔 Hired ${role} for ${$(cost)}`,
      type: warn ? "warning" : "info"
    }],
    nextNotifId: prev.nextNotifId + 1,
  };
}

export function startContract(prev, id) {
  const contract = prev.contracts.find(c => c.id === id);
  if (!contract || contract.active || contract.progress >= contract.duration) return prev;
  if (prev.resources.influence < contract.requiredInfluence) return prev;
  if (prev.contracts.filter(c => c.active).length >= Math.max(1, prev.team.ops)) return prev;
  return {
    ...prev,
    contracts: prev.contracts.map(c => c.id === id ? { ...c, active: true } : c),
    log: [`📋 Activated: ${contract.title}`, ...prev.log].slice(0, 14),
    notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: `📋 CONTRACT STARTED: ${contract.title}`, type: "info" }],
    nextNotifId: prev.nextNotifId + 1,
  };
}

export function attackMarket(prev, id) {
  const market = prev.markets.find(m => m.id === id);
  if (!market || market.locked) return prev;
  const cost = Math.max(25000, market.clientValue * 0.08);
  if (prev.resources.cash < cost) return prev;
  const prod = computeProduction(prev);
  const gain = Math.max(4, (prod.dealFlow + prod.designPower) / Math.max(3, market.prestige));
  return {
    ...prev,
    resources: { ...prev.resources, cash: prev.resources.cash - cost },
    markets: prev.markets.map(m => m.id === id ? { ...m, control: Math.min(100, m.control + gain), underAttack: false } : m),
    log: [`⚔️ Pursued ${market.name}.`, ...prev.log].slice(0, 14),
    notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: `⚔️ PURSUING: ${market.name} — ${$(cost)} deployed`, type: "info" }],
    nextNotifId: prev.nextNotifId + 1,
  };
}

export function defendMarket(prev, id) {
  const cost = 15000;
  const market = prev.markets.find(m => m.id === id);
  if (!market || prev.resources.cash < cost) return prev;
  return {
    ...prev,
    resources: { ...prev.resources, cash: prev.resources.cash - cost },
    markets: prev.markets.map(m => m.id === id
      ? { ...m, control: Math.min(100, m.control + 8 + prev.team.ops * 1.5), underAttack: false }
      : m),
    log: [`🛡️ Fortified ${market.name}.`, ...prev.log].slice(0, 14),
    notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: `🛡️ DEFENDED: ${market.name}`, type: "info" }],
    nextNotifId: prev.nextNotifId + 1,
  };
}

export function buyUpgrade(prev, id) {
  const u = prev.upgrades.find(x => x.id === id);
  if (!u || u.bought || prev.resources.cash < u.cost) return prev;
  let markets = prev.markets;
  if (id === "u5") markets = markets.map(m => m.id === "lon" ? { ...m, locked: false } : m);
  if (id === "u6") markets = markets.map(m => ["blr","sin","syd"].includes(m.id) ? { ...m, locked: false } : m);
  if (id === "u7") markets = markets.map(m => m.id === "dub" ? { ...m, locked: false } : m);
  return {
    ...prev,
    markets,
    resources: { ...prev.resources, cash: prev.resources.cash - u.cost },
    upgrades: prev.upgrades.map(x => x.id === id ? { ...x, bought: true } : x),
    log: [`🔧 Purchased: ${u.name}`, ...prev.log].slice(0, 14),
    notifications: [...prev.notifications.slice(-11), { id: prev.nextNotifId, msg: `🔧 UPGRADE: ${u.name} active!`, type: "success" }],
    nextNotifId: prev.nextNotifId + 1,
  };
}

export function prestigeReset(prev) {
  const ownedTurfs = prev.markets.filter(m => m.control >= 100).length;
  const prestigeGain = Math.max(1, Math.floor((prev.resources.globalScore + ownedTurfs * 60) / 500));
  const fresh = createInitialState();
  fresh.prestigeLevel = prev.prestigeLevel + prestigeGain;
  fresh.resources.cash += prestigeGain * 100000;
  fresh.resources.reputation += prestigeGain * 2;
  fresh.log = [`🌟 Prestige Reset. Gained +${prestigeGain} prestige. Stronger this run.`];
  return fresh;
}

export function newGame() {
  localStorage.removeItem(STORAGE_KEY);
  return createInitialState();
}
