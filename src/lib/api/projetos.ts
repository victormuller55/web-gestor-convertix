import type { PageResponse, Projeto } from '@/types/models'
import type { EtapaProjeto, TipoProjeto } from '@/types/enums'
import { deleteJson, getJson, postJson, putJson, qs } from './client'
import { endpoints } from './endpoints'

export interface ProjetoPayload {
  cliente_id: number
  titulo: string
  tipo: TipoProjeto
  etapa: EtapaProjeto
  site_id?: number
  aplicativo_mobile_id?: number
  prazo?: string
  descricao?: string
  observacao_interna?: string
}

export function listarProjetos(params: {
  query?: string
  page?: number
  size?: number
  id?: number
  cliente_id?: number
  etapa?: EtapaProjeto
  tipo?: TipoProjeto
}) {
  return getJson<PageResponse<Projeto>>(endpoints.projetos.list + qs(params))
}

export function criarProjeto(dados: ProjetoPayload) {
  return postJson<Projeto>(endpoints.projetos.novo, dados)
}

export function alterarProjeto(id: number, dados: ProjetoPayload) {
  return putJson<Projeto>(endpoints.projetos.alterar + qs({ id }), dados)
}

export function alterarEtapaProjeto(id: number, etapa: EtapaProjeto) {
  return putJson<Projeto>(endpoints.projetos.alterarEtapa + qs({ id }), { etapa })
}

export function apagarProjeto(id: number) {
  return deleteJson<void>(endpoints.projetos.apagar + qs({ id }))
}
