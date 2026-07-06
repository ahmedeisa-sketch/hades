import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchInvestors, InvestorStatus } from '../../api/investors';
import { StatusBadge } from '../../components/StatusBadge';

const STATUS_OPTIONS: InvestorStatus[] = [
  'DRAFT',
  'DOCUMENTS_UPLOADED',
  'KYC_REVIEW',
  'COMPLIANCE_REVIEW',
  'APPROVED',
  'FUNDED',
  'ACTIVE',
  'INACTIVE',
  'REDEEMED',
];

export function InvestorsList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvestorStatus | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['investors', { search, status, page }],
    queryFn: () =>
      fetchInvestors({
        search: search || undefined,
        status: status || undefined,
        page,
        pageSize,
      }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Investors</h1>
          <p className="text-sm text-slate mt-1">Investor registry — Module 2</p>
        </div>
        <Link
          to="/investors/new"
          className="bg-ink text-paper text-sm px-4 py-2.5 hover:bg-ink-soft transition-colors"
        >
          + Add investor
        </Link>
      </header>

      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by name, email, client ID, mobile…"
          className="flex-1 border border-ink/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as InvestorStatus | '');
          }}
          className="border border-ink/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-gold"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white/60 border border-ink/5 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-widest text-slate">
              <th className="px-4 py-3 font-medium">Client ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">RM</th>
              <th className="px-4 py-3 font-medium">KYC</th>
              <th className="px-4 py-3 font-medium">Stage</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-light">
                  Loading investors…
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-light">
                  No investors match this search. Add the first investor to get started.
                </td>
              </tr>
            )}
            {data?.items.map((investor) => (
              <tr
                key={investor.id}
                className="border-b border-ink/5 last:border-0 hover:bg-paper-dim/60"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate">{investor.clientId}</td>
                <td className="px-4 py-3">
                  <Link to={`/investors/${investor.id}`} className="hover:text-gold-deep">
                    {investor.fullName}
                  </Link>
                  <div className="text-xs text-slate-light">{investor.email}</div>
                </td>
                <td className="px-4 py-3 text-xs">{investor.investorType}</td>
                <td className="px-4 py-3 text-xs">{investor.relationshipManager?.fullName ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={investor.kycStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={investor.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate">
          <span>
            Page {page} of {totalPages} — {data.total} investors
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-ink/15 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-ink/15 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
