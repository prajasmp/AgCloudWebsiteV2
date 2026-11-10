import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap, Shield, Cpu, Gauge, Headphones, Lock, Sparkles,
  ArrowRight, Globe, Layers, Server, Puzzle, Users, CheckCircle2
} from 'lucide-react';
import ElectricNodeDiagram from '../components/ElectricNodeDiagram';
import ScrollReveal from '../components/ScrollReveal';

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.8,
      dx: (Math.random() - 0.5) * 0.4,
      dy: -Math.random() * 0.5 - 0.2,
      alpha: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.3 ? '#00f2fe' : '#06b6d4'
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const gameCards = [
    { name: 'Minecraft', badge: 'Popular', icon: '/assets/minecraft_icon.png', isOrange: false }
  ];

  const hudFeatures = [
    { icon: Globe, title: 'GLOBAL NODES' },
    { icon: Shield, title: 'ANTI-DDOS' },
    { icon: Cpu, title: 'NVMe STORAGE' },
    { icon: Zap, title: 'INSTANT SETUP' },
    { icon: Puzzle, title: 'MOD SUPPORT' }
  ];

  const features = [
    {
      icon: Cpu,
      title: 'Modern Infrastructure',
      description: 'Ultra-fast NVMe storage and dedicated server hardware optimized for high tickrates.'
    },
    {
      icon: Gauge,
      title: 'Ultra-Low Latency',
      description: 'High-speed network routes tuned specifically for India and South Asia regions.'
    },
    {
      icon: Shield,
      title: 'Enterprise Anti-DDoS',
      description: 'Always-on 1.2 Tbps DDoS protection filtering volumetric & application layer attacks.'
    },
    {
      icon: Headphones,
      title: '24/7 Human Support',
      description: 'Direct assistance from specialized systems engineers through Discord and tickets.'
    },
    {
      icon: Lock,
      title: 'Instant Server Setup',
      description: 'Automated instant deployment right after payment verification. No waiting required.'
    },
    {
      icon: Sparkles,
      title: 'Full Root / Panel Access',
      description: 'Complete control via custom Pterodactyl dashboard with custom SFTP & Web Console.'
    }
  ];

  return (
    <div className="home-redesign-wrapper">

      <section className="ag-hero-container">

        <canvas ref={canvasRef} className="ag-hero-canvas" />

        <div className="ag-ambient-glow cyan" />
        <div className="ag-ambient-glow blue" />

        <div className="ag-hero-art-layer">
          <img
            src="/assets/novexhost_hero_cinematic.png"
            alt="NOVEXHOST Futuristic Cloud Infrastructure"
            className="ag-cinematic-bg-img"
          />
          <div className="ag-art-gradient-overlay" />

          <div className="ag-artwork-text-left">
            <span className="ag-art-line">BUILD</span>
            <span className="ag-art-line">DEPLOY</span>
            <span className="ag-art-line">SCALE</span>
            <span className="ag-art-line cyan-highlight">UNLIMITED</span>
          </div>

          <div className="ag-artwork-text-right">
            <span>PREMIUM CLOUD &amp; VPS HOSTING</span>
          </div>

          <div className="ag-pathway-texts">
            <span className="pathway-word word-1">FASTER</span>
            <span className="pathway-word word-2">SAFER</span>
            <span className="pathway-word word-3">STRONGER</span>
          </div>
        </div>

        <div className="container ag-hero-content-grid">

          <div className="ag-hero-left">
            <ScrollReveal animation="fade-up" delay={100}>
              <div className="ag-glass-badge">
                <Sparkles size={14} className="badge-sparkle" />
                <span>Next-Gen Cloud Platform</span>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200}>
              <h1 className="ag-hero-title">
                POWER YOUR<br />
                WORLD WITH<br />
                <span className="cyan-electric-text">NOVEXHOST</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={300}>
              <p className="ag-hero-desc">
                High-performance game servers, Gen4 NVMe Cloud VPS, Discord bot hosting, and domains with automated instant deployment and 24/7 technical support.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={400}>
              <div className="ag-compact-features">
                <div className="ag-feature-pill">
                  <Zap size={16} className="pill-icon cyan" />
                  <div>
                    <span className="pill-title">Ultra Low Ping</span>
                    <span className="pill-val">&lt;12ms</span>
                  </div>
                </div>

                <div className="ag-feature-pill">
                  <Shield size={16} className="pill-icon blue" />
                  <div>
                    <span className="pill-title">DDoS Protected</span>
                    <span className="pill-val">Always On</span>
                  </div>
                </div>

                <div className="ag-feature-pill">
                  <Server size={16} className="pill-icon cyan" />
                  <div>
                    <span className="pill-title">99.9% Uptime</span>
                    <span className="pill-val">Reliable</span>
                  </div>
                </div>

                <div className="ag-feature-pill">
                  <Users size={16} className="pill-icon blue" />
                  <div>
                    <span className="pill-title">24/7 Support</span>
                    <span className="pill-val">Human Team</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={500}>
              <div className="ag-hero-ctas">
                <Link to="/plans" className="ag-primary-cta">
                  <span>Explore Plans</span>
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="https://discord.gg/novexhost"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ag-discord-cta"
                >
                  <svg className="discord-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>Join Discord</span>
                </a>
              </div>
            </ScrollReveal>
          </div>

          <div className="ag-hero-right">

            <ScrollReveal animation="zoom-in" delay={300}>
              <div className="ag-hud-card live-servers-card">
                <div className="hud-card-header">
                  <span className="hud-label">LIVE SERVERS</span>
                  <div className="live-dot-pulse" />
                </div>
                <div className="hud-main-val">
                  <span className="num-count">12,458</span>
                  <span className="val-dot">●</span>
                </div>
                <div className="hud-mini-graph">
                  <svg viewBox="0 0 200 40" className="waveform-svg">
                    <path
                      d="M 0 25 Q 25 10, 50 28 T 100 15 T 150 30 T 200 18 L 200 40 L 0 40 Z"
                      fill="rgba(6, 182, 212, 0.15)"
                    />
                    <path
                      d="M 0 25 Q 25 10, 50 28 T 100 15 T 150 30 T 200 18"
                      fill="none"
                      stroke="#00f2fe"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="hud-card-footer">
                  <div className="players-info">
                    <span className="players-label">Players Online</span>
                    <span className="players-count">58,341</span>
                  </div>
                  <Users size={16} className="users-icon" />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={450}>
              <div className="ag-hud-panel feature-hud-panel">
                {hudFeatures.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div key={idx} className="hud-feature-row">
                      <IconComp size={18} className="hud-row-icon" />
                      <span className="hud-row-text">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </div>

        <div className="container ag-hero-bottom-grid">

          <div className="ag-game-cards-row">
            {gameCards.map((game, idx) => (
              <div
                key={idx}
                className="ag-game-card"
                onClick={() => navigate('/plans')}
              >
                <div className="game-icon-box">
                  <img src={game.icon} alt={game.name} className="game-img" />
                </div>
                <div className="game-card-info">
                  <span className="game-name">{game.name}</span>
                  <div className="game-status-badge">
                    <span className={`status-dot ${game.isOrange ? 'orange' : 'green'}`} />
                    <span className="status-text">{game.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ag-floating-cta-badge">
            <div className="cta-badge-left">
              <div className="cta-dot" />
              <div className="cta-texts">
                <span className="cta-t1">Ready to start your server?</span>
                <span className="cta-t2">Get started in less than 2 minutes!</span>
              </div>
            </div>
            <Link to="/plans" className="cta-circle-btn">
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="ag-stats-bar-wrapper">
          <div className="container ag-stats-bar">
            <div className="ag-stat-item">
              <Globe size={22} className="stat-icon" />
              <div>
                <span className="stat-val">10+</span>
                <span className="stat-lbl">Global Locations</span>
              </div>
            </div>

            <div className="ag-stat-item">
              <Users size={22} className="stat-icon" />
              <div>
                <span className="stat-val">50K+</span>
                <span className="stat-lbl">Active Players</span>
              </div>
            </div>

            <div className="ag-stat-item">
              <Server size={22} className="stat-icon" />
              <div>
                <span className="stat-val">99.9%</span>
                <span className="stat-lbl">Network Uptime</span>
              </div>
            </div>

            <div className="ag-stat-item">
              <Zap size={22} className="stat-icon" />
              <div>
                <span className="stat-val">&lt;12ms</span>
                <span className="stat-lbl">Average Ping</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SERVICE PILLARS: Web Hosting & VDS Bare-Metal */}
      <section className="ag-section" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="container">
          <div className="text-center" style={{ maxWidth: '700px', margin: '0 auto 2.5rem' }}>
            <span className="ag-section-badge">EXPANDED INFRASTRUCTURE</span>
            <h2 className="ag-section-title" style={{ marginTop: '8px' }}>
              Web Hosting &amp; Dedicated Bare-Metal
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Whether launching a high-traffic WordPress portal or provisioning full AMD Ryzen 9 bare-metal power, NOVEXHOST delivers enterprise SLA guarantees.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Pillar 1: Web Hosting */}
            <div style={{ background: 'linear-gradient(135deg, rgba(8, 20, 38, 0.9) 0%, rgba(3, 7, 18, 0.95) 100%)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.1)', color: '#00f2fe', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                <span>From ₹24.20/month</span>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                cPanel Web Hosting
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Ultra-fast NVMe storage, free automated Let's Encrypt SSL, official cPanel control, and 1-click WordPress installers.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00f2fe' }}>&check;</span> 10 GB to 50 GB NVMe Storage
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00f2fe' }}>&check;</span> MySQL Databases &amp; phpMyAdmin
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00f2fe' }}>&check;</span> Free AutoSSL &amp; Professional Email
                </li>
              </ul>
              <Link to="/web-hosting" className="ag-primary-cta" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Explore Web Hosting Plans</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Pillar 2: VDS Bare-Metal */}
            <div style={{ background: 'linear-gradient(135deg, rgba(8, 20, 38, 0.9) 0%, rgba(3, 7, 18, 0.95) 100%)', border: '2px solid rgba(0, 242, 254, 0.4)', borderRadius: '24px', padding: '2.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(6,182,212,0.15)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', border: '1px solid rgba(0, 242, 254, 0.4)' }}>
                <span>Dedicated Bare-Metal</span>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
                VDS Physical Machines
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Flagship AMD Ryzen 9 9950X, Ryzen 7 &amp; Intel Xeon bare-metal machines. 128 GB DDR4, 1 Gbps unmetered uplink, and full root access.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00f2fe' }}>&check;</span> 100% Dedicated Physical Silicon
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00f2fe' }}>&check;</span> 128 GB RAM + 1 TB NVMe SSD
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#00f2fe' }}>&check;</span> Cloudflare Magic Transit DDoS Shield
                </li>
              </ul>
              <Link to="/vds-machines" className="ag-primary-cta" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Configure VDS Machines</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="ag-section" id="locations">
        <div className="container">
          <ScrollReveal animation="fade-up" delay={150}>
            <ElectricNodeDiagram />
          </ScrollReveal>
        </div>
      </section>

      <section className="ag-section" id="features">
        <div className="container">
          <ScrollReveal animation="fade-up" className="section-heading text-center">
            <span className="ag-section-badge">WHY NOVEXHOST</span>
            <h2 className="ag-section-title">Built for Performance &amp; Maximum Reliability</h2>
          </ScrollReveal>

          <div className="ag-features-grid">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <ScrollReveal key={idx} animation="fade-up" delay={idx * 100}>
                  <div className="ag-feature-card">
                    <div className="feat-icon-ring">
                      <IconComp size={24} className="feat-icon" />
                    </div>
                    <h3 className="feat-title">{feat.title}</h3>
                    <p className="feat-desc">{feat.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ag-section bottom-cta-sec">
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="ag-bottom-cta-box">
              <div className="cta-info">
                <span className="ag-section-badge">READY TO DOMINATE?</span>
                <h2>Deploy Your Game Server in Seconds</h2>
                <p>Instant setup, 24/7 support, and ultra-low latency routes across Asia.</p>
              </div>
              <Link to="/plans" className="ag-primary-cta">
                <span>View All Plans</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
