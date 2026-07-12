'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, usePathname } from '@/navigation'
import { clearAdminSession } from '@/lib/admin-session'
import { apiGet } from '@/lib/api'
import { isAdminPublicPath } from '@/lib/public-routes'
import { disconnectSocket } from '@/lib/socket'

interface AuthUser {
  name: string
  email: string
  role: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthChecked: boolean
  isAuthenticated: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

interface ProfileResponse {
  email: string
  role: string
  fullName?: string
  name?: string
}

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isAuthChecked: false,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'
const REQUIRED_ROLE = 'admin'

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

function toAuthUser(profile: ProfileResponse): AuthUser {
  return {
    name: profile.fullName || profile.name || profile.email,
    email: profile.email,
    role: profile.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setTokenState(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    // B-WEB-04: tear down realtime + cached queries with session
    disconnectSocket()
    queryClient.clear()
    clearAdminSession()
    setTokenState(null)
    setUser(null)
    router.replace('/login')
  }, [queryClient, router])

  // B-WEB-08: bootstrap validates token via profile + role, not bare localStorage presence
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        if (!cancelled) {
          setTokenState(null)
          setUser(null)
          setIsAuthChecked(true)
        }
        return
      }

      try {
        // B-WEB-08: validate stored token via profile endpoint + role (not bare localStorage).
        // Canonical profile route is GET /users/me (docs sometimes label this /auth/profile).
        const profile = await apiGet<ProfileResponse>('/users/me')

        if (profile.role !== REQUIRED_ROLE) {
          throw new Error('invalid role')
        }

        if (cancelled) return

        const authUser = toAuthUser(profile)
        localStorage.setItem(USER_KEY, JSON.stringify(authUser))
        setTokenState(storedToken)
        setUser(authUser)
      } catch {
        disconnectSocket()
        clearAdminSession()
        if (!cancelled) {
          setTokenState(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsAuthChecked(true)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthChecked) return
    if (!token && !isAdminPublicPath(pathname)) {
      router.replace('/login')
    }
  }, [isAuthChecked, token, pathname, router])

  const isPublic = isAdminPublicPath(pathname)

  if (!isAuthChecked && !isPublic) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthChecked,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
