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

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
export type InvestorType = 'RETAIL' | 'PROFESSIONAL' | 'INSTITUTION';
export type RiskRating = 'LOW' | 'MEDIUM' | 'HIGH';

// Server-enforced onboarding order — mirrors WORKFLOW_ORDER in
// investors.service.ts. Used by the UI to only ever offer the single valid
// next step (plus the ACTIVE -> INACTIVE/REDEEMED terminal transitions).
export const WORKFLOW_ORDER: InvestorStatus[] = [
  'DRAFT',
  'DOCUMENTS_UPLOADED',
  'KYC_REVIEW',
  'COMPLIANCE_REVIEW',
  'APPROVED',
  'FUNDED',
  'ACTIVE',
];

export interface InvestorDocument {
  id: string;
  category: string;
  type: string;
  fileName: string;
  version: number;
  expiryDate: string | null;
  uploadedAt: string;
}

export interface Subscription {
  id: string;
  subscriptionAmount: string;
  allocationAmount: string;
  fundUnits: string;
  navPerUnitAtEntry: string;
  transferDate: string | null;
  effectiveDate: string | null;
  createdAt: string;
}

export interface WorkflowHistoryEntry {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedBy: string;
  note: string | null;
  createdAt: string;
}

export interface Investor {
  id: string;
  clientId: string;
  fullName: string;
  mobile: string;
  email: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  country?: string | null;
  address?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  swift?: string | null;
  virtualIban?: string | null;
  investorType: InvestorType;
  status: InvestorStatus;
  kycStatus: ReviewStatus;
  amlStatus: ReviewStatus;
  sourceOfFundsStatus: ReviewStatus;
  riskRating?: RiskRating | null;
  relationshipManagerId?: string | null;
  relationshipManager?: { id: string; fullName: string } | null;
  documents?: InvestorDocument[];
  subscriptions?: Subscription[];
  workflowHistory?: WorkflowHistoryEntry[];
  createdAt: string;
}

export interface PaginatedInvestors {
  items: Investor[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RelationshipManagerOption {
  id: string;
  fullName: string;
}

export interface CreateInvestorInput {
  fullName: string;
  mobile: string;
  email: string;
  dateOfBirth?: string;
  nationality?: string;
  country?: string;
  address?: string;
  bankAccountNumber?: string;
  bankName?: string;
  iban?: string;
  swift?: string;
  virtualIban?: string;
  investorType: InvestorType;
  relationshipManagerId?: string;
}

export type UpdateInvestorInput = Partial<CreateInvestorInput>;

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

export async function fetchRelationshipManagers(): Promise<RelationshipManagerOption[]> {
  const { data } = await apiClient.get<RelationshipManagerOption[]>(
    '/investors/relationship-managers',
  );
  return data;
}

export async function createInvestor(input: CreateInvestorInput): Promise<Investor> {
  const { data } = await apiClient.post<Investor>('/investors', input);
  return data;
}

export async function updateInvestor(
  id: string,
  input: UpdateInvestorInput,
): Promise<Investor> {
  const { data } = await apiClient.patch<Investor>(`/investors/${id}`, input);
  return data;
}

export async function updateInvestorCompliance(
  id: string,
  input: { kycStatus?: ReviewStatus; sourceOfFundsStatus?: ReviewStatus; amlStatus?: ReviewStatus; riskRating?: RiskRating },
): Promise<Investor> {
  const { data } = await apiClient.patch<Investor>(`/investors/${id}/compliance`, input);
  return data;
}

export async function transitionInvestorStage(
  id: string,
  toStage: InvestorStatus,
  note?: string,
): Promise<Investor> {
  const { data } = await apiClient.patch<Investor>(`/investors/${id}/stage`, { toStage, note });
  return data;
}
