import { Redirect } from 'expo-router';

import { useSession } from '@/auth';
import AppTabs from '@/components/app-tabs';
import { SimpleHome } from '@/components/simple-home';
import { useApp } from '@/state';

/** First run: intro, then login (or guest), then setup, then the app (or big-button mode). */
export default function TabLayout() {
  const { profile, seenIntro, guest, simple } = useApp();
  const { session, loading } = useSession();
  if (loading) return null;
  if (!seenIntro) return <Redirect href="/welcome" />;
  if (!session && !guest) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/onboarding" />;
  if (simple) return <SimpleHome />;
  return <AppTabs />;
}
