import { apiClient } from './client';

export type RedemptionStatus =
  | 'REQUESTED'
  | 'COMPLIANCE_REVIEW'
  | 'OPERATIONS_REVIEW'
  | 'APPROVED'
  | 'SETTLEMENT_PROCESSING'
  | 'PAID'
  | 'REJECTED';

export interface WorkflowHistoryEntry {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export interface RedemptionSummary {
  id: string;
  investorId: string;
  fundId: string;
  requestDate: string;
  requestAmount: string;
  unitsRedeemed: string;
  eligibilityDate: string | null;
  finalSettlementDate: string | null;
  status: RedemptionStatus;
  paymentReference: string | null;
  paymentDate: string | null;
  investor?: { id: string; clientId: string; fullName: string };
  fund?: { id: string; name: string; baseCurrency: string };
}

export interface Redemption extends RedemptionSummary {
  reviewedBy: { id: string; fullName: string } | null;
  workflowHistory: WorkflowHistoryEntry[];
}

export interface CreateRedemptionInput {
  fundId: string;
  requestAmount: number;
}

// Legal next states per current status — mirrors the server-side state
// machine, including the reject branches at each review stage.
export const REDEMPTION_NEXT: Record<RedemptionStatus, RedemptionStatus[]> = {
  REQUESTED: ['COMPLIANCE_REVIEW'],
  COMPLIANCE_REVIEW: ['OPERATIONS_REVIEW', 'REJECTED'],
  OPERATIONS_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['SETTLEMENT_PROCESSING'],
  SETTLEMENT_PROCESSING: ['PAID'],
  PAID: [],
  REJECTED: [],
};

export async function fetchRedemptions(params?: {
  investorId?: string;
  status?: RedemptionStatus;
}): Promise<RedemptionSummary[]> {
  const { data } = await apiClient.get<RedemptionSummary[]>('/redemptions', {
    params: params ?? {},
  });
  return data;
}

export async function fetchRedemption(id: string): Promise<Redemption> {
  const { data } = await apiClient.get<Redemption>(`/redemptions/${id}`);
  return data;
}

export async function createRedemption(
  investorId: string,
  input: CreateRedemptionInput,
): Promise<Redemption> {
  const { data } = await apiClient.post<Redemption>(
    `/redemptions/investors/${investorId}`,
    input,
  );
  return data;
}

export async function transitionRedemption(
  id: string,
  toStatus: RedemptionStatus,
  extra?: { paymentReference?: string; note?: string },
): Promise<Redemption> {
  const { data } = await apiClient.post<Redemption>(`/redemptions/${id}/transition`, {
    toStatus,
    ...extra,
  });
  return data;
}
