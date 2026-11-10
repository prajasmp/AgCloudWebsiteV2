/**
 * NOVEXHOST Centralized Backend Plan Configuration
 * Applied 10% price increase: New Price = Math.round(originalPrice * 1.10)
 * Stores both originalPrice and price for transparent auditing and verification.
 */

export const TRUSTED_PLANS = {};

// 1. GAME PLANS (Intel, AMD, Ryzen)
const GAME_RAM_CONFIG = {
  intel: {
    rams: [2, 4, 6, 8, 16, 32, 64],
    originalPrices: [60, 120, 180, 240, 480, 960, 1920],
    cpus: [75, 100, 150, 200, 300, 400, 500]
  },
  amd: {
    rams: [2, 4, 6, 8, 16, 32, 64],
    originalPrices: [80, 160, 240, 320, 640, 1280, 2560],
    cpus: [100, 150, 200, 250, 350, 450, 500]
  },
  ryzen: {
    rams: [2, 4, 8, 12, 16, 24, 32, 64],
    originalPrices: [220, 440, 880, 1320, 1760, 2640, 3520, 7040],
    cpus: [100, 150, 250, 300, 350, 400, 450, 500]
  }
};

Object.keys(GAME_RAM_CONFIG).forEach(category => {
  const cfg = GAME_RAM_CONFIG[category];
  cfg.rams.forEach((ram, idx) => {
    const id = `${category}-${ram}gb`;
    const originalPrice = cfg.originalPrices[idx];
    const price = Math.round(originalPrice * 1.10);
    TRUSTED_PLANS[id] = {
      id,
      category,
      type: 'minecraft',
      name: `${category.toUpperCase()} Gaming ${ram} GB`,
      memoryMb: ram * 1024,
      diskMb: Math.max(10, ram * 5) * 1024,
      cpuPercent: cfg.cpus[idx] || 200,
      originalPrice,
      price,
      duration: '1 Month',
      durationDays: 30
    };
  });
});

// 2. BOT HOSTING PLANS
const BOT_DATA = [
  { ram: 1, originalPrice: 22, cpu: 50, diskGb: 5 },
  { ram: 2, originalPrice: 44, cpu: 100, diskGb: 10 },
  { ram: 4, originalPrice: 88, cpu: 200, diskGb: 20 },
  { ram: 6, originalPrice: 132, cpu: 300, diskGb: 30 },
  { ram: 8, originalPrice: 176, cpu: 400, diskGb: 40 },
  { ram: 16, originalPrice: 352, cpu: 800, diskGb: 80 }
];

BOT_DATA.forEach(item => {
  const id = `bot-${item.ram}gb`;
  const originalPrice = item.originalPrice;
  const price = Math.round(originalPrice * 1.10);
  TRUSTED_PLANS[id] = {
    id,
    category: 'bot-hosting',
    type: 'bot',
    name: `Bot Hosting ${item.ram} GB`,
    memoryMb: item.ram * 1024,
    diskMb: item.diskGb * 1024,
    cpuPercent: item.cpu,
    originalPrice,
    price,
    duration: '1 Month',
    durationDays: 30
  };
});

