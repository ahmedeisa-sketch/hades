const SEAL_CLASS_BY_STATUS: Record<string, string> = {
  ACTIVE: 'seal-active text-forest',
  APPROVED: 'seal-approved text-forest',
  FUNDED: 'seal-approved text-forest',
  PAID: 'seal-approved text-forest',
  PENDING: 'seal-pending text-gold-deep',
  DRAFT: 'seal-pending text-gold-deep',
  DOCUMENTS_UPLOADED: 'seal-pending text-gold-deep',
  KYC_REVIEW: 'seal-pending text-gold-deep',
  COMPLIANCE_REVIEW: 'seal-pending text-gold-deep',
  REQUESTED: 'seal-pending text-gold-deep',
  REJECTED: 'seal-rejected text-wine',
  ESCALATED: 'seal-rejected text-wine',
  INACTIVE: 'seal-rejected text-wine',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = SEAL_CLASS_BY_STATUS[status] ?? 'seal-pending text-gold-deep';
  return <span className={`seal ${cls}`}>{status.replace(/_/g, ' ').toLowerCase()}</span>;
}
