'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from '@/navigation'
import { clearAdminSession } from '@/lib/admin-session'
import { isAdminPublicPath } from '@/lib/public-routes'

interface AuthState {
  token: string | null
  user: { name: string; email: string; role: string } | null
  isAuthChecked: boolean
  isAuthenticated: boolean
  login: (token: string, user: { name: string; email: string; role: string }) => void
  logout: () => void
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

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<AuthState['user']>(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  const login = useCallback((newToken: string, newUser: { name: string; email: string; role: string }) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setTokenState(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    clearAdminSession()
    setTokenState(null)
    setUser(null)
    router.replace('/login')
  }, [router])

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken) {
      setTokenState(storedToken)
      try {
        setUser(JSON.parse(storedUser || 'null'))
      } catch {
        setUser(null)
      }
    }

    if (!storedToken && !isAdminPublicPath(pathname)) {
      router.replace('/login')
      return
    }

    setIsAuthChecked(true)
  }, [pathname, router])

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
