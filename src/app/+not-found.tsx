import { Link } from 'expo-router';
import { View } from 'react-native';

import { H2, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/theme';

// Unknown URLs get a plain screen with a link home (or to sign-in when signed out).
export default function NotFound() {
  const t = useTheme();
  const signedIn = useAuth((s) => !!s.session);
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
      <H2>Page not found</H2>
      <Link href={signedIn ? '/' : '/sign-in'}>
        <Txt size={16} weight={600}>
          {signedIn ? 'Go home' : 'Go to sign in'}
        </Txt>
      </Link>
    </View>
  );
}
