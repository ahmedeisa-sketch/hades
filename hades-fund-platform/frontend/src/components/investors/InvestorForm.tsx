import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRelationshipManagers, CreateInvestorInput, InvestorType } from '../../api/investors';

const INVESTOR_TYPES: InvestorType[] = ['RETAIL', 'PROFESSIONAL', 'INSTITUTION'];

export interface InvestorFormValues extends CreateInvestorInput {}

interface InvestorFormProps {
  initialValues?: Partial<InvestorFormValues>;
  submitLabel: string;
  onSubmit: (values: InvestorFormValues) => Promise<void>;
  onCancel?: () => void;
}

const EMPTY_VALUES: InvestorFormValues = {
  fullName: '',
  mobile: '',
  email: '',
  dateOfBirth: '',
  nationality: '',
  country: '',
  address: '',
  bankAccountNumber: '',
  bankName: '',
  iban: '',
  swift: '',
  virtualIban: '',
  investorType: 'RETAIL',
  relationshipManagerId: '',
};

export function InvestorForm({ initialValues, submitLabel, onSubmit, onCancel }: InvestorFormProps) {
  const [values, setValues] = useState<InvestorFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: relationshipManagers } = useQuery({
    queryKey: ['relationship-managers'],
    queryFn: fetchRelationshipManagers,
  });

  function set<K extends keyof InvestorFormValues>(key: K, value: InvestorFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Strip empty-string optional fields so we don't send "" for things
      // like dateOfBirth (which the backend validates as IsDateString).
      const cleaned = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== ''),
      ) as InvestorFormValues;
      await onSubmit(cleaned);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        'Something went wrong saving this investor. Please check the fields and try again.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="border border-wine/30 bg-wine/5 text-wine text-sm px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">General information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input
              required
              value={values.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Investor type" required>
            <select
              value={values.investorType}
              onChange={(e) => set('investorType', e.target.value as InvestorType)}
              className="input"
            >
              {INVESTOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              required
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Mobile" required>
            <input
              required
              value={values.mobile}
              onChange={(e) => set('mobile', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              value={values.dateOfBirth ?? ''}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Nationality">
            <input
              value={values.nationality ?? ''}
              onChange={(e) => set('nationality', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Country">
            <input
              value={values.country ?? ''}
              onChange={(e) => set('country', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Relationship manager">
            <select
              value={values.relationshipManagerId ?? ''}
              onChange={(e) => set('relationshipManagerId', e.target.value)}
              className="input"
            >
              <option value="">Unassigned</option>
              {relationshipManagers?.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Address" className="md:col-span-2">
            <input
              value={values.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </section>

      <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
        <h2 className="text-sm uppercase tracking-widest text-slate mb-4">Banking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Bank name">
            <input
              value={values.bankName ?? ''}
              onChange={(e) => set('bankName', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Bank account number">
            <input
              value={values.bankAccountNumber ?? ''}
              onChange={(e) => set('bankAccountNumber', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="IBAN">
            <input
              value={values.iban ?? ''}
              onChange={(e) => set('iban', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="SWIFT">
            <input
              value={values.swift ?? ''}
              onChange={(e) => set('swift', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Virtual IBAN">
            <input
              value={values.virtualIban ?? ''}
              onChange={(e) => set('virtualIban', e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm border border-ink/15 hover:bg-paper-dim transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-ink text-paper text-sm px-5 py-2.5 hover:bg-ink-soft transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-xs uppercase tracking-widest text-slate mb-1.5">
        {label}
        {required && <span className="text-wine ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
