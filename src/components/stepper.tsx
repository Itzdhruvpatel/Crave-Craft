import { Circle, Row, T } from '@/components/ui';

export function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <Row style={{ gap: 14 }}>
      <Circle icon="remove" label="decrease" kind="glass" size={42} onPress={value > min ? () => onChange(value - 1) : undefined} />
      <T kind="title" style={{ minWidth: 34, textAlign: 'center' }}>
        {value}
      </T>
      <Circle icon="add" label="increase" kind="white" size={42} onPress={value < max ? () => onChange(value + 1) : undefined} />
    </Row>
  );
}
