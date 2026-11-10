import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WEB_HOSTING_PLANS, BILLING_CYCLES, calculatePriceForCycle, formatINR } from '../data/plans';
import {
  Globe,
  ShieldCheck,
  Zap,
  Server,
  Database,
  Mail,
  Clock,
  Key,
  HardDrive,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  ChevronDown
} from 'lucide-react';

export default function WebHosting() {
  const [selectedCycle, setSelectedCycle] = useState('1mo');
  const [activeFaq, setActiveFaq] = useState(null);

  const currentCycle = BILLING_CYCLES.find(c => c.id === selectedCycle) || BILLING_CYCLES[0];

  const faqs = [
    {
      q: "What is cPanel Web Hosting and how quickly is it activated?",
      a: "NOVEXHOST cPanel Web Hosting is an enterprise-grade hosting solution for websites, WordPress, and PHP applications. Activation is immediate upon successful Razorpay payment verification through our automated provisioning cluster."
    },
    {
      q: "Does NOVEXHOST Web Hosting come with a Free SSL Certificate?",
      a: "Yes! Every website hosted on NOVEXHOST receives automatic, unlimited Let's Encrypt / AutoSSL certificates renewed seamlessly with zero manual configuration."
    },
    {
      q: "Can I host multiple websites under one plan?",
      a: "Our NOVEX SOLO plan supports 1 hosted website, NOVEX PREMIUM supports up to 3 domains, and NOVEX BUSINESS supports up to 10 hosted websites with 100 MySQL databases."
    },
    {
      q: "Do you provide SSH terminal access?",
      a: "Yes, our NOVEX BUSINESS tier includes direct secure SSH terminal access alongside Git deployment integration."
    },
    {
      q: "Do I need to create an account before ordering?",
      a: "No! NOVEXHOST features a 100% guest-friendly ordering system. You simply select your plan, enter your domain and contact info, and pay. You receive an unguessable tracking link and instant credentials."
    }
  ];

  return (
    <div className="web-hosting-page relative z-10 pt-28 pb-24 text-slate-100 min-h-screen">
      {/* Background Neon Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 right-10 w-[450px] h-[350px] bg-cyan-400/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(6,182,212,0.25)] backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            High-Performance NVMe Cloud
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6">
            Enterprise <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">cPanel Web Hosting</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Host lightning-fast WordPress, Node.js, and PHP websites on enterprise NVMe Gen4 storage, powered by official cPanel and 24/7 automated DDoS protection.
          </p>

          {/* Billing Cycle Picker */}
          <div className="mt-10 inline-flex p-1.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl shadow-2xl">
            {BILLING_CYCLES.map((cycle) => {
              const active = cycle.id === selectedCycle;
              return (
                <button
                  key={cycle.id}
                  onClick={() => setSelectedCycle(cycle.id)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {cycle.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
          {WEB_HOSTING_PLANS.map((plan) => {
            const cyclePrice = calculatePriceForCycle(plan.price, currentCycle.months);
            const isPopular = plan.badge === 'Most Popular';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                  isPopular
                    ? 'bg-gradient-to-b from-slate-900/90 via-cyan-950/20 to-slate-900/90 border-2 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.25)] scale-105 z-20'
                    : 'bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 shadow-xl'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white tracking-wide">{plan.name}</h3>
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Globe className="w-6 h-6" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-6">
                    Ideal for personal projects, blogs, and expanding businesses.
                  </p>

                  {/* Price display */}
                  <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-cyan-300">{formatINR(cyclePrice)}</span>
                      <span className="text-xs text-slate-400 font-medium">/ {currentCycle.duration}</span>
                    </div>
                    {currentCycle.months > 1 && (
                      <div className="text-xs text-cyan-400/80 mt-1">
                        Equivalent to {formatINR(plan.price)}/mo
                      </div>
                    )}
                  </div>

                  {/* Key Specs */}
                  <div className="space-y-3.5 mb-8">
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span><strong>{plan.websites}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.storage}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.databases}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.backups}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.emails}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Free AutoSSL Certificate</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-200">
                      <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Official cPanel Control Panel</span>
                    </div>
                    {plan.ssh && (
                      <div className="flex items-center gap-3 text-sm text-cyan-300 font-medium">
                        <Key className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>SSH Terminal &amp; Git Access</span>
                      </div>
                    )}
                    {plan.domain && (
                      <div className="flex items-center gap-3 text-sm text-amber-300 font-medium">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{plan.domain}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to={`/checkout/${plan.id}?cycle=${currentCycle.id}`}
                  className={`w-full py-4 rounded-xl text-center font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)]'
                      : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700 hover:border-cyan-400'
                  }`}
                >
                  <span>Deploy {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="rounded-3xl p-8 sm:p-12 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl mb-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Compare Web Hosting Plans</h2>
            <p className="text-slate-400 text-sm">Everything transparent. No hidden upgrade requirements.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-cyan-400 uppercase text-xs tracking-wider">
                  <th className="py-4 px-6 font-semibold">Features</th>
                  <th className="py-4 px-6 font-semibold">NOVEX SOLO</th>
                  <th className="py-4 px-6 font-semibold text-cyan-300">NOVEX PREMIUM</th>
                  <th className="py-4 px-6 font-semibold">NOVEX BUSINESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Monthly Price</td>
                  <td className="py-4 px-6">₹24.20</td>
                  <td className="py-4 px-6 text-cyan-300 font-bold">₹77.00</td>
                  <td className="py-4 px-6">₹220.00</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Websites Allowed</td>
                  <td className="py-4 px-6">1 Website</td>
                  <td className="py-4 px-6 text-cyan-300">3 Websites</td>
                  <td className="py-4 px-6">10 Websites</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">NVMe Storage</td>
                  <td className="py-4 px-6">10 GB NVMe</td>
                  <td className="py-4 px-6 text-cyan-300">20 GB NVMe</td>
                  <td className="py-4 px-6">50 GB NVMe</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">MySQL Databases</td>
                  <td className="py-4 px-6">2 Databases</td>
                  <td className="py-4 px-6 text-cyan-300">10 Databases</td>
                  <td className="py-4 px-6">100 Databases</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Backup Slots</td>
                  <td className="py-4 px-6">1 Slot</td>
                  <td className="py-4 px-6 text-cyan-300">7 Slots</td>
                  <td className="py-4 px-6">7 Slots</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Email Accounts</td>
                  <td className="py-4 px-6">2 Accounts</td>
                  <td className="py-4 px-6 text-cyan-300">3 Accounts</td>
                  <td className="py-4 px-6">50 Accounts</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Scheduled Cron Jobs</td>
                  <td className="py-4 px-6">5 Cron Jobs</td>
                  <td className="py-4 px-6 text-cyan-300">10 Cron Jobs</td>
                  <td className="py-4 px-6">25 Cron Jobs</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">cPanel Access</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&check; Included</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&check; Included</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&check; Included</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Free SSL Certificate</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&check; AutoSSL</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&check; AutoSSL</td>
                  <td className="py-4 px-6 text-emerald-400 font-semibold">&check; AutoSSL</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">SSH Access</td>
                  <td className="py-4 px-6 text-slate-500">&mdash;</td>
                  <td className="py-4 px-6 text-slate-500">&mdash;</td>
                  <td className="py-4 px-6 text-cyan-300 font-bold">&check; Direct SSH</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium text-white">Free Domain Eligibility</td>
                  <td className="py-4 px-6 text-slate-500">&mdash;</td>
                  <td className="py-4 px-6 text-amber-300 font-medium">Subject to terms</td>
                  <td className="py-4 px-6 text-amber-300 font-medium">Subject to terms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* cPanel Ecosystem Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Intuitive Administration
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Full cPanel Control with 1-Click App Installers
            </h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              Manage databases with phpMyAdmin, install WordPress, Joomla or Laravel in seconds via Softaculous, configure DNS records, and create professional business email accounts with ease.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <ShieldCheck className="w-6 h-6 text-cyan-400 mb-2" />
                <h4 className="font-bold text-white text-sm">Automated Security</h4>
                <p className="text-xs text-slate-400 mt-1">Real-time malware scanning and ModSecurity WAF.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Database className="w-6 h-6 text-cyan-400 mb-2" />
                <h4 className="font-bold text-white text-sm">MySQL &amp; MariaDB</h4>
                <p className="text-xs text-slate-400 mt-1">Instant database creation with phpMyAdmin.</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950/30 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-mono text-cyan-300">cPanel 120.0 (NOVEXHOST)</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Web Server Engine:</span>
                <span className="text-cyan-300">LiteSpeed / NGINX Hybrid</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">PHP Versions Supported:</span>
                <span className="text-white">PHP 7.4 &mdash; PHP 8.3 (Selector)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Disk I/O Speed:</span>
                <span className="text-emerald-400">Gen4 NVMe ~ 7,000 MB/s</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Nameservers:</span>
                <span className="text-cyan-300">ns1.novexhost.com / ns2.novexhost.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400">Got questions about Web Hosting? We've got answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-semibold text-white hover:text-cyan-300"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

