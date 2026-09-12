const server = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
export const API_SERVER = server
export const API_BASE = `${server}/api/v1`

export const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login`,
    recuperarSenha: `${API_BASE}/auth/recuperar-senha`,
    verificarCodigo: `${API_BASE}/auth/verificar-codigo`,
    redefinirSenha: `${API_BASE}/auth/redefinir-senha`,
  },
  usuarios: {
    list: `${API_BASE}/usuarios`,
    novo: `${API_BASE}/usuarios/novo`,
    alterar: `${API_BASE}/usuarios/alterar-dados`,
    apagar: `${API_BASE}/usuarios/apagar`,
  },
  clientes: {
    list: `${API_BASE}/clientes`,
    novo: `${API_BASE}/clientes/novo`,
    alterar: `${API_BASE}/clientes/alterar-dados`,
    apagar: `${API_BASE}/clientes/apagar`,
  },
  sites: {
    list: `${API_BASE}/sites`,
    novo: `${API_BASE}/sites/novo`,
    alterar: `${API_BASE}/sites/alterar-dados`,
    apagar: `${API_BASE}/sites/apagar`,
  },
  biolinks: {
    list: `${API_BASE}/biolinks`,
    novo: `${API_BASE}/biolinks/novo`,
    alterar: `${API_BASE}/biolinks/alterar-dados`,
    apagar: `${API_BASE}/biolinks/apagar`,
    itens: `${API_BASE}/biolinks/itens`,
    itensNovo: `${API_BASE}/biolinks/itens/novo`,
    itensAlterar: `${API_BASE}/biolinks/itens/alterar-dados`,
    itensApagar: `${API_BASE}/biolinks/itens/apagar`,
    itensReordenar: `${API_BASE}/biolinks/itens/reordenar`,
  },
  aplicativosMobile: {
    list: `${API_BASE}/aplicativos-mobile`,
    novo: `${API_BASE}/aplicativos-mobile/novo`,
    alterar: `${API_BASE}/aplicativos-mobile/alterar-dados`,
    apagar: `${API_BASE}/aplicativos-mobile/apagar`,
    documento: `${API_BASE}/aplicativos-mobile/documento-requisitos`,
  },
  dashboard: {
    inicio: `${API_BASE}/dashboard/inicio`,
  },
  financeiro: {
    dashboard: `${API_BASE}/financeiro/dashboard`,
  },
  pagamentos: {
    list: `${API_BASE}/pagamentos`,
    pix: `${API_BASE}/pagamentos/pix`,
    cartao: `${API_BASE}/pagamentos/cartao`,
    ultimos: `${API_BASE}/pagamentos/ultimos`,
    historico: `${API_BASE}/pagamentos/historico`,
    byId: (id: number) => `${API_BASE}/pagamentos/${id}`,
    status: (id: number) => `${API_BASE}/pagamentos/status/${id}`,
    cancelar: (id: number) => `${API_BASE}/pagamentos/${id}/cancelar`,
    estornar: (id: number) => `${API_BASE}/pagamentos/${id}/estornar`,
  },
  assinaturas: {
    list: `${API_BASE}/assinaturas`,
    byId: (id: number) => `${API_BASE}/assinaturas/${id}`,
  },
  projetos: {
    list: `${API_BASE}/projetos`,
    novo: `${API_BASE}/projetos/novo`,
    alterar: `${API_BASE}/projetos/alterar-dados`,
    alterarEtapa: `${API_BASE}/projetos/alterar-etapa`,
    apagar: `${API_BASE}/projetos/apagar`,
  },
  planos: {
    list: `${API_BASE}/planos`,
    novo: `${API_BASE}/planos/novo`,
    alterar: `${API_BASE}/planos/alterar-dados`,
    apagar: `${API_BASE}/planos/apagar`,
  },
  landingPages: {
    list: `${API_BASE}/landing-pages`,
    novo: `${API_BASE}/landing-pages/novo`,
    alterar: `${API_BASE}/landing-pages/alterar-dados`,
    apagar: `${API_BASE}/landing-pages/apagar`,
    formularios: `${API_BASE}/landing-pages/formularios`,
    formulariosNovo: `${API_BASE}/landing-pages/formularios/novo`,
    formulariosAlterar: `${API_BASE}/landing-pages/formularios/alterar-dados`,
    formulariosApagar: `${API_BASE}/landing-pages/formularios/apagar`,
    campos: `${API_BASE}/landing-pages/campos`,
    camposNovo: `${API_BASE}/landing-pages/campos/novo`,
    camposAlterar: `${API_BASE}/landing-pages/campos/alterar-dados`,
    camposApagar: `${API_BASE}/landing-pages/campos/apagar`,
    leads: `${API_BASE}/landing-pages/leads`,
    leadsStatus: `${API_BASE}/landing-pages/leads/alterar-status`,
    leadsApagar: `${API_BASE}/landing-pages/leads/apagar`,
  },
}
