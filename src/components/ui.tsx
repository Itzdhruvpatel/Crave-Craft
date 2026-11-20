import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, type Weight } from '@/constants/fonts';
import { BottomTabInset, Colors, MaxContentWidth } from '@/constants/theme';
import { PHOTOS } from '@/data/photos';
import { nameIn, tr } from '@/lib/i18n.ts';
import type { Course, Dish } from '@/lib/types.ts';
import { useLangNow } from '@/state';

export const C = Colors.dark;
export type IconName = ComponentProps<typeof Ionicons>['name'];

export function useLang() {
  return useLangNow();
}

/**
 * Dish photo URL. Wikimedia serves fixed thumbnail widths, so small spots ask for a small file:
 * 330 for circles, 500 for cards and blurred backdrops, 960 for the recipe hero.
 */
export function photoOf(dishId?: string, width: 330 | 500 | 960 = 500): string | undefined {
  const uri = dishId ? PHOTOS[dishId]?.uri : undefined;
  return uri?.replace('/960px-', `/${width}px-`);
}

/** Full-screen blurred food photo. Changing `uri` crossfades to the new dish. */
export function Backdrop({ uri, blur = 28, sharp }: { uri?: string; blur?: number; sharp?: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={sharp ? 0 : blur} transition={600} />
      ) : null}
      <LinearGradient
        colors={['rgba(11,13,10,0.55)', 'rgba(11,13,10,0.35)', 'rgba(11,13,10,0.75)', C.background]}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** Screen with a food backdrop. The photo stays fixed while content scrolls over it. */
