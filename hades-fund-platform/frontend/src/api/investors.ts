import { apiClient } from './client';

export type InvestorStatus =
  | 'DRAFT'
  | 'DOCUMENTS_UPLOADED'
  | 'KYC_REVIEW'
  | 'COMPLIANCE_REVIEW'
  | 'APPROVED'
  | 'FUNDED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'REDEEMED';

export interface Investor {
  id: string;
  clientId: string;
  fullName: string;
  mobile: string;
  email: string;
  investorType: 'RETAIL' | 'PROFESSIONAL' | 'INSTITUTION';
  status: InvestorStatus;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  amlStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  sourceOfFundsStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  relationshipManager?: { id: string; fullName: string } | null;
  createdAt: string;
}

export interface PaginatedInvestors {
  items: Investor[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchInvestors(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: InvestorStatus;
}): Promise<PaginatedInvestors> {
  const { data } = await apiClient.get<PaginatedInvestors>('/investors', { params });
  return data;
}

export async function fetchInvestor(id: string): Promise<Investor> {
  const { data } = await apiClient.get<Investor>(`/investors/${id}`);
  return data;
}
