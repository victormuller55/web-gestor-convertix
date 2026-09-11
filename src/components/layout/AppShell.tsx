import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/cn'

const titles: Record<string, string> = {
  '/': 'Painel',
  '/usuarios': 'Usuários',
  '/clientes': 'Clientes',
  '/sites': 'Sites',
  '/aplicativos-mobile': 'Aplicativos Mobile',
  '/biolinks': 'BioLinks',
  '/biolink': 'BioLink',
  '/financeiro': 'Financeiro',
  '/pagamentos': 'Pagamentos',
  '/assinaturas': 'Assinaturas',
  '/perfil': 'Perfil',
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const title = titles[location.pathname] ?? 'Convertix'

  function openDrawer() {
    setOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerVisible(true))
    })
  }

  function closeDrawer() {
    setDrawerVisible(false)
    window.setTimeout(() => setOpen(false), 260)
  }

  return (
    <div className="h-dvh overflow-hidden bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden h-dvh lg:block">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className={cn('modal-backdrop absolute inset-0', drawerVisible && 'is-open')}
            onClick={closeDrawer}
          />
          <div
            className={cn(
              'drawer-panel relative h-full w-[280px] shadow-2xl',
              drawerVisible && 'is-open',
            )}
          >
            <Sidebar onNavigate={closeDrawer} />
          </div>
        </div>
      )}

      <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-line bg-card/90 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur md:px-6 md:pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="ui-press grid size-11 place-items-center rounded-xl border border-line bg-card lg:hidden"
              onClick={openDrawer}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div key={location.pathname} className="page-title-anim">
              <p className="text-[11px] text-muted">Olá, {user?.nome?.split(' ')[0]}</p>
              <p className="text-sm font-medium text-ink">{title}</p>
            </div>
          </div>
          <span className="rounded-full border border-line bg-card px-2.5 py-0.5 text-[11px] font-semibold text-muted">
            {user?.tipo === 'ADMIN' ? 'Admin' : 'Cliente'}
          </span>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6">
          <div key={location.pathname} className="page-enter flex h-full min-h-0 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
