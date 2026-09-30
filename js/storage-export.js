/**
 * ChromaCraft Studio - Storage & Multi-Format Exporter
 * LocalStorage management and export generation (CSS, Tailwind, JSON, SVG, PNG, Shareable URL).
 */

import { ColorMath } from './color-math.js';

const STORAGE_KEY = 'chromacraft_saved_palettes';

export const StorageExporter = {
  // --- Local Storage ---
  getSavedPalettes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading localStorage', e);
      return [];
    }
  },

  savePalette(palette, name = 'Untitled Palette') {
    const saved = this.getSavedPalettes();
    const newEntry = {
      id: 'palette_' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      colors: palette.map(swatch => ({
        hex: swatch.hex,
        r: swatch.r,
        g: swatch.g,
        b: swatch.b,
        h: swatch.h,
        s: swatch.s,
        l: swatch.l,
        isBase: swatch.isBase
      }))
    };
    saved.unshift(newEntry);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      console.error('Error writing localStorage', e);
    }
    return newEntry;
  },

  deletePalette(id) {
    let saved = this.getSavedPalettes();
    saved = saved.filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      console.error('Error writing localStorage', e);
    }
  },

  // --- Export Formats ---
  toCssVariables(palette) {
    let css = `:root {\n`;
    palette.forEach((swatch, idx) => {
      const tag = swatch.isBase ? ' /* Base */' : '';
      css += `  --color-${idx + 1}: ${swatch.hex};${tag}\n`;
    });
    css += `}\n\n/* Usage Example */\n.element {\n  background-color: var(--color-3);\n  color: var(--color-1);\n}`;
    return css;
  },

  toTailwindConfig(palette) {
    const colorsObj = {};
    palette.forEach((swatch, idx) => {
      colorsObj[`color-${idx + 1}`] = swatch.hex;
    });

    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colorsObj, null, 8)}\n    }\n  }\n};`;
  },

  toJson(palette) {
    const data = palette.map((swatch, idx) => {
      const cmyk = ColorMath.rgbToCmyk(swatch.r, swatch.g, swatch.b);
      const oklch = ColorMath.rgbToOklch(swatch.r, swatch.g, swatch.b);
      return {
        name: `Color ${idx + 1}`,
        isBase: swatch.isBase,
        hex: swatch.hex,
        rgb: `rgb(${swatch.r}, ${swatch.g}, ${swatch.b})`,
        hsl: `hsl(${swatch.h}, ${swatch.s}%, ${swatch.l}%)`,
        cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
        oklch: `oklch(${oklch.l}% ${oklch.c} ${oklch.h})`
      };
    });
    return JSON.stringify(data, null, 2);
  },

  toSvg(palette) {
    const swatchWidth = 120;
    const height = 180;
    const totalWidth = swatchWidth * palette.length;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">\n`;
    svg += `  <style>\n    .hex { font-family: monospace; font-size: 14px; font-weight: bold; fill: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.6); }\n  </style>\n`;

    palette.forEach((swatch, idx) => {
      const x = idx * swatchWidth;
      svg += `  <g transform="translate(${x}, 0)">\n`;
      svg += `    <rect width="${swatchWidth}" height="${height}" fill="${swatch.hex}" />\n`;
      svg += `    <text x="${swatchWidth / 2}" y="${height - 20}" text-anchor="middle" class="hex">${swatch.hex}</text>\n`;
      svg += `  </g>\n`;
    });

    svg += `</svg>`;
    return svg;
  },

  toPngDataUrl(palette) {
    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const swatchW = width / palette.length;

    palette.forEach((swatch, idx) => {
      const x = idx * swatchW;
      ctx.fillStyle = swatch.hex;
      ctx.fillRect(x, 0, swatchW, height);

      // Label background card at bottom
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(x, height - 80, swatchW, 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(swatch.hex, x + swatchW / 2, height - 45);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(swatch.isBase ? 'Base Color' : `Color ${idx + 1}`, x + swatchW / 2, height - 20);
    });

    return canvas.toDataURL('image/png');
  },

  toShareUrl(palette) {
    const hexes = palette.map(s => s.hex.replace('#', '')).join('-');
    const url = new URL(window.location.href);
    url.searchParams.set('palette', hexes);
    return url.toString();
  },

  fromShareUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const paletteStr = urlParams.get('palette');
    if (!paletteStr) return null;

    const parts = paletteStr.split('-');
    if (parts.length < 5) return null;

    return parts.slice(0, 5).map((hex, index) => {
      const cleanHex = `#${hex}`;
      const rgb = ColorMath.hexToRgb(cleanHex);
      const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
      return {
        ...hsl,
        ...rgb,
        hex: cleanHex,
        isBase: index === 2,
        locked: false
      };
    });
  }
};
