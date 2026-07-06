import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRedemption,
  transitionRedemption,
  REDEMPTION_NEXT,
  RedemptionStatus,
} from '../../api/redemptions';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate, formatUnits } from '../../lib/format';

export function RedemptionDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: redemption, isLoading } = useQuery({
    queryKey: ['redemption', id],
    queryFn: () => fetchRedemption(id as string),
    enabled: !!id,
  });

  async function handleTransition(toStatus: RedemptionStatus) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const extra =
        toStatus === 'PAID'
          ? { paymentReference: window.prompt('Payment reference (optional)') ?? undefined }
          : toStatus === 'REJECTED'
            ? { note: window.prompt('Reason for rejection (optional)') ?? undefined }
            : undefined;
      await transitionRedemption(id, toStatus, extra);
      await queryClient.invalidateQueries({ queryKey: ['redemption', id] });
      await queryClient.invalidateQueries({ queryKey: ['redemptions'] });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update the redemption.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="text-slate text-sm">Loading redemption…</div>;
  if (!redemption) return <div className="text-slate text-sm">Redemption not found.</div>;

  const currency = redemption.fund?.baseCurrency;
  const nextStates = REDEMPTION_NEXT[redemption.status];

  return (
    <div>
      <header className="mb-6">
        <Link to="/redemptions" className="text-xs text-gold-deep hover:underline">
          ← Redemptions
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="font-display text-3xl text-ink">
              {redemption.investor?.fullName ?? 'Redemption'}
            </h1>
            <p className="text-sm text-slate mt-1">
              {redemption.fund?.name} · {formatCurrency(redemption.requestAmount, currency)} ·{' '}
              {formatUnits(redemption.unitsRedeemed)} units
            </p>
          </div>
          <StatusBadge status={redemption.status} />
        </div>
      </header>

      {error && (
        <div className="border border-wine/30 bg-wine/5 text-wine text-sm px-4 py-3 rounded-sm mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Requested" value={formatDate(redemption.requestDate)} />
            <Row label="Eligible from" value={formatDate(redemption.eligibilityDate)} />
            <Row label="Final settlement" value={formatDate(redemption.finalSettlementDate)} />
            <Row
              label="Amount"
              value={formatCurrency(redemption.requestAmount, currency)}
            />
            <Row label="Units" value={formatUnits(redemption.unitsRedeemed)} />
            {redemption.reviewedBy && (
              <Row label="Reviewed by" value={redemption.reviewedBy.fullName} />
            )}
            {redemption.paymentReference && (
              <Row label="Payment ref" value={redemption.paymentReference} />
            )}
          </dl>
        </section>

        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Workflow</h2>
          <div className="flex flex-wrap items-center gap-3">
            {nextStates.length > 0 ? (
              nextStates.map((s) => (
                <button
                  key={s}
                  onClick={() => handleTransition(s)}
                  disabled={busy}
                  className={`text-xs px-3 py-2 transition-colors disabled:opacity-50 ${
                    s === 'REJECTED'
                      ? 'border border-wine/40 text-wine hover:bg-wine/5'
                      : 'bg-ink text-paper hover:bg-ink-soft'
                  }`}
                >
                  {s === 'REJECTED' ? 'Reject' : `Move to ${s.replace(/_/g, ' ')}`}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-light">
                {redemption.status === 'PAID'
                  ? 'Redemption settled — complete.'
                  : redemption.status === 'REJECTED'
                    ? 'Redemption rejected.'
                    : 'No further actions.'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-light mt-3">
            Approval is blocked until the eligibility date once the lock-up applies.
          </p>
        </section>
      </div>

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Workflow history</h2>
        {redemption.workflowHistory.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {redemption.workflowHistory.map((h) => (
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2">
      <dt className="text-slate-light">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
