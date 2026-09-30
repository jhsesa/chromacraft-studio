/**
 * ChromaCraft Studio - Live UI Mockup Preview Module
 * Binds active palette swatches dynamically to UI roles in sample web & app layouts.
 */

import { ColorMath } from './color-math.js';

export class UIPreview {
  constructor() {
    this.viewport = document.getElementById('ui-mockup-viewport');
    this.roleSelects = document.querySelectorAll('.role-select');
    this.currentPalette = [];

    this.roleMap = {
      bg: 4,       // Default to Swatch 5
      surface: 3,  // Default to Swatch 4
      primary: 2,  // Default to Swatch 3 (Base)
      accent: 1,   // Default to Swatch 2
      text: 0      // Default to Swatch 1
    };

    this.init();
  }

  init() {
    if (!this.viewport) return;
    this.bindEvents();
  }

  bindEvents() {
    this.roleSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const role = e.target.dataset.role;
        const swatchIdx = parseInt(e.target.value, 10);
        if (role && !isNaN(swatchIdx)) {
          this.roleMap[role] = swatchIdx;
          this.applyToUi();
        }
      });
    });
  }

  updatePalette(palette) {
    this.currentPalette = palette;
    this.applyToUi();
  }

  applyToUi() {
    if (!this.viewport || !this.currentPalette || this.currentPalette.length < 5) return;

    const getColor = (idx) => {
      const swatch = this.currentPalette[idx] || this.currentPalette[0];
      return swatch ? swatch.hex : '#FFFFFF';
    };

    const bgColor = getColor(this.roleMap.bg);
    const surfaceColor = getColor(this.roleMap.surface);
    const primaryColor = getColor(this.roleMap.primary);
    const accentColor = getColor(this.roleMap.accent);
    let textColor = getColor(this.roleMap.text);

    // Auto-fix contrast if text color has low contrast against background
    const bgRgb = ColorMath.hexToRgb(bgColor);
    const textRgb = ColorMath.hexToRgb(textColor);
    const contrast = ColorMath.getContrastRatio(bgRgb, textRgb);

    if (contrast < 3.0) {
      const bgLum = ColorMath.getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
      textColor = bgLum > 0.5 ? '#0F172A' : '#F8FAFC';
    }

    this.viewport.style.setProperty('--ui-bg', bgColor);
    this.viewport.style.setProperty('--ui-surface', surfaceColor);
    this.viewport.style.setProperty('--ui-primary', primaryColor);
    this.viewport.style.setProperty('--ui-accent', accentColor);
    this.viewport.style.setProperty('--ui-text', textColor);
  }
}
