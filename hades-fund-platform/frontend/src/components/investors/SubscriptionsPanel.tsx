import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSubscriptions,
  createSubscription,
  deleteSubscription,
} from '../../api/subscriptions';
import { fetchFunds } from '../../api/funds';

export function SubscriptionsPanel({ investorId }: { investorId: string }) {
  const queryClient = useQueryClient();
  const [fundId, setFundId] = useState('');
  const [subscriptionAmount, setSubscriptionAmount] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions', investorId],
    queryFn: () => fetchSubscriptions(investorId),
  });
  const { data: funds } = useQuery({ queryKey: ['funds'], queryFn: fetchFunds });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!fundId) {
      setError('Select a fund.');
      return;
    }
    const amount = Number(subscriptionAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid subscription amount.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createSubscription(investorId, {
        fundId,
        subscriptionAmount: amount,
        allocationAmount: allocationAmount ? Number(allocationAmount) : undefined,
        transferReference: transferReference || undefined,
      });
      setFundId('');
      setSubscriptionAmount('');
      setAllocationAmount('');
      setTransferReference('');
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', investorId] });
      await queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create the subscription.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(subscriptionId: string) {
    await deleteSubscription(investorId, subscriptionId);
    await queryClient.invalidateQueries({ queryKey: ['subscriptions', investorId] });
    await queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
  }

  return (
    <section className="bg-white/60 border border-ink/5 rounded-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-slate">Subscriptions</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-xs text-gold-deep hover:underline"
        >
          {showForm ? 'Cancel' : '+ New subscription'}
        </button>
      </div>

      {subscriptions && subscriptions.length > 0 ? (
        <ul className="space-y-2 text-sm mb-4">
          {subscriptions.map((sub) => (
            <li key={sub.id} className="flex items-center justify-between border-b border-ink/5 pb-2">
              <span className="min-w-0">
                <span className="block">
                  {Number(sub.subscriptionAmount).toLocaleString()}{' '}
                  {sub.fund?.baseCurrency ?? ''}
                  <span className="text-xs text-slate-light ml-2">{sub.fund?.name}</span>
                </span>
                <span className="text-xs text-slate-light">
                  {Number(sub.fundUnits).toLocaleString(undefined, { maximumFractionDigits: 6 })} units
                  {' @ '}
                  {Number(sub.navPerUnitAtEntry).toLocaleString(undefined, { maximumFractionDigits: 6 })}/unit
                </span>
              </span>
              <button
                onClick={() => handleDelete(sub.id)}
                className="text-xs text-wine hover:underline shrink-0 ml-3"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-slate-light py-3 text-center mb-2">No subscriptions yet.</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="border-t border-ink/10 pt-4 space-y-3">
          {error && <div className="text-xs text-wine">{error}</div>}
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-slate mb-1">Fund</span>
            <select value={fundId} onChange={(e) => setFundId(e.target.value)} className="input">
              <option value="">Select a fund…</option>
              {funds?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.baseCurrency})
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">
                Subscription amount
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={subscriptionAmount}
                onChange={(e) => setSubscriptionAmount(e.target.value)}
                className="input"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest text-slate mb-1">
                Allocation (optional)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(e.target.value)}
                placeholder="defaults to subscription"
                className="input"
              />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest text-slate mb-1">
              Transfer reference (optional)
            </span>
            <input
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
              className="input"
            />
          </label>
          <p className="text-xs text-slate-light">
            Fund units are calculated automatically from the fund's latest NAV.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="bg-ink text-paper text-sm px-4 py-2 hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create subscription'}
          </button>
        </form>
      )}
    </section>
  );
}
