import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '@/components/common/Logo';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(form.email, form.password);
      // Staff accounts must use the dedicated admin console.
      if (data.user.role !== 'volunteer') {
        try { await authService.logout(); } catch { /* ignore */ }
        toast.error('Staff accounts sign in from the Admin Console.');
        navigate('/admin/login');
        return;
      }
      // Put the token + user into global state first so the next request is authenticated.
      setAuth({ accessToken: data.accessToken, user: data.user });
      // Load the full profile (user + volunteer) BEFORE navigating. Volunteer-only pages
      // (Profile, My Activity) read `volunteer` from global state and were previously stuck
      // loading because login never populated it — only the page-load bootstrap did.
      try {
        const me = await authService.me();
        setAuth({ user: me.user, volunteer: me.volunteer });
      } catch { /* token is set; profile will hydrate on next load if this call fails */ }
      toast.success('Welcome back!');
      navigate('/volunteer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo withTagline /></div>
        <form onSubmit={submit} className="card space-y-4">
          <h1 className="text-center text-2xl font-extrabold text-ink">Welcome back 👋</h1>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label mb-0">Password</label>
              <Link to="/forgot-password" className="text-sm font-medium text-brand hover:underline">
                Forgot password?
              </Link>
            </div>
            <input className="input mt-1.5" type="password" required
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-center text-sm text-ink-soft">
            New here? <Link to="/register" className="font-semibold text-brand">Register as a volunteer</Link>
          </p>
          <p className="text-center text-xs text-ink-soft">
            Staff member? <Link to="/admin/login" className="font-medium text-brand">Admin Console →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
