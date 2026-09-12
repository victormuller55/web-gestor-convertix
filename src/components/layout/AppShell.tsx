import { useEffect, useRef, useState } from 'react'
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
  '/projetos': 'Projetos',
  '/biolinks': 'BioLinks',
  '/biolink': 'BioLink',
  '/financeiro': 'Financeiro',
  '/pagamentos': 'Pagamentos',
  '/assinaturas': 'Assinaturas',
  '/planos': 'Planos',
  '/landing-pages': 'Landing Pages',
  '/leads': 'Leads',
  '/perfil': 'Perfil',
}

const SIDEBAR_KEY = 'convertix.sidebar-collapsed'

export function AppShell() {
  const [open, setOpen] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [peek, setPeek] = useState(false)
  const leaveTimer = useRef<number>(0)
  const location = useLocation()
  const { user } = useAuth()
  const title = titles[location.pathname] ?? 'Convertix'
  const rail = collapsed && !peek

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

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

  function toggleCollapsed() {
    window.clearTimeout(leaveTimer.current)
    if (collapsed) {
      setCollapsed(false)
      setPeek(false)
      return
    }
    setCollapsed(true)
    setPeek(false)
  }

  function enterRail() {
    if (!collapsed) return
    window.clearTimeout(leaveTimer.current)
    setPeek(true)
  }

  function leaveRail() {
    if (!collapsed) return
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => setPeek(false), 180)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-card">
      <div className={cn('relative hidden h-dvh shrink-0 lg:block', collapsed ? 'w-20' : 'w-[260px]')}>
        <div
          className={cn(
            'h-full transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            collapsed && peek
              ? 'absolute inset-y-0 left-0 z-30 w-[260px] shadow-2xl'
              : 'w-full',
          )}
          onMouseEnter={enterRail}
          onMouseLeave={leaveRail}
        >
          <Sidebar
            collapsed={rail}
            collapsible
            onToggleCollapse={toggleCollapsed}
            onNavigate={() => {
              if (collapsed) setPeek(false)
            }}
          />
        </div>
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

      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <div key={location.pathname} className="page-enter flex h-full min-h-0 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
