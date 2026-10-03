/**
 * ChromaCraft Studio - Main Application Controller
 * Connects color math, harmony engine, canvas color wheel, contrast matrix,
 * image extractor, UI playground, export modal, and local storage.
 */

import { ColorMath } from './color-math.js';
import { HARMONY_RULES, HarmonyEngine } from './harmony.js';
import { ColorWheel } from './color-wheel.js';
import { ImageExtractor } from './image-extractor.js';
import { UIPreview } from './ui-preview.js';
import { StorageExporter } from './storage-export.js';
import { i18n } from './i18n.js';
import { aiDetector } from './ai-detector.js';

class App {
  constructor() {
    this.activeRule = HARMONY_RULES.ANALOGOUS;
    this.baseHsl = { h: 217, s: 91, l: 60 }; // #3B82F6 Default Base
    this.palette = [];
    this.activeFormat = 'hex'; // hex, rgb, hsl, cmyk, oklch

    this.wheel = null;
    this.extractor = null;
    this.uiPreview = null;
    this.latestAiAnalysis = null;

    this.init();
  }

  init() {
    // Check shareable URL parameter first
    const sharePalette = StorageExporter.fromShareUrl();
    if (sharePalette) {
      this.palette = sharePalette;
      this.baseHsl = { h: sharePalette[2].h, s: sharePalette[2].s, l: sharePalette[2].l };
      this.activeRule = HARMONY_RULES.CUSTOM;
      const select = document.getElementById('harmony-select');
      if (select) select.value = HARMONY_RULES.CUSTOM;
    } else {
      this.updatePalette();
    }

    this.initColorWheel();
    this.initExtractor();
    this.initUIPreview();
    this.bindDOMEvents();
    this.updateUiTranslations();
    this.renderSwatches();
    this.renderContrastMatrix();
    this.renderSavedLibrary();

    this.showToast(i18n.get('welcomeToast'));
  }

  updateUiTranslations() {
    const langBtnText = document.getElementById('lang-toggle-text');
    if (langBtnText) {
      langBtnText.textContent = i18n.currentLang === 'es' ? '🌐 EN (English)' : '🌐 ES (Español)';
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (key) el.textContent = i18n.get(key);
    });

    document.querySelectorAll('option[data-i18n]').forEach(opt => {
      const key = opt.dataset.i18n;
      if (key) opt.textContent = i18n.get(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (key) el.placeholder = i18n.get(key);
    });

    // Update modal buttons
    const btnCopyCode = document.getElementById('btn-copy-code');
    const btnDownload = document.getElementById('btn-download-file');
    if (btnCopyCode) btnCopyCode.textContent = i18n.get('copyToClipboardBtn');
    if (btnDownload) btnDownload.textContent = i18n.get('downloadFileBtn');

    if (this.palette && this.palette.length > 0) {
      this.renderSwatches();
      this.renderContrastMatrix();
      this.renderSavedLibrary();
    }

    if (this.latestAiAnalysis) {
      this.renderAiAnalysis(this.latestAiAnalysis);
    }
  }

  updatePalette() {
    this.palette = HarmonyEngine.generatePalette(this.baseHsl, this.activeRule, this.palette);
  }

  initColorWheel() {
    const canvas = document.getElementById('color-wheel-canvas');
    if (!canvas) return;

    this.wheel = new ColorWheel(canvas, {
      onPaletteChange: ({ nodeIndex, hue, sat }) => {
        if (nodeIndex === -1 || !this.palette[nodeIndex]) return;

        const swatch = this.palette[nodeIndex];

        if (swatch.isBase) {
          this.baseHsl.h = hue;
          this.baseHsl.s = sat;
          this.updatePalette();
        } else {
          // If dragging non-base node
          if (this.activeRule !== HARMONY_RULES.CUSTOM) {
            this.activeRule = HARMONY_RULES.CUSTOM;
            const select = document.getElementById('harmony-select');
            if (select) select.value = HARMONY_RULES.CUSTOM;
          }
          swatch.h = hue;
          swatch.s = sat;
          const rgb = ColorMath.hslToRgb(hue, sat, swatch.l);
          swatch.r = rgb.r;
          swatch.g = rgb.g;
          swatch.b = rgb.b;
          swatch.hex = ColorMath.rgbToHex(rgb.r, rgb.g, rgb.b);
        }

        this.syncAllViews();
      }
    });

    this.wheel.setPalette(this.palette, this.activeRule);
  }

