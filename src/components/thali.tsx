import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, View, useWindowDimensions } from 'react-native';

import { DishPhoto, useLang } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { nameIn } from '@/lib/i18n.ts';
import type { Dish } from '@/lib/types.ts';

const HERO = ['sabji', 'oneDish', 'breakfast', 'farsan'];

// Katoris sit around the hero dish; angles in degrees, 0 = right, 90 = bottom.
const ANGLES: Record<number, number[]> = {
  1: [90],
  2: [-140, 40],
  3: [-150, -30, 90],
  4: [-135, -45, 45, 135],
};

/** Today's meal as a steel thali seen from above. */
export function Thali({ dishes, maxSize = 380 }: { dishes: Dish[]; maxSize?: number }) {
  const c = useTheme();
  const lang = useLang();
  const W = Math.min(useWindowDimensions().width - 40, maxSize);
  if (!dishes.length) return null;

  const heroIndex = Math.max(0, dishes.findIndex((d) => HERO.includes(d.course)));
  const hero = dishes[heroIndex];
  const rest = dishes.filter((_, i) => i !== heroIndex).slice(0, 4);
  const heroSize = rest.length ? W * 0.4 : W * 0.62;
  const katori = W * 0.26;
  const R = W * 0.34;

  const item = (d: Dish, size: number, cx: number, cy: number) => (
    <Link key={d.id} href={{ pathname: '/dish/[id]', params: { id: d.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={nameIn(d.name, lang)}
        style={{
          position: 'absolute',
          left: cx - size / 2,
          top: cy - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: size * 0.05,
          backgroundColor: c.steelHi,
          boxShadow: '0px 6px 14px rgba(29,43,92,0.22)',
        }}>
        <DishPhoto dish={d} size={size * 0.9} round />
      </Pressable>
    </Link>
  );

  const angles = ANGLES[rest.length] ?? [];

  return (
    <View style={{ width: W, height: W, alignSelf: 'center' }}>
      <LinearGradient
        colors={[c.steelHi, c.steelLo]}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 0.85, y: 0.95 }}
        style={{ position: 'absolute', inset: 0, borderRadius: W / 2, boxShadow: '0px 18px 40px rgba(29,43,92,0.25)' }}
      />
      <LinearGradient
        colors={[c.steelLo, c.steelHi]}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 0.85, y: 0.95 }}
        style={{ position: 'absolute', inset: W * 0.055, borderRadius: W / 2, opacity: 0.9 }}
      />
      {rest.map((d, i) => {
        const a = (angles[i] * Math.PI) / 180;
        return item(d, katori, W / 2 + R * Math.cos(a), W / 2 + R * Math.sin(a));
      })}
      {item(hero, heroSize, W / 2, W / 2)}
    </View>
  );
}
