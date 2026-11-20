import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, Glass, type IconName } from '@/components/ui';
import { useT } from '@/state';

/** Floating glass dock: Week on the left, Today as the big white button, Dishes on the right. */
export default function AppTabs() {
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + 14,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="box-none">
          <Glass radius={999} strong style={{ padding: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 8 }}>
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
          </Glass>
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
