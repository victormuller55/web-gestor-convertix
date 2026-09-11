import { onlyDigits } from './format'

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidPassword(value: string, required = true) {
  if (!value) return !required
  return value.length >= 8
}

function cpfValid(digits: string) {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== Number(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  return rest === Number(digits[10])
}

function cnpjValid(digits: string) {
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false
  const calc = (base: string, factors: number[]) => {
    const total = base.split('').reduce((acc, n, i) => acc + Number(n) * factors[i], 0)
    const rest = total % 11
    return rest < 2 ? 0 : 11 - rest
  }
  const d1 = calc(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calc(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return d1 === Number(digits[12]) && d2 === Number(digits[13])
}

export function isValidDocumento(value: string) {
  const digits = onlyDigits(value)
  if (digits.length === 11) return cpfValid(digits)
  if (digits.length === 14) return cnpjValid(digits)
  return false
}

export function isValidSubdominio(value: string) {
  if (!value) return true
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim().toLowerCase())
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidAndroidPackage(value: string) {
  if (!value) return true
  return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(value.trim())
}

export function isValidIosBundleId(value: string) {
  return isValidAndroidPackage(value)
}

export const PDF_MAX_BYTES = 5 * 1024 * 1024

export function isPdfFile(file: File) {
  const nameOk = file.name.toLowerCase().endsWith('.pdf')
  const typeOk =
    !file.type || file.type === 'application/pdf' || file.type === 'application/x-pdf'
  return nameOk && typeOk
}

export function isValidNomeUsuario(value: string) {
  const v = value.trim()
  return v.length >= 3 && v.length <= 50 && /^[\w.\- @]+$/u.test(v)
}
