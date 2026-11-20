import QRCode from 'qrcode';
import { useMemo } from 'react';
import { View } from 'react-native';

/** QR code drawn with plain Views: each row's dark runs become one bar, so no SVG library is needed. */
export function Qr({ value, size = 180 }: { value: string; size?: number }) {
  const rows = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const n = modules.size;
    return [...Array(n).keys()].map((y) => {
      const runs: [number, number][] = [];
      for (let x = 0; x < n; x++) {
        if (!modules.get(y, x)) continue;
        const last = runs[runs.length - 1];
        if (last && last[0] + last[1] === x) last[1]++;
        else runs.push([x, 1]);
      }
      return runs;
    });
  }, [value]);
  const cell = size / rows.length;
  return (
    // White border (quiet zone) so phone cameras can read it on the dark theme.
    <View style={{ backgroundColor: '#fff', padding: cell * 2, borderRadius: 16, alignSelf: 'center' }}>
      <View style={{ width: size, height: size }}>
        {rows.map((runs, y) =>
          runs.map(([x, len]) => (
            <View key={`${y}-${x}`} style={{ position: 'absolute', top: y * cell, left: x * cell, width: len * cell, height: cell, backgroundColor: '#000' }} />
          )),
        )}
      </View>
    </View>
  );
}