export function Screen({
  children,
  photo,
  tabs = true,
  scroll = true,
}: {
  children: ReactNode;
  photo?: string;
  tabs?: boolean;
  scroll?: boolean;
}) {
  const body = (
    <View style={[styles.screen, { paddingBottom: (tabs ? BottomTabInset : 24) + 24 }]}>{children}</View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Backdrop uri={photo} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

/** Frosted dark glass. Real backdrop blur on iOS and web; on Android the backdrop is already blurred, so a tint reads the same. */
export function Glass({
  children,
  style,
  radius = 28,
  strong,
  tint,
}: {
  children?: ReactNode;
  style?: ViewStyle;
  radius?: number;
  strong?: boolean;
  tint?: string;
}) {
  const fill = tint ?? (strong ? C.glassStrong : 'rgba(40,43,37,0.38)');
  const frame: ViewStyle = { borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: C.border };
  if (Platform.OS === 'android') {
    return <View style={[frame, { backgroundColor: strong ? 'rgba(22,24,20,0.82)' : 'rgba(34,37,31,0.72)' }, style]}>{children}</View>;
  }
  return (
    <BlurView intensity={strong ? 50 : 30} tint="dark" style={[frame, { backgroundColor: fill }, style]}>
      {children}
    </BlurView>
  );
}

const KIND: Record<string, { size: number; line: number; weight: Weight }> = {
  display: { size: 38, line: 42, weight: 300 },
  title: { size: 26, line: 31, weight: 600 },
  h2: { size: 19, line: 25, weight: 600 },
  label: { size: 16, line: 21, weight: 500 },
  body: { size: 15, line: 23, weight: 400 },
  small: { size: 13, line: 18, weight: 400 },
  tiny: { size: 11, line: 14, weight: 500 },
};
export type TextKind = keyof typeof KIND;

export function T({
  children,
  kind = 'body',
  dim,
  color,
  style,
  lines,
  weight,
}: {
  children: ReactNode;
  kind?: TextKind;
  dim?: boolean;
  color?: string;
  style?: TextStyle;
  lines?: number;
  weight?: Weight;
}) {
  const k = KIND[kind];
  const lang = useLang();
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          fontFamily: font(lang, weight ?? k.weight),
          fontSize: k.size,
          lineHeight: Math.round(k.line * (lang === 'en' ? 1 : 1.15)),
          color: color ?? (dim ? C.textSecondary : C.text),
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/** Thin first line, bold second line, the way the menu speaks: "Today's / lunch thali". */
export function Headline({
  a,
  b,
  size = 38,
  right,
  center,
  side,
}: {
  a: string;
  b?: string;
  size?: number;
  right?: boolean;
  center?: boolean;
  /** small note shown beside the bold line */
  side?: string;
}) {
  const lang = useLang();
  const line = Math.round(size * (lang === 'en' ? 1.08 : 1.3));
  const align: TextStyle['textAlign'] = center ? 'center' : right ? 'right' : 'left';
  const base: TextStyle = { fontSize: size, lineHeight: line, color: C.text, textAlign: align, letterSpacing: lang === 'en' ? -0.8 : 0 };
  return (
    <View accessibilityRole="header">
      {a ? <Text style={[base, { fontFamily: font(lang, 300) }]}>{a}</Text> : null}
      {b ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: center ? 'center' : right ? 'flex-end' : 'space-between', gap: 12 }}>
          <Text style={[base, { fontFamily: font(lang, 600), flexShrink: 1 }]}>{b}</Text>
          {side && !right && !center ? (
            <T kind="small" dim style={{ paddingBottom: 6 }}>
              {side}
            </T>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'lime',
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'lime' | 'white' | 'glass';
  icon?: IconName;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const fg = kind === 'glass' ? C.text : C.ink;
  const inner = (
    <View style={[styles.row, { gap: 10, justifyContent: 'center' }]}>
      {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
      <T kind="label" weight={600} color={fg}>
        {label}
      </T>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      {kind === 'glass' ? (
        <Glass radius={999} style={styles.button}>
          {inner}
        </Glass>
      ) : (
        <View style={[styles.button, { backgroundColor: kind === 'lime' ? C.accent : C.white }]}>{inner}</View>
      )}
    </Pressable>
  );
}

/** Round icon button: white (primary), lime (the one active action) or glass. */
export function Circle({
  icon,
  label,
  onPress,
  kind = 'white',
  size = 46,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  kind?: 'white' | 'lime' | 'glass' | 'ink';
  size?: number;
}) {
  const bg = { white: C.white, lime: C.accent, glass: 'transparent', ink: C.ink }[kind];
  const fg = kind === 'glass' || kind === 'ink' ? C.text : C.ink;
  const dot = (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <Ionicons name={icon} size={size * 0.42} color={fg} />
    </View>
  );
  const face = kind === 'glass' ? <Glass radius={size / 2}>{dot}</Glass> : dot;
  // Decorative circles (inside a bigger button) must not be buttons themselves.
  if (!onPress) return <View accessibilityElementsHidden importantForAccessibility="no">{face}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}>
      {face}
    </Pressable>
  );
}

/** Glass pill holding a few round icon buttons, like a little toolbar. */
export function IconPill({ children }: { children: ReactNode }) {
  return (
    <Glass radius={999} style={{ padding: 4 }}>
      <View style={[styles.row, { gap: 4 }]}>{children}</View>
    </Glass>
  );
}

/** Screen header: round button left, small title in the middle, extras on the right. */
export function TopBar({ title, left, right }: { title?: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', minHeight: 54 }]}>
      <View style={{ minWidth: 46 }}>{left}</View>
      {title ? (
        <T kind="small" color={C.textSecondary} style={{ position: 'absolute', left: 60, right: 60, textAlign: 'center' }} lines={1}>
          {title}
        </T>
      ) : null}
      <View style={{ minWidth: 46, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Chip({ label, on, onPress, icon }: { label: string; on?: boolean; onPress?: () => void; icon?: IconName }) {
  const content = (
    <View style={[styles.row, { gap: 6, paddingVertical: 10, paddingHorizontal: 16 }]}>
      {icon ? <Ionicons name={icon} size={14} color={on ? C.ink : C.text} /> : null}
      <T kind="small" weight={500} color={on ? C.ink : C.text}>
        {label}
      </T>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}>
      {on ? (
        <View style={{ borderRadius: 999, backgroundColor: C.accent }}>{content}</View>
      ) : (
        <Glass radius={999}>{content}</Glass>
      )}
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const COURSE_ICON: Record<Course, IconName> = {
  breakfast: 'cafe-outline',
  sabji: 'leaf-outline',
  dal: 'water-outline',
  bread: 'ellipse-outline',
  rice: 'grid-outline',
  oneDish: 'restaurant-outline',
  farsan: 'apps-outline',
  side: 'nutrition-outline',
  sweet: 'ice-cream-outline',
  drink: 'beer-outline',
};

/**
 * Dish photo. `plate` adds a dark ceramic rim and a shadow so the dish looks served,
 * like a plate seen from above. Without a photo it shows a glass plate with the course icon.
 */
export function DishPhoto({
  dish,
  size,
  round,
  plate,
  radius = 24,
  style,
}: {
  dish: Dish;
  size?: number;
  round?: boolean;
  plate?: boolean;
  radius?: number;
  style?: ViewStyle;
}) {
  const uri = photoOf(dish.id, size && size <= 120 ? 330 : 500);
  const r = round || plate ? (size ?? 100) / 2 : radius;
  const box: ViewStyle = { width: size ?? '100%', height: size, aspectRatio: size ? undefined : 1, borderRadius: r, overflow: 'hidden' };
  const img = uri ? (
    <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
  ) : (
    <LinearGradient colors={['#3A3D37', '#1A1C18']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[{ flex: 1 }, styles.center]}>
      <Ionicons name={COURSE_ICON[dish.course]} size={(size ?? 120) * 0.34} color={C.accent} />
    </LinearGradient>
  );
  if (!plate || !size) return <View style={[box, style]}>{img}</View>;
  const rim = size * 0.09;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: rim,
          backgroundColor: '#1C1E1A',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: '0px 18px 30px rgba(0,0,0,0.55)',
        },
        style,
      ]}>
      <View style={{ flex: 1, borderRadius: size / 2, overflow: 'hidden' }}>{img}</View>
    </View>
  );
}

export function minutes(dish: Dish, lang: ReturnType<typeof useLang>) {
  return `${dish.time} ${tr(lang, 'minutes')}`;
}

/** Tappable dish row that opens the recipe. `right` is for extra buttons like swap. */
export function DishRow({ dish, right, note }: { dish: Dish; right?: ReactNode; note?: string }) {
  const lang = useLang();
  return (
    <Row style={{ gap: 12 }}>
      <Link href={{ pathname: '/dish/[id]', params: { id: dish.id } }} asChild>
        <Pressable accessibilityRole="link" style={{ flex: 1 }}>
          <View style={[styles.row, { gap: 14 }]}>
            <DishPhoto dish={dish} size={54} round />
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

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 22,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  button: { borderRadius: 999, paddingVertical: 15, paddingHorizontal: 24, minHeight: 54, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
