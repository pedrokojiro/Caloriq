// constants/colors.ts
// Paleta de cores do CaloriQ — baseada no protótipo Figma

export const colors = {
  // ── Principal ──────────────────────────────────────────────────────────────
  green:       '#16a34a',
  greenLight:  '#dcfce7',
  greenMid:    '#22c55e',
  greenDark:   '#15803d',

  // ── Destaque ───────────────────────────────────────────────────────────────
  orange:      '#f97316',
  orangeLight: '#fff7ed',

  // ── Cinzas ─────────────────────────────────────────────────────────────────
  gray50:  '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',

  // ── Semânticas ─────────────────────────────────────────────────────────────
  white:      '#ffffff',
  background: '#f8fafc',
  card:       '#ffffff',
  border:     '#e2e8f0',

  // ── Macros ─────────────────────────────────────────────────────────────────
  protein:   '#16a34a',
  proteinBg: '#f0fdf4',
  carb:      '#b45309',
  carbBg:    '#fffbeb',
  fat:       '#ea580c',
  fatBg:     '#fff7ed',

  // ── Câmera ─────────────────────────────────────────────────────────────────
  cameraBg:   '#0a0a0a',
  darkGreenBg: '#1e3a2f',
};

export type ColorKey = keyof typeof colors;