// 3. VPS PLANS
const VPS_DATA = [
  // Intel VPS
  { id: 'intel-vps-8gb', cat: 'intel-vps', ram: 8, originalPrice: 339, cores: 2, disk: 60 },
  { id: 'intel-vps-16gb', cat: 'intel-vps', ram: 16, originalPrice: 879, cores: 4, disk: 96 },
  { id: 'intel-vps-32gb', cat: 'intel-vps', ram: 32, originalPrice: 1319, cores: 8, disk: 192 },
  { id: 'intel-vps-48gb', cat: 'intel-vps', ram: 48, originalPrice: 1759, cores: 12, disk: 288 },
  { id: 'intel-vps-64gb', cat: 'intel-vps', ram: 64, originalPrice: 2199, cores: 16, disk: 384 },
  // AMD VPS
  { id: 'amd-vps-8gb', cat: 'amd-vps', ram: 8, originalPrice: 659, cores: 2, disk: 60 },
  { id: 'amd-vps-16gb', cat: 'amd-vps', ram: 16, originalPrice: 1099, cores: 4, disk: 96 },
  { id: 'amd-vps-32gb', cat: 'amd-vps', ram: 32, originalPrice: 2199, cores: 8, disk: 192 },
  { id: 'amd-vps-48gb', cat: 'amd-vps', ram: 48, originalPrice: 2529, cores: 12, disk: 288 },
  { id: 'amd-vps-64gb', cat: 'amd-vps', ram: 64, originalPrice: 3299, cores: 16, disk: 384 },
  // Ryzen VPS
  { id: 'ryzen-vps-4gb', cat: 'ryzen-vps', ram: 4, originalPrice: 389, cores: 2, disk: 60 },
  { id: 'ryzen-vps-8gb', cat: 'ryzen-vps', ram: 8, originalPrice: 789, cores: 2, disk: 60 },
  { id: 'ryzen-vps-12gb', cat: 'ryzen-vps', ram: 12, originalPrice: 1189, cores: 3, disk: 72 },
  { id: 'ryzen-vps-16gb', cat: 'ryzen-vps', ram: 16, originalPrice: 1589, cores: 4, disk: 96 },
  { id: 'ryzen-vps-24gb', cat: 'ryzen-vps', ram: 24, originalPrice: 2379, cores: 6, disk: 144 },
  { id: 'ryzen-vps-32gb', cat: 'ryzen-vps', ram: 32, originalPrice: 3469, cores: 8, disk: 192 },
  { id: 'ryzen-vps-48gb', cat: 'ryzen-vps', ram: 48, originalPrice: 4759, cores: 12, disk: 288 },
  { id: 'ryzen-vps-64gb', cat: 'ryzen-vps', ram: 64, originalPrice: 6339, cores: 16, disk: 384 }
];

VPS_DATA.forEach(v => {
  const originalPrice = v.originalPrice;
  const price = Math.round(originalPrice * 1.10);
  TRUSTED_PLANS[v.id] = {
    id: v.id,
    category: v.cat,
    type: 'vps',
    name: `${v.cat.toUpperCase()} ${v.ram} GB`,
    memoryMb: v.ram * 1024,
    diskMb: v.disk * 1024,
    cpuPercent: v.cores * 100,
    originalPrice,
    price,
    duration: '1 Month',
    durationDays: 30
  };
});

// 4. DOMAIN PLANS
const DOMAINS_DATA = [
  { id: "domain-fun", name: ".fun", originalPrice: 199 },
  { id: "domain-shop", name: ".shop", originalPrice: 299 },
  { id: "domain-online", name: ".online", originalPrice: 199 },
  { id: "domain-blog", name: ".blog", originalPrice: 499 },
  { id: "domain-info", name: ".info", originalPrice: 399 },
  { id: "domain-xyz", name: ".xyz", originalPrice: 199 },
  { id: "domain-in", name: ".in", originalPrice: 499 },
  { id: "domain-org", name: ".org", originalPrice: 999 },
  { id: "domain-net", name: ".net", originalPrice: 1099 },
  { id: "domain-com", name: ".com", originalPrice: 899 },
  { id: "domain-io", name: ".io", originalPrice: 2999 }
];

DOMAINS_DATA.forEach(dom => {
  const originalPrice = dom.originalPrice;
  const price = Math.round(originalPrice * 1.10);
  TRUSTED_PLANS[dom.id] = {
    id: dom.id,
    category: 'domains',
    type: 'domain',
    name: `Domain ${dom.name}`,
    memoryMb: 0,
    diskMb: 0,
    cpuPercent: 0,
    originalPrice,
    price,
    duration: '1 Year',
    durationDays: 365
  };
});

export function getTrustedPlan(planId) {
  return TRUSTED_PLANS[planId] || null;
}

export function getAllTrustedPlans() {
  return Object.values(TRUSTED_PLANS);
}

export function updatePlanPrice(planId, newPrice) {
  if (TRUSTED_PLANS[planId]) {
    TRUSTED_PLANS[planId].price = Number(newPrice);
    return TRUSTED_PLANS[planId];
  }
  return null;
}
