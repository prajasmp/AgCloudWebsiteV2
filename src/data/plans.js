/**
 * NOVEXHOST Centralized Plan & Pricing System
 * All prices have been increased by exactly 10% (New Price = Existing Price * 1.10).
 * Original prices are preserved as `originalPrice` for reference and auditing.
 * Prices are strictly static/deterministic so they are never multiplied again on reloads.
 */

export const CATEGORIES = {
  intel: "Intel Xeon Gaming",
  amd: "AMD EPYC Gaming",
  ryzen: "Ryzen 9 7950X Extreme",
  "intel-vps": "Intel Cloud VPS",
  "amd-vps": "AMD Cloud VPS",
  "ryzen-vps": "Ryzen Ultra VPS",
  domains: "Top-Level Domains",
  "bot-hosting": "Discord / App Bot Hosting"
};

export const CATEGORY_GROUPS = [
  { id: "plans", label: "Game Servers", categories: ["intel", "amd", "ryzen"] },
  { id: "vps", label: "Cloud VPS", categories: ["intel-vps", "amd-vps", "ryzen-vps"] },
  { id: "domains", label: "Domains", categories: ["domains"] },
  { id: "bot-hosting", label: "Bot Hosting", categories: ["bot-hosting"] }
];

export const DEFAULT_LOCATION = "Mumbai, India (Ultra Low Ping)";

export const SERVER_LOCATIONS = [
  { id: "in-bom", name: "Mumbai, India", flag: "🇮🇳", ping: "8-18ms", status: "Optimal" },
  { id: "sg-sin", name: "Singapore", flag: "🇸🇬", ping: "35-50ms", status: "Optimal" },
  { id: "de-fra", name: "Frankfurt, Germany", flag: "🇩🇪", ping: "110-130ms", status: "Active" },
  { id: "us-east", name: "Virginia, USA", flag: "🇺🇸", ping: "160-190ms", status: "Active" }
];

const GAME_FEATURES = [
  "DDoS Protection (1.2 Tbps)",
  "Instant Automated Setup",
  "Custom Pterodactyl Control Panel",
  "Subdomain Included",
  "Automated Daily Backups",
  "Full SFTP & Root Access",
  "99.9% Uptime Guarantee"
];

const GAME_PLAN_LABELS = {
  intel: "Intel High-Clock",
  amd: "AMD EPYC High-Density",
  ryzen: "Ryzen 9 7950X Extreme"
};

// Formula: New Price = Math.round(originalPrice * 1.10)
const gamePlan = (category, ram, originalPrice, cpu, storage, badge) => ({
  id: `${category}-${ram}gb`,
  category,
  name: `${GAME_PLAN_LABELS[category]} ${ram} GB`,
  ram: `${ram} GB DDR4/DDR5 RAM`,
  cpu: `${cpu}% Dedicated CPU`,
  storage: `${storage} GB NVMe SSD`,
  location: DEFAULT_LOCATION,
  originalPrice,
  price: Math.round(originalPrice * 1.10),
  period: "month",
  ...(badge ? { badge } : {}),
  features: GAME_FEATURES
});

const vpsPlan = (category, processor, ram, originalPrice, cores, storage, badge) => ({
  id: `${category}-${ram}gb`,
  category,
  name: `${processor} Cloud VPS ${ram} GB`,
  ram: `${ram} GB RAM`,
  cpu: `${cores} ${processor} vCores`,
  storage: `${storage} GB Gen4 NVMe`,
  location: DEFAULT_LOCATION,
  originalPrice,
  price: Math.round(originalPrice * 1.10),
  period: "month",
  ...(badge ? { badge } : {}),
  features: [
    "Full KVM Root Access",
    "Dedicated IPv4 Address Included",
    "1 Gbps Port Speed with Unmetered Bandwidth",
    "Enterprise DDoS Shield",
    "Custom OS (Ubuntu, Debian, AlmaLinux, Windows)",
    "Instant Automated Provisioning"
  ]
});

