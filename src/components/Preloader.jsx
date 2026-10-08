import React, { useState, useEffect, useRef } from 'react';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading');
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let startTime = performance.now();
    const minDuration = 2200;

    const updateTarget = () => {
      if (!isMounted) return;
      const elapsedTime = performance.now() - startTime;
      const timeRatio = Math.min(1, elapsedTime / minDuration);

      const readyState = document.readyState;
      let loadRatio = 0.3;
      if (readyState === 'interactive') loadRatio = 0.75;
      if (readyState === 'complete') loadRatio = 1.0;

      const target = Math.min(100, Math.floor(Math.max(timeRatio, loadRatio * timeRatio) * 100));
      targetProgressRef.current = target;

      if (target < 100) {
        requestAnimationFrame(updateTarget);
      }
    };

    const handleWindowLoad = () => {
      targetProgressRef.current = 100;
    };

    if (document.readyState === 'complete') {
      targetProgressRef.current = 100;
    } else {
      window.addEventListener('load', handleWindowLoad);
    }

    requestAnimationFrame(updateTarget);

    return () => {
      isMounted = false;
      window.removeEventListener('load', handleWindowLoad);
    };
  }, []);

  useEffect(() => {
    let animationFrame;

    const tickProgress = () => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;

      if (current < target) {

        const next = Math.min(target, current + Math.max(0.8, (target - current) * 0.12));
        currentProgressRef.current = next;
        setProgress(Math.floor(next));
      }

      if (currentProgressRef.current >= 99.5) {
        currentProgressRef.current = 100;
        setProgress(100);
        setPhase('holding');

        setTimeout(() => {
          setPhase('exiting');
          setTimeout(() => {
            setPhase('complete');
            if (onComplete) onComplete();
          }, 650);
        }, 300);
        return;
      }

      animationFrame = requestAnimationFrame(tickProgress);
    };

    animationFrame = requestAnimationFrame(tickProgress);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = 42;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const radius = 110 + (i % 5) * 12;
      nodes.push({
        baseX: radius * Math.cos(theta) * Math.sin(phi),
        baseY: radius * Math.sin(theta) * Math.sin(phi),
        baseZ: radius * Math.cos(phi),
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.6,
        size: 2.5 + (i % 3) * 1.5,
        colorType: i % 3 === 0 ? 'orange' : 'cyan',
      });
    }

    const particleCount = 50;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 600,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let angleX = 0;
    let angleY = 0;
    let time = 0;

    const render = () => {
      time += 0.02;
      angleX += 0.006;
      angleY += 0.009;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const fov = Math.min(width, height) * 0.65;

      const exitScale = phase === 'exiting' ? 1 + (time * 0.05) : 1;

      const projectedNodes = [];

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        const morphRadius = 1 + 0.15 * Math.sin(time * node.speed + node.phase);
        const nx = node.baseX * morphRadius;
        const ny = node.baseY * morphRadius;
        const nz = node.baseZ * morphRadius;

        const x1 = nx * Math.cos(angleY) + nz * Math.sin(angleY);
        const z1 = -nx * Math.sin(angleY) + nz * Math.cos(angleY);

        const y2 = ny * Math.cos(angleX) - z1 * Math.sin(angleX);
        const z2 = ny * Math.sin(angleX) + z1 * Math.cos(angleX);

        const distance = 400 + z2;
        const scale = fov / distance;
        const projX = centerX + x1 * scale * exitScale;
        const projY = centerY + y2 * scale * exitScale;

        projectedNodes.push({
          x: projX,
          y: projY,
          z: z2,
          scale,
          colorType: node.colorType,
          size: node.size * scale * 0.8,
        });
      }

      projectedNodes.sort((a, b) => b.z - a.z);

      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p1 = projectedNodes[i];
          const p2 = projectedNodes[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130 * (p1.scale / 2.5)) {
            const alpha = (1 - dist / (130 * (p1.scale / 2.5))) * 0.28 * Math.min(p1.scale, p2.scale);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p1.colorType === 'orange' || p2.colorType === 'orange'
              ? `rgba(249, 115, 22, ${alpha})`
              : `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < projectedNodes.length; i++) {
        const p = projectedNodes[i];
        const isOrange = p.colorType === 'orange';
        const colorHex = isOrange ? '#d946ef' : '#a855f7';
        const alpha = Math.max(0.2, Math.min(1, (p.z + 250) / 450));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isOrange ? `rgba(217, 70, 239, ${alpha * 0.2})` : `rgba(168, 85, 247, ${alpha * 0.2})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fillStyle = colorHex;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.z += pt.vz;

        if (Math.abs(pt.x) > 300) pt.x *= -0.9;
        if (Math.abs(pt.y) > 300) pt.y *= -0.9;
        if (Math.abs(pt.z) > 300) pt.z *= -0.9;

        const distance = 400 + pt.z;
        const scale = fov / distance;
        const px = centerX + pt.x * scale;
        const py = centerY + pt.y * scale;

        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, pt.size * scale * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? `rgba(168, 85, 247, ${pt.alpha})` : `rgba(217, 70, 239, ${pt.alpha})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  if (phase === 'complete') return null;

  return (
    <div className={`lusion-preloader ${phase === 'exiting' ? 'lusion-exit' : ''}`}>

      <div className="lusion-bg-glow" />

      <canvas ref={canvasRef} className="lusion-canvas" />

      <div className="lusion-ui-container">
        <div className="lusion-logo-wrapper">
          <img src="/assets/agcloud-logo.png" alt="AG Cloud" className="lusion-logo-img" />
          <div className="lusion-logo-ring" />
        </div>

        <div className="lusion-percentage-display">
          <span className="lusion-num">{progress}</span>
          <span className="lusion-symbol">%</span>
        </div>

        <div className="lusion-progress-bar-wrap">
          <div
            className="lusion-progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="lusion-status-text">
          {progress < 30 && 'INITIALIZING HIGH-SPEED INFRASTRUCTURE...'}
          {progress >= 30 && progress < 70 && 'SYNCHRONIZING ASIA CLOUD NODES...'}
          {progress >= 70 && progress < 100 && 'OPTIMIZING NETWORK ROUTES...'}
          {progress === 100 && 'AG CLOUD SYSTEM READY'}
        </div>
      </div>
    </div>
  );
}
