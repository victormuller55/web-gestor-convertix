import type { Usuario } from '@/types/models'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'usuario_logado'
const EXPIRES_KEY = 'auth_expires_at'
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export function saveSession(usuario: Usuario, token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + TOKEN_TTL_MS))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EXPIRES_KEY)
}

export function getToken() {
  if (isSessionExpired()) {
    clearSession()
    return null
  }
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): Usuario | null {
  if (isSessionExpired()) {
    clearSession()
    return null
  }
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

export function isSessionExpired() {
  const expires = Number(localStorage.getItem(EXPIRES_KEY) ?? 0)
  return Boolean(expires) && Date.now() > expires
}

export function updateStoredUser(usuario: Usuario) {
  const token = getToken()
  if (!token) return
  saveSession(usuario, token)
}
