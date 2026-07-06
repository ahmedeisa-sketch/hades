import { apiClient } from './client';

export type DocumentCategory = 'IDENTITY' | 'COMPLIANCE' | 'INVESTOR';

export type DocumentType =
  | 'PASSPORT'
  | 'EMIRATES_ID'
  | 'KYC_FORM'
  | 'AML_FORM'
  | 'SOURCE_OF_FUNDS'
  | 'SUBSCRIPTION_FORM'
  | 'TRANSFER_RECEIPT'
  | 'BANK_CONFIRMATION'
  | 'OTHER';

export interface InvestorDocument {
  id: string;
  investorId: string;
  category: DocumentCategory;
  type: DocumentType;
  fileName: string;
  version: number;
  expiryDate: string | null;
  uploadedAt: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  'PASSPORT',
  'EMIRATES_ID',
  'KYC_FORM',
  'AML_FORM',
  'SOURCE_OF_FUNDS',
  'SUBSCRIPTION_FORM',
  'TRANSFER_RECEIPT',
  'BANK_CONFIRMATION',
  'OTHER',
];

// Which category a document type belongs to — keeps the upload form to a
// single "type" choice while still sending the category the API expects.
export const DOCUMENT_TYPE_CATEGORY: Record<DocumentType, DocumentCategory> = {
  PASSPORT: 'IDENTITY',
  EMIRATES_ID: 'IDENTITY',
  KYC_FORM: 'COMPLIANCE',
  AML_FORM: 'COMPLIANCE',
  SOURCE_OF_FUNDS: 'COMPLIANCE',
  SUBSCRIPTION_FORM: 'INVESTOR',
  TRANSFER_RECEIPT: 'INVESTOR',
  BANK_CONFIRMATION: 'INVESTOR',
  OTHER: 'INVESTOR',
};

export async function fetchDocuments(investorId: string): Promise<InvestorDocument[]> {
  const { data } = await apiClient.get<InvestorDocument[]>(
    `/investors/${investorId}/documents`,
  );
  return data;
}

export async function uploadDocument(
  investorId: string,
  input: { file: File; type: DocumentType; expiryDate?: string },
): Promise<InvestorDocument> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('type', input.type);
  form.append('category', DOCUMENT_TYPE_CATEGORY[input.type]);
  if (input.expiryDate) form.append('expiryDate', input.expiryDate);

  const { data } = await apiClient.post<InvestorDocument>(
    `/investors/${investorId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function downloadDocument(
  investorId: string,
  documentId: string,
): Promise<Blob> {
  const { data } = await apiClient.get(
    `/investors/${investorId}/documents/${documentId}/download`,
    { responseType: 'blob' },
  );
  return data as Blob;
}

export async function deleteDocument(
  investorId: string,
  documentId: string,
): Promise<void> {
  await apiClient.delete(`/investors/${investorId}/documents/${documentId}`);
}
