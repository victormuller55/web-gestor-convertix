import type {
  CicloAssinatura,
  FormaPagamento,
  SituacaoAssinaturaSite,
  StatusAplicativoMobile,
  StatusAssinatura,
  StatusPagamento,
  StatusSite,
  TipoProdutoCobranca,
  TipoSite,
  TipoUsuario,
  BioLinkItemIcone,
} from './enums'

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

export interface ErrorResponse {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  errors?: Record<string, string>
}

export interface Usuario {
  id: number
  nome: string
  email: string
  tipo: TipoUsuario
  ativo: boolean
  foto?: string | null
  cliente_id?: number | null
  nome_empresa?: string | null
  documento?: string | null
  telefone?: string | null
  token?: string
  created_at?: string
  updated_at?: string
}

export interface Cliente {
  id: number
  nome_empresa: string
  documento?: string | null
  email: string
  telefone?: string | null
  foto?: string | null
  created_at?: string
  updated_at?: string
}

export interface SiteDominio {
  valor_dominio?: number | null
  duracao_dominio?: number | null
  data_compra_dominio?: string | null
  data_fim_dominio?: string | null
  data_renovacao?: string | null
}

export interface Site {
  id: number
  cliente_id: number
  cliente_nome_empresa?: string | null
  nome: string
  tipo: TipoSite
  dominio?: string | null
  subdominio?: string | null
  status: StatusSite
  situacao_assinatura?: SituacaoAssinaturaSite | null
  dominio_info?: SiteDominio | null
  created_at?: string
  updated_at?: string
}

export interface BioLink {
  id: number
  site_id: number
  site_nome?: string | null
  nome_usuario: string
  descricao?: string | null
  foto_perfil?: string | null
  created_at?: string
  updated_at?: string
}

export interface AplicativoMobile {
  id: number
  cliente_id: number
  cliente_nome_empresa?: string | null
  nome: string
  descricao?: string | null
  status: StatusAplicativoMobile
  package_android?: string | null
  bundle_id_ios?: string | null
  versao_android?: string | null
  versao_ios?: string | null
  url_android?: string | null
  url_ios?: string | null
  icone_url?: string | null
  documento_requisitos_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface BioLinkItem {
  id: number
  biolink_id: number
  titulo: string
  url: string
  icone?: BioLinkItemIcone | null
  ordem: number
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface HistoricoStatusPagamento {
  id: number
  status_anterior?: StatusPagamento | null
  status_novo: StatusPagamento
  origem?: string | null
  mensagem?: string | null
  created_at?: string
}

export interface Pagamento {
  id: number
  cliente_id?: number | null
  cliente_nome_empresa?: string | null
  site_id?: number | null
  site_nome?: string | null
  site_tipo?: TipoSite | null
  aplicativo_mobile_id?: number | null
  aplicativo_mobile_nome?: string | null
  produto_nome?: string | null
  produto_tipo?: TipoProdutoCobranca | null
  assinatura_id?: number | null
  asaas_payment_id?: string | null
  valor: number
  descricao: string
  status: StatusPagamento
  forma_pagamento?: FormaPagamento | null
  parcelas?: number | null
  qr_code?: string | null
  codigo_pix?: string | null
  invoice_url?: string | null
  comprovante_url?: string | null
  data_vencimento?: string | null
  data_confirmacao?: string | null
  mensagem_asaas?: string | null
  external_reference?: string | null
  created_at?: string
  updated_at?: string
  historico_status?: HistoricoStatusPagamento[]
}

export interface PagamentoResumo {
  id: number
  valor: number
  descricao: string
  status: StatusPagamento
  forma_pagamento?: FormaPagamento | null
  parcelas?: number | null
  asaas_payment_id?: string | null
  invoice_url?: string | null
  comprovante_url?: string | null
  created_at?: string
  data_confirmacao?: string | null
}

export interface Assinatura {
  id: number
  cliente_id?: number | null
  cliente_nome_empresa?: string | null
  site_id?: number | null
  site_nome?: string | null
  site_tipo?: TipoSite | null
  aplicativo_mobile_id?: number | null
  aplicativo_mobile_nome?: string | null
  asaas_subscription_id?: string | null
  valor: number
  descricao: string
  ciclo: CicloAssinatura
  forma_pagamento?: FormaPagamento | null
  status: StatusAssinatura
  proxima_cobranca?: string | null
  mensagem_asaas?: string | null
  external_reference?: string | null
  created_at?: string
  updated_at?: string
  cobrancas?: Pagamento[]
}

export interface AssinaturaAtivaDashboard {
  id: number
  descricao?: string | null
  valor?: number | null
  ciclo?: CicloAssinatura | null
  ciclo_label?: string | null
  forma_pagamento?: FormaPagamento | null
  cliente_nome?: string | null
  produto_nome?: string | null
  proxima_cobranca?: string | null
  situacao?: SituacaoAssinaturaSite | null
  situacao_label?: string | null
}

export interface FinanceiroDashboard {
  total_pago?: number
  total_pendente?: number
  quantidade_pagamentos?: number
  quantidade_pendentes?: number
  ultimo_pagamento?: PagamentoResumo | null
  proxima_cobranca?: string | null
  assinatura_ativa?: boolean
  valor_assinatura?: number | null
  metodo_pagamento_assinatura?: FormaPagamento | null
  descricao_assinatura?: string | null
  status_ultimo_pagamento?: StatusPagamento | null
  assinaturas_ativas?: AssinaturaAtivaDashboard[]
}

export interface RecuperarSenhaResponse {
  usuario_id: number
  mensagem?: string
  enviado_em?: string
  expira_em?: string
}
