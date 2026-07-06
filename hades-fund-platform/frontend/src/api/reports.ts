import { apiClient } from './client';

export type ReportKey =
  | 'investors'
  | 'subscriptions'
  | 'redemptions'
  | 'distributions';

const REPORT_PATHS: Record<ReportKey, string> = {
  investors: '/reports/investors.csv',
  subscriptions: '/reports/subscriptions.csv',
  redemptions: '/reports/redemptions.csv',
  distributions: '/reports/distributions.csv',
};

/**
 * Fetches a CSV report as a blob through the authenticated client and triggers
 * a browser download. Going through apiClient (rather than a plain link)
 * ensures the Authorization header is attached.
 */
export async function downloadReport(key: ReportKey): Promise<void> {
  const { data } = await apiClient.get(REPORT_PATHS[key], { responseType: 'blob' });
  triggerDownload(data as Blob, `${key}.csv`);
}

export async function downloadDistributionAllocations(
  distributionId: string,
): Promise<void> {
  const { data } = await apiClient.get(
    `/reports/distributions/${distributionId}/allocations.csv`,
    { responseType: 'blob' },
  );
  triggerDownload(data as Blob, `distribution-${distributionId}-allocations.csv`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
