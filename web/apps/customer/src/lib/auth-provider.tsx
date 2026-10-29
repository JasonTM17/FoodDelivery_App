'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  api,
  clearToken,
  getAccessToken,
  getRefreshToken,
  setToken,
} from '@/lib/api';
import { disconnectRealtime } from '@/lib/realtime';
import { isPublicPath } from '@/lib/paths';
import type { AuthResult, AuthUser } from '@/lib/types';

export const CUSTOMER_ROLE = 'customer';

export { isPublicPath };

interface AuthState {
  user: AuthUser | null;
  isAuthChecked: boolean;
  isAuthenticated: boolean;
  /** Persists an AuthResult after the caller has verified user.role. */
  completeLogin: (result: AuthResult) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAuthChecked: false,
  isAuthenticated: false,
  completeLogin: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const sessionEpoch = useRef(0);

  const logout = useCallback(() => {
    sessionEpoch.current += 1;
    const refreshToken = getRefreshToken();
    if (refreshToken && getAccessToken()) {
      void api
        .post('/auth/logout', { refreshToken })
        .catch(() => undefined);
    }
    disconnectRealtime();
    clearToken();
    setUser(null);
    setIsAuthChecked(true);
    if (!isPublicPath(window.location.pathname)) {
      router.replace('/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    const profile = await api.get<AuthUser>('/users/me');
    setUser(profile);
  }, []);

  const completeLogin = useCallback(async (result: AuthResult) => {
    const epoch = ++sessionEpoch.current;
    localStorage.setItem('customer_refresh_token', result.refreshToken);
    setToken(result.accessToken);
    setUser(result.user);
    setIsAuthChecked(true);
    void api
      .get<AuthUser>('/users/me')
      .then((profile) => {
        if (sessionEpoch.current === epoch) setUser(profile);
      })
      .catch(() => undefined);
  }, []);

  // Bootstrap: validate stored token via /users/me and enforce the role.
  useEffect(() => {
    let cancelled = false;
    const epoch = ++sessionEpoch.current;

    async function bootstrap() {
      const storedToken = getAccessToken();
      if (!storedToken) {
        if (!cancelled && sessionEpoch.current === epoch) setIsAuthChecked(true);
        return;
      }
      try {
        const profile = await api.get<AuthUser>('/users/me');
        if (cancelled || sessionEpoch.current !== epoch) return;
        if (profile.role !== CUSTOMER_ROLE) {
          disconnectRealtime();
          clearToken();
          setUser(null);
        } else {
          setUser(profile);
        }
      } catch {
        if (cancelled || sessionEpoch.current !== epoch) return;
        disconnectRealtime();
        clearToken();
        setUser(null);
      } finally {
        if (!cancelled && sessionEpoch.current === epoch) setIsAuthChecked(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect unauthenticated users away from protected routes.
  useEffect(() => {
    if (!isAuthChecked || user || isPublicPath(pathname)) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthChecked, user, pathname, router]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthChecked,
      isAuthenticated: Boolean(user),
      completeLogin,
      logout,
      refreshUser,
    }),
    [user, isAuthChecked, completeLogin, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
