import { apiClient } from './client';

export interface Subscription {
  id: string;
  investorId: string;
  fundId: string;
  subscriptionAmount: string;
  allocationAmount: string;
  fundUnits: string;
  navPerUnitAtEntry: string;
  transferDate: string | null;
  transferReference: string | null;
  effectiveDate: string | null;
  createdAt: string;
  fund?: { id: string; name: string; baseCurrency: string };
}

export interface CreateSubscriptionInput {
  fundId: string;
  subscriptionAmount: number;
  allocationAmount?: number;
  transferDate?: string;
  transferReference?: string;
  effectiveDate?: string;
}

export async function fetchSubscriptions(investorId: string): Promise<Subscription[]> {
  const { data } = await apiClient.get<Subscription[]>(
    `/investors/${investorId}/subscriptions`,
  );
  return data;
}

export async function createSubscription(
  investorId: string,
  input: CreateSubscriptionInput,
): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>(
    `/investors/${investorId}/subscriptions`,
    input,
  );
  return data;
}

export async function deleteSubscription(
  investorId: string,
  subscriptionId: string,
): Promise<void> {
  await apiClient.delete(`/investors/${investorId}/subscriptions/${subscriptionId}`);
}
