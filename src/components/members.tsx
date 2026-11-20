import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button, C, Chip, Circle, Glass, Row, T, useLang } from '@/components/ui';
import { font } from '@/constants/fonts';
import type { StrKey } from '@/lib/i18n.ts';
import type { AgeGroup, Allergen, HealthTag, Member } from '@/lib/types.ts';
import { useT } from '@/state';

const AGES: AgeGroup[] = ['kid', 'adult', 'senior'];
const HEALTH: HealthTag[] = ['diabetic', 'lowSalt', 'lowOil'];
const ALLERGENS: Allergen[] = ['peanut', 'nuts', 'dairy', 'gluten', 'sesame'];

const flip = <X,>(list: X[], x: X) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

/** Settings card: one row per person with age, health tags and allergies. */
export function MembersEditor({ members, onChange }: { members: Member[]; onChange: (m: Member[]) => void }) {
  const t = useT();
  const lang = useLang();
  const [name, setName] = useState('');
  const edit = (i: number, patch: Partial<Member>) => onChange(members.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  const add = () => {
    if (!name.trim()) return;
    onChange([...members, { name: name.trim(), age: 'adult', health: [], allergies: [] }]);
    setName('');
  };

  return (
    <Glass style={{ padding: 18, gap: 14 }}>
      <T kind="h2">{t('members')}</T>
      <T kind="small" dim>
        {t('membersHint')}
      </T>
      {members.map((m, i) => (
        <View key={`${m.name}-${i}`} style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T kind="label">{m.name}</T>
            <Circle icon="close" label={`${t('remove')} ${m.name}`} kind="glass" size={32} onPress={() => onChange(members.filter((_, k) => k !== i))} />
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {AGES.map((a) => (
              <Chip key={a} label={t(`age_${a}` as StrKey)} on={m.age === a} onPress={() => edit(i, { age: a })} />
            ))}
          </Row>
          <T kind="tiny" dim>
            {t('health')}
          </T>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {HEALTH.map((h) => (
              <Chip key={h} label={t(`health_${h}` as StrKey)} on={m.health.includes(h)} onPress={() => edit(i, { health: flip(m.health, h) })} />
            ))}
          </Row>
          <T kind="tiny" dim>
            {t('allergies')}
          </T>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {ALLERGENS.map((a) => (
              <Chip key={a} label={t(`allergy_${a}` as StrKey)} on={m.allergies.includes(a)} onPress={() => edit(i, { allergies: flip(m.allergies, a) })} />
            ))}
          </Row>
        </View>
      ))}
      <Row style={{ gap: 10 }}>
        <Glass radius={18} style={{ flex: 1 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={add}
            placeholder={t('memberName')}
            placeholderTextColor={C.textDim}
            accessibilityLabel={t('memberName')}
            style={{ color: C.text, fontFamily: font(lang, 400), fontSize: 16, paddingHorizontal: 16, paddingVertical: 12 }}
          />
        </Glass>
        <Button label={t('addMember')} kind="white" icon="person-add-outline" onPress={add} />
      </Row>
    </Glass>
  );
}
