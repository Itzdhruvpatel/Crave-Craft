import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, type Weight } from '@/constants/fonts';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { PHOTOS } from '@/data/photos';
import { useTheme } from '@/hooks/use-theme';
import { nameIn, tr } from '@/lib/i18n.ts';
import type { Course, Dish } from '@/lib/types.ts';
import { useApp } from '@/state';

export function useLang() {
  return useApp().profile?.lang ?? 'en';
}

export function Screen({ children, tabs = true, edges = ['top'] }: { children: ReactNode; tabs?: boolean; edges?: ('top' | 'bottom')[] }) {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={edges}>
      <ScrollView
        contentContainerStyle={[styles.screen, { paddingBottom: (tabs ? BottomTabInset : 0) + Spacing.six }]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const KIND: Record<string, { size: number; line: number; weight: Weight }> = {
  display: { size: 40, line: 46, weight: 800 },
  title: { size: 30, line: 38, weight: 800 },
  h2: { size: 21, line: 28, weight: 700 },
  label: { size: 16, line: 22, weight: 600 },
  body: { size: 16, line: 25, weight: 400 },
  small: { size: 13, line: 19, weight: 500 },
};
export type TextKind = keyof typeof KIND;

export function T({
  children,
  kind = 'body',
  dim,
  color,
  style,
  lines,
}: {
  children: ReactNode;
  kind?: TextKind;
  dim?: boolean;
  color?: string;
  style?: TextStyle;
  lines?: number;
}) {
  const c = useTheme();
  const k = KIND[kind];
  return (
    <Text
      numberOfLines={lines}
      style={[
        { fontFamily: font(useLang(), k.weight), fontSize: k.size, lineHeight: k.line, color: color ?? (dim ? c.textSecondary : c.text) },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'haldi' | 'soft';
  style?: ViewStyle;
}) {
  const c = useTheme();
  const bg = { primary: c.accent, haldi: c.haldi, soft: c.backgroundElement }[kind];
  const fg = { primary: c.accentText, haldi: c.onHaldi, soft: c.text }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      <T kind="label" color={fg} style={{ textAlign: 'center' }}>
        {label}
      </T>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: on ? c.text : c.backgroundElement }]}>
      <T kind="small" color={on ? c.background : c.text}>
        {label}
      </T>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const COURSE_EMOJI: Record<Course, string> = {
  breakfast: '🍳',
  sabji: '🥘',
  dal: '🍲',
  bread: '🫓',
  rice: '🍚',
  oneDish: '🍛',
  farsan: '🥟',
  side: '🥗',
  sweet: '🍮',
  drink: '🥛',
};

/** Real photo when we have one; a steel katori with the course emoji otherwise. */
export function DishPhoto({ dish, size, round, radius = 20, style }: { dish: Dish; size?: number; round?: boolean; radius?: number; style?: ViewStyle }) {
  const c = useTheme();
  const photo = PHOTOS[dish.id];
  const box: ViewStyle = {
    width: size ?? '100%',
    height: size,
    aspectRatio: size ? undefined : 1,
    borderRadius: round && size ? size / 2 : radius,
    overflow: 'hidden',
  };
  if (photo) {
    return (
      <View style={[box, style]}>
        <Image source={{ uri: photo.uri }} style={{ flex: 1 }} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <LinearGradient colors={[c.steelHi, c.steelLo]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[box, styles.center, style]}>
      <Text style={{ fontSize: (size ?? 140) * 0.42 }}>{COURSE_EMOJI[dish.course]}</Text>
    </LinearGradient>
  );
}

export function minutes(dish: Dish, lang: ReturnType<typeof useLang>) {
  return `${dish.time} ${tr(lang, 'minutes')}`;
}

/** Tappable dish row that opens the recipe. `right` is for extra buttons like swap. */
export function DishRow({ dish, right, note }: { dish: Dish; right?: ReactNode; note?: string }) {
  const lang = useLang();
  return (
    <Row style={{ gap: Spacing.three }}>
      <Link href={{ pathname: '/dish/[id]', params: { id: dish.id } }} asChild>
        <Pressable accessibilityRole="link" style={{ flex: 1 }}>
          <View style={[styles.row, { gap: 14 }]}>
            <DishPhoto dish={dish} size={56} round />
            <View style={{ flex: 1 }}>
              <T kind="label" lines={1}>
                {nameIn(dish.name, lang)}
              </T>
              <T kind="small" dim>
                {note ?? minutes(dish, lang)}
              </T>
            </View>
          </View>
        </Pressable>
      </Link>
      {right}
    </Row>
  );
}

/** Small round icon button (swap, close). */
export function IconButton({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.icon, { backgroundColor: c.backgroundElement, opacity: pressed ? 0.6 : 1 }]}>
      <Text style={{ fontSize: 18, color: c.text }}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    gap: 28,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  button: { borderRadius: 999, paddingVertical: 15, paddingHorizontal: 22, minHeight: 52, justifyContent: 'center' },
  chip: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
