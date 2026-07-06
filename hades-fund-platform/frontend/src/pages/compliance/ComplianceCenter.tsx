import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  fetchComplianceOverview,
  fetchReviewQueue,
  fetchMissingDocuments,
  fetchDocumentAlerts,
} from '../../api/compliance';
import { KpiCard } from '../../components/KpiCard';
import { StatusBadge } from '../../components/StatusBadge';

export function ComplianceCenter() {
  const overviewQuery = useQuery({
    queryKey: ['compliance', 'overview'],
    queryFn: fetchComplianceOverview,
  });
  const queueQuery = useQuery({
    queryKey: ['compliance', 'review-queue'],
    queryFn: fetchReviewQueue,
  });
  const missingQuery = useQuery({
    queryKey: ['compliance', 'missing-documents'],
    queryFn: fetchMissingDocuments,
  });
  const alertsQuery = useQuery({
    queryKey: ['compliance', 'document-alerts'],
    queryFn: fetchDocumentAlerts,
  });

  const o = overviewQuery.data;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Compliance Center</h1>
        <p className="text-sm text-slate mt-1">
          KYC / AML review queue and document completeness across all investors
        </p>
      </header>

      {o && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          <KpiCard label="Review queue" value={String(o.reviewQueueSize)} hint="Investors awaiting review" />
          <KpiCard label="Missing documents" value={String(o.investorsMissingDocuments)} hint="Investors with gaps" />
          <KpiCard label="Expired documents" value={String(o.expiredDocuments)} />
          <KpiCard label="Expiring soon" value={String(o.expiringSoonDocuments)} hint="Within 30 days" />
          <KpiCard label="KYC pending" value={String(o.kycPending)} />
          <KpiCard label="AML pending" value={String(o.amlPending)} />
          <KpiCard label="Source of funds pending" value={String(o.sourceOfFundsPending)} />
        </div>
      )}

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Review queue</h2>
        {queueQuery.data && queueQuery.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                  <th className="py-2 pr-4">Client</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">KYC</th>
                  <th className="py-2 pr-4">AML</th>
                  <th className="py-2 pr-4">Source of funds</th>
                  <th className="py-2 pr-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {queueQuery.data.map((row) => (
                  <tr key={row.id} className="border-b border-ink/5 hover:bg-paper-dim">
                    <td className="py-2 pr-4 font-mono text-xs">
                      <Link to={`/investors/${row.id}`} className="text-gold-deep hover:underline">
                        {row.clientId}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{row.fullName}</td>
                    <td className="py-2 pr-4"><StatusBadge status={row.kycStatus} /></td>
                    <td className="py-2 pr-4"><StatusBadge status={row.amlStatus} /></td>
                    <td className="py-2 pr-4"><StatusBadge status={row.sourceOfFundsStatus} /></td>
                    <td className="py-2 pr-4">{row.riskRating ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyNote text="No investors currently awaiting compliance review." />
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Missing documents</h2>
          {missingQuery.data && missingQuery.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {missingQuery.data.map((row) => (
                <li key={row.investorId} className="flex justify-between border-b border-ink/5 pb-2">
                  <Link to={`/investors/${row.investorId}`} className="text-gold-deep hover:underline">
                    {row.fullName}
                    <span className="font-mono text-xs text-slate-light ml-2">{row.clientId}</span>
                  </Link>
                  <span className="text-xs text-wine text-right">
                    {row.missing.map((m) => m.replace(/_/g, ' ')).join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote text="All onboarded investors have their required documents." />
          )}
        </section>

        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Document expiry alerts</h2>
          {alertsQuery.data &&
          (alertsQuery.data.expired.length > 0 || alertsQuery.data.expiringSoon.length > 0) ? (
            <ul className="space-y-2 text-sm">
              {alertsQuery.data.expired.map((doc) => (
                <li key={doc.id} className="flex justify-between border-b border-ink/5 pb-2">
                  <Link to={`/investors/${doc.investor.id}`} className="text-gold-deep hover:underline">
                    {doc.investor.fullName}
                    <span className="text-xs text-slate-light ml-2">{doc.type.replace(/_/g, ' ')}</span>
                  </Link>
                  <span className="text-xs text-wine">
                    Expired {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
              {alertsQuery.data.expiringSoon.map((doc) => (
                <li key={doc.id} className="flex justify-between border-b border-ink/5 pb-2">
                  <Link to={`/investors/${doc.investor.id}`} className="text-gold-deep hover:underline">
                    {doc.investor.fullName}
                    <span className="text-xs text-slate-light ml-2">{doc.type.replace(/_/g, ' ')}</span>
                  </Link>
                  <span className="text-xs text-gold-deep">
                    Expires {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote text="No expired or soon-to-expire documents." />
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <div className="text-sm text-slate-light py-4 text-center">{text}</div>;
}
