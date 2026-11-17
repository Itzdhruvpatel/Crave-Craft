import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useApp } from '@/state';

export default function TabLayout() {
  if (!useApp().profile) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
