import { apiClient } from './client';

export interface DashboardKpis {
  totalInvestors: number;
  activeInvestors: number;
  pendingInvestors: number;
  totalAum: number;
  fundUnitsOutstanding: number;
  totalDistributionsPaid: number;
  totalRedemptionsPaid: number;
  outstandingRedemptions: number;
  complianceCompletionPct: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface RedemptionPipelineEntry {
  status: string;
  count: number;
  amount: number;
}

export async function fetchKpis(): Promise<DashboardKpis> {
  const { data } = await apiClient.get<DashboardKpis>('/dashboard/kpis');
  return data;
}

export async function fetchInvestorStatusBreakdown(): Promise<StatusBreakdown[]> {
  const { data } = await apiClient.get<StatusBreakdown[]>('/dashboard/investor-status-breakdown');
  return data;
}

export async function fetchRedemptionPipeline(): Promise<RedemptionPipelineEntry[]> {
  const { data } = await apiClient.get<RedemptionPipelineEntry[]>('/dashboard/redemption-pipeline');
  return data;
}
