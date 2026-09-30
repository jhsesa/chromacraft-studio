/**
 * ChromaCraft Studio - Internationalization (i18n) Engine
 * Provides seamless English (EN) and Spanish (ES) language switching.
 */

export const TRANSLATIONS = {
  en: {
    // Header & Actions
    eyedropper: 'Eyedropper',
    randomize: 'Randomize',
    save: 'Save',
    exportPalette: 'Export Palette',

    // Tabs
    tabWheel: 'Color Wheel & Harmony',
    tabContrast: 'Accessibility & Contrast',
    tabExtractor: 'Image Palette Extractor',
    tabMockup: 'Live UI Playground',
    tabLibrary: 'Saved Palettes',

    // Color Wheel & Sidebar
    colorHarmony: 'Color Harmony',
    harmonyRule: 'Harmony Rule',
    baseColor: 'Base Color',
    baseSaturation: 'Base Saturation',
    baseLightness: 'Base Lightness',
    inspirationPresets: 'Inspiration Presets',
    dragNodesInstruction: 'Drag nodes to adjust palette',

    // Harmony Rule Options
    analogous: 'Analogous',
    monochromatic: 'Monochromatic',
    triadic: 'Triadic',
    complementary: 'Complementary',
    splitComplementary: 'Split-Complementary',
    tetradic: 'Tetradic (Square)',
    shades: 'Shades & Tints',
    doubleComplementary: 'Double Complementary',
    custom: 'Custom (Freeform)',

    // Swatch Cards
    baseBadge: 'Base',
    colorBadge: 'Color',
    setAsBaseTitle: 'Set as Base Color',
    lockTitle: 'Lock Color',
    unlockTitle: 'Unlock Color',

    // Accessibility Tab
    contrastTitle: 'WCAG 2.1 Accessibility Matrix',
    contrastDesc: 'Evaluate contrast ratios between every color pair in your active palette according to Web Content Accessibility Guidelines (WCAG 2.1).',
    simulationMode: 'Simulation Mode:',
    normalVision: 'Normal Vision',
    protanopia: 'Protanopia (Red-Blind)',
    deuteranopia: 'Deuteranopia (Green-Blind)',
    tritanopia: 'Tritanopia (Blue-Blind)',
    achromatopsia: 'Achromatopsia (Monochromacy)',
    bgTextHeader: 'Background \\ Text',

    // Image Extractor Tab
    extractorTitle: 'Extract Palette from Image',
    extractorDesc: 'Upload or drag an image into the dropzone to automatically extract vibrant palette colors, or drag the color sampler pins over the image.',
    dropzoneText: 'Click or drag image file here',
    dropzoneSubtext: 'Supports JPG, PNG, WEBP, SVG',
    trySampleImages: 'Or try sample images:',
    applyExtractedBtn: 'Apply Extracted Palette to Wheel',

    // Live UI Playground
    uiPreviewTitle: 'UI Layout Preview',
    uiPreviewDesc: 'See your color palette applied to a realistic web dashboard & app layout.',
    primaryBgRole: 'Primary Background',
    surfaceRole: 'Surface / Card',
    primaryBrandRole: 'Primary Brand / Action',
    secondaryAccentRole: 'Secondary Accent',
    textContentRole: 'Text Content',
    uiWelcome: 'Welcome to Spectra Dashboard',
    uiHeroDesc: 'Real-time analytics and palette preview mockup.',
    uiGetStarted: 'Get Started',
    uiDocs: 'View Documentation',
    uiNewProject: 'New Project',
    uiOverview: 'Overview',
    uiReports: 'Reports',
    uiTeam: 'Team Members',
    uiIntegrations: 'Integrations',
    uiMonthlyRevenue: 'Monthly Active Revenue',
    uiSystemUptime: 'System Uptime',
    uiTotalAccounts: 'Total Registered Accounts',

    // Library Tab
    libraryTitle: 'Saved Palettes Library',
    libraryDesc: 'Access your stored color palettes, search by name, or re-load them into the studio.',
    searchPlaceholder: 'Search saved palettes...',
    noSavedPalettes: 'No saved palettes yet. Click "Save" in the header to store your current palette.',
    loadPaletteBtn: 'Load Palette',
    deleteBtn: 'Delete',

    // Export Modal
    exportTitle: 'Export Palette',
    copyToClipboardBtn: 'Copy to Clipboard',
    downloadFileBtn: 'Download File',

    // Footer
    designedBy: 'Designed & Developed by',
    rights: '© 2026 ChromaCraft Studio • Created by Jonathan Serna',

    // Toasts
    welcomeToast: 'Welcome to ChromaCraft Studio!',
    copiedToast: 'Copied {text} to clipboard!',
    lockedToast: 'Locked Color {num}',
    unlockedToast: 'Unlocked Color {num}',
    setBaseToast: 'Set Color {num} as Base Color',
    extractedToast: 'Extracted palette applied to wheel!',
    presetToast: 'Applied preset {preset}',
    randomizedToast: 'Randomized palette colors!',
    savedToast: 'Saved palette "{name}" to library!',
    loadedToast: 'Loaded palette "{name}"',
    deletedToast: 'Palette deleted from library',
    downloadedToast: 'Downloaded {filename}'
  },

  es: {
    // Header & Actions
    eyedropper: 'Cuenta-gotas',
    randomize: 'Aleatorio',
    save: 'Guardar',
    exportPalette: 'Exportar Paleta',

    // Tabs
    tabWheel: 'Rueda de Color y Armonía',
    tabContrast: 'Accesibilidad y Contraste',
    tabExtractor: 'Extractor de Paleta de Imagen',
    tabMockup: 'Visualizador de UI en Vivo',
    tabLibrary: 'Paletas Guardadas',

    // Color Wheel & Sidebar
    colorHarmony: 'Armonía de Color',
    harmonyRule: 'Regla de Armonía',
    baseColor: 'Color Base',
    baseSaturation: 'Saturación Base',
    baseLightness: 'Luminosidad Base',
    inspirationPresets: 'Presets de Inspiración',
    dragNodesInstruction: 'Arrastra los nodos para ajustar la paleta',

    // Harmony Rule Options
    analogous: 'Análogo',
    monochromatic: 'Monocromático',
    triadic: 'Triádico',
    complementary: 'Complementario',
    splitComplementary: 'Complementario Dividido',
    tetradic: 'Tetrádico (Cuadrado)',
    shades: 'Sombras y Tintes',
    doubleComplementary: 'Doble Complementario',
    custom: 'Personalizado (Libre)',

    // Swatch Cards
    baseBadge: 'Base',
    colorBadge: 'Color',
    setAsBaseTitle: 'Fijar como Color Base',
    lockTitle: 'Bloquear Color',
    unlockTitle: 'Desbloquear Color',

    // Accessibility Tab
    contrastTitle: 'Matriz de Accesibilidad WCAG 2.1',
    contrastDesc: 'Evalúa los contrastes entre cada par de colores de tu paleta activa según las Guías de Accesibilidad para el Contenido Web (WCAG 2.1).',
    simulationMode: 'Modo de Simulación:',
    normalVision: 'Visión Normal',
    protanopia: 'Protanopía (Ceguera al Rojo)',
    deuteranopia: 'Deuteranopía (Ceguera al Verde)',
    tritanopia: 'Tritanopía (Ceguera al Azul)',
    achromatopsia: 'Acromatopsia (Monocromatismo)',
    bgTextHeader: 'Fondo \\ Texto',

    // Image Extractor Tab
    extractorTitle: 'Extraer Paleta desde Imagen',
    extractorDesc: 'Sube o arrastra una imagen a la zona de carga para extraer colores automáticamente, o arrastra los pines muestreadores sobre la imagen.',
    dropzoneText: 'Haz clic o arrastra una imagen aquí',
    dropzoneSubtext: 'Soporta JPG, PNG, WEBP, SVG',
    trySampleImages: 'O prueba imágenes de muestra:',
    applyExtractedBtn: 'Aplicar Paleta Extraída a la Rueda',

    // Live UI Playground
    uiPreviewTitle: 'Vista Previa de Interfaz de Usuario',
    uiPreviewDesc: 'Mira tu paleta de colores aplicada en tiempo real a un panel web y tarjeta móvil realistas.',
    primaryBgRole: 'Fondo Principal',
    surfaceRole: 'Superficie / Tarjeta',
    primaryBrandRole: 'Marca Principal / Acción',
    secondaryAccentRole: 'Acento Secundario',
    textContentRole: 'Contenido de Texto',
    uiWelcome: 'Bienvenido al Panel Spectra',
    uiHeroDesc: 'Analíticas en tiempo real y vista previa de paleta de colores.',
    uiGetStarted: 'Comenzar',
    uiDocs: 'Ver Documentación',
    uiNewProject: 'Nuevo Proyecto',
    uiOverview: 'Resumen',
    uiReports: 'Reportes',
    uiTeam: 'Equipo',
    uiIntegrations: 'Integraciones',
    uiMonthlyRevenue: 'Ingresos Mensuales Activos',
    uiSystemUptime: 'Disponibilidad del Sistema',
    uiTotalAccounts: 'Cuentas Registradas',

    // Library Tab
    libraryTitle: 'Biblioteca de Paletas Guardadas',
    libraryDesc: 'Accede a tus paletas guardadas, busca por nombre o cárgalas nuevamente en el estudio.',
    searchPlaceholder: 'Buscar paletas guardadas...',
    noSavedPalettes: 'No hay paletas guardadas aún. Haz clic en "Guardar" en la barra superior para guardar la paleta actual.',
    loadPaletteBtn: 'Cargar Paleta',
    deleteBtn: 'Eliminar',

    // Export Modal
    exportTitle: 'Exportar Paleta',
    copyToClipboardBtn: 'Copiar al Portapapeles',
    downloadFileBtn: 'Descargar Archivo',

    // Footer
    designedBy: 'Diseñado y Desarrollado por',
    rights: '© 2026 ChromaCraft Studio • Creado por Jonathan Serna',

    // Toasts
    welcomeToast: '¡Bienvenido a ChromaCraft Studio!',
    copiedToast: '¡Se copió {text} al portapapeles!',
    lockedToast: 'Color {num} bloqueado',
    unlockedToast: 'Color {num} desbloqueado',
    setBaseToast: 'Color {num} fijado como Color Base',
    extractedToast: '¡Paleta extraída aplicada a la rueda!',
    presetToast: 'Preset {preset} aplicado',
    randomizedToast: '¡Colores de paleta aleatorizados!',
    savedToast: '¡Paleta "{name}" guardada en la biblioteca!',
    loadedToast: 'Paleta "{name}" cargada',
    deletedToast: 'Paleta eliminada de la biblioteca',
    downloadedToast: 'Descargado {filename}'
  }
};

export class i18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('chromacraft_lang') || 'en';
  }

  setLanguage(lang) {
    if (lang !== 'en' && lang !== 'es') return;
    this.currentLang = lang;
    localStorage.setItem('chromacraft_lang', lang);
    document.documentElement.lang = lang;
  }

  get(key, params = {}) {
    let text = (TRANSLATIONS[this.currentLang] && TRANSLATIONS[this.currentLang][key]) 
      || TRANSLATIONS.en[key] 
      || key;

    Object.keys(params).forEach(p => {
      text = text.replace(`{${p}}`, params[p]);
    });

    return text;
  }
}

export const i18n = new i18nManager();
