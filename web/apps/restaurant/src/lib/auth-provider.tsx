'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from '@/navigation'
import { setToken as storeToken, clearToken, setStoredRestaurant } from '@/lib/api'

interface AuthState {
  token: string | null
  isAuthChecked: boolean
  isAuthenticated: boolean
  login: (token: string, restaurantData?: unknown) => void
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  token: null,
  isAuthChecked: false,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

const TOKEN_KEY = 'restaurant_token'
const REFRESH_KEY = 'restaurant_refresh_token'
const PUBLIC_PATHS = ['/login']

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setTokenState] = useState<string | null>(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  const login = useCallback(
    (newToken: string, restaurantData?: unknown) => {
      storeToken(newToken)
      if (restaurantData) {
        setStoredRestaurant(restaurantData)
      }
      setTokenState(newToken)
    },
    []
  )

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(REFRESH_KEY)
    setTokenState(null)
    router.replace('/login')
  }, [router])

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (storedToken) {
      setTokenState(storedToken)
    }

    if (!storedToken && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login')
      return
    }

    setIsAuthChecked(true)
  }, [pathname, router])

  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (!isAuthChecked && !isPublic) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        token,
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
