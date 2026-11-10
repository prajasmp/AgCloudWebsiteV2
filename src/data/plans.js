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
  "web-hosting": "cPanel Web Hosting",
  "vds-ryzen9": "AMD Ryzen 9 VDS Machines",
  "vds-ryzen7": "AMD Ryzen 7 VDS Machines",
  "vds-xeon": "Intel Xeon VDS Machines",
  domains: "Top-Level Domains",
  "bot-hosting": "Discord / App Bot Hosting"
};

export const CATEGORY_GROUPS = [
  { id: "web-hosting", label: "Web Hosting", categories: ["web-hosting"], path: "/web-hosting" },
  { id: "vds-machines", label: "VDS Machines", categories: ["vds-ryzen9", "vds-ryzen7", "vds-xeon"], path: "/vds-machines" },
  { id: "plans", label: "Game Servers", categories: ["intel", "amd", "ryzen"], path: "/plans" },
  { id: "vps", label: "Cloud VPS", categories: ["intel-vps", "amd-vps", "ryzen-vps"], path: "/plans/intel-vps" },
  { id: "domains", label: "Domains", categories: ["domains"], path: "/plans/domains" },
  { id: "bot-hosting", label: "Bot Hosting", categories: ["bot-hosting"], path: "/plans/bot-hosting" }
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

export const WEB_HOSTING_PLANS = [
  {
    id: "web-solo",
    category: "web-hosting",
    type: "web",
    name: "NOVEX SOLO",
    websites: "1 Website",
    storage: "10 GB NVMe Storage",
    databases: "2 MySQL Databases",
    backups: "1 Backup Slot",
    emails: "2 Email Accounts",
    cron: "5 Cron Jobs",
    ssl: "Free SSL Certificate",
    cpanel: "cPanel Access Included",
    originalPrice: 22,
    price: 24.20,
    period: "month",
    features: [
      "1 Hosted Website",
      "10 GB NVMe High-Speed Storage",
      "2 MySQL Databases",
      "1 Automated Backup Slot",
      "2 Professional Email Accounts",
      "5 Scheduled Cron Jobs",
      "Free AutoSSL Certificate",
      "cPanel Control Panel Included",
      "Unmetered Inbound Traffic"
    ]
  },
  {
    id: "web-premium",
    category: "web-hosting",
    type: "web",
    name: "NOVEX PREMIUM",
    websites: "3 Websites",
    storage: "20 GB NVMe Storage",
    databases: "10 MySQL Databases",
    backups: "7 Backup Slots",
    emails: "3 Email Accounts",
    cron: "10 Cron Jobs",
    ssl: "Free SSL Certificate",
    cpanel: "cPanel Access Included",
    domain: "Free Domain (subject to eligibility)",
    originalPrice: 70,
    price: 77,
    period: "month",
    badge: "Most Popular",
    features: [
      "3 Hosted Websites",
      "20 GB NVMe High-Speed Storage",
      "10 MySQL Databases",
      "7 Automated Backup Slots",
      "3 Professional Email Accounts",
      "10 Scheduled Cron Jobs",
      "Free Domain (subject to eligibility)",
      "Free AutoSSL Certificate",
      "cPanel Control Panel Included"
    ]
  },
  {
    id: "web-business",
    category: "web-hosting",
    type: "web",
    name: "NOVEX BUSINESS",
    websites: "10 Websites",
    storage: "50 GB NVMe Storage",
    databases: "100 MySQL Databases",
    backups: "7 Backup Slots",
    emails: "50 Email Accounts",
    cron: "25 Cron Jobs",
    ssl: "Free SSL Certificate",
    cpanel: "cPanel Access Included",
    ssh: "SSH Terminal Access",
    domain: "Free Domain (subject to eligibility)",
    originalPrice: 200,
    price: 220,
    period: "month",
    badge: "Enterprise Grade",
    features: [
      "10 Hosted Websites",
      "50 GB NVMe High-Speed Storage",
      "100 MySQL Databases",
      "7 Automated Backup Slots",
      "50 Professional Email Accounts",
      "25 Scheduled Cron Jobs",
      "Free Domain (subject to eligibility)",
      "Free AutoSSL Certificate",
      "Direct SSH Terminal Access",
      "cPanel Control Panel Included"
    ]
  }
];

export const VDS_PLANS = [
  // AMD Ryzen 9 (Flagship)
  {
    id: "vds-ryzen9-9950x",
    category: "vds-ryzen9",
    family: "ryzen9",
    type: "bare-metal",
    name: "AMD Ryzen 9 9950X",
    processor: "AMD Ryzen 9 9950X",
    cores: "16 Cores / 32 Threads",
    cpu: "16 Cores / 32 Threads @ up to 5.7 GHz",
    ram: "128 GB DDR4",
    storage: "1 TB NVMe SSD",
    bandwidth: "Unmetered Bandwidth",
    network: "1 Gbps Dedicated Port",
    ipv4: "1 Dedicated IPv4",
    access: "Full Root Access",
    ddos: "Enterprise Anti-DDoS / Cloudflare Magic Transit (where available)",
    ipmi: "IPMI / KVM (where available)",
    originalPrice: 32000,
    price: 35200,
    period: "month",
    badge: "Flagship VDS Bare-Metal",
    features: [
      "Full Physical Bare-Metal Machine",
      "Processor: AMD Ryzen 9 9950X (16C / 32T)",
      "128 GB High-Speed DDR4 RAM",
      "1 TB Enterprise Gen4 NVMe SSD",
      "Unmetered Bandwidth on 1 Gbps Port",
      "1 Dedicated Usable Public IPv4",
      "Complete Root & Bare-Metal OS Access",
      "Cloudflare Magic Transit DDoS Shield",
      "Hardware IPMI / KVM Management"
    ]
  },
  // AMD Ryzen 7
  {
    id: "vds-ryzen7-5700g",
    category: "vds-ryzen7",
    family: "ryzen7",
    type: "bare-metal",
    name: "AMD Ryzen 7 5700G",
    processor: "AMD Ryzen 7 5700G",
    cores: "8 Cores / 16 Threads",
    cpu: "8 Cores / 16 Threads @ 3.8 - 4.6 GHz",
    ram: "128 GB DDR4",
    storage: "1 TB NVMe SSD",
    bandwidth: "Unmetered Bandwidth",
    network: "1 Gbps Dedicated Port",
    ipv4: "1 Dedicated IPv4",
    access: "Full Root Access",
    ddos: "Enterprise Anti-DDoS Protection",
    originalPrice: 20000,
    price: 22000,
    period: "month",
    features: [
      "Dedicated Bare-Metal Architecture",
      "Processor: AMD Ryzen 7 5700G (8C / 16T)",
      "128 GB DDR4 RAM",
      "1 TB NVMe High-Speed SSD",
      "Unmetered Bandwidth",
      "1 Gbps Dedicated Network Uplink",
      "1 Dedicated Public IPv4",
      "Full Root & Administrative Access",
      "24/7 Enterprise DDoS Protection"
    ]
  },
  {
    id: "vds-ryzen7-5800x",
    category: "vds-ryzen7",
    family: "ryzen7",
    type: "bare-metal",
    name: "AMD Ryzen 7 5800X",
    processor: "AMD Ryzen 7 5800X",
    cores: "8 Cores / 16 Threads",
    cpu: "8 Cores / 16 Threads @ 3.8 - 4.7 GHz",
    ram: "128 GB DDR4",
    storage: "1 TB NVMe SSD",
    bandwidth: "Unmetered Bandwidth",
    network: "1 Gbps Dedicated Port",
    ipv4: "1 Dedicated IPv4",
    access: "Full Root Access",
    ddos: "Enterprise Anti-DDoS Protection",
    originalPrice: 20000,
    price: 22000,
    period: "month",
    badge: "High Clock Rate",
    features: [
      "Dedicated Bare-Metal Architecture",
      "Processor: AMD Ryzen 7 5800X (8C / 16T)",
      "128 GB DDR4 RAM",
      "1 TB NVMe High-Speed SSD",
      "Unmetered Bandwidth",
      "1 Gbps Dedicated Network Uplink",
      "1 Dedicated Public IPv4",
      "Full Root & Administrative Access",
      "24/7 Enterprise DDoS Protection"
    ]
  },
  // Intel Xeon
  {
    id: "vds-xeon-2699v4",
    category: "vds-xeon",
    family: "xeon",
    type: "bare-metal",
    name: "Intel Xeon E5-2699 v4",
    processor: "Intel Xeon E5-2699 v4",
    cores: "22 Cores / 44 Threads",
    cpu: "22 Cores / 44 Threads (High Density)",
    ram: "128 GB DDR4",
    storage: "1 TB NVMe SSD",
    bandwidth: "Unmetered Bandwidth",
    network: "1 Gbps Dedicated Port",
    ipv4: "1 Dedicated IPv4",
    access: "Full Root Access",
    ddos: "Enterprise Anti-DDoS Protection",
    ipmi: "IPMI / KVM (where available)",
    originalPrice: 25000,
    price: 27500,
    period: "month",
    badge: "44 High-Density Threads",
    features: [
      "Enterprise Multi-Thread Bare-Metal",
      "Processor: Intel Xeon E5-2699 v4 (22C / 44T)",
      "128 GB ECC Registered DDR4 RAM",
      "1 TB NVMe Storage Drive",
      "Unmetered Bandwidth on 1 Gbps Port",
      "1 Dedicated Public IPv4",
      "Complete Root OS Access",
      "Automated DDoS Mitigation",
      "IPMI / KVM Remote Management"
    ]
  },
  {
    id: "vds-xeon-2680v4",
    category: "vds-xeon",
    family: "xeon",
    type: "bare-metal",
    name: "Intel Xeon E5-2680 v4",
    processor: "Intel Xeon E5-2680 v4",
    cores: "14 Cores / 28 Threads",
    cpu: "14 Cores / 28 Threads",
    ram: "128 GB DDR4",
    storage: "1 TB NVMe SSD",
    bandwidth: "Unmetered Bandwidth",
    network: "1 Gbps Dedicated Port",
    ipv4: "1 Dedicated IPv4",
    access: "Full Root Access",
    ddos: "Enterprise Anti-DDoS Protection",
    ipmi: "IPMI / KVM (where available)",
    originalPrice: 25000,
    price: 27500,
    period: "month",
    features: [
      "Enterprise Multi-Thread Bare-Metal",
      "Processor: Intel Xeon E5-2680 v4 (14C / 28T)",
      "128 GB ECC Registered DDR4 RAM",
      "1 TB NVMe Storage Drive",
      "Unmetered Bandwidth on 1 Gbps Port",
      "1 Dedicated Public IPv4",
      "Complete Root OS Access",
      "Automated DDoS Mitigation",
      "IPMI / KVM Remote Management"
    ]
  },
  {
    id: "vds-xeon-2670v4",
    category: "vds-xeon",
    family: "xeon",
    type: "bare-metal",
    name: "Intel Xeon E5-2670 v4",
    processor: "Intel Xeon E5-2670 v4",
    cores: "14 Cores / 28 Threads",
    cpu: "14 Cores / 28 Threads",
    ram: "128 GB DDR4",
    storage: "1 TB NVMe SSD",
    bandwidth: "Unmetered Bandwidth",
    network: "1 Gbps Dedicated Port",
    ipv4: "1 Dedicated IPv4",
    access: "Full Root Access",
    ddos: "Enterprise Anti-DDoS Protection",
    ipmi: "IPMI / KVM (where available)",
    originalPrice: 25000,
    price: 27500,
    period: "month",
    features: [
      "Enterprise Multi-Thread Bare-Metal",
      "Processor: Intel Xeon E5-2670 v4 (14C / 28T)",
      "128 GB ECC Registered DDR4 RAM",
      "1 TB NVMe Storage Drive",
      "Unmetered Bandwidth on 1 Gbps Port",
      "1 Dedicated Public IPv4",
      "Complete Root OS Access",
      "Automated DDoS Mitigation",
      "IPMI / KVM Remote Management"
    ]
  }
];

export const BILLING_CYCLES = [
  { id: "1mo", label: "1 Month", months: 1, duration: "1 Month", days: 30 },
  { id: "3mo", label: "3 Months (Quarterly)", months: 3, duration: "3 Months", days: 90 },
  { id: "6mo", label: "6 Months (Half-Yearly)", months: 6, duration: "6 Months", days: 180 },
  { id: "12mo", label: "1 Year (Yearly)", months: 12, duration: "1 Year", days: 365 }
];

export const SUPPORTED_VDS_OS = [
  { id: "ubuntu-24-04", name: "Ubuntu 24.04 LTS (Noble Numbat)", tag: "Recommended", icon: "🐧" },
  { id: "ubuntu-22-04", name: "Ubuntu 22.04 LTS (Jammy Jellyfish)", tag: "LTS Stable", icon: "🐧" },
  { id: "debian-12", name: "Debian 12 (Bookworm)", tag: "Solid", icon: "🍥" },
  { id: "debian-13", name: "Debian 13 (Trixie)", tag: "Next-Gen", icon: "🍥" },
  { id: "almalinux-9", name: "AlmaLinux 9 (RHEL Compatible)", tag: "Enterprise", icon: "🛡️" },
  { id: "windows-server-2022", name: "Windows Server 2022 (BYOL / Eval)", tag: "Evaluation", icon: "🪟" }
];

export const ALL_PLANS = [
  ...GAME_PLANS,
  ...VPS_PLANS,
  ...DOMAIN_PLANS,
  ...BOT_PLANS,
  ...WEB_HOSTING_PLANS,
  ...VDS_PLANS
];

export const getPlanById = (id) => ALL_PLANS.find(p => p.id === id);

export function calculatePriceForCycle(baseMonthlyPrice, months = 1) {
  const m = Number(months) || 1;
  return Math.round(Number(baseMonthlyPrice) * m * 100) / 100;
}

export function formatINR(val) {
  if (val === undefined || val === null || val === 'N/A') return 'N/A';
  const num = Number(val);
  if (isNaN(num)) return 'N/A';
  if (Number.isInteger(num)) {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
