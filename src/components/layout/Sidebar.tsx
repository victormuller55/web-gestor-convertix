import { NavLink, useLocation } from 'react-router-dom'
import {
  CreditCard,
  Home,
  Landmark,
  Link2,
  LogOut,
  Moon,
  Receipt,
  RefreshCw,
  Sun,
  Users,
  Building2,
  Globe,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import logoGreen from '@/assets/logos/logo_convertix_green.png'
import logoWhite from '@/assets/logos/logo_convertix_white.png'

const adminNav = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/usuarios', label: 'Usuários', icon: Users },
  { to: '/clientes', label: 'Clientes', icon: Building2 },
  { to: '/sites', label: 'Sites', icon: Globe },
  { to: '/aplicativos-mobile', label: 'Aplicativos Mobile', icon: Smartphone },
  { to: '/biolinks', label: 'BioLinks', icon: Link2 },
]

const clienteNav = [
  { to: '/biolink', label: 'BioLink', icon: Link2 },
  { to: '/aplicativos-mobile', label: 'Aplicativos Mobile', icon: Smartphone },
]

const financeNav = [
  { to: '/financeiro', label: 'Visão geral', icon: Landmark },
  { to: '/pagamentos', label: 'Pagamentos', icon: Receipt },
  { to: '/assinaturas', label: 'Assinaturas', icon: RefreshCw },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const main = isAdmin ? adminNav : clienteNav
  const financeOpen = ['/financeiro', '/pagamentos', '/assinaturas'].some((p) =>
    location.pathname.startsWith(p),
  )

  return (
    <aside className="flex h-full flex-col border-r border-line bg-card text-ink">
      <div className="nav-anim flex flex-col items-center px-4 pt-6 pb-4" style={{ animationDelay: '40ms' }}>
        <img
          src={isDark ? logoWhite : logoGreen}
          alt="Convertix"
          className="h-9 w-auto max-w-[190px] object-contain transition-transform duration-300 hover:scale-[1.02]"
        />
        <p className="mt-2 text-[10px] tracking-[0.2em] text-muted uppercase">Gestor</p>
      </div>

      <div
        className="nav-anim mx-3 mb-4 rounded-2xl border border-line bg-paper px-3 py-3"
        style={{ animationDelay: '90ms' }}
      >
        <NavLink
          to="/perfil"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-1 py-1 transition-all duration-300',
              isActive && 'ring-2 ring-brand/25',
            )
          }
        >
          <Avatar name={user?.nome} src={user?.foto} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.nome}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <div className="space-y-1">
          {main.map((item, index) => (
            <NavItem
              key={item.to}
              {...item}
              onNavigate={onNavigate}
              delay={120 + index * 40}
            />
          ))}
        </div>

        <div className="nav-anim" style={{ animationDelay: `${120 + main.length * 40}ms` }}>
          <p
            className={cn(
              'mb-2 px-3 text-[11px] tracking-[0.16em] text-muted uppercase transition-colors',
              financeOpen && 'text-brand',
            )}
          >
            Financeiro
          </p>
          <div className="space-y-1">
            {financeNav.map((item, index) => (
              <NavItem
                key={item.to}
                {...item}
                onNavigate={onNavigate}
                delay={160 + (main.length + index) * 40}
              />
            ))}
          </div>
        </div>
      </nav>

      <div
        className="nav-anim space-y-1 border-t border-line p-3"
        style={{ animationDelay: `${200 + (main.length + financeNav.length) * 40}ms` }}
      >
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-muted transition-all duration-300 hover:translate-x-0.5 hover:bg-paper hover:text-ink"
        >
          {isDark ? <Sun className="size-4 text-brand" /> : <Moon className="size-4" />}
          {isDark ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-muted transition-all duration-300 hover:translate-x-0.5 hover:bg-paper hover:text-ink"
        >
          <LogOut className="size-4" />
          Sair da conta
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
  delay = 0,
}: {
  to: string
  label: string
  icon: typeof CreditCard
  end?: boolean
  onNavigate?: () => void
  delay?: number
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      style={{ animationDelay: `${delay}ms` }}
      className={({ isActive }) =>
        cn(
          'nav-anim group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ease-out',
          isActive
            ? 'bg-paper font-semibold text-ink'
            : 'text-muted hover:translate-x-1 hover:bg-paper hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute inset-y-2 left-0 w-1 rounded-full bg-brand transition-all duration-300',
              isActive ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0 group-hover:opacity-50',
            )}
          />
          <Icon
            className={cn(
              'size-4 transition-all duration-300',
              isActive ? 'text-brand' : 'group-hover:scale-110 group-hover:text-brand',
            )}
          />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  )
}
