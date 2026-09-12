import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  CreditCard,
  Home,
  Landmark,
  Link2,
  LogOut,
  Menu,
  Moon,
  Receipt,
  RefreshCw,
  Sun,
  Users,
  Building2,
  FolderKanban,
  Globe,
  LayoutPanelLeft,
  Smartphone,
  Tags,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import iconGreen from '@/assets/logos/icon_convertix_green.png'
import iconWhite from '@/assets/logos/icon_convertix_white.png'

type NavEntry = {
  to: string
  label: string
  icon: typeof CreditCard
  end?: boolean
}

const adminNav: NavEntry[] = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/usuarios', label: 'Usuários', icon: Users },
  { to: '/clientes', label: 'Clientes', icon: Building2 },
]

const adminProdutosNav: NavEntry[] = [
  { to: '/sites', label: 'Sites', icon: Globe },
  { to: '/aplicativos-mobile', label: 'Aplicativos Mobile', icon: Smartphone },
  { to: '/biolinks', label: 'BioLinks', icon: Link2 },
  { to: '/landing-pages', label: 'Landing Pages', icon: LayoutPanelLeft },
]

const clienteProdutosNav: NavEntry[] = [
  { to: '/biolink', label: 'BioLink', icon: Link2 },
  { to: '/aplicativos-mobile', label: 'Aplicativos Mobile', icon: Smartphone },
  { to: '/landing-pages', label: 'Landing Pages', icon: LayoutPanelLeft },
]

const operacaoNav: NavEntry[] = [
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/leads', label: 'Leads', icon: UserRound },
]

const financeNav: NavEntry[] = [
  { to: '/financeiro', label: 'Visão geral', icon: Landmark },
  { to: '/pagamentos', label: 'Pagamentos', icon: Receipt },
  { to: '/assinaturas', label: 'Assinaturas', icon: RefreshCw },
]

const financeAdminNav: NavEntry[] = [
  { to: '/financeiro', label: 'Visão geral', icon: Landmark },
  { to: '/planos', label: 'Planos', icon: Tags },
  { to: '/pagamentos', label: 'Pagamentos', icon: Receipt },
  { to: '/assinaturas', label: 'Assinaturas', icon: RefreshCw },
]

function SideLabel({
  collapsed,
  children,
  className,
}: {
  collapsed: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'min-w-0 truncate whitespace-nowrap transition-opacity duration-300 ease-out',
        collapsed ? 'opacity-0' : 'opacity-100 delay-75',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  collapsible = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void
  collapsed?: boolean
  collapsible?: boolean
  onToggleCollapse?: () => void
}) {
  const { user, isAdmin, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const produtosNav = isAdmin ? adminProdutosNav : clienteProdutosNav
  const produtosLabel = isAdmin ? 'Produtos' : 'Meus sites e apps'

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-line bg-card text-ink">
      {collapsible && (
        <div className="pt-4">
          <div className="grid h-11 w-20 shrink-0 place-items-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="ui-press grid size-11 place-items-center rounded-xl border border-line bg-card text-muted transition-colors hover:bg-paper hover:text-ink"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className={cn('flex items-center', collapsible ? 'pt-4 pb-4' : 'pt-8 pb-6')}>
        <div className="grid w-20 shrink-0 place-items-center">
          <img
            src={isDark ? iconWhite : iconGreen}
            alt="Convertix"
            className="size-9 object-contain"
          />
        </div>
        <SideLabel collapsed={collapsed} className="flex items-center gap-2 pr-3">
          <span className="font-display text-base font-semibold tracking-tight">Convertix</span>
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-brand uppercase">
            Gestor
          </span>
        </SideLabel>
      </div>

      <div className="pb-4">
        <NavLink
          to="/perfil"
          onClick={onNavigate}
          title={collapsed ? user?.nome : undefined}
          className={({ isActive }) =>
            cn(
              'group flex items-center transition-colors duration-200',
              isActive ? 'bg-brand-soft' : 'hover:bg-paper',
            )
          }
        >
          <div className="grid w-20 shrink-0 place-items-center py-1">
            <Avatar
              name={user?.nome}
              src={user?.foto}
              className="rounded-full ring-2 ring-brand/15"
            />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-3">
            <div className="min-w-0 flex-1">
              <SideLabel collapsed={collapsed} className="block text-sm font-semibold text-ink">
                {user?.nome}
              </SideLabel>
              <SideLabel collapsed={collapsed} className="mt-0.5 block text-[11px] text-muted">
                {isAdmin ? 'Administrador' : 'Cliente'}
              </SideLabel>
            </div>
            <ChevronRight
              className={cn(
                'size-4 shrink-0 text-muted transition-all duration-300',
                collapsed ? 'opacity-0' : 'opacity-100 delay-75 group-hover:translate-x-0.5 group-hover:text-ink',
              )}
            />
          </div>
        </NavLink>
      </div>
      <div className="mx-3 mb-3 h-px bg-line" />

      <nav className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto pb-4 scrollbar-thin">
        {isAdmin && (
          <NavSection
            title="Admin"
            items={adminNav}
            pathname={location.pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}
        <NavSection
          title={produtosLabel}
          items={produtosNav}
          pathname={location.pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <NavSection
          title="Operação"
          items={operacaoNav}
          pathname={location.pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <NavSection
          title="Financeiro"
          items={isAdmin ? financeAdminNav : financeNav}
          pathname={location.pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      </nav>

      <div className="space-y-1 border-t border-line py-3">
        <IconAction
          collapsed={collapsed}
          label={isDark ? 'Modo claro' : 'Modo escuro'}
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="size-4 text-brand" /> : <Moon className="size-4" />}
        </IconAction>
        <IconAction collapsed={collapsed} label="Sair da conta" onClick={logout}>
          <LogOut className="size-4" />
        </IconAction>
      </div>
    </aside>
  )
}

function IconAction({
  collapsed,
  label,
  onClick,
  children,
}: {
  collapsed: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      aria-label={label}
      onClick={onClick}
      className="flex w-full items-center text-sm text-muted transition-colors duration-200 hover:bg-paper hover:text-ink"
    >
      <span className="grid h-11 w-20 shrink-0 place-items-center">{children}</span>
      <SideLabel collapsed={collapsed} className="pr-3">
        {label}
      </SideLabel>
    </button>
  )
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
  collapsed,
}: {
  title: string
  items: NavEntry[]
  pathname: string
  onNavigate?: () => void
  collapsed: boolean
}) {
  const open = items.some((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  )

  return (
    <div>
      <p
        className={cn(
          'mb-2 h-4 overflow-hidden whitespace-nowrap pl-20 pr-3 text-[11px] tracking-[0.16em] uppercase transition-colors',
          open ? 'text-brand' : 'text-muted',
        )}
      >
        <SideLabel collapsed={collapsed}>{title}</SideLabel>
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
  collapsed,
}: {
  to: string
  label: string
  icon: typeof CreditCard
  end?: boolean
  onNavigate?: () => void
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center overflow-hidden text-sm transition-colors duration-200',
          isActive ? 'bg-paper font-semibold text-ink' : 'text-muted hover:bg-paper hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute inset-y-2 left-0 w-1 rounded-full bg-brand transition-opacity duration-200',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <span className="grid h-11 w-20 shrink-0 place-items-center">
            <Icon
              className={cn(
                'size-4 transition-colors duration-200',
                isActive ? 'text-brand' : 'group-hover:text-brand',
              )}
            />
          </span>
          <SideLabel collapsed={collapsed} className="pr-3">
            {label}
          </SideLabel>
        </>
      )}
    </NavLink>
  )
}
