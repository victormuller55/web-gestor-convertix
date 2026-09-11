import { getToken, clearSession } from '@/lib/auth/storage'
import type { ErrorResponse } from '@/types/models'

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function handleUnauthorized(url: string) {
  if (url.includes('/auth/')) return
  clearSession()
  unauthorizedHandler?.()
}

async function parseError(response: Response) {
  let payload: ErrorResponse | null = null
  try {
    payload = (await response.json()) as ErrorResponse
  } catch {
    payload = null
  }
  const message =
    payload?.message ||
    (response.status === 429
      ? 'Muitas tentativas. Aguarde um momento e tente novamente.'
      : `Erro ${response.status}`)
  return new ApiError(message, response.status, payload?.errors)
}

function authHeaders(extra?: HeadersInit, json = true): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request<T>(url: string, init: RequestInit, json = true): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: authHeaders(init.headers, json),
  })

  if (response.status === 401) {
    handleUnauthorized(url)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 201 || response.headers.get('content-type')?.includes('json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export function getJson<T>(url: string) {
  return request<T>(url, { method: 'GET' })
}

export function postJson<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function putJson<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function deleteJson<T>(url: string) {
  return request<T>(url, { method: 'DELETE' })
}

function appendDados(form: FormData, dados: unknown, file?: File | null) {
  form.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }))
  if (file) form.append('foto', file)
}

export function postMultipart<T>(url: string, dados: unknown, file?: File | null) {
  const form = new FormData()
  appendDados(form, dados, file)
  return request<T>(url, { method: 'POST', body: form }, false)
}

export function putMultipart<T>(url: string, dados: unknown, file?: File | null) {
  const form = new FormData()
  appendDados(form, dados, file)
  return request<T>(url, { method: 'PUT', body: form }, false)
}

export function postMultipartField<T>(url: string, field: string, file: File) {
  const form = new FormData()
  form.append(field, file)
  return request<T>(url, { method: 'POST', body: form }, false)
}

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}
