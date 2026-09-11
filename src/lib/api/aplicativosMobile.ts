import type { PageResponse, AplicativoMobile } from '@/types/models'
import type { StatusAplicativoMobile } from '@/types/enums'
import { deleteJson, getJson, postJson, postMultipartField, putJson, qs } from './client'
import { endpoints } from './endpoints'

export interface AplicativoMobilePayload {
  cliente_id: number
  nome: string
  descricao?: string
  status: StatusAplicativoMobile
  package_android?: string
  bundle_id_ios?: string
  versao_android?: string
  versao_ios?: string
  url_android?: string
  url_ios?: string
  icone_url?: string
}

export function listarAplicativosMobile(params: {
  query?: string
  page?: number
  size?: number
  id?: number
  cliente_id?: number
  status?: StatusAplicativoMobile
}) {
  return getJson<PageResponse<AplicativoMobile>>(endpoints.aplicativosMobile.list + qs(params))
}

export function criarAplicativoMobile(dados: AplicativoMobilePayload) {
  return postJson<AplicativoMobile>(endpoints.aplicativosMobile.novo, dados)
}

export function alterarAplicativoMobile(id: number, dados: AplicativoMobilePayload) {
  return putJson<AplicativoMobile>(endpoints.aplicativosMobile.alterar + qs({ id }), dados)
}

export function apagarAplicativoMobile(id: number) {
  return deleteJson<void>(endpoints.aplicativosMobile.apagar + qs({ id }))
}

export function enviarDocumentoAplicativoMobile(id: number, arquivo: File) {
  return postMultipartField<AplicativoMobile>(
    endpoints.aplicativosMobile.documento + qs({ id }),
    'documento',
    arquivo,
  )
}

export function removerDocumentoAplicativoMobile(id: number) {
  return deleteJson<AplicativoMobile>(endpoints.aplicativosMobile.documento + qs({ id }))
}
