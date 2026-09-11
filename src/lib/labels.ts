import {
  BioLinkItemIcone,
  CicloAssinatura,
  FormaPagamento,
  SituacaoAssinaturaSite,
  StatusAplicativoMobile,
  StatusAssinatura,
  StatusPagamento,
  StatusSite,
  TipoSite,
  TipoUsuario,
} from '@/types/enums'

export const TIPO_USUARIO_LABEL: Record<TipoUsuario, string> = {
  ADMIN: 'Administrador',
  CLIENTE: 'Cliente',
}

export const TIPO_SITE_LABEL: Record<TipoSite, string> = {
  BIOLINK: 'BioLink',
  LANDING_PAGE: 'Landing Page',
  SITE_COMERCIAL: 'Site comercial',
}

export const STATUS_SITE_LABEL: Record<StatusSite, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  EM_DESENVOLVIMENTO: 'Em desenvolvimento',
}

export const STATUS_APLICATIVO_MOBILE_LABEL: Record<StatusAplicativoMobile, string> = {
  DESENVOLVIMENTO: 'Desenvolvimento',
  HOMOLOGACAO: 'Homologação',
  PRODUCAO: 'Produção',
  PAUSADO: 'Pausado',
  ENCERRADO: 'Encerrado',
}

export const STATUS_PAGAMENTO_LABEL: Record<StatusPagamento, string> = {
  PENDING: 'Pendente',
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  CANCELLED: 'Cancelado',
  FAILED: 'Falhou',
  DELETED: 'Excluído',
}

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão',
  BOLETO: 'Boleto',
}

export const CICLO_LABEL: Record<CicloAssinatura, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUALLY: 'Semestral',
  YEARLY: 'Anual',
}

export const STATUS_ASSINATURA_LABEL: Record<StatusAssinatura, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  EXPIRED: 'Expirada',
}

export const SITUACAO_ASSINATURA_LABEL: Record<SituacaoAssinaturaSite, string> = {
  EM_DIA: 'Em dia',
  VENCIDO: 'Vencido',
  DESATIVADO: 'Desativado',
}

export const ICONE_BIOLINK_LABEL: Record<BioLinkItemIcone, string> = {
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  X: 'X',
  TELEGRAM: 'Telegram',
  DISCORD: 'Discord',
  SPOTIFY: 'Spotify',
  PINTEREST: 'Pinterest',
  THREADS: 'Threads',
  SNAPCHAT: 'Snapchat',
  TWITCH: 'Twitch',
  GITHUB: 'GitHub',
  BEHANCE: 'Behance',
  DRIBBBLE: 'Dribbble',
  MEDIUM: 'Medium',
  SUBSTACK: 'Substack',
  GOOGLE_MAPS: 'Google Maps',
  OUTROS: 'Outros',
}

export function enumLabel<T extends string>(map: Record<T, string>, value?: T | null) {
  if (!value) return '—'
  return map[value] ?? value
}
