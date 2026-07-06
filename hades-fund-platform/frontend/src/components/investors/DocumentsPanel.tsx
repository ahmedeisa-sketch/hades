import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  DOCUMENT_TYPES,
  DocumentType,
} from '../../api/documents';

export function DocumentsPanel({ investorId }: { investorId: string }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<DocumentType>('PASSPORT');
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: documents } = useQuery({
    queryKey: ['documents', investorId],
    queryFn: () => fetchDocuments(investorId),
  });

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await uploadDocument(investorId, { file, type, expiryDate: expiryDate || undefined });
      setFile(null);
      setExpiryDate('');
      // Reset the native file input by key-less approach: re-fetch list.
      await queryClient.invalidateQueries({ queryKey: ['documents', investorId] });
      await queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(documentId: string, fileName: string) {
    const blob = await downloadDocument(investorId, documentId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(documentId: string) {
    await deleteDocument(investorId, documentId);
    await queryClient.invalidateQueries({ queryKey: ['documents', investorId] });
    await queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
  }

  return (
    <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
      <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Documents</h2>

      {documents && documents.length > 0 ? (
        <ul className="space-y-2 text-sm mb-5">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between border-b border-ink/5 pb-2">
              <span className="min-w-0">
                <span className="block truncate">{doc.fileName}</span>
                <span className="text-xs text-slate-light">
                  {doc.type.replace(/_/g, ' ')} · v{doc.version}
                  {doc.expiryDate && ` · expires ${new Date(doc.expiryDate).toLocaleDateString()}`}
                </span>
              </span>
              <span className="flex gap-2 shrink-0 ml-3">
                <button
                  onClick={() => handleDownload(doc.id, doc.fileName)}
                  className="text-xs text-gold-deep hover:underline"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs text-wine hover:underline"
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-slate-light py-3 text-center mb-4">
          No documents uploaded yet.
        </div>
      )}

      <form onSubmit={handleUpload} className="border-t border-ink/10 pt-4 space-y-3">
        {error && <div className="text-xs text-wine">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-slate mb-1">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="input"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-slate mb-1">
              Expiry (optional)
            </span>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="input"
            />
          </label>
        </div>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate file:mr-3 file:border file:border-ink/15 file:bg-paper-dim file:px-3 file:py-1.5 file:text-xs"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
        >
          {busy ? 'Uploading…' : 'Upload document'}
        </button>
      </form>
    </section>
  );
}
