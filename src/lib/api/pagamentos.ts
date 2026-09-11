import type { PageResponse, Pagamento, PagamentoResumo } from '@/types/models'
import type { FormaPagamento, StatusPagamento } from '@/types/enums'
import { getJson, postJson, qs } from './client'
import { endpoints } from './endpoints'

export function listarPagamentos(params: {
  status?: StatusPagamento | StatusPagamento[]
  forma_pagamento?: FormaPagamento
  data_inicio?: string
  data_fim?: string
  page?: number
  size?: number
}) {
  return getJson<PageResponse<Pagamento>>(endpoints.pagamentos.list + qs(params))
}

export function historicoPagamentos(params: { page?: number; size?: number } = {}) {
  return getJson<PageResponse<Pagamento>>(endpoints.pagamentos.historico + qs(params))
}

export function obterPagamento(id: number) {
  return getJson<Pagamento>(endpoints.pagamentos.byId(id))
}

export function sincronizarPagamento(id: number) {
  return getJson<Pagamento>(endpoints.pagamentos.status(id))
}

export function criarPagamento(dados: {
  cliente_id?: number
  site_id?: number
  valor: number
  descricao: string
  data_vencimento?: string
  external_reference?: string
}) {
  return postJson<Pagamento>(endpoints.pagamentos.list, dados)
}

export function criarPagamentoPix(dados: {
  cliente_id?: number
  site_id?: number
  valor: number
  descricao: string
  data_vencimento?: string
  external_reference?: string
}) {
  return postJson<Pagamento>(endpoints.pagamentos.pix, dados)
}

export function criarPagamentoCartao(dados: {
  cliente_id?: number
  site_id?: number
  valor: number
  descricao: string
  data_vencimento?: string
  external_reference?: string
  parcelas?: number
}) {
  return postJson<Pagamento>(endpoints.pagamentos.cartao, dados)
}

export function cancelarPagamento(id: number) {
  return postJson<Pagamento>(endpoints.pagamentos.cancelar(id), {})
}

export function estornarPagamento(id: number, dados?: { valor?: number; descricao?: string }) {
  return postJson<Pagamento>(endpoints.pagamentos.estornar(id), dados ?? {})
}

export function ultimosPagamentos() {
  return getJson<PagamentoResumo[]>(endpoints.pagamentos.ultimos)
}
