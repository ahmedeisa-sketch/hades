import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDistribution,
  recalculateDistribution,
  transitionDistribution,
  DISTRIBUTION_NEXT,
  DistributionStatus,
} from '../../api/distributions';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate, formatUnits } from '../../lib/format';

export function DistributionDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: distribution, isLoading } = useQuery({
    queryKey: ['distribution', id],
    queryFn: () => fetchDistribution(id as string),
    enabled: !!id,
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['distribution', id] });
    await queryClient.invalidateQueries({ queryKey: ['distributions'] });
  }

  async function handleTransition(toStatus: DistributionStatus) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const extra =
        toStatus === 'PAID'
          ? { paymentReference: window.prompt('Payment reference (optional)') ?? undefined }
          : undefined;
      await transitionDistribution(id, toStatus, extra);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update the distribution.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRecalculate() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await recalculateDistribution(id);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not recalculate allocations.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="text-slate text-sm">Loading distribution…</div>;
  if (!distribution) return <div className="text-slate text-sm">Distribution not found.</div>;

  const currency = distribution.fund?.baseCurrency;
  const nextStates = DISTRIBUTION_NEXT[distribution.status];

  return (
    <div>
      <header className="mb-6">
        <Link to="/distributions" className="text-xs text-gold-deep hover:underline">
          ← Distributions
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="font-display text-3xl text-ink">{distribution.distributionPeriod}</h1>
            <p className="text-sm text-slate mt-1">
              {distribution.fund?.name} · {formatDate(distribution.distributionDate)} ·{' '}
              {formatCurrency(distribution.distributionAmount, currency)}
            </p>
          </div>
          <StatusBadge status={distribution.status} />
        </div>
      </header>

      {error && (
        <div className="border border-wine/30 bg-wine/5 text-wine text-sm px-4 py-3 rounded-sm mb-5">
          {error}
        </div>
      )}

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Workflow</h2>
        <div className="flex flex-wrap items-center gap-3">
          {distribution.status === 'DRAFT' && (
            <button
              onClick={handleRecalculate}
              disabled={busy}
              className="text-xs px-3 py-2 border border-ink/15 hover:bg-paper-dim transition-colors disabled:opacity-50"
            >
              Recalculate allocations
            </button>
          )}
          {nextStates.length > 0 ? (
            nextStates.map((s) => (
              <button
                key={s}
                onClick={() => handleTransition(s)}
                disabled={busy}
                className="bg-ink text-paper text-xs px-3 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
              >
                Move to {s.replace(/_/g, ' ')}
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-light">
              {distribution.status === 'PAID' ? 'Distribution paid — complete.' : 'No further actions.'}
            </span>
          )}
          {distribution.approvedBy && (
            <span className="text-xs text-slate-light ml-auto">
              Approved by {distribution.approvedBy.fullName}
            </span>
          )}
        </div>
        {distribution.paymentReference && (
          <p className="text-xs text-slate-light mt-3">
            Payment ref: {distribution.paymentReference} · {formatDate(distribution.paymentDate)}
          </p>
        )}
      </section>

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">
          Allocations ({distribution.allocations.length})
        </h2>
        {distribution.allocations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                  <th className="py-2 pr-4">Investor</th>
                  <th className="py-2 pr-4">Units held</th>
                  <th className="py-2 pr-4">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {distribution.allocations.map((a) => (
                  <tr key={a.id} className="border-b border-ink/5 hover:bg-paper-dim">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/investors/${a.investorId}`}
                        className="text-gold-deep hover:underline"
                      >
                        {a.investor?.fullName ?? a.investorId}
                      </Link>
                      {a.investor?.clientId && (
                        <span className="font-mono text-xs text-slate-light ml-2">
                          {a.investor.clientId}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 tabular">{formatUnits(a.unitsHeldAtRun)}</td>
                    <td className="py-2 pr-4 tabular">{formatCurrency(a.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-light py-4 text-center">
            No allocations — no units are held in this fund yet.
          </div>
        )}
      </section>

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Workflow history</h2>
        {distribution.workflowHistory.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {distribution.workflowHistory.map((h) => (
              <li key={h.id} className="flex justify-between border-b border-ink/5 pb-2">
                <span>
                  {h.fromStage ? `${h.fromStage.replace(/_/g, ' ')} → ` : ''}
                  {h.toStage.replace(/_/g, ' ')}
                  {h.note && <span className="text-xs text-slate-light ml-2">{h.note}</span>}
                </span>
                <span className="text-xs text-slate-light">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-light py-4 text-center">No history.</div>
        )}
      </section>
    </div>
  );
}
