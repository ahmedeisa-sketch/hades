import { apiClient } from './client';

export interface ComplianceOverview {
  investorsMissingDocuments: number;
  expiredDocuments: number;
  expiringSoonDocuments: number;
  reviewQueueSize: number;
  kycPending: number;
  amlPending: number;
  sourceOfFundsPending: number;
}

export interface ReviewQueueItem {
  id: string;
  clientId: string;
  fullName: string;
  status: string;
  kycStatus: string;
  amlStatus: string;
  sourceOfFundsStatus: string;
  riskRating: string | null;
}

export interface MissingDocumentsRow {
  investorId: string;
  clientId: string;
  fullName: string;
  status: string;
  missing: string[];
}

export interface DocumentAlert {
  id: string;
  type: string;
  fileName: string;
  expiryDate: string | null;
  investor: { id: string; clientId: string; fullName: string };
}

export interface DocumentAlerts {
  expired: DocumentAlert[];
  expiringSoon: DocumentAlert[];
}

export async function fetchComplianceOverview(): Promise<ComplianceOverview> {
  const { data } = await apiClient.get<ComplianceOverview>('/compliance/overview');
  return data;
}

export async function fetchReviewQueue(): Promise<ReviewQueueItem[]> {
  const { data } = await apiClient.get<ReviewQueueItem[]>('/compliance/review-queue');
  return data;
}

export async function fetchMissingDocuments(): Promise<MissingDocumentsRow[]> {
  const { data } = await apiClient.get<MissingDocumentsRow[]>('/compliance/missing-documents');
  return data;
}

export async function fetchDocumentAlerts(): Promise<DocumentAlerts> {
  const { data } = await apiClient.get<DocumentAlerts>('/compliance/document-alerts');
  return data;
}