export const DOMAIN_PLANS = [
  { id: "domain-fun", category: "domains", name: ".fun", originalPrice: 199, price: Math.round(199 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-shop", category: "domains", name: ".shop", originalPrice: 299, price: Math.round(299 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-online", category: "domains", name: ".online", originalPrice: 199, price: Math.round(199 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-blog", category: "domains", name: ".blog", originalPrice: 499, price: Math.round(499 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-info", category: "domains", name: ".info", originalPrice: 399, price: Math.round(399 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-xyz", category: "domains", name: ".xyz", originalPrice: 199, price: Math.round(199 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-in", category: "domains", name: ".in", originalPrice: 499, price: Math.round(499 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-org", category: "domains", name: ".org", originalPrice: 999, price: Math.round(999 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-net", category: "domains", name: ".net", originalPrice: 1099, price: Math.round(1099 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-com", category: "domains", name: ".com", originalPrice: 899, price: Math.round(899 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] },
  { id: "domain-io", category: "domains", name: ".io", originalPrice: 2999, price: Math.round(2999 * 1.10), period: "year", features: ["DNS Management", "WHOIS Privacy", "Instant Activation"] }
];

export const GAME_PLANS = [
  gamePlan("intel", 2, 60, 75, 10),
  gamePlan("intel", 4, 120, 100, 20),
  gamePlan("intel", 6, 180, 150, 30),
  gamePlan("intel", 8, 240, 200, 40, "Popular"),
  gamePlan("intel", 16, 480, 300, 80),
  gamePlan("intel", 32, 960, 400, 160),
  gamePlan("intel", 64, 1920, 500, 320, "Enterprise"),
  gamePlan("amd", 2, 80, 100, 10),
  gamePlan("amd", 4, 160, 150, 20),
  gamePlan("amd", 6, 240, 200, 30),
  gamePlan("amd", 8, 320, 250, 40, "Popular"),
  gamePlan("amd", 16, 640, 350, 80),
  gamePlan("amd", 32, 1280, 450, 160),
  gamePlan("amd", 64, 2560, 500, 320, "Enterprise"),
  gamePlan("ryzen", 2, 220, 100, 10),
  gamePlan("ryzen", 4, 440, 150, 20),
  gamePlan("ryzen", 8, 880, 250, 40, "Popular"),
  gamePlan("ryzen", 12, 1320, 300, 60),
  gamePlan("ryzen", 16, 1760, 350, 80),
  gamePlan("ryzen", 24, 2640, 400, 120),
  gamePlan("ryzen", 32, 3520, 450, 160),
  gamePlan("ryzen", 64, 7040, 500, 320, "Maximum Performance")
];

export const VPS_PLANS = [
  vpsPlan("intel-vps", "Intel", 8, 339, 2, 60),
  vpsPlan("intel-vps", "Intel", 16, 879, 4, 96, "Popular"),
  vpsPlan("intel-vps", "Intel", 32, 1319, 8, 192),
  vpsPlan("intel-vps", "Intel", 48, 1759, 12, 288),
  vpsPlan("intel-vps", "Intel", 64, 2199, 16, 384),
  vpsPlan("amd-vps", "AMD", 8, 659, 2, 60),
  vpsPlan("amd-vps", "AMD", 16, 1099, 4, 96, "Popular"),
  vpsPlan("amd-vps", "AMD", 32, 2199, 8, 192),
  vpsPlan("amd-vps", "AMD", 48, 2529, 12, 288),
  vpsPlan("amd-vps", "AMD", 64, 3299, 16, 384),
  vpsPlan("ryzen-vps", "Ryzen", 4, 389, 2, 60, "High Clock"),
  vpsPlan("ryzen-vps", "Ryzen", 8, 789, 2, 60),
  vpsPlan("ryzen-vps", "Ryzen", 12, 1189, 3, 72),
  vpsPlan("ryzen-vps", "Ryzen", 16, 1589, 4, 96, "Popular"),
  vpsPlan("ryzen-vps", "Ryzen", 24, 2379, 6, 144),
  vpsPlan("ryzen-vps", "Ryzen", 32, 3469, 8, 192),
  vpsPlan("ryzen-vps", "Ryzen", 48, 4759, 12, 288),
  vpsPlan("ryzen-vps", "Ryzen", 64, 6339, 16, 384)
];

export const BOT_PLANS = [
  { id: "bot-1gb", category: "bot-hosting", name: "Bot Hosting 1 GB", ram: "1 GB RAM", cpu: "0.5 vCore", storage: "5 GB NVMe", originalPrice: 22, price: Math.round(22 * 1.10), period: "month" },
  { id: "bot-2gb", category: "bot-hosting", name: "Bot Hosting 2 GB", ram: "2 GB RAM", cpu: "1 vCore", storage: "10 GB NVMe", originalPrice: 44, price: Math.round(44 * 1.10), period: "month" },
  { id: "bot-4gb", category: "bot-hosting", name: "Bot Hosting 4 GB", ram: "4 GB RAM", cpu: "2 vCore", storage: "20 GB NVMe", originalPrice: 88, price: Math.round(88 * 1.10), period: "month", badge: "Popular" },
  { id: "bot-6gb", category: "bot-hosting", name: "Bot Hosting 6 GB", ram: "6 GB RAM", cpu: "3 vCore", storage: "30 GB NVMe", originalPrice: 132, price: Math.round(132 * 1.10), period: "month" },
  { id: "bot-8gb", category: "bot-hosting", name: "Bot Hosting 8 GB", ram: "8 GB RAM", cpu: "4 vCore", storage: "40 GB NVMe", originalPrice: 176, price: Math.round(176 * 1.10), period: "month" },
  { id: "bot-16gb", category: "bot-hosting", name: "Bot Hosting 16 GB", ram: "16 GB RAM", cpu: "8 vCore", storage: "80 GB NVMe", originalPrice: 352, price: Math.round(352 * 1.10), period: "month" }
];

export const ALL_PLANS = [
  ...GAME_PLANS,
  ...VPS_PLANS,
  ...DOMAIN_PLANS,
  ...BOT_PLANS
];

export const getPlanById = (id) => ALL_PLANS.find(p => p.id === id);

export function formatINR(val) {
  if (val === undefined || val === null || val === 'N/A') return 'N/A';
  return `₹${Number(val).toLocaleString('en-IN')}`;
}
