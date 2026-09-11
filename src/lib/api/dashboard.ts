import type { DashboardInicio } from '@/types/dashboard'
import type { FinanceiroDashboard } from '@/types/models'
import { getJson, qs } from './client'
import { endpoints } from './endpoints'

export function obterDashboardInicio(params?: {
  meses?: number
  tipo_produto?: string
  limite_atividades?: number
  limite_alertas?: number
  limite_tops?: number
}) {
  return getJson<DashboardInicio>(endpoints.dashboard.inicio + qs(params ?? {}))
}

export function obterFinanceiroDashboard() {
  return getJson<FinanceiroDashboard>(endpoints.financeiro.dashboard)
}
