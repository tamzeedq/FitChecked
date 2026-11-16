import { useColorScheme } from 'react-native';

import { useStore } from '@/data/store';
import { dark, light, type Theme } from './tokens';

export * from './tokens';

/** Theme for the current appearance setting (System follows the OS). */
export function useTheme(): Theme {
  const system = useColorScheme();
  const appearance = useStore((s) => s.settings.appearance);
  const isDark = appearance === 'system' ? system === 'dark' : appearance === 'dark';
  return isDark ? dark : light;
}
