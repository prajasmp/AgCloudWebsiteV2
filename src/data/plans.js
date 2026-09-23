export const CATEGORIES = {
  intel: "Intel Plans",
  amd: "AMD Plans",
  ryzen: "Ryzen Plans",
  "intel-vps": "Intel VPS",
  "amd-vps": "AMD VPS",
  "ryzen-vps": "Ryzen VPS",
  domains: "Domains",
  "bot-hosting": "Bot Hosting",
  boost: "Boost Plans",
  invite: "Invite Plans"
};

export const DEFAULT_LOCATION = "India / Singapore";

const makeGamePlans = (prefix, namePrefix, ramList, pricePerGb, cpuPercents) =>
  ramList.map((ram, i) => ({
    id: `${prefix}-${ram}gb`,
    category: prefix,
    name: `${namePrefix} ${ram} GB`,
    ram: `${ram} GB RAM`,
    cpu: `${cpuPercents[i]}% CPU`,
    storage: `${Math.max(10, ram * 5)} GB NVMe SSD`,
    price: ram * pricePerGb,
    period: "month",
    badge: ram === 8 ? "Popular" : ram === 64 ? "Maximum" : undefined,
    features: ["DDoS protection", "99.9% uptime", "Game panel access"]
  }));

const makeVpsPlans = (prefix, namePrefix, ramList, pricePerGb, cpuLabel) =>
  ramList.map(ram => ({
    id: `${prefix}-${ram}gb`,
    category: prefix,
    name: `${namePrefix} ${ram} GB`,
    ram: `${ram} GB RAM`,
    cpu: `${Math.max(2, Math.ceil(ram / 4))} ${cpuLabel}`,
    storage: `${Math.max(60, ram * 6)} GB NVMe SSD`,
    price: ram * pricePerGb,
    period: "month",
    badge: prefix === "ryzen-vps" && ram === 4 ? "Optional · Stock Limited" : ram === 16 ? "Popular" : undefined,
    features: ["Full root access", "DDoS protection", "1 Gbps port", "Manual verification"]
  }));

export const DOMAIN_PLANS = [
  { id: "domain-fun", category: "domains", name: ".fun", price: 199, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-shop", category: "domains", name: ".shop", price: 299, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-online", category: "domains", name: ".online", price: 199, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-blog", category: "domains", name: ".blog", price: 499, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-info", category: "domains", name: ".info", price: 399, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-xyz", category: "domains", name: ".xyz", price: 199, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-in", category: "domains", name: ".in", price: 499, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-org", category: "domains", name: ".org", price: 999, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-net", category: "domains", name: ".net", price: 1099, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-com", category: "domains", name: ".com", price: 899, period: "year", features: ["Domain registration", "DNS management"] },
  { id: "domain-io", category: "domains", name: ".io", price: 2999, period: "year", features: ["Domain registration", "DNS management"] }
];

export const FREE_REWARD_PLANS = [
  { id: "boost-1", category: "boost", name: "1 Boost", ram: "2 GB RAM", features: ["Server remains active while the boost is maintained"] },
  { id: "boost-2", category: "boost", name: "2 Boosts", ram: "4 GB RAM", features: ["Server remains active while both boosts are maintained"], badge: "Best Value" },
  { id: "invite-5", category: "invite", name: "5 Invites", ram: "2 GB RAM", storage: "4 GB Storage", cpu: "100% CPU" },
  { id: "invite-8", category: "invite", name: "8 Invites", ram: "4 GB RAM", storage: "6 GB Storage", cpu: "100% CPU" },
  { id: "invite-12", category: "invite", name: "12 Invites", ram: "6 GB RAM", storage: "8 GB Storage", cpu: "100% CPU" },
  { id: "invite-16", category: "invite", name: "16 Invites", ram: "8 GB RAM", storage: "10 GB Storage", cpu: "100% CPU" },
  { id: "invite-20", category: "invite", name: "20 Invites", ram: "12 GB RAM", storage: "16 GB Storage", cpu: "100% CPU" },
  { id: "invite-28", category: "invite", name: "28 Invites", ram: "16 GB RAM", storage: "20 GB Storage", cpu: "100% CPU", badge: "Maximum" }
];

export const BOT_PLANS = [1, 2, 4, 6, 8, 16].map(ram => ({
  id: `bot-${ram}gb`,
  category: "bot-hosting",
  name: `Bot Hosting ${ram} GB`,
  ram: `${ram} GB RAM`,
  cpu: `${Math.max(0.5, ram / 2)} vCore`,
  storage: `${Math.max(5, ram * 5)} GB Disk`,
  price: ram * 25,
  period: "month",
  badge: ram === 4 ? "Popular" : undefined,
  features: ["Node.js & Python support", "24/7 uptime", "Discord bot ready"]
}));

export const ALL_PLANS = [
  ...FREE_REWARD_PLANS,
  ...makeGamePlans("intel", "Intel Plan", [2, 4, 6, 8, 16, 32, 64], 25, [75, 100, 150, 200, 300, 400, 500]),
  ...makeGamePlans("amd", "AMD Plan", [2, 4, 6, 8, 16, 32, 64], 40, [100, 150, 200, 250, 350, 450, 500]),
  ...makeGamePlans("ryzen", "Ryzen Plan", [2, 4, 8, 12, 16, 24, 32, 64], 110, [100, 150, 250, 300, 350, 400, 450, 500]),
  ...makeVpsPlans("intel-vps", "Intel VPS", [8, 16, 32, 48, 64], 65, "Intel vCores"),
  ...makeVpsPlans("amd-vps", "AMD VPS", [8, 16, 32, 48, 64], 120, "AMD vCores"),
  ...makeVpsPlans("ryzen-vps", "Ryzen VPS", [4, 8, 12, 16, 24, 32, 48, 64], 190, "Ryzen vCores"),
  ...DOMAIN_PLANS,
  ...BOT_PLANS
];

export const getPlanById = (id) => ALL_PLANS.find(p => p.id === id);
