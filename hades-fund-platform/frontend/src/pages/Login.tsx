import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      // Distinguish genuinely-wrong credentials (a 401 from the API) from the
      // API being unreachable / blocked by CORS (no response), so setup
      // problems don't masquerade as bad credentials.
      if (isAxiosError(err) && err.response) {
        setError(
          err.response.status === 401
            ? 'Incorrect email or password.'
            : `Login failed (server responded ${err.response.status}). Check the API logs.`,
        );
      } else {
        setError(
          'Could not reach the API. Is the backend running on the expected URL, and is CORS_ORIGIN set to this app’s origin?',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-display text-3xl text-paper tracking-wide">HADES</div>
          <div className="text-xs text-slate-light mt-1 tracking-widest uppercase">
            Fund Management Platform
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper rounded-sm px-7 py-8">
          <label className="block text-xs uppercase tracking-widest text-slate mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink/15 bg-white px-3 py-2 text-sm mb-4 focus:outline-none focus:border-gold"
            placeholder="you@hadesfund.com"
          />

          <label className="block text-xs uppercase tracking-widest text-slate mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink/15 bg-white px-3 py-2 text-sm mb-5 focus:outline-none focus:border-gold"
            placeholder="••••••••"
          />

          {error && <div className="text-wine text-sm mb-4">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-2.5 text-sm tracking-wide hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
