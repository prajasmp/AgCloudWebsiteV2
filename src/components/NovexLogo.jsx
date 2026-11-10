import React from 'react';

export default function NovexLogo({ size = 36, showText = true, className = '' }) {
  return (
    <div className={`novex-brand-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="novex-logo-svg"
      >
        <defs>
          <linearGradient id="aquaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id="aquaGlow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.2" />
          </linearGradient>
          <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hex Shield */}
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          fill="#060e1e"
          stroke="url(#aquaGradient)"
          strokeWidth="3.5"
          filter="url(#neonBlur)"
        />

        {/* Inner geometric grid accents */}
        <polygon
          points="50,14 80,32 80,68 50,86 20,68 20,32"
          fill="rgba(6, 182, 212, 0.06)"
          stroke="rgba(0, 242, 254, 0.3)"
          strokeWidth="1.5"
        />

        {/* Futuristic glowing 'N' monogram */}
        <path
          d="M32 68 V32 L68 68 V32"
          stroke="url(#aquaGradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neonBlur)"
        />

        {/* Center energy core dot */}
        <circle cx="50" cy="50" r="3.5" fill="#ffffff" filter="url(#neonBlur)" />
        <circle cx="32" cy="32" r="2.5" fill="#00f2fe" />
        <circle cx="68" cy="68" r="2.5" fill="#00f2fe" />
      </svg>

      {showText && (
        <div className="novex-text-wrapper" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', letterSpacing: '0.08em' }}>
            <span style={{ fontSize: size * 0.54, fontWeight: 900, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>NOVEX</span>
            <span style={{ fontSize: size * 0.54, fontWeight: 900, background: 'linear-gradient(135deg, #00f2fe, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit, sans-serif' }}>HOST</span>
          </div>
          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.22em', color: '#38bdf8', textTransform: 'uppercase', opacity: 0.85 }}>PREMIUM CLOUD & VPS</span>
        </div>
      )}
    </div>
  );
}
