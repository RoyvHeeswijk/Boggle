import React, { useEffect, useRef, useState } from 'react';
import { Text, TextProps } from 'react-native';

interface CountUpProps extends TextProps {
  value: number;
  durationMs?: number;
  /** When true, jump straight to the final value (skip animation). */
  skip?: boolean;
  suffix?: string;
}

export function CountUp({ value, durationMs = 900, skip, suffix = '', style, ...props }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (skip) {
      setDisplay(value);
      return;
    }

    start.current = null;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min(1, (ts - start.current) / durationMs);
      // easeOutCubic for a calm finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      }
    };
    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs, skip]);

  return (
    <Text style={style} {...props}>
      {display}
      {suffix}
    </Text>
  );
}
