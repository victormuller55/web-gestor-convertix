export function stripUrlProtocol(value: string) {
  return value.trim().replace(/^https?:\/\//i, '')
}

export function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '—') return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function dominioParaApi(value: string) {
  return stripUrlProtocol(value)
}

export function urlPublicaSite(dominio?: string | null, subdominio?: string | null) {
  const d = dominioParaApi(dominio ?? '')
  const s = (subdominio ?? '').trim()
  if (d && s) {
    const host = d.toLowerCase()
    const sub = s.toLowerCase()
    if (host === sub || host.startsWith(`${sub}.`)) return d
    return `${s}.${d}`
  }
  if (d) return d
  if (s) return s
  return null
}

export function fotoUrl(path?: string | null) {
  if (!path?.trim()) return ''
  if (/^https?:\/\//i.test(path)) return path
  const server = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
  return `${server}${path.startsWith('/') ? path : `/${path}`}`
}
