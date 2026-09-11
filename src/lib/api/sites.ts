import type { PageResponse, Site, SiteDominio } from '@/types/models'
import type { StatusSite, TipoSite } from '@/types/enums'
import { deleteJson, getJson, postJson, putJson, qs } from './client'
import { endpoints } from './endpoints'

export interface SitePayload {
  cliente_id: number
  nome: string
  tipo: TipoSite
  dominio?: string
  subdominio?: string
  status: StatusSite
  dominio_info?: SiteDominio | null
}

export function listarSites(params: { query?: string; page?: number; size?: number; id?: number }) {
  return getJson<PageResponse<Site>>(endpoints.sites.list + qs(params))
}

export function criarSite(dados: SitePayload) {
  return postJson<Site>(endpoints.sites.novo, dados)
}

export function alterarSite(id: number, dados: SitePayload) {
  return putJson<Site>(endpoints.sites.alterar + qs({ id }), dados)
}

export function apagarSite(id: number) {
  return deleteJson<void>(endpoints.sites.apagar + qs({ id }))
}
