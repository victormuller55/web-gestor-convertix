import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { login as loginRequest } from '@/lib/api/auth'
import { setUnauthorizedHandler } from '@/lib/api/client'
import { clearSession, getStoredUser, getToken, saveSession, updateStoredUser } from '@/lib/auth/storage'
import { TipoUsuario } from '@/types/enums'
import type { Usuario } from '@/types/models'

interface AuthContextValue {
  user: Usuario | null
  token: string | null
  ready: boolean
  isAdmin: boolean
  isCliente: boolean
  login: (email: string, senha: string) => Promise<Usuario>
  logout: () => void
  setUser: (usuario: Usuario) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUserState(getStoredUser())
    setToken(getToken())
    setReady(true)
  }, [])

  const logout = useCallback(() => {
    queryClient.clear()
    clearSession()
    setUserState(null)
    setToken(null)
    navigate('/login', { replace: true })
  }, [navigate, queryClient])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async (email: string, senha: string) => {
    const usuario = await loginRequest(email, senha)
    if (!usuario.token) throw new Error('A API não retornou token de autenticação.')
    queryClient.clear()
    saveSession(usuario, usuario.token)
    setUserState(usuario)
    setToken(usuario.token)
    return usuario
  }, [queryClient])

  const setUser = useCallback((usuario: Usuario) => {
    updateStoredUser(usuario)
    setUserState(usuario)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      isAdmin: user?.tipo === TipoUsuario.ADMIN,
      isCliente: user?.tipo === TipoUsuario.CLIENTE,
      login,
      logout,
      setUser,
    }),
    [user, token, ready, login, logout, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
