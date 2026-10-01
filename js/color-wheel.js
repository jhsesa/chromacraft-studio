/**
 * ChromaCraft Studio - 2D Interactive HTML5 Canvas Color Wheel
 * Renders HSL color wheel with interactive node handles and geometric connection lines.
 */

import { ColorMath } from './color-math.js';

export class ColorWheel {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.onPaletteChange = options.onPaletteChange || (() => {});
    
    this.palette = [];
    this.activeRule = 'analogous';
    this.draggedNodeIndex = -1;

    this.radius = 180;
    this.centerX = 240;
    this.centerY = 240;

    this.wheelOffscreenCanvas = null;

    this.init();
  }

  init() {
    this.setupDpi();
    this.createWheelOffscreen();
    this.bindEvents();
  }

  setupDpi() {
    const dpr = window.devicePixelRatio || 1;
    const width = 480;
    const height = 480;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.radius = (width / 2) - 30; // Margin for handle dragging
  }

  createWheelOffscreen() {
    const width = 480;
    const height = 480;
    this.wheelOffscreenCanvas = document.createElement('canvas');
    this.wheelOffscreenCanvas.width = width;
    this.wheelOffscreenCanvas.height = height;
    const offCtx = this.wheelOffscreenCanvas.getContext('2d');

    const cx = width / 2;
    const cy = height / 2;
    const r = this.radius;

    // Draw HSL color wheel pie pixels
    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        const dist = Math.sqrt(x * x + y * y);
        if (dist <= r) {
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          const sat = (dist / r) * 100;
          
          offCtx.fillStyle = `hsl(${angle}, ${sat}%, 50%)`;
          offCtx.fillRect(cx + x, cy + y, 1.5, 1.5);
        }
      }
    }

    // Outer wheel border ring
    offCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    offCtx.lineWidth = 2;
    offCtx.beginPath();
    offCtx.arc(cx, cy, r, 0, Math.PI * 2);
    offCtx.stroke();
  }

  setPalette(palette, rule = 'analogous') {
    this.palette = palette;
    this.activeRule = rule;
    this.render();
  }

  render() {
    if (!this.ctx || !this.wheelOffscreenCanvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, 480, 480);

    // Draw pre-rendered color wheel
    this.ctx.drawImage(this.wheelOffscreenCanvas, 0, 0);

    if (!this.palette || this.palette.length === 0) return;

    // Calculate canvas coordinates for all swatches
    const nodeCoords = this.palette.map(swatch => {
      const angleRad = (swatch.h * Math.PI) / 180;
      const dist = (swatch.s / 100) * this.radius;
      return {
        x: this.centerX + dist * Math.cos(angleRad),
        y: this.centerY + dist * Math.sin(angleRad),
        swatch
      };
    });

    // Draw geometric connection lines between nodes
    this.drawHarmonyGeometry(nodeCoords);

    // Draw node handles
    nodeCoords.forEach((node, index) => {
      this.drawNodePin(node.x, node.y, node.swatch, index);
    });
  }

  drawHarmonyGeometry(nodeCoords) {
    if (nodeCoords.length < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);

    const baseNode = nodeCoords.find(n => n.swatch.isBase) || nodeCoords[2];

    this.ctx.beginPath();
    nodeCoords.forEach((node, idx) => {
      if (idx === 0) {
        this.ctx.moveTo(node.x, node.y);
      } else {
        this.ctx.lineTo(node.x, node.y);
      }
    });

    if (this.activeRule === 'triadic' || this.activeRule === 'tetradic') {
      this.ctx.closePath();
    }
    this.ctx.stroke();

    // Secondary lines connecting to center for base
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.setLineDash([]);
    nodeCoords.forEach(node => {
      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX, this.centerY);
      this.ctx.lineTo(node.x, node.y);
      this.ctx.stroke();
    });

    this.ctx.restore();
  }

  drawNodePin(x, y, swatch, index) {
    this.ctx.save();

    const isBase = swatch.isBase;
    const pinRadius = isBase ? 14 : 10;

    // Outer glow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 2;

    // Outer ring
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(x, y, pinRadius + 3, 0, Math.PI * 2);
    this.ctx.fill();

    if (isBase) {
      // Base node golden accent ring
      this.ctx.strokeStyle = '#F59E0B';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, pinRadius + 5, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Swatch color fill
    this.ctx.fillStyle = swatch.hex;
    this.ctx.beginPath();
    this.ctx.arc(x, y, pinRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Node index text label
    this.ctx.fillStyle = ColorMath.getLuminance(swatch.r, swatch.g, swatch.b) > 0.5 ? '#000000' : '#FFFFFF';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(index + 1, x, y);

    this.ctx.restore();
  }

  bindEvents() {
    const getCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
      const scaleX = 480 / (rect.width || 480);
      const scaleY = 480 / (rect.height || 480);
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const handlePointerDown = (e) => {
      const coords = getCoords(e);
      const clickedIdx = this.hitTest(coords.x, coords.y, !!e.touches);
      if (clickedIdx !== -1) {
        this.draggedNodeIndex = clickedIdx;
        e.preventDefault();
      }
    };

    const handlePointerMove = (e) => {
      if (this.draggedNodeIndex === -1) return;
      const coords = getCoords(e);
      this.processDrag(coords.x, coords.y);
      e.preventDefault();
    };

    const handlePointerUp = () => {
      this.draggedNodeIndex = -1;
    };

    this.canvas.addEventListener('mousedown', handlePointerDown);
    this.canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    this.canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    this.canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  }

  hitTest(x, y, isTouch = false) {
    if (!this.palette) return -1;

    // Build list of candidates: check base node FIRST (it has a larger pin)
    // so nearby swatches don't steal the touch on mobile.
    const baseHitRadius = isTouch ? 36 : 22;
    const otherHitRadius = isTouch ? 28 : 20;

    const baseIdx = this.palette.findIndex(s => s.isBase);
    const checkOrder = baseIdx !== -1
      ? [baseIdx, ...this.palette.map((_, i) => i).filter(i => i !== baseIdx)]
      : this.palette.map((_, i) => i);

    for (const i of checkOrder) {
      const swatch = this.palette[i];
      const angleRad = (swatch.h * Math.PI) / 180;
      const dist = (swatch.s / 100) * this.radius;
      const nx = this.centerX + dist * Math.cos(angleRad);
      const ny = this.centerY + dist * Math.sin(angleRad);

      const dx = x - nx;
      const dy = y - ny;
      const hitRadius = swatch.isBase ? baseHitRadius : otherHitRadius;
      if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) {
        return i;
      }
    }
    return -1;
  }

  processDrag(x, y) {
    const dx = x - this.centerX;
    const dy = y - this.centerY;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const sat = Math.min(100, Math.max(0, Math.round((dist / this.radius) * 100)));
    const hue = Math.round(angle);

    this.onPaletteChange({
      nodeIndex: this.draggedNodeIndex,
      hue,
      sat
    });
  }
}
