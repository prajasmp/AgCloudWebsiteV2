export const CATEGORIES = {
  intel: "Intel Plans",
  amd: "AMD Plans",
  ryzen: "Ryzen Plans",
  "intel-vps": "Intel VPS",
  "amd-vps": "AMD VPS",
  "ryzen-vps": "Ryzen VPS",
  domains: "Domains",
  "bot-hosting": "Bot Hosting"
};

export const CATEGORY_GROUPS = [
  { id: "plans", label: "Plans", categories: ["intel", "amd", "ryzen"] },
  { id: "vps", label: "VPS", categories: ["intel-vps", "amd-vps", "ryzen-vps"] },
  { id: "domains", label: "Domain", categories: ["domains"] },
  { id: "bot-hosting", label: "Bot Hosting", categories: ["bot-hosting"] }
];

export const DEFAULT_LOCATION = "India / Singapore";

const GAME_FEATURES = ["DDoS protection", "99.9% uptime", "Game panel access"];
const GAME_PLAN_LABELS = { intel: "Intel", amd: "AMD", ryzen: "Ryzen" };

const gamePlan = (category, ram, price, cpu, storage, badge) => ({
  id: `${category}-${ram}gb`,
  category,
  name: `${GAME_PLAN_LABELS[category]} Plan ${ram} GB`,
  ram: `${ram} GB RAM`,
  cpu: `${cpu}% CPU`,
  storage: `${storage} GB NVMe SSD`,
  location: DEFAULT_LOCATION,
  price,
  period: "month",
  ...(badge ? { badge } : {}),
  features: GAME_FEATURES
});

const vpsPlan = (category, processor, ram, price, cores, storage, badge) => ({
  id: `${category}-${ram}gb`,
  category,
  name: `${processor} VPS ${ram} GB`,
  ram: `${ram} GB RAM`,
  cpu: `${cores} ${processor} vCores`,
  storage: `${storage} GB NVMe SSD`,
  location: DEFAULT_LOCATION,
  price,
  period: "month",
  ...(badge ? { badge } : {}),
  features: ["Full root access", "DDoS protection", "1 Gbps port", "Manual verification"]
});

export const DOMAIN_PLANS = [
  { id: "domain-fun", category: "domains", name: ".fun", price: 200, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-net", category: "domains", name: ".net", price: 1299, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-com", category: "domains", name: ".com", price: 1499, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-in", category: "domains", name: ".in", price: 899, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-xyz", category: "domains", name: ".xyz", price: 499, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-io", category: "domains", name: ".io", price: 3299, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-online", category: "domains", name: ".online", price: 129, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-blog", category: "domains", name: ".blog", price: 259, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-shop", category: "domains", name: ".shop", price: 119, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-org", category: "domains", name: ".org", price: 949, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] },
  { id: "domain-info", category: "domains", name: ".info", price: 419, period: "year", features: ["Domain registration", "DNS management", "Create a Discord ticket to purchase"] }
];

export const GAME_PLANS = [
  gamePlan("intel", 2, 50, 75, 10),
  gamePlan("intel", 4, 100, 100, 20),
  gamePlan("intel", 6, 150, 150, 30),
  gamePlan("intel", 8, 200, 200, 40, "Popular"),
  gamePlan("intel", 16, 400, 300, 80),
  gamePlan("intel", 32, 800, 400, 160),
  gamePlan("intel", 64, 1600, 500, 320, "Maximum"),
  gamePlan("amd", 2, 80, 100, 10),
  gamePlan("amd", 4, 160, 150, 20),
  gamePlan("amd", 6, 240, 200, 30),
  gamePlan("amd", 8, 320, 250, 40, "Popular"),
  gamePlan("amd", 16, 640, 350, 80),
  gamePlan("amd", 32, 1280, 450, 160),
  gamePlan("amd", 64, 2560, 500, 320, "Maximum"),
  gamePlan("ryzen", 2, 220, 100, 10),
  gamePlan("ryzen", 4, 440, 150, 20),
  gamePlan("ryzen", 8, 880, 250, 40, "Popular"),
  gamePlan("ryzen", 12, 1320, 300, 60),
  gamePlan("ryzen", 16, 1760, 350, 80),
  gamePlan("ryzen", 24, 2640, 400, 120),
  gamePlan("ryzen", 32, 3520, 450, 160),
  gamePlan("ryzen", 64, 7040, 500, 320, "Maximum")
];

export const VPS_PLANS = [
  vpsPlan("intel-vps", "Intel", 8, 520, 2, 60),
  vpsPlan("intel-vps", "Intel", 16, 1040, 4, 96, "Popular"),
  vpsPlan("intel-vps", "Intel", 32, 2080, 8, 192),
  vpsPlan("intel-vps", "Intel", 48, 3120, 12, 288),
  vpsPlan("intel-vps", "Intel", 64, 4160, 16, 384),
  vpsPlan("amd-vps", "AMD", 8, 960, 2, 60),
  vpsPlan("amd-vps", "AMD", 16, 1920, 4, 96, "Popular"),
  vpsPlan("amd-vps", "AMD", 32, 3840, 8, 192),
  vpsPlan("amd-vps", "AMD", 48, 5760, 12, 288),
  vpsPlan("amd-vps", "AMD", 64, 7680, 16, 384),
  vpsPlan("ryzen-vps", "Ryzen", 4, 760, 2, 60, "Optional · If Available"),
  vpsPlan("ryzen-vps", "Ryzen", 8, 1520, 2, 60),
  vpsPlan("ryzen-vps", "Ryzen", 12, 2280, 3, 72),
  vpsPlan("ryzen-vps", "Ryzen", 16, 3040, 4, 96, "Popular"),
  vpsPlan("ryzen-vps", "Ryzen", 24, 4560, 6, 144),
  vpsPlan("ryzen-vps", "Ryzen", 32, 6080, 8, 192),
  vpsPlan("ryzen-vps", "Ryzen", 48, 9120, 12, 288),
  vpsPlan("ryzen-vps", "Ryzen", 64, 12160, 16, 384)
];

export const BOT_PLANS = [
  { id: "bot-1gb", category: "bot-hosting", name: "Bot Hosting 1 GB", ram: "1 GB RAM", cpu: "0.5 vCore", storage: "5 GB Disk", price: 35, period: "month" },
  { id: "bot-2gb", category: "bot-hosting", name: "Bot Hosting 2 GB", ram: "2 GB RAM", cpu: "1 vCore", storage: "10 GB Disk", price: 70, period: "month" },
  { id: "bot-4gb", category: "bot-hosting", name: "Bot Hosting 4 GB", ram: "4 GB RAM", cpu: "2 vCore", storage: "20 GB Disk", price: 140, period: "month", badge: "Popular" },
  { id: "bot-6gb", category: "bot-hosting", name: "Bot Hosting 6 GB", ram: "6 GB RAM", cpu: "3 vCore", storage: "30 GB Disk", price: 210, period: "month" },
  { id: "bot-8gb", category: "bot-hosting", name: "Bot Hosting 8 GB", ram: "8 GB RAM", cpu: "4 vCore", storage: "40 GB Disk", price: 280, period: "month" },
  { id: "bot-16gb", category: "bot-hosting", name: "Bot Hosting 16 GB", ram: "16 GB RAM", cpu: "8 vCore", storage: "80 GB Disk", price: 560, period: "month" }
];

export const ALL_PLANS = [
  ...GAME_PLANS,
  ...VPS_PLANS,
  ...DOMAIN_PLANS,
  ...BOT_PLANS
];

export const getPlanById = (id) => ALL_PLANS.find(p => p.id === id);
