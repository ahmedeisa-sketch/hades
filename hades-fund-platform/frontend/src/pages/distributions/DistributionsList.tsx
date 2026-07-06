import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDistributions,
  createDistribution,
} from '../../api/distributions';
import { fetchFunds } from '../../api/funds';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/format';

export function DistributionsList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [fundId, setFundId] = useState('');
  const [period, setPeriod] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [pct, setPct] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: distributions, isLoading } = useQuery({
    queryKey: ['distributions'],
    queryFn: () => fetchDistributions(),
  });
  const { data: funds } = useQuery({ queryKey: ['funds'], queryFn: fetchFunds });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!fundId || !period || !date || !amount) {
      setError('Fund, period, date and amount are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createDistribution({
        fundId,
        distributionPeriod: period,
        distributionDate: date,
        distributionAmount: Number(amount),
        distributionPct: pct ? Number(pct) : undefined,
      });
      setFundId('');
      setPeriod('');
      setDate('');
      setAmount('');
      setPct('');
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['distributions'] });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create the distribution.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Distributions</h1>
          <p className="text-sm text-slate mt-1">
            Pro-rata distribution runs and their approval workflow
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-ink text-paper text-sm px-4 py-2.5 hover:bg-ink-soft transition-colors"
        >
          {showForm ? 'Cancel' : '+ New distribution'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6 space-y-3">
          {error && <div className="text-xs text-wine">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">Fund</span>
              <select value={fundId} onChange={(e) => setFundId(e.target.value)} className="input">
                <option value="">Select a fund…</option>
                {funds?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.baseCurrency})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">Period</span>
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2026-Q2"
                className="input"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">
                Total amount
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">
                Percentage (optional)
              </span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                className="input"
              />
            </label>
          </div>
          <p className="text-xs text-slate-light">
            Allocations are calculated automatically pro-rata to units held, and can be recalculated
            while the distribution is in DRAFT.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create distribution'}
          </button>
        </form>
      )}

      <div className="bg-white/60 border border-ink/5 rounded-sm p-5">
        {isLoading && <div className="text-slate text-sm">Loading…</div>}
        {distributions && distributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Fund</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Allocations</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => (
                  <tr key={d.id} className="border-b border-ink/5 hover:bg-paper-dim">
                    <td className="py-2 pr-4">
                      <Link to={`/distributions/${d.id}`} className="text-gold-deep hover:underline">
                        {d.distributionPeriod}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{d.fund?.name ?? '—'}</td>
                    <td className="py-2 pr-4">{formatDate(d.distributionDate)}</td>
                    <td className="py-2 pr-4 tabular">
                      {formatCurrency(d.distributionAmount, d.fund?.baseCurrency)}
                    </td>
                    <td className="py-2 pr-4">{d._count?.allocations ?? 0}</td>
                    <td className="py-2 pr-4"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="text-sm text-slate-light py-6 text-center">
              No distributions yet. Create one to allocate a payout across unit holders.
            </div>
          )
        )}
      </div>
    </div>
  );
}
