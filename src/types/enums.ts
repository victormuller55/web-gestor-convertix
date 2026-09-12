export const TipoUsuario = {
  ADMIN: 'ADMIN',
  CLIENTE: 'CLIENTE',
} as const
export type TipoUsuario = (typeof TipoUsuario)[keyof typeof TipoUsuario]

export const TipoSite = {
  BIOLINK: 'BIOLINK',
  LANDING_PAGE: 'LANDING_PAGE',
  SITE_COMERCIAL: 'SITE_COMERCIAL',
} as const
export type TipoSite = (typeof TipoSite)[keyof typeof TipoSite]

export const TipoProdutoCobranca = {
  ...TipoSite,
  APLICATIVO_MOBILE: 'APLICATIVO_MOBILE',
} as const
export type TipoProdutoCobranca = (typeof TipoProdutoCobranca)[keyof typeof TipoProdutoCobranca]

export const TipoProdutoDashboard = {
  TODOS: 'TODOS',
  ...TipoProdutoCobranca,
} as const
export type TipoProdutoDashboard = (typeof TipoProdutoDashboard)[keyof typeof TipoProdutoDashboard]

export const StatusSite = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  EM_DESENVOLVIMENTO: 'EM_DESENVOLVIMENTO',
} as const
export type StatusSite = (typeof StatusSite)[keyof typeof StatusSite]

export const StatusPagamento = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const
export type StatusPagamento = (typeof StatusPagamento)[keyof typeof StatusPagamento]

export const FormaPagamento = {
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  BOLETO: 'BOLETO',
} as const
export type FormaPagamento = (typeof FormaPagamento)[keyof typeof FormaPagamento]

export const CicloAssinatura = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  BIMONTHLY: 'BIMONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMIANNUALLY: 'SEMIANNUALLY',
  YEARLY: 'YEARLY',
} as const
export type CicloAssinatura = (typeof CicloAssinatura)[keyof typeof CicloAssinatura]

export const StatusAssinatura = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
} as const
export type StatusAssinatura = (typeof StatusAssinatura)[keyof typeof StatusAssinatura]

export const SituacaoAssinaturaSite = {
  EM_DIA: 'EM_DIA',
  VENCIDO: 'VENCIDO',
  DESATIVADO: 'DESATIVADO',
} as const
export type SituacaoAssinaturaSite =
  (typeof SituacaoAssinaturaSite)[keyof typeof SituacaoAssinaturaSite]

export const StatusAplicativoMobile = {
  DESENVOLVIMENTO: 'DESENVOLVIMENTO',
  HOMOLOGACAO: 'HOMOLOGACAO',
  PRODUCAO: 'PRODUCAO',
  PAUSADO: 'PAUSADO',
  ENCERRADO: 'ENCERRADO',
} as const
export type StatusAplicativoMobile =
  (typeof StatusAplicativoMobile)[keyof typeof StatusAplicativoMobile]

export const TipoProjeto = {
  BIOLINK: 'BIOLINK',
  LANDING_PAGE: 'LANDING_PAGE',
  SITE_COMERCIAL: 'SITE_COMERCIAL',
  APLICATIVO_MOBILE: 'APLICATIVO_MOBILE',
  OUTRO: 'OUTRO',
} as const
export type TipoProjeto = (typeof TipoProjeto)[keyof typeof TipoProjeto]

export const EtapaProjeto = {
  BRIEFING: 'BRIEFING',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  HOMOLOGACAO: 'HOMOLOGACAO',
  CONCLUIDO: 'CONCLUIDO',
  PAUSADO: 'PAUSADO',
  CANCELADO: 'CANCELADO',
} as const
export type EtapaProjeto = (typeof EtapaProjeto)[keyof typeof EtapaProjeto]

export const ETAPAS_PROJETO = [
  EtapaProjeto.BRIEFING,
  EtapaProjeto.EM_ANDAMENTO,
  EtapaProjeto.HOMOLOGACAO,
  EtapaProjeto.CONCLUIDO,
  EtapaProjeto.PAUSADO,
  EtapaProjeto.CANCELADO,
] as const

export const VinculoPlano = {
  SITE: 'SITE',
  APLICATIVO: 'APLICATIVO',
  NENHUM: 'NENHUM',
} as const
export type VinculoPlano = (typeof VinculoPlano)[keyof typeof VinculoPlano]

export const TipoLandingPageCampo = {
  TEXT: 'TEXT',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  NUMBER: 'NUMBER',
  TEXTAREA: 'TEXTAREA',
  SELECT: 'SELECT',
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
  DATE: 'DATE',
} as const
export type TipoLandingPageCampo = (typeof TipoLandingPageCampo)[keyof typeof TipoLandingPageCampo]

export const StatusLandingPageLead = {
  NOVO: 'NOVO',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  NEGOCIANDO: 'NEGOCIANDO',
  CONVERTIDO: 'CONVERTIDO',
  PERDIDO: 'PERDIDO',
} as const
export type StatusLandingPageLead =
  (typeof StatusLandingPageLead)[keyof typeof StatusLandingPageLead]

export const BioLinkItemIcone = {
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  YOUTUBE: 'YOUTUBE',
  FACEBOOK: 'FACEBOOK',
  LINKEDIN: 'LINKEDIN',
  X: 'X',
  TELEGRAM: 'TELEGRAM',
  DISCORD: 'DISCORD',
  SPOTIFY: 'SPOTIFY',
  PINTEREST: 'PINTEREST',
  THREADS: 'THREADS',
  SNAPCHAT: 'SNAPCHAT',
  TWITCH: 'TWITCH',
  GITHUB: 'GITHUB',
  BEHANCE: 'BEHANCE',
  DRIBBBLE: 'DRIBBBLE',
  MEDIUM: 'MEDIUM',
  SUBSTACK: 'SUBSTACK',
  GOOGLE_MAPS: 'GOOGLE_MAPS',
  OUTROS: 'OUTROS',
} as const
export type BioLinkItemIcone = (typeof BioLinkItemIcone)[keyof typeof BioLinkItemIcone]

export function isPagamentoPago(status?: StatusPagamento | null) {
  return status === StatusPagamento.RECEIVED || status === StatusPagamento.CONFIRMED
}

export function podeCancelarPagamento(status?: StatusPagamento | null) {
  return status === StatusPagamento.PENDING
}

export function podeEstornarPagamento(status?: StatusPagamento | null) {
  return isPagamentoPago(status)
}
