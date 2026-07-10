import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { radius, spacing, typography } from '../theme';
import type { CellPosition } from '@/src/core/game/types';
import { isValidCell, posKey } from '@/src/core/board/solver';

interface BoggleBoardProps {
  board: string[][];
  selectedPath: CellPosition[];
  onPathChange: (path: CellPosition[], word: string) => void;
  onWordComplete: () => void;
  disabled?: boolean;
}

interface GridGeometry {
  width: number;
  cellSize: number;
  gap: number;
}

function getCellCenter(row: number, col: number, geo: GridGeometry) {
  const { cellSize, gap } = geo;
  return {
    x: col * (cellSize + gap) + cellSize / 2,
    y: row * (cellSize + gap) + cellSize / 2,
  };
}

function ConnectionLine({
  from,
  to,
  color,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) return null;

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.line,
        {
          left: midX - length / 2,
          top: midY - 3,
          width: length,
          backgroundColor: color,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

function BoardCell({
  letter,
  selected,
  accentPrimary,
  accentLight,
  accentDark,
  palette,
}: {
  letter: string;
  selected: boolean;
  accentPrimary: string;
  accentLight: string;
  accentDark: string;
  palette: { tile: string; tileBorder: string; text: string };
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      scale.value = withSpring(1.08, { damping: 12, stiffness: 400 });
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    }
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          backgroundColor: selected ? accentLight : palette.tile,
          borderColor: selected ? accentPrimary : palette.tileBorder,
          shadowColor: selected ? accentPrimary : '#000',
          shadowOpacity: selected ? 0.35 : 0.08,
          shadowRadius: selected ? 8 : 4,
          shadowOffset: { width: 0, height: selected ? 4 : 2 },
          elevation: selected ? 6 : 2,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.letter, { color: selected ? accentDark : palette.text }]}>
        {letter}
      </Text>
    </Animated.View>
  );
}

export function BoggleBoard({
  board,
  selectedPath,
  onPathChange,
  onWordComplete,
  disabled,
}: BoggleBoardProps) {
  const { palette, accent } = useTheme();
  const size = board.length;
  const [geo, setGeo] = useState<GridGeometry>({ width: 0, cellSize: 0, gap: spacing.md });
  const selectedPathRef = useRef(selectedPath);

  useEffect(() => {
    selectedPathRef.current = selectedPath;
  }, [selectedPath]);

  const getCellAtPoint = useCallback(
    (x: number, y: number): CellPosition | null => {
      const { width, cellSize, gap } = geo;
      if (width <= 0 || cellSize <= 0) return null;

      const step = cellSize + gap;
      // Snap to the nearest cell (gutters included) so diagonal swipes are
      // forgiving and never fall into a dead zone between tiles.
      const clamp = (v: number) => Math.min(size - 1, Math.max(0, v));
      const col = clamp(Math.floor(x / step));
      const row = clamp(Math.floor(y / step));

      const cell = { row, col };
      return isValidCell(cell, size as 4 | 5) ? cell : null;
    },
    [geo, size],
  );

  const isAdjacent = (a: CellPosition, b: CellPosition): boolean =>
    Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;

  const buildWord = (path: CellPosition[]) =>
    path.map((p) => board[p.row]![p.col]).join('');

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart((e) => {
      const cell = getCellAtPoint(e.x, e.y);
      if (cell) {
        onPathChange([cell], board[cell.row]![cell.col]!);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onUpdate((e) => {
      const cell = getCellAtPoint(e.x, e.y);
      if (!cell) return;

      const path = selectedPathRef.current;
      const key = posKey(cell);
      const pathKeys = path.map(posKey);

      if (pathKeys.includes(key)) {
        if (pathKeys.length > 1 && key === pathKeys[pathKeys.length - 2]) {
          const newPath = path.slice(0, -1);
          onPathChange(newPath, buildWord(newPath));
        }
        return;
      }

      const last = path[path.length - 1];
      if (last && isAdjacent(last, cell)) {
        const newPath = [...path, cell];
        onPathChange(newPath, buildWord(newPath));
        Haptics.selectionAsync();
      }
    })
    .onEnd(() => {
      // Always hand control back to the parent on release; it validates and
      // clears the selection so tiles never stay highlighted.
      onWordComplete();
    });

  const connectionLines = useMemo(() => {
    if (geo.cellSize <= 0 || selectedPath.length < 2) return null;

    return selectedPath.slice(1).map((cell, index) => {
      const prev = selectedPath[index]!;
      const from = getCellCenter(prev.row, prev.col, geo);
      const to = getCellCenter(cell.row, cell.col, geo);
      return <ConnectionLine key={`${posKey(prev)}-${posKey(cell)}`} from={from} to={to} color={accent.primary} />;
    });
  }, [selectedPath, geo, accent.primary]);

  const isSelected = (row: number, col: number) =>
    selectedPath.some((p) => p.row === row && p.col === col);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={styles.container}
        onLayout={(e: LayoutChangeEvent) => {
          const width = e.nativeEvent.layout.width;
          const gap = spacing.md;
          const cellSize = (width - gap * (size - 1)) / size;
          setGeo({ width, cellSize, gap });
        }}
      >
        {connectionLines}

        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.row, { gap: geo.gap }]}>
            {row.map((letter, colIndex) => (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={{ width: geo.cellSize || undefined, height: geo.cellSize || undefined }}
              >
                <BoardCell
                  letter={letter}
                  selected={isSelected(rowIndex, colIndex)}
                  accentPrimary={accent.primary}
                  accentLight={accent.light}
                  accentDark={accent.dark}
                  palette={palette}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    width: '100%',
    position: 'relative',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...typography.tile,
    fontSize: 32,
  },
  line: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    zIndex: 10,
    opacity: 0.85,
  },
});
