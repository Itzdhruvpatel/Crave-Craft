import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { FONT_FILES } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const [loaded, error] = useFonts(FONT_FILES);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider
      value={{ ...base, colors: { ...base.colors, background: c.background, card: c.background, text: c.text, primary: c.accent } }}>
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="dish/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="grocery" options={{ headerShown: false }} />
        <Stack.Screen name="fridge" options={{ headerShown: false }} />
        <Stack.Screen name="cook/[id]" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="family" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
