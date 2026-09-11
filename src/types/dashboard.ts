import type {
  CicloAssinatura,
  FormaPagamento,
  StatusAssinatura,
  StatusPagamento,
  StatusSite,
  TipoSite,
  TipoUsuario,
} from './enums'

export interface ContagemChave {
  chave: string
  label?: string
  quantidade: number
}

export interface ContagemValor {
  chave: string
  quantidade: number
  valor?: number
}

export interface PontoReceitaMensal {
  ano: number
  mes: number
  label: string
  valor_pago?: number
  valor_pendente?: number
  quantidade_pagos?: number
  quantidade_pendentes?: number
}

export interface PontoQuantidadeMensal {
  ano: number
  mes: number
  label: string
  quantidade: number
}

export interface DashboardAlerta {
  id: string
  tipo?: string
  severidade?: string
  titulo: string
  mensagem?: string
  entidade?: string
  entidade_id?: number
  cliente_id?: number
  cliente_nome?: string
  data_referencia?: string
  valor?: number
}

export interface DashboardInicio {
  gerado_em?: string
  escopo?: 'ADMIN' | 'CLIENTE' | string
  periodo_meses?: number
  usuario?: {
    id: number
    nome: string
    email: string
    tipo: TipoUsuario
    nome_empresa?: string
    foto?: string
  }
  kpis?: {
    total_sites?: number
    sites_ativos?: number
    sites_inativos?: number
    sites_em_desenvolvimento?: number
    total_biolinks?: number
    sites_biolink?: number
    total_clientes?: number
    total_usuarios?: number
    usuarios_ativos?: number
    assinaturas_ativas?: number
    assinaturas_inativas?: number
    assinaturas_expiradas?: number
    total_pago?: number
    total_pendente?: number
    quantidade_pagamentos?: number
    quantidade_pendentes?: number
    quantidade_vencidos?: number
    ticket_medio_pago?: number
    mrr_estimado?: number
    receita_mes_atual?: number
    receita_mes_anterior?: number
    variacao_receita_percentual?: number
  }
  distribuicoes?: {
    sites_por_status?: ContagemChave[]
    sites_por_tipo?: ContagemChave[]
    pagamentos_por_status?: ContagemValor[]
    pagamentos_por_forma?: ContagemValor[]
    assinaturas_por_status?: ContagemChave[]
    assinaturas_por_ciclo?: ContagemChave[]
  }
  series?: {
    receita_mensal?: PontoReceitaMensal[]
    novos_clientes_mensal?: PontoQuantidadeMensal[]
    novos_sites_mensal?: PontoQuantidadeMensal[]
    novas_assinaturas_mensal?: PontoQuantidadeMensal[]
  }
  funil?: {
    clientes?: number
    clientes_com_site?: number
    clientes_com_assinatura?: number
    clientes_com_pagamento_pago?: number
    taxas?: {
      cliente_para_site?: number
      site_para_assinatura?: number
      assinatura_para_pago?: number
      cliente_para_pago?: number
    }
  }
  alertas?: DashboardAlerta[]
  tops?: {
    clientes_por_receita?: Array<{
      cliente_id: number
      cliente_nome: string
      total_pago?: number
      quantidade_pagamentos?: number
    }>
    sites_recentes?: Array<{
      id: number
      nome: string
      tipo: TipoSite
      status: StatusSite
      cliente_id?: number
      cliente_nome?: string
      created_at?: string
    }>
  }
  assinatura_destaque?: {
    ativa: boolean
    assinatura_id?: number
    descricao?: string
    status?: StatusAssinatura
    valor?: number
    ciclo?: CicloAssinatura
    metodo_pagamento?: FormaPagamento
    proxima_cobranca?: string
    cliente_id?: number
    cliente_nome?: string
  }
  ultimos_pagamentos?: Array<{
    id: number
    valor: number
    descricao: string
    status: StatusPagamento
    forma_pagamento?: FormaPagamento
    parcelas?: number
    asaas_payment_id?: string
    invoice_url?: string
    comprovante_url?: string
    created_at?: string
    data_confirmacao?: string
    cliente_id?: number
    cliente_nome?: string
  }>
  atividades_recentes?: Array<{
    id: string
    tipo?: string
    titulo: string
    descricao?: string
    entidade?: string
    entidade_id?: number
    cliente_id?: number
    cliente_nome?: string
    created_at?: string
  }>
}
