import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { GuestRoute, ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/login/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { SitesPage } from '@/pages/sites/SitesPage'
import { AplicativosMobilePage } from '@/pages/aplicativos-mobile/AplicativosMobilePage'
import { BioLinksPage } from '@/pages/biolinks/BioLinksPage'
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage'
import { PagamentosPage } from '@/pages/pagamentos/PagamentosPage'
import { AssinaturasPage } from '@/pages/assinaturas/AssinaturasPage'
import { ProjetosPage } from '@/pages/projetos/ProjetosPage'
import { PlanosPage } from '@/pages/planos/PlanosPage'
import { LandingPagesPage } from '@/pages/landing-pages/LandingPagesPage'
import { LeadsPage } from '@/pages/leads/LeadsPage'
import { PerfilPage } from '@/pages/perfil/PerfilPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="financeiro" element={<FinanceiroPage />} />
                    <Route path="pagamentos" element={<PagamentosPage />} />
                    <Route path="assinaturas" element={<AssinaturasPage />} />
                    <Route path="biolink" element={<BioLinksPage />} />
                    <Route path="aplicativos-mobile" element={<AplicativosMobilePage />} />
                    <Route path="projetos" element={<ProjetosPage />} />
                    <Route path="landing-pages" element={<LandingPagesPage />} />
                    <Route path="leads" element={<LeadsPage />} />
                    <Route path="perfil" element={<PerfilPage />} />

                    <Route element={<ProtectedRoute adminOnly />}>
                      <Route path="usuarios" element={<UsuariosPage />} />
                      <Route path="clientes" element={<ClientesPage />} />
                      <Route path="sites" element={<SitesPage />} />
                      <Route path="biolinks" element={<BioLinksPage />} />
                      <Route path="planos" element={<PlanosPage />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
