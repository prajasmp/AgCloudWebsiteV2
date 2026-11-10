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

// 5. WEB HOSTING PLANS (Reference NextyHost + 10%)
const WEB_HOSTING_DATA = [
  {
    id: 'web-solo',
    name: 'NOVEX SOLO',
    websites: 1,
    storageGb: 10,
    databases: 2,
    backups: 1,
    emails: 2,
    cron: 5,
    originalPrice: 22,
    price: 24.20
  },
  {
    id: 'web-premium',
    name: 'NOVEX PREMIUM',
    websites: 3,
    storageGb: 20,
    databases: 10,
    backups: 7,
    emails: 3,
    cron: 10,
    originalPrice: 70,
    price: 77
  },
  {
    id: 'web-business',
    name: 'NOVEX BUSINESS',
    websites: 10,
    storageGb: 50,
    databases: 100,
    backups: 7,
    emails: 50,
    cron: 25,
    originalPrice: 200,
    price: 220
  }
];

WEB_HOSTING_DATA.forEach(w => {
  TRUSTED_PLANS[w.id] = {
    id: w.id,
    category: 'web-hosting',
    type: 'web',
    name: w.name,
    websites: w.websites,
    storageGb: w.storageGb,
    diskMb: w.storageGb * 1024,
    databases: w.databases,
    backups: w.backups,
    emails: w.emails,
    cron: w.cron,
    originalPrice: w.originalPrice,
    price: w.price,
    duration: '1 Month',
    durationDays: 30
  };
});

// 6. VDS MACHINES - BARE-METAL PHYSICAL SERVERS (Reference NextyHost + 10%)
const VDS_DATA = [
  // AMD Ryzen 9
  {
    id: 'vds-ryzen9-9950x',
    category: 'vds-ryzen9',
    family: 'ryzen9',
    type: 'bare-metal',
    name: 'AMD Ryzen 9 9950X',
    processor: 'AMD Ryzen 9 9950X',
    cores: '16 Cores / 32 Threads',
    cpuPercent: 3200,
    ramGb: 128,
    memoryMb: 128 * 1024,
    storageGb: 1000,
    diskMb: 1000 * 1024,
    network: '1 Gbps',
    bandwidth: 'Unmetered',
    ipv4Count: 1,
    originalPrice: 32000,
    price: 35200
  },
  // AMD Ryzen 7
  {
    id: 'vds-ryzen7-5700g',
    category: 'vds-ryzen7',
    family: 'ryzen7',
    type: 'bare-metal',
    name: 'AMD Ryzen 7 5700G',
    processor: 'AMD Ryzen 7 5700G',
    cores: '8 Cores / 16 Threads',
    cpuPercent: 1600,
    ramGb: 128,
    memoryMb: 128 * 1024,
    storageGb: 1000,
    diskMb: 1000 * 1024,
    network: '1 Gbps',
    bandwidth: 'Unmetered',
    ipv4Count: 1,
    originalPrice: 20000,
    price: 22000
  },
  {
    id: 'vds-ryzen7-5800x',
    category: 'vds-ryzen7',
    family: 'ryzen7',
    type: 'bare-metal',
    name: 'AMD Ryzen 7 5800X',
    processor: 'AMD Ryzen 7 5800X',
    cores: '8 Cores / 16 Threads',
    cpuPercent: 1600,
    ramGb: 128,
    memoryMb: 128 * 1024,
    storageGb: 1000,
    diskMb: 1000 * 1024,
    network: '1 Gbps',
    bandwidth: 'Unmetered',
    ipv4Count: 1,
    originalPrice: 20000,
    price: 22000
  },
  // Intel Xeon
  {
    id: 'vds-xeon-2699v4',
    category: 'vds-xeon',
    family: 'xeon',
    type: 'bare-metal',
    name: 'Intel Xeon E5-2699 v4',
    processor: 'Intel Xeon E5-2699 v4',
    cores: '22 Cores / 44 Threads',
    cpuPercent: 4400,
    ramGb: 128,
    memoryMb: 128 * 1024,
    storageGb: 1000,
    diskMb: 1000 * 1024,
    network: '1 Gbps',
    bandwidth: 'Unmetered',
    ipv4Count: 1,
    originalPrice: 25000,
    price: 27500
  },
  {
    id: 'vds-xeon-2680v4',
    category: 'vds-xeon',
    family: 'xeon',
    type: 'bare-metal',
    name: 'Intel Xeon E5-2680 v4',
    processor: 'Intel Xeon E5-2680 v4',
    cores: '14 Cores / 28 Threads',
    cpuPercent: 2800,
    ramGb: 128,
    memoryMb: 128 * 1024,
    storageGb: 1000,
    diskMb: 1000 * 1024,
    network: '1 Gbps',
    bandwidth: 'Unmetered',
    ipv4Count: 1,
    originalPrice: 25000,
    price: 27500
  },
  {
    id: 'vds-xeon-2670v4',
    category: 'vds-xeon',
    family: 'xeon',
    type: 'bare-metal',
    name: 'Intel Xeon E5-2670 v4',
    processor: 'Intel Xeon E5-2670 v4',
    cores: '14 Cores / 28 Threads',
    cpuPercent: 2800,
    ramGb: 128,
    memoryMb: 128 * 1024,
    storageGb: 1000,
    diskMb: 1000 * 1024,
    network: '1 Gbps',
    bandwidth: 'Unmetered',
    ipv4Count: 1,
    originalPrice: 25000,
    price: 27500
  }
];

VDS_DATA.forEach(v => {
  TRUSTED_PLANS[v.id] = {
    id: v.id,
    category: v.category,
    family: v.family,
    type: 'bare-metal',
    name: v.name,
    processor: v.processor,
    cores: v.cores,
    ramGb: v.ramGb,
    ram: `${v.ramGb} GB DDR4`,
    storageGb: v.storageGb,
    storage: '1 TB NVMe SSD',
    memoryMb: v.memoryMb,
    diskMb: v.diskMb,
    cpuPercent: v.cpuPercent,
    network: v.network,
    bandwidth: v.bandwidth,
    ipv4Count: v.ipv4Count,
    originalPrice: v.originalPrice,
    price: v.price,
    duration: '1 Month',
    durationDays: 30
  };
});

/**
 * Resolves billing cycle multipliers
 */
export function getBillingCycleDetails(cycleInput) {
  const norm = String(cycleInput || '1mo').toLowerCase().trim();
  if (norm === '12mo' || norm === '12' || norm === '1year' || norm === 'yearly' || norm === '1y') {
    return { multiplier: 12, duration: '1 Year', durationDays: 365, cycleId: '12mo' };
  }
  if (norm === '6mo' || norm === '6' || norm === 'half-yearly' || norm === '6months' || norm === '6m') {
    return { multiplier: 6, duration: '6 Months', durationDays: 180, cycleId: '6mo' };
  }
  if (norm === '3mo' || norm === '3' || norm === 'quarterly' || norm === '3months' || norm === '3m') {
    return { multiplier: 3, duration: '3 Months', durationDays: 90, cycleId: '3mo' };
  }
  return { multiplier: 1, duration: '1 Month', durationDays: 30, cycleId: '1mo' };
}

export function calculateOrderAmount(plan, cycleInput) {
  const cycle = getBillingCycleDetails(cycleInput);
  const totalAmount = Math.round(Number(plan.price) * cycle.multiplier * 100) / 100;
  const amountInPaise = Math.round(totalAmount * 100);
  return {
    ...cycle,
    monthlyPrice: plan.price,
    totalAmount,
    amountInPaise
  };
}

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
