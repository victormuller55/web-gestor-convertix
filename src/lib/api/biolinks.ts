import type { BioLink, BioLinkItem, PageResponse } from '@/types/models'
import type { BioLinkItemIcone } from '@/types/enums'
import { deleteJson, getJson, postJson, postMultipart, putJson, putMultipart, qs } from './client'
import { endpoints } from './endpoints'

export function listarBioLinks(params: { id?: number; page?: number; size?: number }) {
  return getJson<PageResponse<BioLink>>(endpoints.biolinks.list + qs(params))
}

export function criarBioLink(
  dados: { site_id: number; nome_usuario: string; descricao?: string },
  foto?: File | null,
) {
  return postMultipart<BioLink>(endpoints.biolinks.novo, dados, foto)
}

export function alterarBioLink(
  id: number,
  dados: { site_id: number; nome_usuario: string; descricao?: string },
  foto?: File | null,
) {
  return putMultipart<BioLink>(endpoints.biolinks.alterar + qs({ id }), dados, foto)
}

export function apagarBioLink(id: number) {
  return deleteJson<void>(endpoints.biolinks.apagar + qs({ id }))
}

export function listarBioLinkItens(biolinkId: number, id?: number) {
  return getJson<BioLinkItem[] | BioLinkItem>(
    endpoints.biolinks.itens + qs({ biolink_id: biolinkId, id }),
  )
}

export function criarBioLinkItem(dados: {
  titulo: string
  biolink_id: number
  url: string
  icone?: BioLinkItemIcone
  ordem: number
  ativo: boolean
}) {
  return postJson<BioLinkItem>(endpoints.biolinks.itensNovo, dados)
}

export function alterarBioLinkItem(
  biolinkId: number,
  id: number,
  dados: {
    titulo: string
    biolink_id: number
    url: string
    icone?: BioLinkItemIcone
    ordem: number
    ativo: boolean
  },
) {
  return putJson<BioLinkItem>(
    endpoints.biolinks.itensAlterar + qs({ biolink_id: biolinkId, id }),
    dados,
  )
}

export function apagarBioLinkItem(biolinkId: number, id: number) {
  return deleteJson<void>(endpoints.biolinks.itensApagar + qs({ biolink_id: biolinkId, id }))
}

export function reordenarBioLinkItens(biolinkId: number, ids: number[]) {
  return putJson<BioLinkItem[]>(endpoints.biolinks.itensReordenar + qs({ biolink_id: biolinkId }), { ids })
}
