import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColorKey, FINISH_PATH, PLAYER_META, SAFE_SQUARES, TRACK } from '../../lib/ludo';

type BoardCell = { column: number; row: number };

const boardCell = (point: { x: number; y: number }): BoardCell => ({
  column: Math.round((point.x / 100) * 15 - 0.5),
  row: Math.round((point.y / 100) * 15 - 0.5),
});

const cellKey = ({ column, row }: BoardCell) => `${column}:${row}`;
const withAlpha = (hex: string, alpha: number) => {
  const color = hex.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
};

const trackCells = TRACK.map((point, index) => ({ ...boardCell(point), index }));
const entryColorByCell = new Map(
  Object.entries(PLAYER_META).map(([color, meta]) => [cellKey(boardCell(TRACK[meta.entry]!)), color as ColorKey]),
);
const safeCellKeys = new Set([...SAFE_SQUARES].map((index) => cellKey(boardCell(TRACK[index]!))));
const homeLaneCells = Object.entries(FINISH_PATH).flatMap(([color, path]) => path
  .map((point) => ({ ...boardCell(point), color: color as ColorKey }))
  .filter(({ column, row }) => column !== 7 || row !== 7));
const uniqueHomeLaneCells = [...new Map(homeLaneCells.map((cell) => [cellKey(cell), cell])).values()];

const homeZones: { color: ColorKey; top: string; left: string }[] = [
  { color: 'green', top: '0%', left: '0%' },
  { color: 'yellow', top: '0%', left: '60%' },
  { color: 'red', top: '60%', left: '0%' },
  { color: 'blue', top: '60%', left: '60%' },
];

export function LudoBoard({ size, children }: PropsWithChildren<{ size: number }>) {
  const cellSize = size / 15;

  return (
    <View accessibilityLabel="Traditional four-color Ludo board" style={[styles.board, { width: size, height: size }]}>
      {homeZones.map(({ color, top, left }) => (
        <View
          key={color}
          style={[
            styles.homeZone,
            { top, left, width: '40%', height: '40%', backgroundColor: PLAYER_META[color].accent },
          ]}
        >
          <View style={styles.yard}>
            <View style={styles.yardPads}>
              {[0, 1, 2, 3].map((pad) => (
                <View key={pad} style={[styles.yardPad, { borderColor: withAlpha(PLAYER_META[color].accent, 0.66) }]}>
                  <View style={[styles.yardDot, { backgroundColor: withAlpha(PLAYER_META[color].accent, 0.18) }]} />
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}

      {trackCells.map(({ column, row, index }) => {
        const key = `${column}:${row}`;
        const entryColor = entryColorByCell.get(key);
        const safe = safeCellKeys.has(key);
        const cellColor = entryColor ? PLAYER_META[entryColor].accent : '#FFFDF7';
        return (
          <View
            key={`track-${index}`}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                left: column * cellSize,
                top: row * cellSize,
                backgroundColor: entryColor ? withAlpha(cellColor, 0.94) : '#FFFDF7',
              },
            ]}
          >
            {safe ? <Text style={[styles.safeStar, entryColor ? styles.entryStar : null]}>★</Text> : null}
          </View>
        );
      })}

      {uniqueHomeLaneCells.map(({ column, row, color }) => (
        <View
          key={`lane-${column}-${row}`}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              left: column * cellSize,
              top: row * cellSize,
              backgroundColor: withAlpha(PLAYER_META[color].accent, 0.88),
            },
          ]}
        />
      ))}

      <View style={styles.center}>
        <View style={styles.centerRow}>
          <View style={[styles.centerQuadrant, { backgroundColor: PLAYER_META.green.accent }]} />
          <View style={[styles.centerQuadrant, { backgroundColor: PLAYER_META.yellow.accent }]} />
        </View>
        <View style={styles.centerRow}>
          <View style={[styles.centerQuadrant, { backgroundColor: PLAYER_META.red.accent }]} />
          <View style={[styles.centerQuadrant, { backgroundColor: PLAYER_META.blue.accent }]} />
        </View>
        <View style={styles.centerBadge}><Text style={styles.centerStar}>✦</Text></View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFDF7',
    borderColor: '#F3D87B',
    borderWidth: 3,
    borderRadius: 13,
    elevation: 8,
    shadowColor: '#0F0614',
    shadowOpacity: 0.36,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  homeZone: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(63,35,58,0.38)' },
  yard: { width: '68%', height: '68%', borderRadius: 5, backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#421B36', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  yardPads: { width: '80%', height: '80%', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-between', justifyContent: 'space-between' },
  yardPad: { width: '42%', height: '42%', borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  yardDot: { width: '55%', height: '55%', borderRadius: 999 },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderColor: '#8A7B86', borderWidth: 0.65 },
  safeStar: { color: '#B7A9B1', fontSize: 11, fontWeight: '900', lineHeight: 13 },
  entryStar: { color: '#FFFFFF', textShadowColor: 'rgba(65,25,46,0.7)', textShadowRadius: 2 },
  center: { position: 'absolute', width: '20%', height: '20%', left: '40%', top: '40%', borderWidth: 1, borderColor: '#796878' },
  centerRow: { flex: 1, flexDirection: 'row' },
  centerQuadrant: { flex: 1, borderWidth: 0.4, borderColor: 'rgba(255,255,255,0.65)' },
  centerBadge: { position: 'absolute', width: '31%', height: '31%', borderRadius: 999, left: '34.5%', top: '34.5%', backgroundColor: '#FFF7E4', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C49D42' },
  centerStar: { color: '#7B326D', fontSize: 15, fontWeight: '900' },
});
