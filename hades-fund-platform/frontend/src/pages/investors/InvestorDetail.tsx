import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchInvestor,
  updateInvestor,
  updateInvestorCompliance,
  transitionInvestorStage,
  provisionPortalAccount,
  PortalAccountResult,
  WORKFLOW_ORDER,
  InvestorStatus,
  ReviewStatus,
  RiskRating,
} from '../../api/investors';
import { StatusBadge } from '../../components/StatusBadge';
import { InvestorForm, InvestorFormValues } from '../../components/investors/InvestorForm';
import { DocumentsPanel } from '../../components/investors/DocumentsPanel';
import { SubscriptionsPanel } from '../../components/investors/SubscriptionsPanel';

const REVIEW_STATUSES: ReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED'];
const RISK_RATINGS: RiskRating[] = ['LOW', 'MEDIUM', 'HIGH'];

export function InvestorDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [portalCredentials, setPortalCredentials] = useState<PortalAccountResult | null>(null);
  const [provisioning, setProvisioning] = useState(false);

  const { data: investor, isLoading } = useQuery({
    queryKey: ['investor', id],
    queryFn: () => fetchInvestor(id as string),
    enabled: !!id,
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['investor', id] });
    await queryClient.invalidateQueries({ queryKey: ['investors'] });
  }

  async function handleUpdate(values: InvestorFormValues) {
    if (!id) return;
    await updateInvestor(id, values);
    await refresh();
    setIsEditing(false);
  }

  async function handleAdvanceStage(toStage: InvestorStatus) {
    if (!id) return;
    setActionError(null);
    try {
      await transitionInvestorStage(id, toStage);
      await refresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Could not update the workflow stage.');
    }
  }

  async function handleProvisionPortal() {
    if (!id) return;
    setProvisioning(true);
    setActionError(null);
    try {
      const result = await provisionPortalAccount(id);
      setPortalCredentials(result);
      await refresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Could not provision a portal account.');
    } finally {
      setProvisioning(false);
    }
  }

  async function handleComplianceChange(
    field: 'kycStatus' | 'sourceOfFundsStatus' | 'amlStatus' | 'riskRating',
    value: string,
  ) {
    if (!id) return;
    // The backend's UpdateComplianceDto validates riskRating with @IsEnum
    // when present — it has no "unset" semantics, so an empty selection
    // (the "— unset —" option) is a no-op rather than an invalid request.
    if (value === '') return;
    setActionError(null);
    try {
      await updateInvestorCompliance(id, { [field]: value } as never);
      await refresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? 'Could not update compliance status.');
    }
  }

  if (isLoading) return <div className="text-slate text-sm">Loading investor…</div>;
  if (!investor) return <div className="text-slate text-sm">Investor not found.</div>;

  if (isEditing) {
    return (
      <div>
        <header className="mb-6">
          <div className="text-xs font-mono text-slate mb-1">{investor.clientId}</div>
          <h1 className="font-display text-3xl text-ink">Edit {investor.fullName}</h1>
        </header>
        <InvestorForm
          submitLabel="Save changes"
          initialValues={{
            fullName: investor.fullName,
            mobile: investor.mobile,
            email: investor.email,
            dateOfBirth: investor.dateOfBirth?.slice(0, 10) ?? '',
            nationality: investor.nationality ?? '',
            country: investor.country ?? '',
            address: investor.address ?? '',
            bankAccountNumber: investor.bankAccountNumber ?? '',
            bankName: investor.bankName ?? '',
            iban: investor.iban ?? '',
            swift: investor.swift ?? '',
            virtualIban: investor.virtualIban ?? '',
            investorType: investor.investorType,
            relationshipManagerId: investor.relationshipManagerId ?? '',
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // Server enforces exactly one forward step (or ACTIVE -> INACTIVE/REDEEMED)
  // — mirror that here so the button only ever offers a legal transition.
  const currentIndex = WORKFLOW_ORDER.indexOf(investor.status);
  const nextStage = WORKFLOW_ORDER[currentIndex + 1];
  const isActive = investor.status === 'ACTIVE';

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-xs font-mono text-slate mb-1">{investor.clientId}</div>
          <h1 className="font-display text-3xl text-ink">{investor.fullName}</h1>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={investor.status} />
            <StatusBadge status={investor.kycStatus} />
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2.5 text-sm border border-ink/15 hover:bg-paper-dim transition-colors"
        >
          Edit
        </button>
      </header>

      {actionError && (
        <div className="border border-wine/30 bg-wine/5 text-wine text-sm px-4 py-3 rounded-sm mb-5">
          {actionError}
        </div>
      )}

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Onboarding workflow</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink">Current stage: <strong>{investor.status.replace(/_/g, ' ')}</strong></span>
          {nextStage && (
            <button
              onClick={() => handleAdvanceStage(nextStage)}
              className="bg-ink text-paper text-xs px-3 py-2 hover:bg-ink-soft transition-colors"
            >
              Advance to {nextStage.replace(/_/g, ' ')}
            </button>
          )}
          {isActive && (
            <>
              <button
                onClick={() => handleAdvanceStage('INACTIVE')}
                className="text-xs px-3 py-2 border border-ink/15 hover:bg-paper-dim transition-colors"
              >
                Mark inactive
              </button>
              <button
                onClick={() => handleAdvanceStage('REDEEMED')}
                className="text-xs px-3 py-2 border border-ink/15 hover:bg-paper-dim transition-colors"
              >
                Mark redeemed
              </button>
            </>
          )}
          {!nextStage && !isActive && (
            <span className="text-xs text-slate-light">Terminal stage — no further transitions.</span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">
            General information
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={investor.email} />
            <Row label="Mobile" value={investor.mobile} />
            <Row label="Investor type" value={investor.investorType} />
            <Row label="Nationality" value={investor.nationality ?? '—'} />
            <Row label="Country" value={investor.country ?? '—'} />
            <Row
              label="Relationship manager"
              value={investor.relationshipManager?.fullName ?? '—'}
            />
          </dl>
        </section>

        <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
          <h2 className="text-sm uppercase tracking-widest text-slate mb-4">
            Compliance — Compliance Officer / Super Admin only
          </h2>
          <div className="space-y-3 text-sm">
            <ComplianceSelect
              label="KYC status"
              value={investor.kycStatus}
              options={REVIEW_STATUSES}
              onChange={(v) => handleComplianceChange('kycStatus', v)}
            />
            <ComplianceSelect
              label="AML status"
              value={investor.amlStatus}
              options={REVIEW_STATUSES}
              onChange={(v) => handleComplianceChange('amlStatus', v)}
            />
            <ComplianceSelect
              label="Source of funds"
              value={investor.sourceOfFundsStatus}
              options={REVIEW_STATUSES}
              onChange={(v) => handleComplianceChange('sourceOfFundsStatus', v)}
            />
            <ComplianceSelect
              label="Risk rating"
              value={investor.riskRating ?? ''}
              options={['', ...RISK_RATINGS]}
              onChange={(v) => handleComplianceChange('riskRating', v)}
            />
          </div>
        </section>
      </div>

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5 mb-6">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Portal account</h2>
        {investor.portalUserId ? (
          <div className="text-sm text-ink flex items-center gap-2">
            <StatusBadge status="ACTIVE" />
            <span>This investor has a portal login and can sign in to view their portfolio.</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate">
              No portal login yet. Provision one so the investor can sign in (read-only).
            </span>
            <button
              onClick={handleProvisionPortal}
              disabled={provisioning}
              className="bg-ink text-paper text-xs px-3 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              {provisioning ? 'Provisioning…' : 'Provision portal account'}
            </button>
          </div>
        )}

        {portalCredentials && (
          <div className="mt-4 border border-gold/40 bg-gold/5 rounded-sm p-4 text-sm">
            <div className="font-medium text-ink mb-2">
              Portal account created — share these credentials securely. This is the only time the
              password is shown.
            </div>
            <div className="font-mono text-xs space-y-1">
              <div>Email: {portalCredentials.email}</div>
              <div>Temporary password: {portalCredentials.temporaryPassword}</div>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DocumentsPanel investorId={investor.id} />
        <SubscriptionsPanel investorId={investor.id} />
      </div>

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Workflow history</h2>
        {investor.workflowHistory && investor.workflowHistory.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {investor.workflowHistory.map((entry) => (
              <li key={entry.id} className="flex justify-between border-b border-ink/5 pb-2">
                <span>
                  {entry.fromStage ? `${entry.fromStage.replace(/_/g, ' ')} → ` : ''}
                  {entry.toStage.replace(/_/g, ' ')}
                  {entry.note && <span className="text-xs text-slate-light ml-2">{entry.note}</span>}
                </span>
                <span className="text-xs text-slate-light">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote text="No workflow history." />
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

function EmptyNote({ text }: { text: string }) {
  return <div className="text-sm text-slate-light py-4 text-center">{text}</div>;
}

function ComplianceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-light">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-ink/15 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-gold"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === '' ? '— unset —' : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
