import { useState } from 'react';
import { downloadReport, ReportKey } from '../../api/reports';

const REPORTS: { key: ReportKey; title: string; description: string }[] = [
  { key: 'investors', title: 'Investors', description: 'All investors with status, KYC and RM' },
  { key: 'subscriptions', title: 'Subscriptions', description: 'Subscriptions with units and NAV at entry' },
  { key: 'redemptions', title: 'Redemptions', description: 'Redemption requests with status and dates' },
  { key: 'distributions', title: 'Distributions', description: 'Distribution runs with amounts and status' },
];

export function Reports() {
  const [busyKey, setBusyKey] = useState<ReportKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(key: ReportKey) {
    setBusyKey(key);
    setError(null);
    try {
      await downloadReport(key);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not generate the report.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Reports</h1>
        <p className="text-sm text-slate mt-1">Export platform data as CSV</p>
      </header>

      {error && (
        <div className="border border-wine/30 bg-wine/5 text-wine text-sm px-4 py-3 rounded-sm mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="bg-white/60 border border-ink/5 rounded-sm p-5 flex items-center justify-between">
            <div>
              <div className="text-ink font-medium">{r.title}</div>
              <div className="text-xs text-slate-light mt-1">{r.description}</div>
            </div>
            <button
              onClick={() => handleDownload(r.key)}
              disabled={busyKey === r.key}
              className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50 shrink-0 ml-4"
            >
              {busyKey === r.key ? 'Preparing…' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-light mt-6">
        PDF and Excel exports are planned; the CSVs above are generated live from the database.
      </p>
    </div>
  );
}
