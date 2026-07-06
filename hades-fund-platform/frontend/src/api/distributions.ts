import { apiClient } from './client';

export type DistributionStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PROCESSING' | 'PAID';

export interface DistributionAllocation {
  id: string;
  investorId: string;
  amount: string;
  unitsHeldAtRun: string;
  investor?: { id: string; clientId: string; fullName: string };
}

export interface WorkflowHistoryEntry {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export interface DistributionSummary {
  id: string;
  fundId: string;
  distributionPeriod: string;
  distributionDate: string;
  distributionAmount: string;
  distributionPct: string | null;
  status: DistributionStatus;
  paymentReference: string | null;
  paymentDate: string | null;
  createdAt: string;
  fund?: { id: string; name: string; baseCurrency: string };
  _count?: { allocations: number };
}

export interface Distribution extends DistributionSummary {
  allocations: DistributionAllocation[];
  approvedBy: { id: string; fullName: string } | null;
  workflowHistory: WorkflowHistoryEntry[];
}

export interface CreateDistributionInput {
  fundId: string;
  distributionPeriod: string;
  distributionDate: string;
  distributionAmount: number;
  distributionPct?: number;
}

// Legal next states per current status — mirrors the server-side state
// machine so the UI only offers valid actions.
export const DISTRIBUTION_NEXT: Record<DistributionStatus, DistributionStatus[]> = {
  DRAFT: ['REVIEWED'],
  REVIEWED: ['APPROVED', 'DRAFT'],
  APPROVED: ['PROCESSING'],
  PROCESSING: ['PAID'],
  PAID: [],
};

export async function fetchDistributions(fundId?: string): Promise<DistributionSummary[]> {
  const { data } = await apiClient.get<DistributionSummary[]>('/distributions', {
    params: fundId ? { fundId } : {},
  });
  return data;
}

export async function fetchDistribution(id: string): Promise<Distribution> {
  const { data } = await apiClient.get<Distribution>(`/distributions/${id}`);
  return data;
}

export async function createDistribution(
  input: CreateDistributionInput,
): Promise<Distribution> {
  const { data } = await apiClient.post<Distribution>('/distributions', input);
  return data;
}

export async function recalculateDistribution(id: string): Promise<Distribution> {
  const { data } = await apiClient.post<Distribution>(`/distributions/${id}/recalculate`, {});
  return data;
}

export async function transitionDistribution(
  id: string,
  toStatus: DistributionStatus,
  extra?: { paymentReference?: string; note?: string },
): Promise<Distribution> {
  const { data } = await apiClient.post<Distribution>(`/distributions/${id}/transition`, {
    toStatus,
    ...extra,
  });
  return data;
}
