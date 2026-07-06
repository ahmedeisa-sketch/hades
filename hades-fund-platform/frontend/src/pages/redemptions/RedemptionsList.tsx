import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRedemptions, createRedemption } from '../../api/redemptions';
import { fetchFunds } from '../../api/funds';
import { fetchInvestors } from '../../api/investors';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate, formatUnits } from '../../lib/format';

export function RedemptionsList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [investorId, setInvestorId] = useState('');
  const [fundId, setFundId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: redemptions, isLoading } = useQuery({
    queryKey: ['redemptions'],
    queryFn: () => fetchRedemptions(),
  });
  const { data: funds } = useQuery({ queryKey: ['funds'], queryFn: fetchFunds });
  const { data: investorPage } = useQuery({
    queryKey: ['investors', { pageSize: 100 }],
    queryFn: () => fetchInvestors({ page: 1, pageSize: 100 }),
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!investorId || !fundId || !amount) {
      setError('Investor, fund and amount are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createRedemption(investorId, { fundId, requestAmount: Number(amount) });
      setInvestorId('');
      setFundId('');
      setAmount('');
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['redemptions'] });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create the redemption.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Redemptions</h1>
          <p className="text-sm text-slate mt-1">
            Redemption requests, eligibility and the settlement workflow
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-ink text-paper text-sm px-4 py-2.5 hover:bg-ink-soft transition-colors"
        >
          {showForm ? 'Cancel' : '+ New redemption'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6 space-y-3">
          {error && <div className="text-xs text-wine">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">Investor</span>
              <select value={investorId} onChange={(e) => setInvestorId(e.target.value)} className="input">
                <option value="">Select…</option>
                {investorPage?.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.fullName} ({i.clientId})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">Fund</span>
              <select value={fundId} onChange={(e) => setFundId(e.target.value)} className="input">
                <option value="">Select…</option>
                {funds?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.baseCurrency})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
              />
            </label>
          </div>
          <p className="text-xs text-slate-light">
            Units are derived from the fund's latest NAV; eligibility and settlement dates are
            calculated from the fund's lock-up and notice period.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {busy ? 'Submitting…' : 'Submit redemption'}
          </button>
        </form>
      )}

      <div className="bg-white/60 border border-ink/5 rounded-sm p-5">
        {isLoading && <div className="text-slate text-sm">Loading…</div>}
        {redemptions && redemptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                  <th className="py-2 pr-4">Investor</th>
                  <th className="py-2 pr-4">Fund</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Units</th>
                  <th className="py-2 pr-4">Settlement</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-ink/5 hover:bg-paper-dim">
                    <td className="py-2 pr-4">
                      <Link to={`/redemptions/${r.id}`} className="text-gold-deep hover:underline">
                        {r.investor?.fullName ?? r.investorId}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{r.fund?.name ?? '—'}</td>
                    <td className="py-2 pr-4 tabular">
                      {formatCurrency(r.requestAmount, r.fund?.baseCurrency)}
                    </td>
                    <td className="py-2 pr-4 tabular">{formatUnits(r.unitsRedeemed)}</td>
                    <td className="py-2 pr-4">{formatDate(r.finalSettlementDate)}</td>
                    <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="text-sm text-slate-light py-6 text-center">
              No redemption requests yet.
            </div>
          )
        )}
      </div>
    </div>
  );
}
