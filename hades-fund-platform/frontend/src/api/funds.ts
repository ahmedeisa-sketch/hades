import { apiClient } from './client';

export interface Fund {
  id: string;
  name: string;
  baseCurrency: string;
  managementFeePct: string | null;
  performanceFeePct: string | null;
  lockupMonths: number;
  noticeDays: number;
  isActive: boolean;
}

export interface NavSnapshot {
  id: string;
  fundId: string;
  asOfDate: string;
  navPerUnit: string;
  totalAum: string;
  enteredBy: string;
  createdAt: string;
}

export interface CreateFundInput {
  name: string;
  baseCurrency?: string;
  managementFeePct?: number;
  performanceFeePct?: number;
  lockupMonths?: number;
  noticeDays?: number;
}

export async function fetchFunds(): Promise<Fund[]> {
  const { data } = await apiClient.get<Fund[]>('/funds');
  return data;
}

export async function createFund(input: CreateFundInput): Promise<Fund> {
  const { data } = await apiClient.post<Fund>('/funds', input);
  return data;
}

export async function fetchNavHistory(fundId: string): Promise<NavSnapshot[]> {
  const { data } = await apiClient.get<NavSnapshot[]>(`/funds/${fundId}/nav`);
  return data;
}

export async function fetchLatestNav(fundId: string): Promise<NavSnapshot | null> {
  const { data } = await apiClient.get<NavSnapshot | null>(`/funds/${fundId}/nav/latest`);
  return data;
}

export async function createNavSnapshot(
  fundId: string,
  input: { asOfDate: string; navPerUnit: number; totalAum: number },
): Promise<NavSnapshot> {
  const { data } = await apiClient.post<NavSnapshot>(`/funds/${fundId}/nav`, input);
  return data;
}
