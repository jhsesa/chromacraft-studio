/**
 * ChromaCraft Studio - Image Palette Extractor
 * Canvas rendering, color quantization, and interactive image sampler pins.
 */

import { ColorMath } from './color-math.js';

export class ImageExtractor {
  constructor(options = {}) {
    this.canvas = document.getElementById('extractor-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.overlayContainer = document.getElementById('pin-overlay-container');
    this.dropzone = document.getElementById('image-dropzone');
    this.fileInput = document.getElementById('image-file-input');
    this.onPaletteExtracted = options.onPaletteExtracted || (() => {});

    this.extractedColors = [];
    this.pins = [];
    this.activeImg = null;

    this.init();
  }

  init() {
    if (!this.canvas || !this.dropzone) return;
    this.bindEvents();
    // Render default sample gradient image on startup
    this.loadSampleGradient('gradient1');
  }

  bindEvents() {
    this.dropzone.addEventListener('click', () => this.fileInput.click());
    
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.loadImageFile(e.target.files[0]);
      }
    });

    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.loadImageFile(e.dataTransfer.files[0]);
      }
    });

    // Sample gradient buttons
    const sampleThumbs = document.getElementById('sample-thumbs');
    if (sampleThumbs) {
      sampleThumbs.addEventListener('click', (e) => {
        const btn = e.target.closest('.sample-btn');
        if (btn && btn.dataset.type) {
          this.loadSampleGradient(btn.dataset.type);
        }
      });
    }

    // Apply button
    const btnApply = document.getElementById('btn-use-extracted');
    if (btnApply) {
      btnApply.addEventListener('click', () => {
        if (this.extractedColors.length > 0) {
          this.onPaletteExtracted(this.extractedColors);
        }
      });
    }
  }

  loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.processLoadedImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  loadSampleGradient(type) {
    const width = 600;
    const height = 400;
    this.canvas.width = width;
    this.canvas.height = height;

    const gradient = this.ctx.createLinearGradient(0, 0, width, height);

    if (type === 'gradient1') {
      gradient.addColorStop(0, '#FF6B6B');
      gradient.addColorStop(0.35, '#4ECDC4');
      gradient.addColorStop(0.7, '#FFE66D');
      gradient.addColorStop(1, '#1A535C');
    } else if (type === 'gradient2') {
      gradient.addColorStop(0, '#0F2027');
      gradient.addColorStop(0.5, '#203A43');
      gradient.addColorStop(1, '#2C5364');
    } else {
      gradient.addColorStop(0, '#8E2DE2');
      gradient.addColorStop(0.5, '#4A00E0');
      gradient.addColorStop(1, '#FF007F');
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    this.extractAndCreatePins();
  }

  processLoadedImage(img) {
    this.activeImg = img;
    const maxW = 600;
    const maxH = 400;
    let w = img.width;
    let h = img.height;

    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    this.canvas.width = w;
    this.canvas.height = h;

    this.ctx.drawImage(img, 0, 0, w, h);
    this.extractAndCreatePins();
  }

  extractAndCreatePins() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    const extracted = ColorMath.extractDominantColorsFromCanvas(this.ctx, w, h, 5);
    this.extractedColors = extracted;

    this.renderSamplerPins(extracted);
  }

  renderSamplerPins(colors) {
    if (!this.overlayContainer) return;
    this.overlayContainer.innerHTML = '';
    this.pins = [];

    const w = this.canvas.width;
    const h = this.canvas.height;

    colors.forEach((col, idx) => {
      // Position pins in a diagonal / spread layout
      const x = Math.round((idx + 1) * (w / 6));
      const y = Math.round((idx + 1) * (h / 6));

      const pin = document.createElement('div');
      pin.className = 'extractor-pin';
      pin.style.left = `${x}px`;
      pin.style.top = `${y}px`;
      pin.style.backgroundColor = col.hex;
      pin.title = `Color ${idx + 1}: ${col.hex}`;

      this.overlayContainer.appendChild(pin);
      this.makePinDraggable(pin, idx);
      this.pins.push({ element: pin, x, y, color: col });
    });
  }

  makePinDraggable(pinElement, pinIndex) {
    let isDragging = false;

    const onMove = (e) => {
      if (!isDragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let x = Math.max(0, Math.min(this.canvas.width - 1, Math.round(clientX - rect.left)));
      let y = Math.max(0, Math.min(this.canvas.height - 1, Math.round(clientY - rect.top)));

      pinElement.style.left = `${x}px`;
      pinElement.style.top = `${y}px`;

      // Read pixel RGB from canvas
      const pixelData = this.ctx.getImageData(x, y, 1, 1).data;
      const r = pixelData[0];
      const g = pixelData[1];
      const b = pixelData[2];
      const hex = ColorMath.rgbToHex(r, g, b);

      pinElement.style.backgroundColor = hex;
      pinElement.title = `Color ${pinIndex + 1}: ${hex}`;

      this.extractedColors[pinIndex] = { r, g, b, hex };
      e.preventDefault();
    };

    const onStart = (e) => {
      isDragging = true;
      e.preventDefault();
    };

    const onEnd = () => {
      isDragging = false;
    };

    pinElement.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    pinElement.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }
}
