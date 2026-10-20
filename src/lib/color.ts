// React Native has no oklch() support, so tile colors are converted to sRGB hex here.

function linearToSrgb(x: number) {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

export function oklch(l: number, c: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  const r = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

  return '#' + [r, g, bl].map((v) => linearToSrgb(v).toString(16).padStart(2, '0')).join('');
}

/** Two gradient stops (165°) for an item's tinted tile. */
export function tileGradient(bgHue: number, lightness: number, chroma: number, delta = 0): [string, string] {
  const L = lightness + delta;
  return [oklch(L + 0.03, chroma, bgHue), oklch(L - 0.035, chroma, bgHue)];
}

/** Dot color for a tag group. */
export function groupDot(hue: number) {
  return oklch(0.64, 0.13, hue);
}
