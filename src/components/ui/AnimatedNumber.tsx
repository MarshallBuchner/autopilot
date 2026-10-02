"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const end = value;
    if (start === end) return;
    const duration = 280;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from previous display value
  }, [value]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}
