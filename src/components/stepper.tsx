import { Pressable, Text } from 'react-native';

import { Row, T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

export function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const c = useTheme();
  const btn = (label: string, next: number, a11y: string) => {
    const off = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        disabled={off}
        onPress={() => onChange(next)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: c.text,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: off ? 0.3 : 1,
        }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: c.background }}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <Row style={{ gap: 18 }}>
      {btn('−', value - 1, 'decrease')}
      <T kind="title" style={{ minWidth: 40, textAlign: 'center' }}>
        {value}
      </T>
      {btn('+', value + 1, 'increase')}
    </Row>
  );
}
