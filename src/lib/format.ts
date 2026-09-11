export function formatMoney(value?: number | null) {
  const n = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(n) ? n : 0)
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = parseDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = parseDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(1)}%`
}

export function parseDate(value: string) {
  const raw = value.trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function toIsoDate(value: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = parseDate(value)
  if (!parsed) return ''
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso() {
  return toIsoDateFromLocal(new Date())
}

export function startOfMonthIso(date = new Date()) {
  return toIsoDateFromLocal(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonthIso(date = new Date()) {
  return toIsoDateFromLocal(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

function toIsoDateFromLocal(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function plusDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function maskDocumento(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

/** Formata CPF/CNPJ para exibição; retorna "—" se vazio. */
export function formatDocumento(value?: string | number | null) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'
  return maskDocumento(raw) || '—'
}

/** Formata telefone para exibição; retorna "—" se vazio. */
export function formatTelefone(value?: string | number | null) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'
  return maskTelefone(raw) || '—'
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

/** Máscara de digitação em reais (centavos da direita): "500" → "R$ 5,00". */
export function maskCurrency(value: string) {
  const digits = onlyDigits(value).replace(/^0+/, '').slice(0, 11)
  if (!digits) return ''
  return formatMoney(Number(digits) / 100)
}

/** Converte valor mascarado ("R$ 1.234,56") para decimal. Vazio → NaN. */
export function parseCurrency(value: string) {
  const digits = onlyDigits(value)
  if (!digits) return Number.NaN
  return Number(digits) / 100
}

/** Hidrata um número da API no campo mascarado. */
export function formatCurrencyInput(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return ''
  return formatMoney(value)
}

export function initials(name?: string | null) {
  if (!name) return 'CV'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'CV'
}

export function formatBytes(bytes?: number | null) {
  const n = Number(bytes ?? 0)
  if (!Number.isFinite(n) || n <= 0) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