  initExtractor() {
    this.extractor = new ImageExtractor({
      onPaletteExtracted: (extractedColors) => {
        this.palette = extractedColors.map((col, idx) => {
          const hsl = ColorMath.rgbToHsl(col.r, col.g, col.b);
          return {
            ...hsl,
            r: col.r,
            g: col.g,
            b: col.b,
            hex: col.hex,
            isBase: idx === 2,
            locked: false
          };
        });

        this.baseHsl = { h: this.palette[2].h, s: this.palette[2].s, l: this.palette[2].l };
        this.activeRule = HARMONY_RULES.CUSTOM;
        const select = document.getElementById('harmony-select');
        if (select) select.value = HARMONY_RULES.CUSTOM;

        this.syncAllViews();
        this.showToast(i18n.get('extractedToast'));
      },
      onImageReady: (canvas, extractedColors) => {
        this.runAiSchemeDetection(canvas, extractedColors);
      }
    });

    this.initGeminiModal();
  }

  async runAiSchemeDetection(canvas, extractedColors, forceDeepAi = false) {
    const loadingState = document.getElementById('ai-loading-state');
    const loadingText = document.getElementById('ai-loading-text');
    const apiKey = aiDetector.getSavedApiKey();

    if (forceDeepAi && apiKey) {
      if (loadingState) {
        loadingState.classList.remove('hidden');
        if (loadingText) loadingText.textContent = i18n.get('deepAiAnalyzing');
      }
      try {
        const analysis = await aiDetector.analyzeWithGemini(canvas, apiKey, i18n.currentLang);
        this.latestAiAnalysis = analysis;
        this.renderAiAnalysis(analysis);
        this.showToast(i18n.get('aiDeepAnalysisSuccessToast'));
      } catch (err) {
        console.warn('Gemini AI failed, falling back to client AI:', err);
        this.showToast(i18n.get('aiErrorFallbackToast'));
        const analysis = aiDetector.analyzeImageClient(canvas, extractedColors);
        this.latestAiAnalysis = analysis;
        this.renderAiAnalysis(analysis);
      } finally {
        if (loadingState) loadingState.classList.add('hidden');
      }
    } else {
      // Free instant client-side AI analysis
      if (loadingState) {
        loadingState.classList.remove('hidden');
        if (loadingText) loadingText.textContent = i18n.get('analyzingImageAi');
      }
      setTimeout(() => {
        const analysis = aiDetector.analyzeImageClient(canvas, extractedColors);
        this.latestAiAnalysis = analysis;
        this.renderAiAnalysis(analysis);
        if (loadingState) loadingState.classList.add('hidden');
      }, 150);
    }
  }

