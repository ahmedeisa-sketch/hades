import { useQuery } from '@tanstack/react-query';
import {
  fetchAllNotifications,
  fetchMyNotifications,
} from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';

const OVERSIGHT_ROLES = ['SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'OPERATIONS'];

export function Notifications() {
  const { user } = useAuth();
  const canSeeAll = !!user && OVERSIGHT_ROLES.includes(user.role);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', canSeeAll ? 'all' : 'mine'],
    queryFn: () => (canSeeAll ? fetchAllNotifications() : fetchMyNotifications()),
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Notifications</h1>
        <p className="text-sm text-slate mt-1">
          {canSeeAll ? 'All notifications sent by the platform' : 'Notifications addressed to you'}
        </p>
      </header>

      <div className="bg-white/60 border border-ink/5 rounded-sm p-5">
        {isLoading && <div className="text-slate text-sm">Loading…</div>}
        {notifications && notifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-light border-b border-ink/10">
                  <th className="py-2 pr-4">Template</th>
                  <th className="py-2 pr-4">Channel</th>
                  {canSeeAll && <th className="py-2 pr-4">Recipient</th>}
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">When</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className="border-b border-ink/5 hover:bg-paper-dim">
                    <td className="py-2 pr-4">{n.template.replace(/_/g, ' ')}</td>
                    <td className="py-2 pr-4 text-xs text-slate-light">{n.channel}</td>
                    {canSeeAll && (
                      <td className="py-2 pr-4 text-xs">
                        {n.user ? `${n.user.fullName}` : '—'}
                      </td>
                    )}
                    <td className="py-2 pr-4"><StatusBadge status={n.status} /></td>
                    <td className="py-2 pr-4 text-xs text-slate-light">
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="text-sm text-slate-light py-6 text-center">No notifications yet.</div>
          )
        )}
      </div>
    </div>
  );
}
