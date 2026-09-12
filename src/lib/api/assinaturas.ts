import type { Assinatura, PageResponse } from '@/types/models'
import type { CicloAssinatura, StatusAssinatura } from '@/types/enums'
import { deleteJson, getJson, postJson, putJson, qs } from './client'
import { endpoints } from './endpoints'

export function listarAssinaturas(params: {
  status?: StatusAssinatura
  page?: number
  size?: number
}) {
  return getJson<PageResponse<Assinatura>>(endpoints.assinaturas.list + qs(params))
}

export function obterAssinatura(id: number) {
  return getJson<Assinatura>(endpoints.assinaturas.byId(id))
}

export function criarAssinatura(dados: {
  cliente_id?: number
  site_id?: number
  aplicativo_mobile_id?: number
  plano_id?: number
  valor: number
  descricao: string
  ciclo: CicloAssinatura
  proxima_cobranca: string
  external_reference?: string
}) {
  return postJson<Assinatura>(endpoints.assinaturas.list, dados)
}

export function atualizarAssinatura(
  id: number,
  dados: {
    valor?: number
    descricao?: string
    ciclo?: CicloAssinatura
    proxima_cobranca?: string
    external_reference?: string
  },
) {
  return putJson<Assinatura>(endpoints.assinaturas.byId(id), dados)
}

export function cancelarAssinatura(id: number) {
  return deleteJson<Assinatura>(endpoints.assinaturas.byId(id))
}
