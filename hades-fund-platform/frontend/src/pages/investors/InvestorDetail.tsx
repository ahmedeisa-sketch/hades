import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchInvestor } from '../../api/investors';
import { StatusBadge } from '../../components/StatusBadge';

export function InvestorDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: investor, isLoading } = useQuery({
    queryKey: ['investor', id],
    queryFn: () => fetchInvestor(id as string),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-slate text-sm">Loading investor…</div>;
  if (!investor) return <div className="text-slate text-sm">Investor not found.</div>;

  return (
    <div>
      <header className="mb-6">
        <div className="text-xs font-mono text-slate mb-1">{investor.clientId}</div>
        <h1 className="font-display text-3xl text-ink">{investor.fullName}</h1>
        <div className="flex gap-2 mt-2">
          <StatusBadge status={investor.status} />
          <StatusBadge status={investor.kycStatus} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">
            General information
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={investor.email} />
            <Row label="Mobile" value={investor.mobile} />
            <Row label="Investor type" value={investor.investorType} />
            <Row
              label="Relationship manager"
              value={investor.relationshipManager?.fullName ?? '—'}
            />
          </dl>
        </section>

        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Compliance</h2>
          <dl className="space-y-2 text-sm">
            <Row label="KYC status" value={investor.kycStatus} />
            <Row label="AML status" value={investor.amlStatus} />
            <Row label="Source of funds" value={investor.sourceOfFundsStatus} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2">
      <dt className="text-slate-light">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
