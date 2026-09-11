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

export const PLANOS_ASSINATURA = [
  {
    id: 'biolink',
    titulo: 'BioLink Profissional',
    tipoSite: TipoSite.BIOLINK,
    valorFixo: 30,
    descricaoPadrao: 'Assinatura mensal BioLink Profissional',
    manual: false,
    recurso: 'site',
  },
  {
    id: 'landing_page',
    titulo: 'Landing Page',
    tipoSite: TipoSite.LANDING_PAGE,
    valorFixo: 90,
    descricaoPadrao: 'Assinatura mensal Landing Page',
    manual: false,
    recurso: 'site',
  },
  {
    id: 'site_institucional',
    titulo: 'Site Institucional Completo',
    tipoSite: TipoSite.SITE_COMERCIAL,
    valorFixo: 170,
    descricaoPadrao: 'Assinatura mensal Site Institucional Completo',
    manual: false,
    recurso: 'site',
  },
  {
    id: 'aplicativo_mobile',
    titulo: 'Aplicativo Mobile',
    tipoSite: null,
    valorFixo: null,
    descricaoPadrao: '',
    manual: true,
    recurso: 'aplicativo',
  },
  {
    id: 'outro',
    titulo: 'Outro valor',
    tipoSite: null,
    valorFixo: null,
    descricaoPadrao: '',
    manual: true,
    recurso: 'site',
  },
] as const

export function isPagamentoPago(status?: StatusPagamento | null) {
  return status === StatusPagamento.RECEIVED || status === StatusPagamento.CONFIRMED
}

export function podeCancelarPagamento(status?: StatusPagamento | null) {
  return status === StatusPagamento.PENDING
}

export function podeEstornarPagamento(status?: StatusPagamento | null) {
  return isPagamentoPago(status)
}
