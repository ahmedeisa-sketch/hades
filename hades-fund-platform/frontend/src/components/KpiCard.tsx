interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="bg-white/60 border border-ink/5 rounded-sm px-5 py-4">
      <div className="text-xs uppercase tracking-widest text-slate mb-2">{label}</div>
      <div className="kpi-figure">{value}</div>
      {hint && <div className="text-xs text-slate-light mt-2">{hint}</div>}
    </div>
  );
}
