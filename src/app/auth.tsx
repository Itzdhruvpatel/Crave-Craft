import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { finishEmailLink } from '@/auth';
import { C, T } from '@/components/ui';

/** The email sign-in link opens mummysaidso://auth?code=..., which lands here. */
export default function AuthLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return void router.replace('/');
    finishEmailLink(code)
      .then(() => router.replace('/'))
      .catch((e: Error) => setError(e.message));
  }, [code]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.background, padding: 24 }}>
      {error ? <T color={C.warn}>{error}</T> : <ActivityIndicator color={C.accent} />}
    </View>
  );
}
