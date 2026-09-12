import type { PageResponse, Usuario } from '@/types/models'
import { deleteJson, getJson, postMultipart, putMultipart, qs } from './client'
import { endpoints } from './endpoints'

export function listarUsuarios(params: {
  query?: string
  page?: number
  size?: number
  ativo?: boolean
  tipo?: string
  id?: number
}) {
  return getJson<PageResponse<Usuario>>(endpoints.usuarios.list + qs(params))
}

export function criarUsuario(
  dados: { nome: string; email: string; senha: string; ativo: boolean },
  foto?: File | null,
) {
  return postMultipart<Usuario>(endpoints.usuarios.novo, dados, foto)
}

export function alterarUsuario(
  id: number,
  dados: { nome: string; email: string; senha?: string; ativo: boolean },
  foto?: File | null,
) {
  return putMultipart<Usuario>(endpoints.usuarios.alterar + qs({ id }), dados, foto)
}

export function apagarUsuario(id: number) {
  return deleteJson<void>(endpoints.usuarios.apagar + qs({ id }))
}
