import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import api from '@/services/api';

// Runs the session-restore exactly once per page load. This module-level flag
// survives React StrictMode's deliberate double-mount in development, which would
// otherwise fire TWO concurrent /auth/refresh calls on every reload and trigger a
// token-rotation race that desyncs the cookie from the DB and logs the user out.
let bootstrapStarted = false;

// Bootstraps auth on app load: tries to refresh the session, then loads the user.
export function useAuthBootstrap() {
  const { setAccessToken, setAuth, setReady } = useAuthStore();
  useEffect(() => {
    if (bootstrapStarted) return;
    bootstrapStarted = true;
    (async () => {
      try {
        // Refresh is driven entirely by the HTTP-only cookie — no access token needed here.
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.accessToken);
        const me = await authService.me();
        setAuth({ user: me.user, volunteer: me.volunteer });
      } catch {
        // No valid session cookie — remain logged out. (Not an error.)
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useAuth() {
  return useAuthStore();
}
