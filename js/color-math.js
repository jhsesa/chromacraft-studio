/**
 * ChromaCraft Studio - Core Color Math Engine
 * Conversions, Contrast Ratio, Color Blindness Simulations & Image Quantization
 */

export const ColorMath = {
  // --- Hex Utilities ---
  hexToRgb(hex) {
    let cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) return { r: 0, g: 0, b: 0 };
    const num = parseInt(cleanHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  },

  rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    const toHex = v => clamp(v).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  },

  // --- HSL Utilities (h: 0-360, s: 0-100, l: 0-100) ---
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  hslToRgb(h, s, l) {
    h = (h % 360 + 360) % 360 / 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },

  // --- HSV / HSB Utilities (h: 0-360, s: 0-100, v: 0-100) ---
  rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    };
  },

  hsvToRgb(h, s, v) {
    h = (h % 360 + 360) % 360 / 60;
    s = Math.max(0, Math.min(100, s)) / 100;
    v = Math.max(0, Math.min(100, v)) / 100;

    const i = Math.floor(h);
    const f = h - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));

    let r = 0, g = 0, b = 0;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },

  // --- CMYK Utilities ---
  rgbToCmyk(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  },

  // --- OKLCH Utilities ---
  rgbToOklch(r, g, b) {
    // Convert sRGB to linear RGB
    const toLinear = c => {
      c /= 255;
      return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
    };
    const lr = toLinear(r);
    const lg = toLinear(g);
    const lb = toLinear(b);

    // LMS matrix
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

    // OKLab
    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720403 * s;
    const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const b_val = 0.0259040371 * l + 0.7827717662 * m - 0.8086757973 * s;

    // OKLCH
    const C = Math.sqrt(a * a + b_val * b_val);
    let h = Math.atan2(b_val, a) * (180 / Math.PI);
    if (h < 0) h += 360;

    return {
      l: Math.round(L * 100),
      c: Number(C.toFixed(3)),
      h: Math.round(h)
    };
  },

  // --- WCAG 2.1 Contrast Ratio & Relative Luminance ---
  getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  },

  getContrastRatio(rgb1, rgb2) {
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  getContrastRatings(ratio) {
    return {
      ratio: Number(ratio.toFixed(2)),
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3.0,
      aaaNormal: ratio >= 7.0,
      aaaLarge: ratio >= 4.5
    };
  },

  // --- Color Blindness Simulation (Linear RGB Matrices) ---
  simulateColorBlindness(rgb, type = 'normal') {
    if (type === 'normal') return { ...rgb };

    // Linear RGB conversion
    const s2l = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const l2s = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

    const lr = s2l(rgb.r / 255);
    const lg = s2l(rgb.g / 255);
    const lb = s2l(rgb.b / 255);

    let sr = 0, sg = 0, sb = 0;

    switch (type) {
      case 'protanopia': // Red-blind
        sr = 0.56667 * lr + 0.43333 * lg + 0.0 * lb;
        sg = 0.55833 * lr + 0.44167 * lg + 0.0 * lb;
        sb = 0.0 * lr + 0.24167 * lg + 0.75833 * lb;
        break;
      case 'deuteranopia': // Green-blind
        sr = 0.625 * lr + 0.375 * lg + 0.0 * lb;
        sg = 0.7 * lr + 0.3 * lg + 0.0 * lb;
        sb = 0.0 * lr + 0.3 * lg + 0.7 * lb;
        break;
      case 'tritanopia': // Blue-blind
        sr = 0.95 * lr + 0.05 * lg + 0.0 * lb;
        sg = 0.0 * lr + 0.43333 * lg + 0.56667 * lb;
        sb = 0.0 * lr + 0.475 * lg + 0.525 * lb;
        break;
      case 'achromatopsia': // Monochromacy
        sr = sg = sb = 0.299 * lr + 0.587 * lg + 0.114 * lb;
        break;
      default:
        return { ...rgb };
    }

    const clamp = v => Math.max(0, Math.min(255, Math.round(l2s(v) * 255)));

    return {
      r: clamp(sr),
      g: clamp(sg),
      b: clamp(sb)
    };
  },

  // --- Simple Quantization for Image Palette Extraction ---
  extractDominantColorsFromCanvas(ctx, width, height, count = 5) {
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const pixelCount = width * height;
    const step = Math.max(1, Math.floor(pixelCount / 2000)); // Sample ~2000 pixels for fast execution

    const colorBucketMap = new Map();

    for (let i = 0; i < imageData.length; i += step * 4) {
      const a = imageData[i + 3];
      if (a < 128) continue; // Skip transparent

      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];

      // Quantize to 16-level buckets
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      const key = `${qr},${qg},${qb}`;

      if (!colorBucketMap.has(key)) {
        colorBucketMap.set(key, { r: qr, g: qg, b: qb, count: 0 });
      }
      colorBucketMap.get(key).count += 1;
    }

    const sortedBuckets = Array.from(colorBucketMap.values())
      .sort((a, b) => b.count - a.count);

    // Pick top distinct colors (filter out very similar colors)
    const results = [];
    for (const b of sortedBuckets) {
      if (results.length >= count) break;
      const isTooSimilar = results.some(existing => {
        const dr = existing.r - b.r;
        const dg = existing.g - b.g;
        const db = existing.b - b.b;
        return Math.sqrt(dr * dr + dg * dg + db * db) < 45; // Euclidean RGB distance threshold
      });
      if (!isTooSimilar) {
        results.push({ r: b.r, g: b.g, b: b.b, hex: this.rgbToHex(b.r, b.g, b.b) });
      }
    }

    // Fallback if not enough distinct colors found
    while (results.length < count) {
      const fallbackHsl = { h: (results.length * 360 / count), s: 70, l: 50 };
      const fallbackRgb = this.hslToRgb(fallbackHsl.h, fallbackHsl.s, fallbackHsl.l);
      results.push({ ...fallbackRgb, hex: this.rgbToHex(fallbackRgb.r, fallbackRgb.g, fallbackRgb.b) });
    }

    return results;
  }
};
