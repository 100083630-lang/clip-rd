import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatUsd, formatViews } from "@/lib/cliprd/format";
import { platformName } from "./chrome";

type Point = { bucket: string; views: number; amount: string };
type Platform = { platform_id: string; views: number; amount: string };

export function PerformanceChart({ data, mode }: { data: Point[]; mode: "views" | "money" }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const rows = data.map((point) => ({
    name: point.bucket.slice(5),
    value: mode === "views" ? Number(point.views) : Number(point.amount),
  }));
  if (!ready) return <div className="h-64" />;
  if (rows.every((row) => row.value === 0)) {
    return <p className="grid h-64 place-items-center text-sm text-muted">Todavía no hay movimientos en este periodo.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ fill: "rgba(46,255,125,0.06)" }}
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }}
            formatter={(value) =>
              mode === "views" ? formatViews(Number(value ?? 0)) : formatUsd(String(value ?? 0))
            }
          />
          <Bar dataKey="value" fill="var(--color-neon)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlatformChart({ data, metric = "money" }: { data: Platform[]; metric?: "money" | "views" }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const rows = data.map((item) => ({
    name: platformName(item.platform_id),
    value: metric === "views" ? Number(item.views) : Number(item.amount),
  }));
  if (!ready) return <div className="h-64" />;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" stroke="var(--color-muted)" fontSize={12} width={120} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }}
            formatter={(value) =>
              metric === "views" ? formatViews(Number(value ?? 0)) : formatUsd(String(value ?? 0))
            }
          />
          <Bar dataKey="value" fill="var(--color-fg)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
