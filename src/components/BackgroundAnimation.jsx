import React, { useEffect, useRef } from 'react';

export default function BackgroundAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouse = { x: width * 0.5, y: height * 0.4, targetX: width * 0.5, targetY: height * 0.4 };
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.6 - 0.15,
      alpha: Math.random() * 0.65 + 0.25,
      color: Math.random() > 0.5 ? '#d946ef' : '#00C8FF',
      pulseSpeed: Math.random() * 0.03 + 0.015,
      angle: Math.random() * Math.PI * 2
    }));

    let tick = 0;

    const render = () => {
      tick += 0.018;

      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      ctx.fillStyle = '#020711';
      ctx.fillRect(0, 0, width, height);

      const leftShift = Math.sin(tick * 0.7) * 40;
      const rightShift = Math.cos(tick * 0.7) * 40;

      const leftGrad = ctx.createRadialGradient(
        width * 0.2 + leftShift,
        height * 0.4 + leftShift,
        50,
        width * 0.2 + leftShift,
        height * 0.4 + leftShift,
        550
      );
      leftGrad.addColorStop(0, 'rgba(217, 70, 239, 0.22)');
      leftGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.08)');
      leftGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, width, height);

      const rightGrad = ctx.createRadialGradient(
        width * 0.8 + rightShift,
        height * 0.5 - rightShift,
        50,
        width * 0.8 + rightShift,
        height * 0.5 - rightShift,
        600
      );
      rightGrad.addColorStop(0, 'rgba(0, 200, 255, 0.24)');
      rightGrad.addColorStop(0.5, 'rgba(22, 139, 255, 0.09)');
      rightGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rightGrad;
      ctx.fillRect(0, 0, width, height);

      const mouseGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 420);
      mouseGrad.addColorStop(0, 'rgba(0, 200, 255, 0.14)');
      mouseGrad.addColorStop(0.5, 'rgba(217, 70, 239, 0.07)');
      mouseGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = mouseGrad;
      ctx.fillRect(0, 0, width, height);

      const spacing = 36;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;

          const distLeft = Math.hypot(x - (width * 0.2), y - (height * 0.4));
          const distRight = Math.hypot(x - (width * 0.8), y - (height * 0.5));

          const wave = Math.sin((c * 0.15) + (r * 0.15) + (tick * 1.5));
          const opacity = Math.max(0.02, (wave + 1.2) * 0.08);

          if (distLeft < 480 || distRight < 480) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2 + wave * 0.4, 0, Math.PI * 2);

            if (distLeft < distRight) {
              ctx.fillStyle = `rgba(217, 70, 239, ${opacity * 1.6})`;
            } else {
              ctx.fillStyle = `rgba(0, 200, 255, ${opacity * 1.6})`;
            }
            ctx.fill();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.pulseSpeed;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const alpha = Math.max(0.1, (Math.sin(p.angle) + 1) * 0.5 * p.alpha);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
}
