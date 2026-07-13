'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
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
  const sessionEpoch = useRef(0)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    sessionEpoch.current += 1
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setTokenState(newToken)
    setUser(newUser)
    setIsAuthChecked(true)
  }, [])

  const logout = useCallback(() => {
    sessionEpoch.current += 1
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
      const bootstrapEpoch = sessionEpoch.current
      const isCurrentBootstrap = () =>
        !cancelled &&
        sessionEpoch.current === bootstrapEpoch &&
        localStorage.getItem(TOKEN_KEY) === storedToken

      if (!storedToken) {
        if (isCurrentBootstrap()) {
          setTokenState(null)
          setUser(null)
          setIsAuthChecked(true)
        }
        return
      }

      try {
        const profile = await apiGet<ProfileResponse>('/users/me')

        if (profile.role !== REQUIRED_ROLE) {
          throw new Error('invalid role')
        }

        if (!isCurrentBootstrap()) return

        const authUser = toAuthUser(profile)
        localStorage.setItem(USER_KEY, JSON.stringify(authUser))
        setTokenState(storedToken)
        setUser(authUser)
      } catch {
        if (!isCurrentBootstrap()) return
        disconnectSocket()
        clearAdminSession()
        setTokenState(null)
        setUser(null)
      } finally {
        if (isCurrentBootstrap()) setIsAuthChecked(true)
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
