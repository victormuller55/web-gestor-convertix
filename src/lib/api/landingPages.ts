import type {
  LandingPage,
  LandingPageCampo,
  LandingPageFormulario,
  LandingPageLead,
  PageResponse,
} from '@/types/models'
import type { StatusLandingPageLead, TipoLandingPageCampo } from '@/types/enums'
import { deleteJson, getJson, postJson, putJson, qs } from './client'
import { endpoints } from './endpoints'

export function listarLandingPages(params: { query?: string; page?: number; size?: number; id?: number }) {
  return getJson<PageResponse<LandingPage>>(endpoints.landingPages.list + qs(params))
}

export function criarLandingPage(dados: { site_id: number; slug: string }) {
  return postJson<LandingPage>(endpoints.landingPages.novo, dados)
}

export function alterarLandingPage(id: number, dados: { site_id: number; slug: string }) {
  return putJson<LandingPage>(endpoints.landingPages.alterar + qs({ id }), dados)
}

export function apagarLandingPage(id: number) {
  return deleteJson<void>(endpoints.landingPages.apagar + qs({ id }))
}

export function listarFormularios(landingPageId: number) {
  return getJson<LandingPageFormulario[]>(
    endpoints.landingPages.formularios + qs({ landing_page_id: landingPageId }),
  )
}

export function criarFormulario(
  landingPageId: number,
  dados: {
    nome: string
    titulo: string
    descricao?: string
    texto_botao: string
    ativo: boolean
  },
) {
  return postJson<LandingPageFormulario>(
    endpoints.landingPages.formulariosNovo + qs({ landing_page_id: landingPageId }),
    dados,
  )
}

export function alterarFormulario(
  landingPageId: number,
  id: number,
  dados: {
    nome: string
    titulo: string
    descricao?: string
    texto_botao: string
    ativo: boolean
  },
) {
  return putJson<LandingPageFormulario>(
    endpoints.landingPages.formulariosAlterar + qs({ landing_page_id: landingPageId, id }),
    dados,
  )
}

export function apagarFormulario(landingPageId: number, id: number) {
  return deleteJson<void>(
    endpoints.landingPages.formulariosApagar + qs({ landing_page_id: landingPageId, id }),
  )
}

export function listarCampos(formularioId: number) {
  return getJson<LandingPageCampo[]>(endpoints.landingPages.campos + qs({ formulario_id: formularioId }))
}

export function criarCampo(
  formularioId: number,
  dados: {
    nome_interno: string
    label: string
    tipo: TipoLandingPageCampo
    placeholder?: string
    obrigatorio: boolean
    ordem: number
    ativo: boolean
  },
) {
  return postJson<LandingPageCampo>(
    endpoints.landingPages.camposNovo + qs({ formulario_id: formularioId }),
    dados,
  )
}

export function alterarCampo(
  id: number,
  dados: {
    nome_interno: string
    label: string
    tipo: TipoLandingPageCampo
    placeholder?: string
    obrigatorio: boolean
    ordem: number
    ativo: boolean
  },
) {
  return putJson<LandingPageCampo>(endpoints.landingPages.camposAlterar + qs({ id }), dados)
}

export function apagarCampo(id: number) {
  return deleteJson<void>(endpoints.landingPages.camposApagar + qs({ id }))
}

export function listarLeads(params: {
  landing_page_id?: number
  status?: StatusLandingPageLead
  query?: string
  page?: number
  size?: number
}) {
  return getJson<PageResponse<LandingPageLead>>(endpoints.landingPages.leads + qs(params))
}

export function obterLead(landingPageId: number, id: number) {
  return getJson<LandingPageLead>(
    endpoints.landingPages.leads + qs({ landing_page_id: landingPageId, id }),
  )
}

export function alterarStatusLead(
  landingPageId: number,
  id: number,
  dados: { status: StatusLandingPageLead; observacao?: string },
) {
  return putJson<LandingPageLead>(
    endpoints.landingPages.leadsStatus + qs({ landing_page_id: landingPageId, id }),
    dados,
  )
}

export function apagarLead(landingPageId: number, id: number) {
  return deleteJson<void>(endpoints.landingPages.leadsApagar + qs({ landing_page_id: landingPageId, id }))
}
