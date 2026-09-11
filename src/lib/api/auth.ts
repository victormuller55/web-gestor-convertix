import { endpoints } from './endpoints'
import { postJson } from './client'
import type { RecuperarSenhaResponse, Usuario } from '@/types/models'

export function login(email: string, senha: string) {
  return postJson<Usuario>(endpoints.auth.login, { email, senha })
}

export function solicitarRecuperacao(email: string) {
  return postJson<RecuperarSenhaResponse>(endpoints.auth.recuperarSenha, { email })
}

export function verificarCodigo(usuarioId: number, codigo: string) {
  return postJson<{ usuario_id: number; valido: boolean; mensagem?: string }>(
    endpoints.auth.verificarCodigo,
    { usuario_id: usuarioId, codigo },
  )
}

export function redefinirSenha(usuarioId: number, codigo: string, novaSenha: string) {
  return postJson<{ usuario_id: number; mensagem?: string }>(endpoints.auth.redefinirSenha, {
    usuario_id: usuarioId,
    codigo,
    nova_senha: novaSenha,
  })
}
