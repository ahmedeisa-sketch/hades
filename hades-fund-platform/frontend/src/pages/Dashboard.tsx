import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchKpis, fetchInvestorStatusBreakdown, fetchRedemptionPipeline } from '../api/dashboard';
import { KpiCard } from '../components/KpiCard';

const AED = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
});

const PIE_COLORS = ['#B8874B', '#3F6B4F', '#6E2A3D', '#9297A3', '#D9B685'];

export function Dashboard() {
  const kpisQuery = useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: fetchKpis });
  const statusQuery = useQuery({
    queryKey: ['dashboard', 'investor-status'],
    queryFn: fetchInvestorStatusBreakdown,
  });
  const pipelineQuery = useQuery({
    queryKey: ['dashboard', 'redemption-pipeline'],
    queryFn: fetchRedemptionPipeline,
  });

  const kpis = kpisQuery.data;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="text-sm text-slate mt-1">Fund-wide position as of today</p>
      </header>

      {kpisQuery.isLoading && <div className="text-slate text-sm">Loading KPIs…</div>}

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          <KpiCard label="Total investors" value={String(kpis.totalInvestors)} />
          <KpiCard label="Active investors" value={String(kpis.activeInvestors)} />
          <KpiCard label="Pending investors" value={String(kpis.pendingInvestors)} />
          <KpiCard
            label="Total AUM"
            value={AED.format(Number(kpis.totalAum))}
            hint="Sum of allocated subscriptions"
          />
          <KpiCard
            label="Fund units outstanding"
            value={Number(kpis.fundUnitsOutstanding).toLocaleString()}
          />
          <KpiCard
            label="Distributions paid"
            value={AED.format(Number(kpis.totalDistributionsPaid))}
          />
          <KpiCard
            label="Redemptions paid"
            value={AED.format(Number(kpis.totalRedemptionsPaid))}
          />
          <KpiCard
            label="Outstanding redemptions"
            value={AED.format(Number(kpis.outstandingRedemptions))}
          />
          <KpiCard
            label="Compliance completion"
            value={`${kpis.complianceCompletionPct}%`}
            hint="Investors with approved KYC"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">
            Investor status
          </h2>
          {statusQuery.data && statusQuery.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusQuery.data}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={90}
                  label={(entry) => entry.status}
                >
                  {statusQuery.data.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No investors yet — onboard the first one to see this chart populate." />
          )}
        </div>

        <div className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">
            Redemption pipeline
          </h2>
          {pipelineQuery.data && pipelineQuery.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipelineQuery.data}>
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#B8874B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No redemption requests yet." />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-slate-light text-center px-6">
      {text}
    </div>
  );
}
