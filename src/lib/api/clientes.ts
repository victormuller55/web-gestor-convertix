import type { Cliente, PageResponse } from '@/types/models'
import { deleteJson, getJson, postMultipart, putMultipart, qs } from './client'
import { endpoints } from './endpoints'

export function listarClientes(params: { query?: string; page?: number; size?: number; id?: number }) {
  return getJson<PageResponse<Cliente>>(endpoints.clientes.list + qs(params))
}

export function criarCliente(
  dados: {
    nome_empresa: string
    documento: string
    email: string
    senha: string
    telefone?: string
  },
  foto?: File | null,
) {
  return postMultipart<Cliente>(endpoints.clientes.novo, dados, foto)
}

export function alterarCliente(
  id: number,
  dados: {
    nome_empresa: string
    documento: string
    email: string
    senha?: string
    telefone?: string
    remover_foto?: boolean
  },
  foto?: File | null,
) {
  return putMultipart<Cliente>(endpoints.clientes.alterar + qs({ id }), dados, foto)
}

export function apagarCliente(id: number) {
  return deleteJson<void>(endpoints.clientes.apagar + qs({ id }))
}
