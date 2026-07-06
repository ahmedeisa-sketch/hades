import { useQuery } from '@tanstack/react-query';
import {
  fetchPortalProfile,
  fetchPortalStatement,
  fetchPortalSubscriptions,
  fetchPortalDistributions,
  fetchPortalRedemptions,
  fetchPortalDocuments,
} from '../../api/portal';
import { KpiCard } from '../../components/KpiCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDate, formatUnits } from '../../lib/format';

export function MyPortfolio() {
  const profileQuery = useQuery({ queryKey: ['portal', 'me'], queryFn: fetchPortalProfile });
  const statementQuery = useQuery({ queryKey: ['portal', 'statement'], queryFn: fetchPortalStatement });
  const subsQuery = useQuery({ queryKey: ['portal', 'subscriptions'], queryFn: fetchPortalSubscriptions });
  const distQuery = useQuery({ queryKey: ['portal', 'distributions'], queryFn: fetchPortalDistributions });
  const redQuery = useQuery({ queryKey: ['portal', 'redemptions'], queryFn: fetchPortalRedemptions });
  const docsQuery = useQuery({ queryKey: ['portal', 'documents'], queryFn: fetchPortalDocuments });

  const profile = profileQuery.data;
  const statement = statementQuery.data;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">My Portfolio</h1>
        {profile && (
          <p className="text-sm text-slate mt-1">
            {profile.fullName} · <span className="font-mono">{profile.clientId}</span> ·{' '}
            <StatusBadge status={profile.status} />
          </p>
        )}
      </header>

      {statement && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
          <KpiCard label="Net units held" value={formatUnits(statement.netUnitsHeld)} />
          <KpiCard label="Total invested" value={formatCurrency(statement.totalInvested)} />
          <KpiCard label="Total subscribed" value={formatCurrency(statement.totalSubscribed)} />
          <KpiCard
            label="Distributions received"
            value={formatCurrency(statement.totalDistributionsReceived)}
          />
          <KpiCard label="Redemptions paid" value={formatCurrency(statement.totalRedeemedPaid)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title="Subscriptions">
          {subsQuery.data && subsQuery.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {subsQuery.data.map((s) => (
                <li key={s.id} className="flex justify-between border-b border-ink/5 pb-2">
                  <span>
                    {formatCurrency(s.subscriptionAmount, s.fund?.baseCurrency)}
                    <span className="text-xs text-slate-light ml-2">{s.fund?.name}</span>
                  </span>
                  <span className="text-xs text-slate-light">{formatUnits(s.fundUnits)} units</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No subscriptions." />
          )}
        </Panel>

        <Panel title="Distributions received">
          {distQuery.data && distQuery.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {distQuery.data.map((d) => (
                <li key={d.id} className="flex justify-between border-b border-ink/5 pb-2">
                  <span>
                    {d.distribution.distributionPeriod}
                    <span className="text-xs text-slate-light ml-2">{d.distribution.fund.name}</span>
                  </span>
                  <span className="text-xs">
                    {formatCurrency(d.amount, d.distribution.fund.baseCurrency)}
                    <StatusBadge status={d.distribution.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No distributions yet." />
          )}
        </Panel>

        <Panel title="Redemptions">
          {redQuery.data && redQuery.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {redQuery.data.map((r) => (
                <li key={r.id} className="flex justify-between border-b border-ink/5 pb-2">
                  <span>
                    {formatCurrency(r.requestAmount, r.fund?.baseCurrency)}
                    <span className="text-xs text-slate-light ml-2">
                      settle {formatDate(r.finalSettlementDate)}
                    </span>
                  </span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No redemption requests." />
          )}
        </Panel>

        <Panel title="Documents">
          {docsQuery.data && docsQuery.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {docsQuery.data.map((doc) => (
                <li key={doc.id} className="flex justify-between border-b border-ink/5 pb-2">
                  <span>
                    {doc.fileName}
                    <span className="text-xs text-slate-light ml-2">
                      {doc.type.replace(/_/g, ' ')} · v{doc.version}
                    </span>
                  </span>
                  <span className="text-xs text-slate-light">
                    {doc.expiryDate ? `expires ${formatDate(doc.expiryDate)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No documents on file." />
          )}
        </Panel>
      </div>

      {profile && (
        <Panel title="Compliance status">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="KYC"><StatusBadge status={profile.kycStatus} /></Field>
            <Field label="AML"><StatusBadge status={profile.amlStatus} /></Field>
            <Field label="Source of funds"><StatusBadge status={profile.sourceOfFundsStatus} /></Field>
            <Field label="Risk rating"><span className="text-ink">{profile.riskRating ?? '—'}</span></Field>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
      <h2 className="text-sm uppercase tracking-widest text-slate mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-slate-light mb-1">{label}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-slate-light py-3 text-center">{text}</div>;
}
