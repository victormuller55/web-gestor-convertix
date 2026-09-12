import type { PageResponse, Plano } from '@/types/models'
import type { TipoProjeto } from '@/types/enums'
import { deleteJson, getJson, postJson, putJson, qs } from './client'
import { endpoints } from './endpoints'

export interface PlanoPayload {
  codigo?: string
  nome: string
  tipo: TipoProjeto
  vinculo: Plano['vinculo']
  valor?: number
  valor_livre: boolean
  ciclo: Plano['ciclo']
  descricao_padrao?: string
  ativo: boolean
  ordem?: number
}

export function listarPlanos(params: {
  query?: string
  page?: number
  size?: number
  tipo?: TipoProjeto
  ativo?: boolean
}) {
  return getJson<PageResponse<Plano>>(endpoints.planos.list + qs(params))
}

export function criarPlano(dados: PlanoPayload) {
  return postJson<Plano>(endpoints.planos.novo, dados)
}

export function alterarPlano(id: number, dados: PlanoPayload) {
  return putJson<Plano>(endpoints.planos.alterar + qs({ id }), dados)
}

export function apagarPlano(id: number) {
  return deleteJson<void>(endpoints.planos.apagar + qs({ id }))
}
