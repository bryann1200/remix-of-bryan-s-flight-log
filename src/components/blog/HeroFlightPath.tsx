import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const X0 = 60;
const Y0 = 118;
const X1 = 580;
const Y1 = 46;
const BASE_CX = 320;
const BASE_CY = 30;

function quadPoint(t: number, cx: number, cy: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * X0 + 2 * mt * t * cx + t * t * X1,
    y: mt * mt * Y0 + 2 * mt * t * cy + t * t * Y1,
  };
}

export function HeroFlightPath({ onActivate }: { onActivate: () => void }) {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ctrl = useRef({ x: BASE_CX, y: BASE_CY });
  const target = useRef({ x: BASE_CX, y: BASE_CY });
  const raf = useRef<number | null>(null);
  const hovering = useRef(false);
  const t0 = useRef(0);
  const [plane, setPlane] = useState({ x: X0, y: Y0 });
  const [d, setD] = useState(`M ${X0} ${Y0} Q ${BASE_CX} ${BASE_CY} ${X1} ${Y1}`);
  const [marker, setMarker] = useState<{ x: number; y: number; alt: number; hdg: number } | null>(
    null,
  );

  useEffect(() => {
    if (reduced) return;
    const svg = svgRef.current;
    if (!svg) return;

    const toLocal = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 640,
        y: ((event.clientY - rect.top) / rect.height) * 160,
      };
    };

    const tick = () => {
      if (!hovering.current) {
        if (t0.current === 0) t0.current = performance.now();
        const el = (performance.now() - t0.current) / 1000;
        target.current = {
          x: BASE_CX + Math.sin(el * 0.55) * 34,
          y: BASE_CY + Math.cos(el * 0.42) * 16,
        };
      }
      const c = ctrl.current;
      const t = target.current;
      c.x += (t.x - c.x) * 0.12;
      c.y += (t.y - c.y) * 0.12;
      setD(`M ${X0} ${Y0} Q ${c.x.toFixed(2)} ${c.y.toFixed(2)} ${X1} ${Y1}`);
      const travel = ((performance.now() / 5200) % 1);
      setPlane(quadPoint(travel, c.x, c.y));
      setMarker((prev) => {
        if (!prev) return prev;
        const tt = Math.min(1, Math.max(0, (prev.x - X0) / (X1 - X0)));
        const p = quadPoint(tt, c.x, c.y);
        return { ...prev, y: p.y };
      });
      raf.current = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      hovering.current = true;
      const p = toLocal(event);
      target.current = {
        x: BASE_CX + (p.x - BASE_CX) * 0.32,
        y: BASE_CY + (p.y - BASE_CY) * 0.45,
      };
      const tt = Math.min(1, Math.max(0, (p.x - X0) / (X1 - X0)));
      const onCurve = quadPoint(tt, ctrl.current.x, ctrl.current.y);
      setMarker({
        x: onCurve.x,
        y: onCurve.y,
        alt: Math.round((1200 + tt * 33000) / 10) * 10,
        hdg: Math.round(40 + tt * 60),
      });
      if (raf.current === null) raf.current = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      hovering.current = false;
      t0.current = performance.now();
      target.current = { x: BASE_CX, y: BASE_CY };
      setMarker(null);
    };

    const parent = svg.parentElement;
    parent?.addEventListener("pointermove", onMove);
    parent?.addEventListener("pointerleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      parent?.removeEventListener("pointermove", onMove);
      parent?.removeEventListener("pointerleave", onLeave);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [reduced]);

  return (
    <div className="relative mx-auto mt-12 w-full max-w-[640px] select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 640 160"
        className="w-full cursor-pointer overflow-visible"
        role="img"
        aria-label="Flight path — jump to entries"
        onClick={onActivate}
      >
        <path
          d={d}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="900"
          style={{
            strokeDashoffset: 0,
            animation: reduced ? undefined : "draw-in 1.9s cubic-bezier(0.22,1,0.36,1) forwards",
          }}
        />
        <style>{`@keyframes draw-in { from { stroke-dashoffset: 900 } to { stroke-dashoffset: 0 } }`}</style>

        <circle cx={X0} cy={Y0} r="3" fill="var(--ink-soft)" />
        {!reduced && (
          <g transform={`translate(${plane.x.toFixed(2)} ${plane.y.toFixed(2)})`}>
            <circle r="10" fill="var(--primary)" opacity="0.1" />
            <circle r="3" fill="var(--primary)" />
          </g>
        )}
        <circle
          cx={X1}
          cy={Y1}
          r="4.5"
          fill="var(--primary)"
          style={{
            opacity: 0,
            animation: reduced
              ? "soft-fade 0.01s forwards"
              : "soft-fade 0.6s ease-out 1.9s forwards",
          }}
        />

        {marker && (
          <g>
            <circle cx={marker.x} cy={marker.y} r="9" fill="var(--primary)" opacity="0.12" />
            <circle cx={marker.x} cy={marker.y} r="3.5" fill="var(--primary)" />
          </g>
        )}

        <text x={X0 - 6} y={Y0 + 20} className="meta" fill="var(--ink-soft)" fontSize="9.5">
          SGT · GROUND
        </text>
        <text
          x={X1 + 6}
          y={Y1 - 12}
          textAnchor="end"
          className="meta"
          fill="var(--ink-soft)"
          fontSize="9.5"
        >
          CRUISE ALT.
        </text>

        {marker && (
          <text
            x={Math.min(marker.x + 14, 560)}
            y={marker.y - 14}
            className="meta"
            fill="var(--ink)"
            fontSize="9.5"
          >
            {`ALT ${marker.alt.toLocaleString("en-US")} FT · HDG ${String(marker.hdg).padStart(3, "0")}°`}
          </text>
        )}
      </svg>
    </div>
  );
}
