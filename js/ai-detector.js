/**
 * ChromaCraft Studio - AI Color Scheme & Mood Detector
 * Uses Computer Vision, Color Theory clustering, and optional Google Gemini Vision API
 * to detect the matching color schema, harmony rule, aesthetic mood, and semantic roles.
 */

import { ColorMath } from './color-math.js';
import { HARMONY_RULES } from './harmony.js';
import { i18n } from './i18n.js';

export class AIDetector {
  constructor() {
    this.geminiStorageKey = 'chromacraft_gemini_api_key';
  }

  getSavedApiKey() {
    try {
      return localStorage.getItem(this.geminiStorageKey) || '';
    } catch {
      return '';
    }
  }

  saveApiKey(key) {
    try {
      localStorage.setItem(this.geminiStorageKey, (key || '').trim());
    } catch (e) {
      console.warn('Could not save API key:', e);
    }
  }

  /**
   * Client-side Computer Vision & Color Theory Analysis
   * 100% Free, instant, zero-latency, zero-config.
   */
  analyzeImageClient(canvas, extractedColors) {
    if (!canvas || !extractedColors || extractedColors.length === 0) {
      return null;
    }

    const swatches = extractedColors.map(c => {
      const hsl = ColorMath.rgbToHsl(c.r, c.g, c.b);
      return { ...c, ...hsl };
    });

    // 1. Harmony Rule Detection via angular distribution on 360° circle
    const harmonyResult = this.detectHarmonyRule(swatches);

    // 2. Temperature & Contrast Analysis
    const tempResult = this.calculateTemperature(swatches);

    // 3. Aesthetic Mood Classification
    const moodResult = this.detectAestheticMood(swatches, tempResult);

    // 4. Assign Semantic Roles (Base, Accent, Surface, Complement, Detail)
    const ratedColors = this.assignSemanticRoles(swatches, harmonyResult.baseIndex);

    return {
      isDeepAi: false,
      harmonyRule: harmonyResult.rule,
      harmonyNameKey: harmonyResult.ruleKey,
      confidence: harmonyResult.confidence,
      reasoning: harmonyResult.reasoning,
      baseColor: ratedColors.find(c => c.role === 'base') || ratedColors[0],
      colors: ratedColors,
      mood: moodResult.title,
      moodKey: moodResult.key,
      moodDesc: moodResult.description,
      moodIcon: moodResult.icon,
      warmPercent: tempResult.warmPercent,
      coolPercent: tempResult.coolPercent,
      contrastRating: tempResult.contrastRating,
      vibrancyRating: tempResult.vibrancyRating,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Angular distance on 360° color circle
   */
  angularDiff(a, b) {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  /**
   * Evaluates fit against standard Adobe / Color Theory harmony formulas
   */
  detectHarmonyRule(swatches) {
    const hues = swatches.map(s => s.h);
    const saturations = swatches.map(s => s.s);
    const lightnesses = swatches.map(s => s.l);

    // Calculate pairwise angular differences
    const pairDiffs = [];
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        pairDiffs.push({ i, j, diff: this.angularDiff(hues[i], hues[j]) });
      }
    }

    const maxLightDiff = Math.max(...lightnesses) - Math.min(...lightnesses);
    const avgSat = saturations.reduce((a, b) => a + b, 0) / saturations.length;

    // A) Monochromatic check: all hues within 26°
    const maxHueDiff = Math.max(...pairDiffs.map(p => p.diff));
    let monoScore = 0;
    if (maxHueDiff <= 28) {
      monoScore = 85 + (maxLightDiff > 35 ? 12 : 5) - (maxHueDiff / 3);
    }

    // B) Analogous check: all hues within 65° or clustered together
    let analogousScore = 0;
    if (maxHueDiff <= 75 && maxHueDiff > 20) {
      analogousScore = 88 + Math.max(0, 8 - (maxHueDiff - 30) / 5);
    } else if (maxHueDiff <= 90) {
      analogousScore = 75;
    }

    // C) Complementary check: pairs close to 180° (150° - 210°)
    let compScore = 0;
    let compPair = null;
    pairDiffs.forEach(p => {
      if (p.diff >= 145 && p.diff <= 215) {
        const score = 90 - Math.abs(180 - p.diff) / 2;
        if (score > compScore) {
          compScore = score;
          compPair = p;
        }
      }
    });

    // D) Triadic check: clusters ~120° apart (100° - 140°)
    let triadicScore = 0;
    pairDiffs.forEach(p => {
      if (p.diff >= 100 && p.diff <= 140) {
        const score = 84 - Math.abs(120 - p.diff) / 2;
        if (score > triadicScore) triadicScore = score;
      }
    });

    // E) Split-Complementary check: one base with pairs at ~150°
    let splitScore = 0;
    pairDiffs.forEach(p => {
      if (p.diff >= 135 && p.diff <= 165) {
        const score = 82 - Math.abs(150 - p.diff) / 2;
        if (score > splitScore) splitScore = score;
      }
    });

    // F) Tetradic check: 4 distinct quadrants ~90° apart
    let tetradicScore = 0;
    pairDiffs.forEach(p => {
      if (p.diff >= 75 && p.diff <= 105) {
        const score = 78 - Math.abs(90 - p.diff) / 2;
        if (score > tetradicScore) tetradicScore = score;
      }
    });

    // Select winning harmony rule
    const scores = [
      { rule: HARMONY_RULES.COMPLEMENTARY, ruleKey: 'complementary', score: compScore, reasoning: 'Prominent opposing color poles create strong dynamic tension.' },
      { rule: HARMONY_RULES.ANALOGOUS, ruleKey: 'analogous', score: analogousScore, reasoning: 'Hues are adjacent on the color wheel, creating smooth organic harmony.' },
      { rule: HARMONY_RULES.MONOCHROMATIC, ruleKey: 'monochromatic', score: monoScore, reasoning: 'Tonal variations of a single dominant hue with rich luminance contrast.' },
      { rule: HARMONY_RULES.TRIADIC, ruleKey: 'triadic', score: triadicScore, reasoning: 'Balanced three-pole chromatic distribution across the color spectrum.' },
      { rule: HARMONY_RULES.SPLIT_COMPLEMENTARY, ruleKey: 'splitComplementary', score: splitScore, reasoning: 'High contrast with less visual tension than pure complementary.' },
      { rule: HARMONY_RULES.TETRADIC, ruleKey: 'tetradic', score: tetradicScore, reasoning: 'Rich multi-hue palette arranged in two complementary pairs.' }
    ];

    scores.sort((a, b) => b.score - a.score);
    const top = scores[0];

    // If all scores low, fallback to Analogous or Custom
    let finalRule = top.rule;
    let finalKey = top.ruleKey;
    let confidence = Math.min(98, Math.max(76, Math.round(top.score)));
    let reasoning = top.reasoning;

    if (top.score < 50) {
      finalRule = HARMONY_RULES.ANALOGOUS;
      finalKey = 'analogous';
      confidence = 82;
      reasoning = 'Cohesive color arrangement with natural ambient blending.';
    }

    // Determine Base Swatch index: pick the most saturated or central tone
    let baseIndex = 0;
    let maxWeight = -1;
    swatches.forEach((s, idx) => {
      // Weight by saturation and balanced lightness (avoid pure black or pure white as base)
      const lightPenalty = Math.abs(50 - s.l) / 50; // 0 at 50% lightness, 1 at 0% or 100%
      const weight = (s.s * 1.5) + (1 - lightPenalty) * 50;
      if (weight > maxWeight) {
        maxWeight = weight;
        baseIndex = idx;
      }
    });

    return {
      rule: finalRule,
      ruleKey: finalKey,
      confidence,
      reasoning,
      baseIndex
    };
  }

  /**
   * Temperature & Contrast Metrics
   */
  calculateTemperature(swatches) {
    let warmWeight = 0;
    let coolWeight = 0;

    swatches.forEach(s => {
      // Warm hues: 0-80° (reds, oranges, yellows) and 300-360° (magentas, pinks)
      // Cool hues: 140-260° (cyans, blues, deep purples)
      // Transitional: 80-140° (yellow-greens, greens) and 260-300° (violets)
      const h = s.h;
      const weight = Math.max(10, s.s);

      if ((h >= 0 && h <= 80) || (h >= 300 && h <= 360)) {
        warmWeight += weight;
      } else if (h >= 140 && h <= 260) {
        coolWeight += weight;
      } else {
        // Transitional: split 50/50
        warmWeight += weight * 0.5;
        coolWeight += weight * 0.5;
      }
    });

    const total = Math.max(1, warmWeight + coolWeight);
    const warmPercent = Math.round((warmWeight / total) * 100);
    const coolPercent = 100 - warmPercent;

    // Contrast & Vibrancy
    const lumValues = swatches.map(s => ColorMath.getLuminance(s.r, s.g, s.b));
    const minLum = Math.min(...lumValues);
    const maxLum = Math.max(...lumValues);
    const lumSpread = (maxLum + 0.05) / (minLum + 0.05);

    let contrastRating = 'Balanced Contrast';
    if (lumSpread >= 7) contrastRating = 'High Contrast (WCAG AAA)';
    else if (lumSpread >= 4.5) contrastRating = 'Optimal Contrast (WCAG AA)';
    else contrastRating = 'Soft & Subtle Contrast';

    const avgSat = swatches.reduce((acc, s) => acc + s.s, 0) / swatches.length;
    let vibrancyRating = 'Vivid & Saturated';
    if (avgSat < 28) vibrancyRating = 'Muted & Minimalist';
    else if (avgSat < 50) vibrancyRating = 'Subtle & Natural';

    return { warmPercent, coolPercent, contrastRating, vibrancyRating };
  }

  /**
   * Classify aesthetic mood and visual theme
   */
  detectAestheticMood(swatches, tempResult) {
    const avgLight = swatches.reduce((acc, s) => acc + s.l, 0) / swatches.length;
    const avgSat = swatches.reduce((acc, s) => acc + s.s, 0) / swatches.length;
    const minLight = Math.min(...swatches.map(s => s.l));
    const maxLight = Math.max(...swatches.map(s => s.l));

    const hues = swatches.map(s => s.h);
    const hasCyanMagenta = hues.some(h => (h >= 170 && h <= 200) || (h >= 290 && h <= 330));
    const hasGreen = hues.some(h => h >= 75 && h <= 160);

    // 1. Cyberpunk / Neon Noir: Dark baseline + electric neon
    if (minLight < 26 && avgSat > 60 && hasCyanMagenta) {
      return {
        key: 'cyberpunk',
        icon: '⚡',
        title: 'Cyberpunk & Neon Noir',
        description: 'High-contrast nocturnal atmosphere with glowing luminescent accents.'
      };
    }

    // 2. Warm Sunset / Golden Hour: Dominant warm tones + rich saturation
    if (tempResult.warmPercent >= 68 && avgSat > 40) {
      return {
        key: 'sunset',
        icon: '🌅',
        title: 'Golden Hour & Warm Sunset',
        description: 'Radiant amber, golden glow, and rich fiery highlights.'
      };
    }

    // 3. Earthy Botanical / Forest Flora: Greens, browns, nature tones
    if (hasGreen && tempResult.coolPercent >= 35 && avgSat < 70) {
      return {
        key: 'nature',
        icon: '🌿',
        title: 'Earthy Nature & Botanical Flora',
        description: 'Organic foliage, mossy greens, and soothing natural minerals.'
      };
    }

    // 4. Oceanic / Coastal Serenity: Deep cool blues and seafoam
    if (tempResult.coolPercent >= 68) {
      return {
        key: 'oceanic',
        icon: '🌊',
        title: 'Deep Oceanic & Coastal Serenity',
        description: 'Tranquil maritime blues, aqua crests, and cool nautical depths.'
      };
    }

    // 5. Pastel Dream / Soft Aesthetic: High lightness, gentle saturation
    if (avgLight >= 65 && avgSat <= 60) {
      return {
        key: 'pastel',
        icon: '🌸',
        title: 'Pastel Dream & Soft Aesthetics',
        description: 'Airy, delicate candy hues with gentle low-strain luminance.'
      };
    }

    // 6. Minimalist Modern / Crisp Monochrome: Low saturation, stark contrast
    if (avgSat < 25) {
      return {
        key: 'minimalist',
        icon: '🏛️',
        title: 'Minimalist Modern & Architectural',
        description: 'Understated slate, architectural neutrals, and timeless restraint.'
      };
    }

    // 7. Vibrant Contemporary / High Energy: Broad spectrum, vivid saturation
    if (avgSat >= 60) {
      return {
        key: 'vibrant',
        icon: '🎨',
        title: 'Vibrant Pop & Creative Energy',
        description: 'Dynamic saturation with lively visual punch for modern branding.'
      };
    }

    // Default
    return {
      key: 'balanced',
      icon: '✨',
      title: 'Balanced Editorial & Modern Studio',
      description: 'Sophisticated color harmony with versatile UI application.'
    };
  }

  /**
   * Assign Color Theory UI Roles
   */
  assignSemanticRoles(swatches, baseIndex) {
    const roles = ['base', 'accent', 'complement', 'surface', 'detail'];
    
    // Sort others by saturation and contrast against base
    const baseColor = swatches[baseIndex];

    const remaining = swatches
      .map((s, idx) => ({ ...s, originalIdx: idx }))
      .filter((_, idx) => idx !== baseIndex);

    // Accent: highest saturation + distinct hue from base
    remaining.sort((a, b) => {
      const diffA = this.angularDiff(a.h, baseColor.h);
      const diffB = this.angularDiff(b.h, baseColor.h);
      return (b.s * 1.5 + diffB) - (a.s * 1.5 + diffA);
    });

    const accent = remaining.shift();

    // Surface / Background: highest or lowest lightness (neutral anchor)
    remaining.sort((a, b) => Math.abs(50 - b.l) - Math.abs(50 - a.l));
    const surface = remaining.shift();

    // Complement / Harmony Partner: highest angular distance to base
    remaining.sort((a, b) => this.angularDiff(b.h, baseColor.h) - this.angularDiff(a.h, baseColor.h));
    const complement = remaining.shift();

    // Detail: whatever remains
    const detail = remaining.shift() || swatches[0];

    const roleMap = [
      { swatch: baseColor, role: 'base', roleLabel: 'Base Anchor', name: this.getColorName(baseColor.h, baseColor.s, baseColor.l) },
      { swatch: accent, role: 'accent', roleLabel: 'Accent / CTA', name: this.getColorName(accent.h, accent.s, accent.l) },
      { swatch: complement, role: 'complement', roleLabel: 'Harmonizer', name: this.getColorName(complement.h, complement.s, complement.l) },
      { swatch: surface, role: 'surface', roleLabel: 'Surface Tone', name: this.getColorName(surface.h, surface.s, surface.l) },
      { swatch: detail, role: 'detail', roleLabel: 'Contrast Detail', name: this.getColorName(detail.h, detail.s, detail.l) }
    ];

    return roleMap.map(r => ({
      ...r.swatch,
      role: r.role,
      roleLabel: r.roleLabel,
      colorName: r.name
    }));
  }

  /**
   * Artistic color naming algorithm
   */
  getColorName(h, s, l) {
    if (l < 12) return 'Obsidian Black';
    if (l > 92 && s < 15) return 'Alabaster White';
    if (s < 12) {
      if (l < 30) return 'Charcoal Slate';
      if (l < 60) return 'Steel Gray';
      return 'Platinum Silver';
    }

    if (h < 15 || h >= 345) {
      if (l > 75) return 'Blush Rose';
      if (s > 70 && l > 45) return 'Crimson Ember';
      if (l < 35) return 'Burgundy Wine';
      return 'Scarlet Flare';
    }
    if (h < 45) {
      if (l > 70) return 'Peach Bellini';
      if (s > 75) return 'Electric Amber';
      if (l < 35) return 'Burnt Sienna';
      return 'Sunset Tangerine';
    }
    if (h < 70) {
      if (l > 75) return 'Champagne Gold';
      if (s > 70) return 'Solar Yellow';
      if (l < 40) return 'Raw Ochre';
      return 'Golden Marigold';
    }
    if (h < 155) {
      if (l > 75) return 'Pistachio Sage';
      if (h < 100) return 'Citron Lime';
      if (s > 65) return 'Emerald Bloom';
      if (l < 35) return 'Deep Pine';
      return 'Forest Jade';
    }
    if (h < 195) {
      if (l > 75) return 'Seafoam Mint';
      if (s > 70) return 'Electric Cyan';
      if (l < 35) return 'Deep Teal';
      return 'Caribbean Turquoise';
    }
    if (h < 255) {
      if (l > 75) return 'Sky Mist';
      if (s > 70 && l > 45) return 'Royal Cobalt';
      if (l < 35) return 'Midnight Navy';
      return 'Cerulean Azure';
    }
    if (h < 290) {
      if (l > 75) return 'Lavender Haze';
      if (s > 70) return 'Electric Violet';
      if (l < 35) return 'Deep Amethyst';
      return 'Imperial Iris';
    }
    if (h < 345) {
      if (l > 75) return 'Cotton Candy';
      if (s > 70) return 'Neon Magenta';
      if (l < 35) return 'Plum Velvet';
      return 'Fuchsia Orchid';
    }
    return 'Chromatic Accent';
  }

  /**
   * Deep AI Vision Analysis using Google Gemini API
   * Free tier available from Google AI Studio (no credit card needed).
   */
  async analyzeWithGemini(canvas, apiKey, lang = 'en') {
    if (!apiKey) {
      throw new Error('MISSING_API_KEY');
    }

    // Downscale canvas to max 400x400 JPEG base64 for fast upload
    const maxDim = 400;
    const offscreen = document.createElement('canvas');
    let w = canvas.width;
    let h = canvas.height;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');
    octx.drawImage(canvas, 0, 0, w, h);

    const base64Data = offscreen.toDataURL('image/jpeg', 0.82).split(',')[1];

    const promptText = lang === 'es'
      ? `Eres un director de arte y experto en teoría del color. Analiza esta imagen y detecta su esquema de color exacto.
Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "harmonyRule": "analogous" | "monochromatic" | "triadic" | "complementary" | "split-complementary" | "tetradic",
  "confidence": 94,
  "mood": "Título del estado de ánimo estético (ej. Atardecer Dorado Cálido)",
  "description": "Explicación breve de 1-2 frases sobre la armonía y la vibra visual de la imagen.",
  "warmPercent": 75,
  "coolPercent": 25,
  "contrastRating": "Alto Contraste (Accesible)",
  "vibrancyRating": "Vívido y Saturado",
  "colors": [
    {"hex": "#...", "name": "Nombre artístico", "role": "base", "roleLabel": "Base Principal"},
    {"hex": "#...", "name": "Nombre artístico", "role": "accent", "roleLabel": "Acento / CTA"},
    {"hex": "#...", "name": "Nombre artístico", "role": "complement", "roleLabel": "Armonizador"},
    {"hex": "#...", "name": "Nombre artístico", "role": "surface", "roleLabel": "Superficie / Fondo"},
    {"hex": "#...", "name": "Nombre artístico", "role": "detail", "roleLabel": "Detalle de Contraste"}
  ],
  "designTip": "Consejo breve sobre cómo usar este esquema en UI o diseño web."
}`
      : `You are an art director and color theory expert. Analyze this image and detect its exact color scheme.
Respond ONLY with a valid JSON matching this schema:
{
  "harmonyRule": "analogous" | "monochromatic" | "triadic" | "complementary" | "split-complementary" | "tetradic",
  "confidence": 94,
  "mood": "Aesthetic mood title (e.g. Golden Sunset Warmth)",
  "description": "Brief 1-2 sentence explanation of the color harmony and visual atmosphere.",
  "warmPercent": 75,
  "coolPercent": 25,
  "contrastRating": "High Contrast (Accessible)",
  "vibrancyRating": "Vivid & Saturated",
  "colors": [
    {"hex": "#...", "name": "Artistic Name", "role": "base", "roleLabel": "Base Anchor"},
    {"hex": "#...", "name": "Artistic Name", "role": "accent", "roleLabel": "Accent / CTA"},
    {"hex": "#...", "name": "Artistic Name", "role": "complement", "roleLabel": "Harmonizer"},
    {"hex": "#...", "name": "Artistic Name", "role": "surface", "roleLabel": "Surface Tone"},
    {"hex": "#...", "name": "Artistic Name", "role": "detail", "roleLabel": "Contrast Detail"}
  ],
  "designTip": "Brief tip on using this scheme in web/app UI design."
}`;

    // Try Gemini 2.5 Flash first, then 1.5 Flash
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              response_mime_type: 'application/json'
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`API ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) throw new Error('Empty model response');

        const parsed = JSON.parse(rawJsonText);

        // Convert hex colors to full swatches with RGB and HSL
        const colors = (parsed.colors || []).map(c => {
          const rgb = ColorMath.hexToRgb(c.hex);
          const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
          return {
            ...rgb,
            ...hsl,
            hex: c.hex.toUpperCase(),
            colorName: c.name,
            role: c.role || 'base',
            roleLabel: c.roleLabel || c.role
          };
        });

        const baseColor = colors.find(c => c.role === 'base') || colors[0];

        return {
          isDeepAi: true,
          harmonyRule: parsed.harmonyRule || HARMONY_RULES.ANALOGOUS,
          harmonyNameKey: parsed.harmonyRule || 'analogous',
          confidence: parsed.confidence || 95,
          reasoning: parsed.description || 'Deep Multimodal Vision Color Theory Analysis',
          baseColor,
          colors,
          mood: parsed.mood || 'AI Curated Aesthetic',
          moodKey: 'gemini',
          moodDesc: parsed.description,
          moodIcon: '✨',
          warmPercent: parsed.warmPercent ?? 60,
          coolPercent: parsed.coolPercent ?? 40,
          contrastRating: parsed.contrastRating || 'Optimal Contrast',
          vibrancyRating: parsed.vibrancyRating || 'Vivid',
          designTip: parsed.designTip || '',
          timestamp: new Date().toISOString()
        };
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model ${model} attempt failed:`, err);
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }
}

export const aiDetector = new AIDetector();
