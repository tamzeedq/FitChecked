// Linen design tokens. Source: design_handoff_fitchecked_linen/README.md (`linen` / `linenDark`).

export type Theme = {
  dark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  onAccent: string;
  btnBg: string;
  btnInk: string;
  btn2Bg: string;
  btn2Ink: string;
  chipBg: string;
  chipInk: string;
  chipOnBg: string;
  chipOnInk: string;
  chipOnBd: string;
  inBg: string;
  inBd: string;
  tabBg: string;
  tabOn: string;
  tabPill: string;
  selBg: string;
  selInk: string;
  today: string;
  danger: string;
  dim: string;
  cardShadow: string;
  /** Item tile lightness / chroma (oklch) for the tinted garment background. */
  tileL: number;
  tileC: number;
};

export const light: Theme = {
  dark: false,
  bg: '#f2efe8',
  surface: '#fffdf8',
  surface2: '#e8e4da',
  ink: '#23271f',
  muted: '#5d6257',
  line: '#e0dbd0',
  accent: '#3f6f55',
  onAccent: '#ffffff',
  btnBg: '#3f6f55',
  btnInk: '#ffffff',
  btn2Bg: '#e8e4da',
  btn2Ink: '#23271f',
  chipBg: '#e8e4da',
  chipInk: '#23271f',
  chipOnBg: '#dbe8de',
  chipOnInk: '#24503a',
  chipOnBd: '#9fc2ab',
  inBg: '#fffdf8',
  inBd: '#e0dbd0',
  tabBg: '#fffdf8',
  tabOn: '#2f5a44',
  tabPill: '#dbe8de',
  selBg: '#3f6f55',
  selInk: '#ffffff',
  today: '#c47a55',
  danger: '#b3261e',
  dim: 'rgba(35,39,31,0.4)',
  cardShadow: '0px 1px 2px rgba(45,40,30,0.05), 0px 10px 28px -14px rgba(45,40,30,0.22)',
  tileL: 0.92,
  tileC: 0.018,
};

export const dark: Theme = {
  dark: true,
  bg: '#1a1d18',
  surface: '#23271f',
  surface2: '#2d3228',
  ink: '#ecebe4',
  muted: '#a9ae9f',
  line: '#353a30',
  accent: '#8cc3a2',
  onAccent: '#10201a',
  btnBg: '#8cc3a2',
  btnInk: '#10201a',
  btn2Bg: '#2d3228',
  btn2Ink: '#ecebe4',
  chipBg: '#2d3228',
  chipInk: '#ecebe4',
  chipOnBg: '#2c4637',
  chipOnInk: '#c4e4d0',
  chipOnBd: '#4f7a5f',
  inBg: '#23271f',
  inBd: '#353a30',
  tabBg: '#23271f',
  tabOn: '#b4dcc4',
  tabPill: '#2c4637',
  selBg: '#8cc3a2',
  selInk: '#10201a',
  today: '#e09a74',
  danger: '#f2948a',
  dim: 'rgba(0,0,0,0.55)',
  cardShadow: '0px 10px 28px -14px rgba(0,0,0,0.6)',
  tileL: 0.4,
  tileC: 0.015,
};

export const radius = {
  card: 22,
  tile: 16,
  button: 16,
  small: 14,
  mini: 6,
  chip: 999,
  sheet: 28,
} as const;

export const dialogShadow = '0px 20px 50px rgba(0,0,0,0.3)';

/** Screen side margin. */
export const GUTTER = 20;

/** Height of the custom tab bar, excluding the bottom safe-area inset. */
export const TAB_BAR_HEIGHT = 54;