  renderAiAnalysis(analysis) {
    if (!analysis) return;

    const elHarmony = document.getElementById('ai-detected-harmony');
    const elConfidence = document.getElementById('ai-confidence-badge');
    const elReasoning = document.getElementById('ai-harmony-reasoning');
    const elMoodIcon = document.getElementById('ai-mood-icon');
    const elMoodTitle = document.getElementById('ai-mood-title');
    const elMoodDesc = document.getElementById('ai-mood-desc');
    const elWarmPct = document.getElementById('ai-warm-pct');
    const elCoolPct = document.getElementById('ai-cool-pct');
    const elFillWarm = document.getElementById('ai-temp-fill-warm');
    const elFillCool = document.getElementById('ai-temp-fill-cool');
    const elContrast = document.getElementById('ai-contrast-tag');
    const elVibrancy = document.getElementById('ai-vibrancy-tag');
    const elStatusPill = document.getElementById('ai-status-pill');
    const elColorsContainer = document.getElementById('ai-colors-container');
    const elFootnote = document.getElementById('ai-engine-footnote');

    if (elHarmony) {
      const translatedRule = i18n.get(analysis.harmonyNameKey) || analysis.harmonyRule;
      elHarmony.textContent = translatedRule.charAt(0).toUpperCase() + translatedRule.slice(1);
    }
    if (elConfidence) elConfidence.textContent = `${analysis.confidence}% ${i18n.get('confidenceLabel')}`;
    if (elReasoning) elReasoning.textContent = analysis.reasoning;
    if (elMoodIcon) elMoodIcon.textContent = analysis.moodIcon || '✨';
    if (elMoodTitle) elMoodTitle.textContent = analysis.mood;
    if (elMoodDesc) elMoodDesc.textContent = analysis.moodDesc;
    if (elWarmPct) elWarmPct.textContent = `${analysis.warmPercent}%`;
    if (elCoolPct) elCoolPct.textContent = `${analysis.coolPercent}%`;
    if (elFillWarm) elFillWarm.style.width = `${analysis.warmPercent}%`;
    if (elFillCool) elFillCool.style.width = `${analysis.coolPercent}%`;
    if (elContrast) elContrast.textContent = analysis.contrastRating;
    if (elVibrancy) elVibrancy.textContent = analysis.vibrancyRating;

    if (elStatusPill) {
      if (analysis.isDeepAi) {
        elStatusPill.textContent = '✨ Gemini Vision AI';
        elStatusPill.style.background = 'rgba(168, 85, 247, 0.25)';
        elStatusPill.style.borderColor = '#A855F7';
        elStatusPill.style.color = '#DDD6FE';
      } else {
        elStatusPill.textContent = 'Active (Free AI)';
        elStatusPill.style.background = 'rgba(16, 185, 129, 0.2)';
        elStatusPill.style.borderColor = '#10B981';
        elStatusPill.style.color = '#6EE7B7';
      }
    }

    if (elFootnote) {
      elFootnote.innerHTML = analysis.isDeepAi
        ? `<span>✨ Powered by Google Gemini Vision API (Free Multimodal AI)</span>`
        : `<span data-i18n="builtInAiNotice">${i18n.get('builtInAiNotice')}</span>`;
    }

    if (elColorsContainer && analysis.colors) {
      elColorsContainer.innerHTML = '';
      analysis.colors.forEach(c => {
        const card = document.createElement('div');
        const isBase = c.role === 'base';
        card.className = `ai-color-card ${isBase ? 'is-base-role' : ''}`;
        const lum = ColorMath.getLuminance(c.r, c.g, c.b);
        const textCol = lum > 0.5 ? '#000000' : '#FFFFFF';

        let roleText = c.roleLabel || c.role;
        if (c.role === 'base') roleText = i18n.get('roleBaseAnchor');
        else if (c.role === 'accent') roleText = i18n.get('roleAccentCta');
        else if (c.role === 'complement') roleText = i18n.get('roleHarmonizer');
        else if (c.role === 'surface') roleText = i18n.get('roleSurfaceTone');
        else if (c.role === 'detail') roleText = i18n.get('roleContrastDetail');

        card.innerHTML = `
          <div class="ai-color-card-swatch" style="background-color: ${c.hex}; color: ${textCol};">
            <span>${c.hex}</span>
          </div>
          <div class="ai-color-card-info">
            <span class="ai-color-card-name" title="${c.colorName}">${c.colorName}</span>
            <span class="ai-color-role-badge">${roleText}</span>
          </div>
        `;
        elColorsContainer.appendChild(card);
      });
    }
  }

  applyAiSchemaToStudio() {
    if (!this.latestAiAnalysis || !this.latestAiAnalysis.colors) return;

    const analysis = this.latestAiAnalysis;

    // Apply the 5 detected colors to the active studio palette
    this.palette = analysis.colors.map(col => {
      const isBase = col.role === 'base';
      return {
        h: col.h,
        s: col.s,
        l: col.l,
        r: col.r,
        g: col.g,
        b: col.b,
        hex: col.hex,
        isBase,
        locked: false
      };
    });

    // Ensure one base exists
    const baseIndex = this.palette.findIndex(s => s.isBase);
    const baseSwatch = baseIndex !== -1 ? this.palette[baseIndex] : this.palette[2];
    if (baseIndex === -1 && this.palette[2]) this.palette[2].isBase = true;

    this.baseHsl = { h: baseSwatch.h, s: baseSwatch.s, l: baseSwatch.l };
    this.activeRule = analysis.harmonyRule;

    const select = document.getElementById('harmony-select');
    if (select) select.value = analysis.harmonyRule;

    this.syncAllViews();
    this.switchTab('tab-wheel');

    const ruleName = i18n.get(analysis.harmonyNameKey) || analysis.harmonyRule;
    this.showToast(i18n.get('aiSchemaAppliedToast', { rule: ruleName, mood: analysis.mood }));
  }

