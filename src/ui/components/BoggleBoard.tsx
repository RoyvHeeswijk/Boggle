import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

export function BoggleBoard({
  board,
  selectedPath,
  onPathChange,
  onWordComplete,
  disabled,
}: BoggleBoardProps) {
  const { palette, accent } = useTheme();
  const size = board.length;
  const cellLayouts = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(
    new Map(),
  );
  const boardLayout = useRef({ x: 0, y: 0 });

  const getCellAtPoint = useCallback(
    (x: number, y: number): CellPosition | null => {
      for (const [key, layout] of cellLayouts.current.entries()) {
        if (
          x >= layout.x &&
          x <= layout.x + layout.width &&
          y >= layout.y &&
          y <= layout.y + layout.height
        ) {
          const [row, col] = key.split(',').map(Number);
          return { row: row!, col: col! };
        }
      }
      return null;
    },
    [],
  );

  const isAdjacent = (a: CellPosition, b: CellPosition): boolean => {
    return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart((e) => {
      const cell = getCellAtPoint(e.x, e.y);
      if (cell && isValidCell(cell, size as 4 | 5)) {
        onPathChange([cell], board[cell.row]![cell.col]!);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onUpdate((e) => {
      const cell = getCellAtPoint(e.x, e.y);
      if (!cell || !isValidCell(cell, size as 4 | 5)) return;

      const key = posKey(cell);
      const pathKeys = selectedPath.map(posKey);

      if (pathKeys.includes(key)) {
        if (pathKeys.length > 1 && key === pathKeys[pathKeys.length - 2]) {
          const newPath = selectedPath.slice(0, -1);
          const word = newPath.map((p) => board[p.row]![p.col]).join('');
          onPathChange(newPath, word);
        }
        return;
      }

      const last = selectedPath[selectedPath.length - 1];
      if (last && isAdjacent(last, cell)) {
        const newPath = [...selectedPath, cell];
        const word = newPath.map((p) => board[p.row]![p.col]).join('');
        onPathChange(newPath, word);
        Haptics.selectionAsync();
      }
    })
    .onEnd(() => {
      if (selectedPath.length >= 3) {
        onWordComplete();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

  const isSelected = (row: number, col: number) =>
    selectedPath.some((p) => p.row === row && p.col === col);

  const selectionIndex = (row: number, col: number) =>
    selectedPath.findIndex((p) => p.row === row && p.col === col);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={styles.container}
        onLayout={(e: LayoutChangeEvent) => {
          boardLayout.current = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y };
        }}
      >
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((letter, colIndex) => {
              const selected = isSelected(rowIndex, colIndex);
              const index = selectionIndex(rowIndex, colIndex);

              return (
                <View
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: selected ? accent.light : palette.tile,
                      borderColor: selected ? accent.primary : palette.tileBorder,
                      width: `${100 / size - 2}%` as unknown as number,
                    },
                  ]}
                  onLayout={(e) => {
                    cellLayouts.current.set(`${rowIndex},${colIndex}`, {
                      x: e.nativeEvent.layout.x,
                      y: e.nativeEvent.layout.y,
                      width: e.nativeEvent.layout.width,
                      height: e.nativeEvent.layout.height,
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.letter,
                      { color: selected ? accent.dark : palette.text },
                    ]}
                  >
                    {letter}
                  </Text>
                  {selected && index >= 0 && (
                    <View style={[styles.indexBadge, { backgroundColor: accent.primary }]}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                  )}
                </View>
              );
            })}
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
    gap: spacing.sm,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    ...typography.tile,
  },
  indexBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
