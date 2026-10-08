import React, { useState } from 'react';
import { Gamepad2, Server, Bot, Shield, Zap, Globe } from 'lucide-react';

export default function ElectricNodeDiagram() {
  const [activeNode, setActiveNode] = useState(null);

  const nodes = [
    {
      id: 'game',
      title: 'Game Servers',
      sub: 'Minecraft & CS2',
      icon: Gamepad2,
      side: 'left',
      yOffset: 40,
      color: '#a855f7'
    },
    {
      id: 'vps',
      title: 'VPS Compute',
      sub: 'Intel, AMD & Ryzen',
      icon: Server,
      side: 'left',
      yOffset: 180,
      color: '#f97316'
    },
    {
      id: 'bot',
      title: 'Bot Hosting',
      sub: 'Node.js & Python 24/7',
      icon: Bot,
      side: 'left',
      yOffset: 320,
      color: '#a855f7'
    },
    {
      id: 'ddos',
      title: 'Anti-DDoS Shield',
      sub: 'L3/L4/L7 Mitigation',
      icon: Shield,
      side: 'right',
      yOffset: 40,
      color: '#34d399'
    },
    {
      id: 'latency',
      title: 'Low Latency POP',
      sub: 'India & Asia Routes',
      icon: Zap,
      side: 'right',
      yOffset: 180,
      color: '#fbbf24'
    },
    {
      id: 'dns',
      title: 'Domains & DNS',
      sub: '.fun, .com, .in DNS',
      icon: Globe,
      side: 'right',
      yOffset: 320,
      color: '#c084fc'
    }
  ];

  return (
    <div className="electric-diagram-wrapper glass-card glow-border">
      <div className="diagram-header text-center">
        <span className="badge-subtitle">Infrastructure Core</span>
        <h2>High-Speed Edge Network Driven by AG</h2>
        <p>Real-time telemetry and lightning-fast packet routing across all hosting layers.</p>
      </div>

      <div className="diagram-container">

        <svg className="circuit-svg" viewBox="0 0 900 420" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="cyanElectric" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="1" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <path
            d="M 400 210 L 260 210 L 260 70 L 180 70"
            className={`circuit-track ${activeNode === 'game' ? 'active' : ''}`}
          />
          <path
            d="M 400 210 L 260 210 L 260 70 L 180 70"
            className="electric-pulse pulse-left-1"
          />

          <path
            d="M 400 210 L 180 210"
            className={`circuit-track ${activeNode === 'vps' ? 'active' : ''}`}
          />
          <path
            d="M 400 210 L 180 210"
            className="electric-pulse pulse-left-2"
          />

          <path
            d="M 400 210 L 260 210 L 260 350 L 180 350"
            className={`circuit-track ${activeNode === 'bot' ? 'active' : ''}`}
          />
          <path
            d="M 400 210 L 260 210 L 260 350 L 180 350"
            className="electric-pulse pulse-left-3"
          />

          <path
            d="M 500 210 L 640 210 L 640 70 L 720 70"
            className={`circuit-track ${activeNode === 'ddos' ? 'active' : ''}`}
          />
          <path
            d="M 500 210 L 640 210 L 640 70 L 720 70"
            className="electric-pulse pulse-right-1"
          />

          <path
            d="M 500 210 L 720 210"
            className={`circuit-track ${activeNode === 'latency' ? 'active' : ''}`}
          />
          <path
            d="M 500 210 L 720 210"
            className="electric-pulse pulse-right-2"
          />

          <path
            d="M 500 210 L 640 210 L 640 350 L 720 350"
            className={`circuit-track ${activeNode === 'dns' ? 'active' : ''}`}
          />
          <path
            d="M 500 210 L 640 210 L 640 350 L 720 350"
            className="electric-pulse pulse-right-3"
          />

          <circle cx="260" cy="210" r="4" className="circuit-node-dot" />
          <circle cx="260" cy="70" r="4" className="circuit-node-dot" />
          <circle cx="260" cy="350" r="4" className="circuit-node-dot" />
          <circle cx="640" cy="210" r="4" className="circuit-node-dot" />
          <circle cx="640" cy="70" r="4" className="circuit-node-dot" />
          <circle cx="640" cy="350" r="4" className="circuit-node-dot" />
        </svg>

        <div className="center-ag-chip">
          <div className="chip-aura-glow" />
          <div className="chip-body">
            <div className="chip-pin pin-top-1" />
            <div className="chip-pin pin-top-2" />
            <div className="chip-pin pin-bottom-1" />
            <div className="chip-pin pin-bottom-2" />
            <div className="chip-pin pin-left-1" />
            <div className="chip-pin pin-left-2" />
            <div className="chip-pin pin-right-1" />
            <div className="chip-pin pin-right-2" />

            <div className="chip-content">
              <span className="chip-ag-text">AG</span>
              <span className="chip-subtext">CORE ENGINE</span>
            </div>
          </div>
        </div>

        <div className="nodes-overlay">
          {nodes.map(node => {
            const IconComponent = node.icon;
            const isLeft = node.side === 'left';
            return (
              <div
                key={node.id}
                className={`node-card ${isLeft ? 'node-left' : 'node-right'} ${
                  activeNode === node.id ? 'active-hover' : ''
                }`}
                style={{ top: `${node.yOffset}px` }}
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
              >
                <div className="node-icon-box" style={{ borderColor: node.color }}>
                  <IconComponent size={20} style={{ color: node.color }} />
                </div>
                <div className="node-text">
                  <h4>{node.title}</h4>
                  <p>{node.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
