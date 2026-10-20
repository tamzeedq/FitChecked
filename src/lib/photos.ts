import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Capture } from '@/data/store';
import { CATEGORIES, COLORS, type Category, type ColorName } from '@/data/types';

/** Copies a captured photo into app storage so it survives cache clears. */
export function keepPhoto(uri: string): string {
  if (Platform.OS === 'web' || !uri.startsWith('file:')) return uri;
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create({ intermediates: true });
    const src = new File(uri);
    const dest = new File(dir, `${Date.now()}-${src.name}`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

function saveBase64Png(b64: string): string {
  if (Platform.OS === 'web') return `data:image/png;base64,${b64}`;
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, `${Date.now()}-cutout.png`);
  file.create();
  file.write(b64, { encoding: 'base64' });
  return file.uri;
}

export class NotConfiguredError extends Error {}

const ENDPOINT = process.env.EXPO_PUBLIC_BG_REMOVAL_URL;

/**
 * Sends the photo to the background-removal service.
 *
 * Contract: POST multipart/form-data with field `image`; responds with JSON
 * `{ image: <base64 PNG>, category?: string, color?: string, tags?: string[] }`.
 * Set EXPO_PUBLIC_BG_REMOVAL_URL to enable it. Without it, processing is skipped
 * and the original photo is used.
 */
export async function removeBackground(originalUri: string): Promise<Capture> {
  if (!ENDPOINT) throw new NotConfiguredError('Background removal is not configured');
  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('image', await (await fetch(originalUri)).blob(), 'photo.jpg');
  } else {
    form.append('image', { uri: originalUri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(ENDPOINT, { method: 'POST', body: form, signal: controller.signal });
    if (!res.ok) throw new Error(`Background removal ${res.status}`);
    const j = await res.json();
    const category = CATEGORIES.find((c) => c.toLowerCase() === String(j.category ?? '').toLowerCase()) as Category | undefined;
    const color = COLORS.find(([n]) => n.toLowerCase() === String(j.color ?? '').toLowerCase())?.[0] as ColorName | undefined;
    return {
      originalUri,
      photoUri: saveBase64Png(j.image),
      suggestion: { category, color, tags: Array.isArray(j.tags) ? j.tags : undefined },
    };
  } finally {
    clearTimeout(timer);
  }
}
