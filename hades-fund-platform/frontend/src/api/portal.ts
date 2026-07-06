import { apiClient } from './client';

export interface PortalProfile {
  id: string;
  clientId: string;
  fullName: string;
  email: string;
  mobile: string;
  nationality: string | null;
  country: string | null;
  investorType: string;
  status: string;
  kycStatus: string;
  amlStatus: string;
  sourceOfFundsStatus: string;
  riskRating: string | null;
  createdAt: string;
}

export interface PortalStatement {
  totalInvested: string | number;
  totalSubscribed: string | number;
  netUnitsHeld: string;
  totalDistributionsReceived: string | number;
  totalRedeemedPaid: string | number;
}

export interface PortalSubscription {
  id: string;
  subscriptionAmount: string;
  allocationAmount: string;
  fundUnits: string;
  navPerUnitAtEntry: string;
  createdAt: string;
  fund?: { id: string; name: string; baseCurrency: string };
}

export interface PortalDistribution {
  id: string;
  amount: string;
  unitsHeldAtRun: string;
  distribution: {
    id: string;
    distributionPeriod: string;
    distributionDate: string;
    status: string;
    paymentDate: string | null;
    fund: { name: string; baseCurrency: string };
  };
}

export interface PortalRedemption {
  id: string;
  requestAmount: string;
  unitsRedeemed: string;
  status: string;
  requestDate: string;
  eligibilityDate: string | null;
  finalSettlementDate: string | null;
  fund?: { id: string; name: string; baseCurrency: string };
}

export interface PortalDocument {
  id: string;
  category: string;
  type: string;
  fileName: string;
  version: number;
  expiryDate: string | null;
  uploadedAt: string;
}

export async function fetchPortalProfile(): Promise<PortalProfile> {
  const { data } = await apiClient.get<PortalProfile>('/portal/me');
  return data;
}

export async function fetchPortalStatement(): Promise<PortalStatement> {
  const { data } = await apiClient.get<PortalStatement>('/portal/statement');
  return data;
}

export async function fetchPortalSubscriptions(): Promise<PortalSubscription[]> {
  const { data } = await apiClient.get<PortalSubscription[]>('/portal/subscriptions');
  return data;
}

export async function fetchPortalDistributions(): Promise<PortalDistribution[]> {
  const { data } = await apiClient.get<PortalDistribution[]>('/portal/distributions');
  return data;
}

export async function fetchPortalRedemptions(): Promise<PortalRedemption[]> {
  const { data } = await apiClient.get<PortalRedemption[]>('/portal/redemptions');
  return data;
}

export async function fetchPortalDocuments(): Promise<PortalDocument[]> {
  const { data } = await apiClient.get<PortalDocument[]>('/portal/documents');
  return data;
}
