import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/investors', label: 'Investors' },
  { to: '/compliance', label: 'Compliance' },
  { to: '/distributions', label: 'Distributions', disabled: true },
  { to: '/redemptions', label: 'Redemptions', disabled: true },
  { to: '/reports', label: 'Reports', disabled: true },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-64 shrink-0 bg-ink text-paper flex flex-col justify-between min-h-screen">
      <div>
        <div className="px-6 py-7 border-b border-white/10">
          <div className="font-display text-2xl tracking-wide">HADES</div>
          <div className="text-xs text-slate-light mt-1 tracking-widest uppercase">
            Fund Management
          </div>
        </div>

        <nav className="mt-4 px-3">
          {NAV_ITEMS.map((item) =>
            item.disabled ? (
              <div
                key={item.to}
                className="flex items-center justify-between px-3 py-2.5 rounded text-sm text-white/30 cursor-not-allowed"
                title="Planned for a later phase"
              >
                {item.label}
                <span className="text-[10px] uppercase tracking-wide">Soon</span>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded text-sm mb-0.5 transition-colors ${
                    isActive
                      ? 'bg-white/10 text-gold-soft border-l-2 border-gold pl-[10px]'
                      : 'text-white/70 hover:bg-white/5 hover:text-paper'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      </div>

      <div className="px-6 py-5 border-t border-white/10">
        <div className="text-sm text-paper">{user?.fullName}</div>
        <div className="text-xs text-slate-light mb-3">{user?.role}</div>
        <button
          onClick={() => signOut()}
          className="text-xs text-gold-soft hover:text-gold underline underline-offset-2"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
