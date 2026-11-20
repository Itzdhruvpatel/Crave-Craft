import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LangSwitch } from '@/components/lang-switch';
import { Button, Headline, T } from '@/components/ui';
import { PHOTOS } from '@/data/photos';
import type { StrKey } from '@/lib/i18n.ts';
import { finishIntro, useT } from '@/state';

const SLIDES: { photo: string; a: StrKey; b: StrKey; body: StrKey }[] = [
  { photo: 'bhinda_nu_shaak', a: 'intro1a', b: 'intro1b', body: 'intro1' },
  { photo: 'khaman', a: 'intro2a', b: 'intro2b', body: 'intro2' },
  { photo: 'undhiyu', a: 'intro3a', b: 'intro3b', body: 'intro3' },
];

export default function Welcome() {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pager = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const done = () => {
    finishIntro();
    router.replace('/login');
  };
  const next = () => (last ? done() : pager.current?.scrollTo({ x: width * (page + 1), animated: true }));

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0D0A' }}>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        scrollEventThrottle={64}>
        {SLIDES.map((s) => (
          <View key={s.photo} style={{ width, height }}>
            <Image source={{ uri: PHOTOS[s.photo].uri }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={300} />
            <LinearGradient
              colors={['rgba(11,13,10,0.35)', 'rgba(11,13,10,0)', 'rgba(11,13,10,0.85)', '#0B0D0A']}
              locations={[0, 0.25, 0.6, 0.85]}
              style={{ position: 'absolute', inset: 0 }}
            />
            <View style={{ position: 'absolute', left: 24, right: 24, bottom: 150 + insets.bottom, gap: 16 }}>
              <Headline a={t(s.a)} b={t(s.b)} size={50} />
              <T color="rgba(255,255,255,0.72)" style={{ fontSize: 18, lineHeight: 27 }}>
                {t(s.body)}
              </T>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ position: 'absolute', top: insets.top + 12, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <LangSwitch />
        <Pressable accessibilityRole="button" onPress={done} hitSlop={12}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', opacity: 0.85 }}>{t('skip')}</Text>
        </Pressable>
      </View>

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 32 + insets.bottom, gap: 22 }}>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`${page + 1} / ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.photo} style={{ height: 6, width: i === page ? 28 : 6, borderRadius: 3, backgroundColor: i === page ? '#CFF54A' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </View>
        <Button label={last ? t('getStarted') : t('next')} onPress={next} />
      </View>
    </View>
  );
}
