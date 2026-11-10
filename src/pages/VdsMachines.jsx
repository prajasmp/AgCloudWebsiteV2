import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { VDS_PLANS, BILLING_CYCLES, calculatePriceForCycle, formatINR } from '../data/plans';
import {
  Cpu,
  Server,
  Zap,
  ShieldAlert,
  HardDrive,
  Activity,
  Globe,
  Radio,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export default function VdsMachines() {
  const { family: urlFamily } = useParams();
  const [selectedFamily, setSelectedFamily] = useState(urlFamily || 'all');
  const [selectedCycle, setSelectedCycle] = useState('1mo');
  const [activeFaq, setActiveFaq] = useState(null);

  const currentCycle = BILLING_CYCLES.find(c => c.id === selectedCycle) || BILLING_CYCLES[0];

  const families = [
    { id: 'all', label: 'All VDS Machines', count: 6 },
    { id: 'ryzen9', label: 'AMD Ryzen 9 (Flagship)', count: 1 },
    { id: 'ryzen7', label: 'AMD Ryzen 7 Series', count: 2 },
    { id: 'xeon', label: 'Intel Xeon Series', count: 3 }
  ];

  const filteredPlans = selectedFamily === 'all'
    ? VDS_PLANS
    : VDS_PLANS.filter(p => p.family === selectedFamily);

  const faqs = [
    {
      q: "What is a NOVEXHOST VDS Machine?",
      a: "NOVEXHOST VDS Machines are dedicated physical bare-metal servers designed for extreme computing, heavy database clusters, virtualization nodes, and competitive game server networks. You receive the entire physical machine—no shared vCPUs and no noisy neighbors."
    },
    {
      q: "How does billing duration work for VDS Machines?",
      a: "You can purchase VDS machines for 1 Month, 3 Months, 6 Months, or 1 Year. Billing is calculated directly using the monthly rate, with exact INR invoicing via Razorpay."
    },
    {
      q: "Is IPMI / KVM out-of-band management provided?",
      a: "Yes! IPMI / KVM access is available where supported across our enterprise fleet, granting you direct out-of-band console access, BIOS configuration, and ISO mount capabilities."
    },
    {
      q: "What DDoS mitigation is included?",
      a: "All VDS machines come protected by our multi-layered Enterprise Anti-DDoS infrastructure with real-time BGP filtering and Cloudflare Magic Transit on supported clusters."
    },
    {
      q: "How long does physical machine deployment take?",
      a: "Upon verified Razorpay payment, our automated NOC provisioning engine allocates the physical hardware, configures your chosen OS via automated PXE netboot, tests connectivity, and delivers credentials via your secure order link."
    }
  ];

  return (
    <div className="vds-machines-page relative z-10 pt-28 pb-24 text-slate-100 min-h-screen">
      {/* Background Neon Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 left-10 w-[450px] h-[350px] bg-cyan-400/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(6,182,212,0.25)] backdrop-blur-md">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            Dedicated Bare-Metal Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6">
            NOVEXHOST <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">VDS Machines</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Dedicated physical bare-metal performance for mission-critical operations. Powered by flagship AMD Ryzen 9 9950X, Ryzen 7, and Intel Xeon E5 multi-threaded processors on unmetered 1 Gbps uplinks.
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

          {/* Family Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {families.map((fam) => {
              const active = fam.id === selectedFamily;
              return (
                <button
                  key={fam.id}
                  onClick={() => setSelectedFamily(fam.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {fam.label} ({fam.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Flagship Banner if Ryzen 9 is shown */}
        {(selectedFamily === 'all' || selectedFamily === 'ryzen9') && (
          <div className="relative rounded-3xl p-8 sm:p-10 mb-16 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
            <div className="absolute top-0 right-0 px-6 py-1.5 rounded-bl-2xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-md">
              Flagship Bare-Metal
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 text-cyan-400 text-sm font-semibold mb-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span>Zen 5 Architecture &bull; 16 Cores / 32 Threads</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  AMD Ryzen 9 9950X Machine
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-light">
                  Uncompromised single-core and multi-threaded horsepower. Equipped with 128 GB DDR4, 1 TB NVMe SSD, 1 Gbps unmetered uplink, and Cloudflare Magic Transit DDoS Shield.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block">CPU Clock</span>
                    <span className="text-sm font-bold text-white">Up to 5.7 GHz</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Memory</span>
                    <span className="text-sm font-bold text-cyan-300">128 GB DDR4</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Primary Drive</span>
                    <span className="text-sm font-bold text-white">1 TB NVMe</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Network Uplink</span>
                    <span className="text-sm font-bold text-emerald-400">1 Gbps Unmetered</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col justify-between h-full">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Total Pricing</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-cyan-300">
                      {formatINR(calculatePriceForCycle(35200, currentCycle.months))}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ {currentCycle.duration}</span>
                  </div>
                  <div className="text-xs text-cyan-400/80 mt-1">
                    Standard Rate: ₹35,200/mo (INR)
                  </div>
                </div>
                <Link
                  to={`/checkout/vds-ryzen9-9950x?cycle=${currentCycle.id}`}
                  className="mt-6 w-full py-3.5 rounded-xl text-center font-bold text-sm bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-2"
                >
                  <span>Order Flagship Ryzen 9</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Machine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24 items-stretch">
          {filteredPlans.map((plan) => {
            const cyclePrice = calculatePriceForCycle(plan.price, currentCycle.months);
            const isFlagship = plan.id === 'vds-ryzen9-9950x';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                  isFlagship
                    ? 'bg-gradient-to-b from-slate-900/90 via-cyan-950/20 to-slate-900/90 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 shadow-xl'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white tracking-wide">{plan.name}</h3>
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Server className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-cyan-300">{formatINR(cyclePrice)}</span>
                      <span className="text-xs text-slate-400 font-medium">/ {currentCycle.duration}</span>
                    </div>
                    {currentCycle.months > 1 && (
                      <div className="text-xs text-cyan-400/80 mt-1">
                        Equivalent to {formatINR(plan.price)}/mo
                      </div>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="space-y-3 mb-8 text-sm">
                    <div className="flex items-center gap-3 text-slate-200">
                      <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.processor}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span><strong>{plan.cores}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.ram}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.storage}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.network} &bull; {plan.bandwidth}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{plan.ipv4}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Full Root &amp; OS Control</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Enterprise DDoS Protection</span>
                    </div>
                    {plan.ipmi && (
                      <div className="flex items-center gap-3 text-cyan-300 font-medium">
                        <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{plan.ipmi}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to={`/checkout/${plan.id}?cycle=${currentCycle.id}`}
                  className="w-full py-3.5 rounded-xl text-center font-bold text-sm tracking-wide bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700 hover:border-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <span>Configure {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Physical Bare-Metal Architecture Highlight */}
        <div className="rounded-3xl p-8 sm:p-12 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl mb-24">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Bare-Metal Distinction
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              True Physical Machine Architecture
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
              Unlike shared VPS nodes or sliced VMs, each NOVEXHOST VDS machine gives you exclusive bare-metal access to CPU silicon, memory controllers, and PCIe NVMe lanes. Ideal for high-throughput game servers, Redis caches, high-frequency trading simulations, and private cloud hypervisors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
              <Cpu className="w-8 h-8 text-cyan-400 mb-3" />
              <h4 className="font-bold text-white mb-2">100% Dedicated Silicon</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero hypervisor overhead, full AVX-512 vector support, and uninterrupted sustained clock rates.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
              <Radio className="w-8 h-8 text-cyan-400 mb-3" />
              <h4 className="font-bold text-white mb-2">1 Gbps Unmetered Uplink</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct connections to Tier-1 international backbones with low latency routing across Asia and Europe.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
              <Terminal className="w-8 h-8 text-cyan-400 mb-3" />
              <h4 className="font-bold text-white mb-2">Out-of-Band IPMI / KVM</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hardware-level remote console access even if the operating system is offline or rebooting.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400">Everything you need to know about our physical VDS machines.</p>
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
