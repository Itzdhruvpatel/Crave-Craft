import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, Glass, type IconName } from '@/components/ui';
import { useT } from '@/state';

// Three side buttons, the big Today button, the gaps and the pill's padding.
const DOCK_W = 48 * 3 + 58 + 18 * 3 + 14 * 2;

/**
 * Floating glass dock: Week, Today (big white button), Dishes, Settings.
 * expo-router only registers TabTriggers that are direct children of the TabList's element,
 * so the glass is a background layer beside them, not a wrapper around them.
 */
export default function AppTabs() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 14,
            left: (width - DOCK_W) / 2,
            width: DOCK_W,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 18,
            padding: 6,
            paddingHorizontal: 14,
          }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Glass radius={999} strong style={{ flex: 1 }} />
          </View>
          <TabTrigger name="week" href="/week" asChild>
            <DockButton icon="calendar-outline" label={t('week')} />
          </TabTrigger>
          <TabTrigger name="index" href="/" asChild>
            <DockButton icon="restaurant" label={t('today')} main />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <DockButton icon="search" label={t('dishes')} />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <DockButton icon="person-outline" label={t('settings')} />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

type DockProps = TabTriggerSlotProps & { icon: IconName; label: string; main?: boolean };

function DockButton({ icon, label, main, isFocused, onPress, onLongPress }: DockProps) {
  const size = main ? 58 : 48;
  const bg = main ? C.white : isFocused ? C.accent : 'transparent';
  const fg = main || isFocused ? C.ink : C.text;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: main && isFocused ? 3 : 0,
          borderColor: C.accent,
        }}>
        <Ionicons name={icon} size={main ? 24 : 21} color={fg} />
      </View>
    </Pressable>
  );
}
