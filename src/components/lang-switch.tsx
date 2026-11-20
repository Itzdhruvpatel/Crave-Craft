import { Pressable, ScrollView, Text } from 'react-native';

import { LANGS } from '@/lib/i18n.ts';
import { setLang, useLangNow } from '@/state';

/** Glass pill with every language, for screens shown before setup. Scrolls sideways on small phones. */
export function LangSwitch() {
  const lang = useLangNow();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      style={{ flexGrow: 0, maxWidth: '100%', borderRadius: 999, backgroundColor: 'rgba(11,13,10,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
      contentContainerStyle={{ padding: 4 }}>
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => setLang(l.id)}
            style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: on ? '#FFFFFF' : 'transparent' }}>
            <Text style={{ color: on ? '#0B0D0A' : '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{l.id === 'en' ? 'EN' : l.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
