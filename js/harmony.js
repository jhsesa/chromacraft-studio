/**
 * ChromaCraft Studio - Color Harmony Calculator
 * Generates 5-color palettes based on standard Adobe Color harmony formulas.
 */

import { ColorMath } from './color-math.js';

export const HARMONY_RULES = {
  ANALOGOUS: 'analogous',
  MONOCHROMATIC: 'monochromatic',
  TRIADIC: 'triadic',
  COMPLEMENTARY: 'complementary',
  SPLIT_COMPLEMENTARY: 'split-complementary',
  TETRADIC: 'tetradic',
  SHADES: 'shades',
  DOUBLE_COMPLEMENTARY: 'double-complementary',
  CUSTOM: 'custom'
};

export const HarmonyEngine = {
  generatePalette(baseHsl, rule = HARMONY_RULES.ANALOGOUS, currentPalette = []) {
    const { h, s, l } = baseHsl;
    let colorsHsl = [];

    switch (rule) {
      case HARMONY_RULES.ANALOGOUS:
        colorsHsl = [
          { h: (h - 30 + 360) % 360, s, l: Math.min(95, l + 10) },
          { h: (h - 15 + 360) % 360, s, l: Math.min(95, l + 5) },
          { h, s, l }, // Base color at index 2 (center)
          { h: (h + 15) % 360, s, l: Math.max(10, l - 5) },
          { h: (h + 30) % 360, s, l: Math.max(10, l - 10) }
        ];
        break;

      case HARMONY_RULES.MONOCHROMATIC:
        colorsHsl = [
          { h, s: Math.max(10, s - 30), l: Math.min(92, l + 30) },
          { h, s: Math.max(15, s - 15), l: Math.min(85, l + 15) },
          { h, s, l }, // Base color
          { h, s: Math.min(100, s + 15), l: Math.max(25, l - 15) },
          { h, s: Math.min(100, s + 30), l: Math.max(12, l - 30) }
        ];
        break;

      case HARMONY_RULES.TRIADIC:
        colorsHsl = [
          { h: (h + 120) % 360, s: Math.max(20, s - 10), l: Math.min(90, l + 15) },
          { h: (h + 120) % 360, s, l },
          { h, s, l }, // Base color
          { h: (h + 240) % 360, s, l },
          { h: (h + 240) % 360, s: Math.min(100, s + 10), l: Math.max(15, l - 15) }
        ];
        break;

      case HARMONY_RULES.COMPLEMENTARY:
        const compHue = (h + 180) % 360;
        colorsHsl = [
          { h, s: Math.max(10, s - 20), l: Math.min(90, l + 20) },
          { h, s, l: Math.min(85, l + 10) },
          { h, s, l }, // Base color
          { h: compHue, s, l },
          { h: compHue, s: Math.min(100, s + 10), l: Math.max(15, l - 20) }
        ];
        break;

      case HARMONY_RULES.SPLIT_COMPLEMENTARY:
        const split1 = (h + 150) % 360;
        const split2 = (h + 210) % 360;
        colorsHsl = [
          { h: split1, s: Math.max(20, s - 10), l: Math.min(85, l + 10) },
          { h: split1, s, l },
          { h, s, l }, // Base color
          { h: split2, s, l },
          { h: split2, s: Math.min(100, s + 10), l: Math.max(20, l - 15) }
        ];
        break;

      case HARMONY_RULES.TETRADIC:
        colorsHsl = [
          { h, s, l }, // Base color
          { h: (h + 90) % 360, s, l },
          { h: (h + 180) % 360, s, l },
          { h: (h + 270) % 360, s, l },
          { h: (h + 90) % 360, s: Math.max(15, s - 20), l: Math.min(85, l + 15) }
        ];
        break;

      case HARMONY_RULES.SHADES:
        colorsHsl = [
          { h, s, l: Math.min(95, Math.max(80, l + 35)) },
          { h, s, l: Math.min(85, Math.max(60, l + 18)) },
          { h, s, l }, // Base color
          { h, s, l: Math.max(20, l - 18) },
          { h, s, l: Math.max(8, l - 35) }
        ];
        break;

      case HARMONY_RULES.DOUBLE_COMPLEMENTARY:
        const pair1 = (h + 30) % 360;
        const compBase = (h + 180) % 360;
        const compPair1 = (pair1 + 180) % 360;
        colorsHsl = [
          { h, s, l }, // Base
          { h: pair1, s, l },
          { h: (h + 15) % 360, s: Math.max(20, s - 20), l: Math.min(90, l + 20) }, // accent bridge
          { h: compBase, s, l },
          { h: compPair1, s, l }
        ];
        break;

      case HARMONY_RULES.CUSTOM:
      default:
        if (currentPalette && currentPalette.length === 5) {
          return currentPalette;
        }
        colorsHsl = [
          { h, s, l },
          { h: (h + 45) % 360, s, l },
          { h: (h + 90) % 360, s, l },
          { h: (h + 135) % 360, s, l },
          { h: (h + 180) % 360, s, l }
        ];
        break;
    }

    // Preserve locked swatches if currentPalette exists
    return colorsHsl.map((hsl, index) => {
      if (currentPalette[index] && currentPalette[index].locked) {
        return currentPalette[index];
      }

      const rgb = ColorMath.hslToRgb(hsl.h, hsl.s, hsl.l);
      const hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);

      return {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        hex,
        isBase: index === 2, // Swatch index 2 is base by default
        locked: false
      };
    });
  }
};
