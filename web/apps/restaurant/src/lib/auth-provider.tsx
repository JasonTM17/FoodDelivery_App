'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { useRouter, usePathname } from '@/navigation'
import {
  setToken as storeToken,
  clearToken,
  setStoredRestaurant,
  api,
  getStoredRestaurant,
} from '@/lib/api'
import { disconnectSocket } from '@/lib/socket'
import { disconnectTrackingSocket } from '@/lib/tracking-socket'
import { resolveStaffPermissions } from '@/lib/staff-permissions'
import type { StaffCapability, StaffRole } from '@/lib/types'

interface ProfileResponse {
  email: string
  role: string
  fullName?: string
  name?: string
  restaurantProfile?: {
    restaurant?: unknown
  } | null
}

interface RestaurantProfileResponse {
  id?: string
  name?: string
  membership?: {
    role?: StaffRole | string
    permissions?: StaffCapability[] | string[]
  }
  [key: string]: unknown
}

interface AuthState {
  token: string | null
  isAuthChecked: boolean
  isAuthenticated: boolean
  permissions: StaffCapability[]
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  token: null,
  isAuthChecked: false,
  isAuthenticated: false,
  permissions: ['orders'],
  login: async () => {},
  logout: () => {},
})

const TOKEN_KEY = 'restaurant_token'
const REFRESH_KEY = 'restaurant_refresh_token'
const PUBLIC_PATHS = ['/login']
const REQUIRED_ROLE = 'restaurant'

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

function permissionsFromRestaurant(data: unknown): StaffCapability[] {
  const restaurant = data as RestaurantProfileResponse | null | undefined
  return resolveStaffPermissions(
    restaurant?.membership?.role,
    restaurant?.membership?.permissions,
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setTokenState] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<StaffCapability[]>(['orders'])
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const sessionEpoch = useRef(0)

  const login = useCallback(
    async (newToken: string) => {
      const loginEpoch = ++sessionEpoch.current
      storeToken(newToken)
      localStorage.removeItem('restaurant_data')
      setTokenState(newToken)
      setPermissions(['orders'])
      setIsAuthChecked(true)

      try {
        const restaurantData = await api.get<RestaurantProfileResponse>('/restaurant/profile')
        if (sessionEpoch.current !== loginEpoch || localStorage.getItem(TOKEN_KEY) !== newToken) return
        setStoredRestaurant(restaurantData)
        setPermissions(permissionsFromRestaurant(restaurantData))
      } catch {
        if (sessionEpoch.current === loginEpoch && localStorage.getItem(TOKEN_KEY) === newToken) {
          setPermissions(permissionsFromRestaurant(null))
        }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    sessionEpoch.current += 1
    // B-WEB-05: disconnect both realtime sockets on logout
    disconnectSocket()
    disconnectTrackingSocket()
    clearToken()
    localStorage.removeItem(REFRESH_KEY)
    setTokenState(null)
    setPermissions(['orders'])
    router.replace('/login')
  }, [router])

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
          setPermissions(['orders'])
          setIsAuthChecked(true)
        }
        return
      }

      try {
        const profile = await api.get<ProfileResponse>('/users/me')

        if (profile.role !== REQUIRED_ROLE) {
          throw new Error('invalid role')
        }

        if (!isCurrentBootstrap()) return

        let restaurantData: RestaurantProfileResponse | null = null
        try {
          restaurantData = await api.get<RestaurantProfileResponse>('/restaurant/profile')
          if (!isCurrentBootstrap()) return
          setStoredRestaurant(restaurantData)
        } catch {
          if (!isCurrentBootstrap()) return
          restaurantData = getStoredRestaurant() as RestaurantProfileResponse | null
        }

        if (!isCurrentBootstrap()) return

        setTokenState(storedToken)
        setPermissions(permissionsFromRestaurant(restaurantData))
      } catch {
        if (!isCurrentBootstrap()) return
        disconnectSocket()
        disconnectTrackingSocket()
        clearToken()
        localStorage.removeItem(REFRESH_KEY)
        setTokenState(null)
        setPermissions(['orders'])
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
    if (!token && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login')
    }
  }, [isAuthChecked, token, pathname, router])

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
        permissions,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
