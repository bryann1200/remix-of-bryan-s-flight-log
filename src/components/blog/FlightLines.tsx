import { useCallback, useEffect, useState } from "react";
import { gapLabel, type Post } from "@/lib/blog";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Pt = { x: number; y: number; id: string };

export function FlightLines({
  containerRef,
  pins,
  posts,
  onWaypoint,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pins: React.MutableRefObject<Map<string, HTMLDivElement>>;
  posts: Post[];
  onWaypoint: (post: Post) => void;
}) {
  const reduced = useReducedMotion();
  const [pts, setPts] = useState<Pt[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<number | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const base = container.getBoundingClientRect();
    const next: Pt[] = [];
    for (const post of posts) {
      const el = pins.current.get(post.id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      next.push({
        id: post.id,
        x: r.left - base.left + r.width / 2,
        y: r.top - base.top + r.height / 2,
      });
    }
    setSize({ w: base.width, h: base.height });
    setPts(next);
  }, [containerRef, pins, posts]);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    const container = containerRef.current;
    const ro = new ResizeObserver(() => measure());
    if (container) ro.observe(container);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [measure, containerRef]);

  if (pts.length < 2 || size.w === 0) return null;

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0"
      width={size.w}
      height={size.h}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.25"
        strokeDasharray="6 7"
        opacity="0.34"
        style={
          reduced
            ? undefined
            : { animation: "soft-fade 0.6s ease-out both" }
        }
      />
      {pts.slice(0, -1).map((p, i) => {
        const q = pts[i + 1]!;
        const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
        const active = hover === i;
        return (
          <g key={`${p.id}-${q.id}`}>
            <line
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke="var(--primary)"
              strokeWidth={active ? 2.25 : 0}
              opacity={active ? 0.85 : 0}
            />
            <line
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke="transparent"
              strokeWidth="14"
              className="pointer-events-auto cursor-default"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            />
            {active && (
              <text
                x={mid.x}
                y={mid.y - 10}
                textAnchor="middle"
                className="meta"
                fontSize="10"
                fill="var(--ink)"
              >
                {gapLabel(posts[i]!, posts[i + 1]!)}
              </text>
            )}
          </g>
        );
      })}
      {pts.map((p, i) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r="10"
          fill="transparent"
          className="pointer-events-auto cursor-pointer"
          onClick={() => {
            const post = posts[i];
            if (post) onWaypoint(post);
          }}
        />
      ))}
    </svg>
  );
}
