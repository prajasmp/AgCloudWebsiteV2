const GAME_RAM_LIST = {
  intel: { pricePerGb: 25, cpus: [75, 100, 150, 200, 300, 400, 500] },
  amd: { pricePerGb: 40, cpus: [100, 150, 200, 250, 350, 450, 500] },
  ryzen: { pricePerGb: 110, cpus: [100, 150, 250, 300, 350, 400, 450, 500] }
};

const RAM_LISTS = {
  intel: [2, 4, 6, 8, 16, 32, 64],
  amd: [2, 4, 6, 8, 16, 32, 64],
  ryzen: [2, 4, 8, 12, 16, 24, 32, 64]
};

export const TRUSTED_PLANS = {};

Object.keys(GAME_RAM_LIST).forEach(category => {
  const cfg = GAME_RAM_LIST[category];
  const rams = RAM_LISTS[category];
  rams.forEach((ram, idx) => {
    const id = `${category}-${ram}gb`;
    TRUSTED_PLANS[id] = {
      id,
      category,
      type: 'minecraft',
      name: `${category.toUpperCase()} Plan ${ram} GB`,
      memoryMb: ram * 1024,
      diskMb: Math.max(10, ram * 5) * 1024,
      cpuPercent: cfg.cpus[idx] || 200,
      price: ram * cfg.pricePerGb,
      duration: '1 Month',
      durationDays: 30
    };
  });
});

[1, 2, 4, 6, 8, 16].forEach(ram => {
  const id = `bot-${ram}gb`;
  TRUSTED_PLANS[id] = {
    id,
    category: 'bot-hosting',
    type: 'bot',
    name: `Bot Hosting ${ram} GB`,
    memoryMb: ram * 1024,
    diskMb: Math.max(5, ram * 5) * 1024,
    cpuPercent: Math.max(50, (ram / 2) * 100),
    price: ram * 25,
    duration: '1 Month',
    durationDays: 30
  };
});

const VPS_PRICES = { 'intel-vps': 65, 'amd-vps': 120, 'ryzen-vps': 190 };
['intel-vps', 'amd-vps', 'ryzen-vps'].forEach(cat => {
  [4, 8, 12, 16, 24, 32, 48, 64].forEach(ram => {
    const id = `${cat}-${ram}gb`;
    TRUSTED_PLANS[id] = {
      id,
      category: cat,
      type: 'vps',
      name: `${cat.toUpperCase()} ${ram} GB`,
      memoryMb: ram * 1024,
      diskMb: Math.max(60, ram * 6) * 1024,
      cpuPercent: Math.max(200, Math.ceil(ram / 4) * 100),
      price: ram * (VPS_PRICES[cat] || 100),
      duration: '1 Month',
      durationDays: 30
    };
  });
});

[
  { id: "domain-fun", name: ".fun", price: 199 },
  { id: "domain-shop", name: ".shop", price: 299 },
  { id: "domain-online", name: ".online", price: 199 },
  { id: "domain-blog", name: ".blog", price: 499 },
  { id: "domain-info", name: ".info", price: 399 },
  { id: "domain-xyz", name: ".xyz", price: 199 },
  { id: "domain-in", name: ".in", price: 499 },
  { id: "domain-org", name: ".org", price: 999 },
  { id: "domain-net", name: ".net", price: 1099 },
  { id: "domain-com", name: ".com", price: 899 },
  { id: "domain-io", name: ".io", price: 2999 }
].forEach(dom => {
  TRUSTED_PLANS[dom.id] = {
    id: dom.id,
    category: 'domains',
    type: 'domain',
    name: `Domain ${dom.name}`,
    memoryMb: 0,
    diskMb: 0,
    cpuPercent: 0,
    price: dom.price,
    duration: '1 Year',
    durationDays: 365
  };
});

export function getTrustedPlan(planId) {
  return TRUSTED_PLANS[planId] || null;
}
