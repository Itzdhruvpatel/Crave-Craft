import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state';

export default function AppTabs() {
  const t = useT();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>{t('today')}</TabButton>
          </TabTrigger>
          <TabTrigger name="week" href="/week" asChild>
            <TabButton>{t('week')}</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>{t('dishes')}</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>{t('settings')}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, onPress }: TabTriggerSlotProps) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      onPress={onPress}
      style={[styles.tab, { backgroundColor: isFocused ? c.text : 'transparent' }]}>
      <T kind="small" color={isFocused ? c.background : c.text}>
        {children}
      </T>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const c = useTheme();
  return (
    <View {...props} style={styles.wrap}>
      <View style={[styles.inner, { backgroundColor: c.backgroundElement }]}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, width: '100%', padding: Spacing.three, alignItems: 'center' },
  inner: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: 999,
    maxWidth: MaxContentWidth,
    justifyContent: 'space-between',
  },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999 },
});
