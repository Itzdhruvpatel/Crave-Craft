import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Circle, DishRow, Glass, Headline, Row, Screen, T, TopBar, photoOf, useLang } from '@/components/ui';
import { DISH_BY_ID } from '@/data/dishes/index.ts';
import { rerollTiffin, useApp, useT } from '@/state';

export default function Tiffin() {
  const { plan } = useApp();
  const t = useT();
  const lang = useLang();
  const locale = lang === 'en' ? 'en-IN' : `${lang}-IN`;
  const unpacked = !!plan?.length && plan.every((d) => !d.tiffin);

  return (
    <Screen photo={photoOf('methi_thepla')} tabs={false}>
      <TopBar left={<Circle icon="chevron-back" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/week'))} />} />
      <Headline a={t('tiffinA')} b={t('tiffinB')} />
      <T kind="small" dim>
        {t('tiffinHint')}
      </T>

      {unpacked && <Button label={t('tiffinPack')} icon="briefcase-outline" onPress={() => rerollTiffin()} />}

      {plan?.map((d) => {
        const date = new Date(`${d.date}T00:00:00`);
        const day = date.toLocaleDateString(locale, { weekday: 'long' });
        if (date.getDay() === 0) {
          return (
            <T key={d.date} kind="small" dim style={{ textAlign: 'center' }}>
              {t('sundayOff')}
            </T>
          );
        }
        return (
          <Glass key={d.date} style={{ padding: 18, gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T kind="h2">{day}</T>
              {!unpacked && <Circle icon="shuffle" label={`${t('spinTitle')} ${day}`} kind="glass" size={36} onPress={() => rerollTiffin(d.date)} />}
            </Row>
            <View style={{ gap: 12 }}>
              {(d.tiffin ?? []).map((id) => {
                const dish = DISH_BY_ID.get(id);
                return dish ? <DishRow key={id} dish={dish} /> : null;
              })}
            </View>
          </Glass>
        );
      })}
    </Screen>
  );
}
