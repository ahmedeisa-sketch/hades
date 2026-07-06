import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchFunds,
  createFund,
  fetchNavHistory,
  createNavSnapshot,
  Fund,
} from '../../api/funds';
import { formatCurrency, formatDate } from '../../lib/format';

export function FundsManagement() {
  const queryClient = useQueryClient();
  const [showFundForm, setShowFundForm] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);

  const { data: funds, isLoading } = useQuery({ queryKey: ['funds'], queryFn: fetchFunds });

  const selectedFund = funds?.find((f) => f.id === selectedFundId) ?? null;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Funds &amp; NAV</h1>
          <p className="text-sm text-slate mt-1">
            Manage funds and enter NAV snapshots used to price subscriptions and redemptions
          </p>
        </div>
        <button
          onClick={() => setShowFundForm((s) => !s)}
          className="bg-ink text-paper text-sm px-4 py-2.5 hover:bg-ink-soft transition-colors"
        >
          {showFundForm ? 'Cancel' : '+ New fund'}
        </button>
      </header>

      {showFundForm && <CreateFundForm onDone={() => setShowFundForm(false)} />}

      <div className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6">
        {isLoading && <div className="text-slate text-sm">Loading…</div>}
        {funds && funds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                  <th className="py-2 pr-4">Fund</th>
                  <th className="py-2 pr-4">Currency</th>
                  <th className="py-2 pr-4">Mgmt fee</th>
                  <th className="py-2 pr-4">Perf fee</th>
                  <th className="py-2 pr-4">Lock-up</th>
                  <th className="py-2 pr-4">Notice</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id} className="border-b border-ink/5 hover:bg-paper-dim">
                    <td className="py-2 pr-4 text-ink">{f.name}</td>
                    <td className="py-2 pr-4">{f.baseCurrency}</td>
                    <td className="py-2 pr-4">{f.managementFeePct ?? '—'}%</td>
                    <td className="py-2 pr-4">{f.performanceFeePct ?? '—'}%</td>
                    <td className="py-2 pr-4">{f.lockupMonths} mo</td>
                    <td className="py-2 pr-4">{f.noticeDays} d</td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => setSelectedFundId(f.id)}
                        className="text-xs text-gold-deep hover:underline"
                      >
                        Manage NAV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="text-sm text-slate-light py-6 text-center">
              No funds yet. Create one to start onboarding subscriptions.
            </div>
          )
        )}
      </div>

      {selectedFund && (
        <NavPanel fund={selectedFund} onClose={() => setSelectedFundId(null)} />
      )}
    </div>
  );

  function CreateFundForm({ onDone }: { onDone: () => void }) {
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('AED');
    const [mgmtFee, setMgmtFee] = useState('');
    const [perfFee, setPerfFee] = useState('');
    const [lockup, setLockup] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(e: FormEvent) {
      e.preventDefault();
      if (!name.trim()) {
        setError('Fund name is required.');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await createFund({
          name: name.trim(),
          baseCurrency: currency || undefined,
          managementFeePct: mgmtFee ? Number(mgmtFee) : undefined,
          performanceFeePct: perfFee ? Number(perfFee) : undefined,
          lockupMonths: lockup ? Number(lockup) : undefined,
          noticeDays: notice ? Number(notice) : undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ['funds'] });
        onDone();
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Could not create the fund.');
      } finally {
        setBusy(false);
      }
    }

    return (
      <form onSubmit={submit} className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6 space-y-3">
        {error && <div className="text-xs text-wine">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Labeled label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Labeled>
          <Labeled label="Base currency">
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="input" />
          </Labeled>
          <Labeled label="Management fee %">
            <input type="number" min="0" step="0.001" value={mgmtFee} onChange={(e) => setMgmtFee(e.target.value)} className="input" />
          </Labeled>
          <Labeled label="Performance fee %">
            <input type="number" min="0" step="0.001" value={perfFee} onChange={(e) => setPerfFee(e.target.value)} className="input" />
          </Labeled>
          <Labeled label="Lock-up (months)">
            <input type="number" min="0" step="1" value={lockup} onChange={(e) => setLockup(e.target.value)} className="input" />
          </Labeled>
          <Labeled label="Notice (days)">
            <input type="number" min="0" step="1" value={notice} onChange={(e) => setNotice(e.target.value)} className="input" />
          </Labeled>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create fund'}
        </button>
      </form>
    );
  }

  function NavPanel({ fund, onClose }: { fund: Fund; onClose: () => void }) {
    const [asOfDate, setAsOfDate] = useState('');
    const [navPerUnit, setNavPerUnit] = useState('');
    const [totalAum, setTotalAum] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: navHistory } = useQuery({
      queryKey: ['nav', fund.id],
      queryFn: () => fetchNavHistory(fund.id),
    });

    async function submit(e: FormEvent) {
      e.preventDefault();
      if (!asOfDate || !navPerUnit || !totalAum) {
        setError('Date, NAV per unit and total AUM are required.');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await createNavSnapshot(fund.id, {
          asOfDate,
          navPerUnit: Number(navPerUnit),
          totalAum: Number(totalAum),
        });
        setAsOfDate('');
        setNavPerUnit('');
        setTotalAum('');
        await queryClient.invalidateQueries({ queryKey: ['nav', fund.id] });
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Could not add the NAV snapshot.');
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="bg-white/60 border border-ink/5 rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm uppercase tracking-widest text-slate">
            NAV — {fund.name} ({fund.baseCurrency})
          </h2>
          <button onClick={onClose} className="text-xs text-slate-light hover:text-ink">
            Close
          </button>
        </div>

        <form onSubmit={submit} className="border border-ink/10 rounded-sm p-4 mb-5 space-y-3">
          {error && <div className="text-xs text-wine">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Labeled label="As of date">
              <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="input" />
            </Labeled>
            <Labeled label="NAV per unit">
              <input type="number" min="0" step="0.000001" value={navPerUnit} onChange={(e) => setNavPerUnit(e.target.value)} className="input" />
            </Labeled>
            <Labeled label="Total AUM">
              <input type="number" min="0" step="0.01" value={totalAum} onChange={(e) => setTotalAum(e.target.value)} className="input" />
            </Labeled>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add NAV snapshot'}
          </button>
        </form>

        {navHistory && navHistory.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                <th className="py-2 pr-4">As of</th>
                <th className="py-2 pr-4">NAV / unit</th>
                <th className="py-2 pr-4">Total AUM</th>
              </tr>
            </thead>
            <tbody>
              {navHistory.map((n) => (
                <tr key={n.id} className="border-b border-ink/5">
                  <td className="py-2 pr-4">{formatDate(n.asOfDate)}</td>
                  <td className="py-2 pr-4 tabular">{Number(n.navPerUnit).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                  <td className="py-2 pr-4 tabular">{formatCurrency(n.totalAum, fund.baseCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-slate-light py-4 text-center">
            No NAV snapshots yet. Add one so subscriptions and redemptions can be priced.
          </div>
        )}
      </div>
    );
  }
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-slate mb-1">{label}</span>
      {children}
    </label>
  );
}