  initGeminiModal() {
    const modal = document.getElementById('gemini-modal');
    const btnOpen = document.getElementById('btn-open-gemini-modal');
    const btnClose = document.getElementById('gemini-modal-close-btn');
    const btnSave = document.getElementById('btn-save-gemini-key');
    const btnClear = document.getElementById('btn-clear-gemini-key');
    const inputKey = document.getElementById('gemini-api-key-input');
    const btnToggleVis = document.getElementById('btn-toggle-key-visibility');
    const indicatorDot = document.getElementById('gemini-indicator-dot');
    const statusText = document.getElementById('gemini-status-text');

    const updateModalStatus = () => {
      const key = aiDetector.getSavedApiKey();
      if (inputKey) inputKey.value = key ? '••••••••••••••••' : '';
      if (key) {
        if (indicatorDot) indicatorDot.className = 'status-indicator-dot active';
        if (statusText) statusText.textContent = 'API Key Configured (Google Gemini Vision Active)';
      } else {
        if (indicatorDot) indicatorDot.className = 'status-indicator-dot';
        if (statusText) statusText.textContent = 'No API key saved (Using free built-in AI)';
      }
    };

    updateModalStatus();

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        updateModalStatus();
        if (modal) modal.classList.add('active');
      });
    }

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (btnToggleVis && inputKey) {
      btnToggleVis.addEventListener('click', () => {
        if (inputKey.type === 'password') {
          inputKey.type = 'text';
          btnToggleVis.textContent = '🔒';
          const savedKey = aiDetector.getSavedApiKey();
          if (savedKey) inputKey.value = savedKey;
        } else {
          inputKey.type = 'password';
          btnToggleVis.textContent = '👁️';
        }
      });
    }

    if (btnSave && inputKey) {
      btnSave.addEventListener('click', async () => {
        const val = inputKey.value.trim();
        if (val && !val.startsWith('•••')) {
          aiDetector.saveApiKey(val);
          this.showToast(i18n.get('geminiKeySavedToast'));
        }
        closeModal();
        if (this.extractor && this.extractor.canvas) {
          await this.runAiSchemeDetection(this.extractor.canvas, this.extractor.extractedColors, true);
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        aiDetector.saveApiKey('');
        if (inputKey) inputKey.value = '';
        updateModalStatus();
        this.showToast(i18n.get('geminiKeyClearedToast'));
        closeModal();
        if (this.extractor && this.extractor.canvas) {
          this.runAiSchemeDetection(this.extractor.canvas, this.extractor.extractedColors, false);
        }
      });
    }
  }

  initUIPreview() {
    this.uiPreview = new UIPreview();
    this.uiPreview.updatePalette(this.palette);
  }

  syncAllViews() {
    if (this.wheel) this.wheel.setPalette(this.palette, this.activeRule);
    this.renderSwatches();
    this.renderContrastMatrix();
    if (this.uiPreview) this.uiPreview.updatePalette(this.palette);
    this.updateBaseControlsUI();
  }

  updateBaseControlsUI() {
    const picker = document.getElementById('base-color-picker');
    const hexInput = document.getElementById('base-color-hex');
    const satSlider = document.getElementById('base-sat-slider');
    const lightSlider = document.getElementById('base-light-slider');
    const satVal = document.getElementById('base-sat-val');
    const lightVal = document.getElementById('base-light-val');
    const tag = document.getElementById('current-harmony-tag');

    const baseSwatch = this.palette.find(s => s.isBase) || this.palette[2];

    if (picker) picker.value = baseSwatch.hex;
    if (hexInput) hexInput.value = baseSwatch.hex;
    if (satSlider) satSlider.value = baseSwatch.s;
    if (lightSlider) lightSlider.value = baseSwatch.l;
    if (satVal) satVal.textContent = `${baseSwatch.s}%`;
    if (lightVal) lightVal.textContent = `${baseSwatch.l}%`;
    if (tag) tag.textContent = this.activeRule.toUpperCase();
  }

  renderSwatches() {
    const container = document.getElementById('swatches-container');
    if (!container) return;

    container.innerHTML = '';

    this.palette.forEach((swatch, idx) => {
      const card = document.createElement('div');
      card.className = `swatch-card ${swatch.isBase ? 'is-base-card' : ''}`;

      const lum = ColorMath.getLuminance(swatch.r, swatch.g, swatch.b);
      const textColor = lum > 0.5 ? '#000000' : '#FFFFFF';
      const oklch = ColorMath.rgbToOklch(swatch.r, swatch.g, swatch.b);

      const badgeText = swatch.isBase ? i18n.get('baseBadge') : `${i18n.get('colorBadge')} ${idx + 1}`;
      const setBaseTitle = i18n.get('setAsBaseTitle');
      const lockTitle = swatch.locked ? i18n.get('unlockTitle') : i18n.get('lockTitle');

      card.innerHTML = `
        <div class="swatch-color-display" style="background-color: ${swatch.hex}; color: ${textColor};">
          <div class="swatch-top-actions">
            <span class="swatch-badge">${badgeText}</span>
            <div style="display: flex; gap: 4px;">
              <button class="swatch-btn-icon btn-set-base ${swatch.isBase ? 'active' : ''}" title="${setBaseTitle}" data-index="${idx}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
              </button>
              <button class="swatch-btn-icon btn-lock ${swatch.locked ? 'active' : ''}" title="${lockTitle}" data-index="${idx}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${swatch.locked 
                    ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' 
                    : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}
                </svg>
              </button>
            </div>
          </div>
          <div class="swatch-hex-display">${swatch.hex}</div>
        </div>

        <div class="swatch-card-footer">
          <div class="swatch-code-row">
            <span>RGB:</span>
            <span class="swatch-code-val">${swatch.r}, ${swatch.g}, ${swatch.b}</span>
          </div>
          <div class="swatch-code-row">
            <span>HSL:</span>
            <span class="swatch-code-val">${swatch.h}°, ${swatch.s}%, ${swatch.l}%</span>
          </div>
          <div class="swatch-code-row">
            <span>OKLCH:</span>
            <span class="swatch-code-val">${oklch.l}% ${oklch.c} ${oklch.h}°</span>
          </div>
        </div>
      `;

      // Copy color code on click
      const display = card.querySelector('.swatch-color-display');
      display.addEventListener('click', (e) => {
        if (e.target.closest('.swatch-btn-icon')) return;
        this.copyToClipboard(swatch.hex, i18n.get('copiedToast', { text: swatch.hex }));
      });

      // Lock toggle
      const lockBtn = card.querySelector('.btn-lock');
      lockBtn.addEventListener('click', () => {
        swatch.locked = !swatch.locked;
        this.renderSwatches();
        this.showToast(swatch.locked ? i18n.get('lockedToast', { num: idx + 1 }) : i18n.get('unlockedToast', { num: idx + 1 }));
      });

      // Set as Base toggle
      const setBaseBtn = card.querySelector('.btn-set-base');
      setBaseBtn.addEventListener('click', () => {
        this.palette.forEach(s => s.isBase = false);
        swatch.isBase = true;
        this.baseHsl = { h: swatch.h, s: swatch.s, l: swatch.l };
        this.updatePalette();
        this.syncAllViews();
        this.showToast(i18n.get('setBaseToast', { num: idx + 1 }));
      });

      container.appendChild(card);
    });
  }

  renderContrastMatrix() {
    const table = document.getElementById('contrast-matrix-table');
    const previewsContainer = document.getElementById('contrast-previews');
    const simSelect = document.getElementById('color-blindness-select');

    if (!table) return;

    const simType = simSelect ? simSelect.value : 'normal';

    // Simulate palette colors if filter selected
    const displayColors = this.palette.map(swatch => {
      const simRgb = ColorMath.simulateColorBlindness({ r: swatch.r, g: swatch.g, b: swatch.b }, simType);
      return {
        ...swatch,
        simRgb,
        simHex: ColorMath.rgbToHex(simRgb.r, simRgb.g, simRgb.b)
      };
    });

    // Generate Table Header
    let tableHtml = `<thead><tr><th>${i18n.get('bgTextHeader')}</th>`;
    displayColors.forEach((col, idx) => {
      tableHtml += `<th><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${col.simHex};margin-right:4px;"></span>C${idx + 1}</th>`;
    });
    tableHtml += `</tr></thead><tbody>`;

    // Generate Table Body
    displayColors.forEach((bgCol, bgIdx) => {
      tableHtml += `<tr><th><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${bgCol.simHex};margin-right:4px;"></span>C${bgIdx + 1}</th>`;
      displayColors.forEach((textCol, textIdx) => {
        if (bgIdx === textIdx) {
          tableHtml += `<td><span style="opacity:0.3;">N/A</span></td>`;
        } else {
          const ratio = ColorMath.getContrastRatio(bgCol.simRgb, textCol.simRgb);
          const ratings = ColorMath.getContrastRatings(ratio);

          const badgeAA = ratings.aaNormal ? '<span class="badge-wcag badge-pass">AA</span>' : '<span class="badge-wcag badge-fail">Fail</span>';
          const badgeAAA = ratings.aaaNormal ? '<span class="badge-wcag badge-pass">AAA</span>' : '';

          tableHtml += `
            <td>
              <div class="matrix-cell" style="background:${bgCol.simHex}; color:${textCol.simHex}; border:1px solid rgba(255,255,255,0.1);">
                <span class="ratio-val">${ratings.ratio}:1</span>
                <div class="wcag-badges">${badgeAA} ${badgeAAA}</div>
              </div>
            </td>
          `;
        }
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody>`;
    table.innerHTML = tableHtml;

    // Render Preview Cards
    if (previewsContainer) {
      previewsContainer.innerHTML = '';
      for (let i = 0; i < displayColors.length - 1; i++) {
        const bg = displayColors[i];
        const text = displayColors[i + 1];
        const ratio = ColorMath.getContrastRatio(bg.simRgb, text.simRgb).toFixed(2);

        const card = document.createElement('div');
        card.className = 'preview-card';
        card.style.backgroundColor = bg.simHex;
        card.style.color = text.simHex;
        card.style.border = '1px solid rgba(255, 255, 255, 0.1)';

        card.innerHTML = `
          <div style="font-weight:700; font-size:1.1rem;">Contrast Sample (${ratio}:1)</div>
          <div style="font-size:0.9rem; opacity:0.9;">The quick brown fox jumps over the lazy dog.</div>
          <div style="font-size:0.75rem; opacity:0.75; margin-top:4px;">Background: ${bg.simHex} | Text: ${text.simHex}</div>
        `;
        previewsContainer.appendChild(card);
      }
    }
  }

  renderSavedLibrary() {
    const grid = document.getElementById('saved-palettes-grid');
    if (!grid) return;

    const saved = StorageExporter.getSavedPalettes();
    grid.innerHTML = '';

    if (saved.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1; color:var(--text-muted); text-align:center; padding:3rem 0;">${i18n.get('noSavedPalettes')}</p>`;
      return;
    }

    saved.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'saved-card';

      let stripsHtml = '<div class="saved-card-strip">';
      entry.colors.forEach(col => {
        stripsHtml += `<div class="saved-color-block" style="background-color:${col.hex};" title="${col.hex}"></div>`;
      });
      stripsHtml += '</div>';

      card.innerHTML = `
        <div class="saved-card-header">
          <span class="saved-card-title">${entry.name}</span>
          <small style="color:var(--text-muted); font-size:0.75rem;">${new Date(entry.createdAt).toLocaleDateString()}</small>
        </div>
        ${stripsHtml}
        <div class="saved-card-actions">
          <button class="btn btn-secondary btn-load-saved" data-id="${entry.id}">Load Palette</button>
          <button class="btn btn-secondary btn-delete-saved" data-id="${entry.id}" style="color:#EF4444;">Delete</button>
        </div>
      `;

      card.querySelector('.btn-load-saved').addEventListener('click', () => {
        this.palette = entry.colors.map(col => {
          const hsl = ColorMath.rgbToHsl(col.r, col.g, col.b);
          return {
            ...hsl,
            r: col.r,
            g: col.g,
            b: col.b,
            hex: col.hex,
            isBase: col.isBase || false,
            locked: false
          };
        });

        const baseSwatch = this.palette.find(s => s.isBase) || this.palette[2];
        this.baseHsl = { h: baseSwatch.h, s: baseSwatch.s, l: baseSwatch.l };
        this.activeRule = HARMONY_RULES.CUSTOM;
        const select = document.getElementById('harmony-select');
        if (select) select.value = HARMONY_RULES.CUSTOM;

        this.syncAllViews();
        this.switchTab('tab-wheel');
        this.showToast(i18n.get('loadedToast', { name: entry.name }));
      });

      card.querySelector('.btn-delete-saved').addEventListener('click', () => {
        StorageExporter.deletePalette(entry.id);
        this.renderSavedLibrary();
        this.showToast(i18n.get('deletedToast'));
      });

      grid.appendChild(card);
    });
  }

  bindDOMEvents() {
    // Language Toggle Button
    const btnLangToggle = document.getElementById('btn-lang-toggle');
    if (btnLangToggle) {
      btnLangToggle.addEventListener('click', () => {
        const nextLang = i18n.currentLang === 'en' ? 'es' : 'en';
        i18n.setLanguage(nextLang);
        this.updateUiTranslations();
        this.showToast(nextLang === 'es' ? '¡Idioma cambiado a Español!' : 'Language switched to English!');
      });
    }

    // Navigation Tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Harmony select dropdown
    const harmonySelect = document.getElementById('harmony-select');
    if (harmonySelect) {
      harmonySelect.addEventListener('change', (e) => {
        this.activeRule = e.target.value;
        this.updatePalette();
        this.syncAllViews();
      });
    }

    // Base color picker & hex input
    const colorPicker = document.getElementById('base-color-picker');
    const hexInput = document.getElementById('base-color-hex');
    const satSlider = document.getElementById('base-sat-slider');
    const lightSlider = document.getElementById('base-light-slider');

    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        const rgb = ColorMath.hexToRgb(e.target.value);
        const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
        this.baseHsl = hsl;
        this.updatePalette();
        this.syncAllViews();
      });
    }

    if (hexInput) {
      hexInput.addEventListener('change', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          const rgb = ColorMath.hexToRgb(val);
          this.baseHsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
          this.updatePalette();
          this.syncAllViews();
        }
      });
    }

    if (satSlider) {
      satSlider.addEventListener('input', (e) => {
        this.baseHsl.s = parseInt(e.target.value, 10);
        this.updatePalette();
        this.syncAllViews();
      });
    }

    if (lightSlider) {
      lightSlider.addEventListener('input', (e) => {
        this.baseHsl.l = parseInt(e.target.value, 10);
        this.updatePalette();
        this.syncAllViews();
      });
    }

    // Inspiration Presets
    const presetChips = document.querySelectorAll('.preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const hex = chip.dataset.hex;
        const rgb = ColorMath.hexToRgb(hex);
        this.baseHsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
        this.updatePalette();
        this.syncAllViews();
        this.showToast(`Applied preset ${chip.textContent}`);
      });
    });

    // Randomize button (Space key)
    const btnRandom = document.getElementById('btn-randomize');
    if (btnRandom) {
      btnRandom.addEventListener('click', () => this.randomizePalette());
    }

    // Eyedropper API
    const btnEyedropper = document.getElementById('btn-eyedropper');
    if (btnEyedropper) {
      btnEyedropper.addEventListener('click', async () => {
        if ('EyeDropper' in window) {
          try {
            const eyeDropper = new EyeDropper();
            const result = await eyeDropper.open();
            const rgb = ColorMath.hexToRgb(result.sRGBHex);
            this.baseHsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
            this.updatePalette();
            this.syncAllViews();
            this.showToast(`Picked color ${result.sRGBHex}`);
          } catch (e) {
            console.log('Eyedropper canceled', e);
          }
        } else {
          this.showToast('Eyedropper API not supported in this browser version.', 3000);
        }
      });
    }

    // Save Palette Button
    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const name = prompt('Enter a name for your palette:', 'Sunset Chroma');
        if (name) {
          StorageExporter.savePalette(this.palette, name);
          this.renderSavedLibrary();
          this.showToast(`Saved palette "${name}" to library!`);
        }
      });
    }

    // Export Modal Events
    const btnExport = document.getElementById('btn-export');
    const modalExport = document.getElementById('export-modal');
    const btnModalClose = document.getElementById('modal-close-btn');

    if (btnExport && modalExport) {
      btnExport.addEventListener('click', () => {
        modalExport.classList.add('active');
        this.updateExportModal('css');
      });
    }

    if (btnModalClose && modalExport) {
      btnModalClose.addEventListener('click', () => modalExport.classList.remove('active'));
      modalExport.addEventListener('click', (e) => {
        if (e.target === modalExport) modalExport.classList.remove('active');
      });
    }

    // Export Modal Format Tabs
    const modalTabs = document.querySelectorAll('.modal-tab');
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.updateExportModal(tab.dataset.exportType);
      });
    });

    // Copy & Download Export Buttons
    const btnCopyCode = document.getElementById('btn-copy-code');
    const btnDownload = document.getElementById('btn-download-file');
    const codeBox = document.getElementById('export-code-box');

    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        if (codeBox && codeBox.value) {
          this.copyToClipboard(codeBox.value, 'Export content copied to clipboard!');
        }
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const activeTab = document.querySelector('.modal-tab.active');
        const type = activeTab ? activeTab.dataset.exportType : 'css';
        this.downloadExportFile(type);
      });
    }

    // Contrast Simulation Select
    const simSelect = document.getElementById('color-blindness-select');
    if (simSelect) {
      simSelect.addEventListener('change', () => this.renderContrastMatrix());
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.randomizePalette();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (btnSave) btnSave.click();
      }
    });

    // AI Color Scheme Actions
    const btnApplyAi = document.getElementById('btn-apply-ai-schema');
    if (btnApplyAi) {
      btnApplyAi.addEventListener('click', () => this.applyAiSchemaToStudio());
    }

    const btnReanalyzeAi = document.getElementById('btn-reanalyze-ai');
    if (btnReanalyzeAi) {
      btnReanalyzeAi.addEventListener('click', () => {
        if (this.extractor && this.extractor.canvas) {
          const hasKey = !!aiDetector.getSavedApiKey();
          this.runAiSchemeDetection(this.extractor.canvas, this.extractor.extractedColors, hasKey);
        }
      });
    }
  }

  randomizePalette() {
    this.baseHsl = {
      h: Math.floor(Math.random() * 360),
      s: Math.floor(Math.random() * 40) + 60, // 60% to 100% saturation
      l: Math.floor(Math.random() * 30) + 35  // 35% to 65% lightness
    };
    this.updatePalette();
    this.syncAllViews();
    this.showToast('Randomized palette colors!');
  }

  switchTab(targetId) {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(t => {
      const active = t.dataset.tab === targetId;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });

    contents.forEach(c => {
      c.classList.toggle('active', c.id === targetId);
    });

    if (targetId === 'tab-contrast') this.renderContrastMatrix();
    if (targetId === 'tab-library') this.renderSavedLibrary();
  }

  updateExportModal(type) {
    const codeBox = document.getElementById('export-code-box');
    const pngPreview = document.getElementById('png-preview-container');
    if (!codeBox) return;

    pngPreview.classList.add('hidden');
    codeBox.classList.remove('hidden');

    switch (type) {
      case 'css':
        codeBox.value = StorageExporter.toCssVariables(this.palette);
        break;
      case 'tailwind':
        codeBox.value = StorageExporter.toTailwindConfig(this.palette);
        break;
      case 'json':
        codeBox.value = StorageExporter.toJson(this.palette);
        break;
      case 'svg':
        codeBox.value = StorageExporter.toSvg(this.palette);
        break;
      case 'png':
        const dataUrl = StorageExporter.toPngDataUrl(this.palette);
        codeBox.classList.add('hidden');
        pngPreview.classList.remove('hidden');
        pngPreview.innerHTML = `<img src="${dataUrl}" style="max-width:100%; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">`;
        break;
      case 'url':
        codeBox.value = StorageExporter.toShareUrl(this.palette);
        break;
    }
  }

  downloadExportFile(type) {
    let content = '';
    let filename = `chromacraft-palette.${type === 'tailwind' ? 'js' : type}`;
    let mime = 'text/plain';

    if (type === 'css') {
      content = StorageExporter.toCssVariables(this.palette);
    } else if (type === 'tailwind') {
      content = StorageExporter.toTailwindConfig(this.palette);
    } else if (type === 'json') {
      content = StorageExporter.toJson(this.palette);
      mime = 'application/json';
    } else if (type === 'svg') {
      content = StorageExporter.toSvg(this.palette);
      mime = 'image/svg+xml';
    } else if (type === 'png') {
      const dataUrl = StorageExporter.toPngDataUrl(this.palette);
      const link = document.createElement('a');
      link.download = 'chromacraft-palette.png';
      link.href = dataUrl;
      link.click();
      this.showToast('Downloaded PNG palette image!');
      return;
    } else if (type === 'url') {
      content = StorageExporter.toShareUrl(this.palette);
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${filename}`);
  }

  copyToClipboard(text, message = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(message);
    }).catch(err => {
      console.error('Copy failed', err);
    });
  }

  showToast(msg, duration = 2400) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Bootstrap Application when DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
