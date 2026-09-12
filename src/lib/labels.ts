import {
  BioLinkItemIcone,
  CicloAssinatura,
  FormaPagamento,
  SituacaoAssinaturaSite,
  StatusAplicativoMobile,
  StatusAssinatura,
  StatusPagamento,
  StatusSite,
  TipoProdutoCobranca,
  TipoProdutoDashboard,
  TipoSite,
  TipoUsuario,
  TipoProjeto,
  EtapaProjeto,
  VinculoPlano,
  TipoLandingPageCampo,
  StatusLandingPageLead,
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

export const TIPO_PRODUTO_COBRANCA_LABEL: Record<TipoProdutoCobranca, string> = {
  BIOLINK: 'BioLink',
  LANDING_PAGE: 'Landing page',
  SITE_COMERCIAL: 'Site institucional',
  APLICATIVO_MOBILE: 'Aplicativo mobile',
}

export const TIPO_PRODUTO_DASHBOARD_LABEL: Record<TipoProdutoDashboard, string> = {
  TODOS: 'Todos os produtos',
  ...TIPO_PRODUTO_COBRANCA_LABEL,
}

export const TIPO_PROJETO_LABEL: Record<TipoProjeto, string> = {
  ...TIPO_PRODUTO_COBRANCA_LABEL,
  OUTRO: 'Outro',
}

export const ETAPA_PROJETO_LABEL: Record<EtapaProjeto, string> = {
  BRIEFING: 'Briefing',
  EM_ANDAMENTO: 'Em andamento',
  HOMOLOGACAO: 'Homologação',
  CONCLUIDO: 'Concluído',
  PAUSADO: 'Pausado',
  CANCELADO: 'Cancelado',
}

export const VINCULO_PLANO_LABEL: Record<VinculoPlano, string> = {
  SITE: 'Site',
  APLICATIVO: 'Aplicativo',
  NENHUM: 'Nenhum',
}

export const TIPO_LANDING_PAGE_CAMPO_LABEL: Record<TipoLandingPageCampo, string> = {
  TEXT: 'Texto',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  NUMBER: 'Número',
  TEXTAREA: 'Texto longo',
  SELECT: 'Lista',
  CHECKBOX: 'Caixa',
  RADIO: 'Opção',
  DATE: 'Data',
}

export const STATUS_LANDING_PAGE_LEAD_LABEL: Record<StatusLandingPageLead, string> = {
  NOVO: 'Novo',
  EM_ATENDIMENTO: 'Em atendimento',
  NEGOCIANDO: 'Negociando',
  CONVERTIDO: 'Convertido',
  PERDIDO: 'Perdido',
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
