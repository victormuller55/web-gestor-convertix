import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageSpinner } from '@/components/ui/Spinner'

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, ready, isAdmin } = useAuth()
  const location = useLocation()

  if (!ready) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (adminOnly && !isAdmin) return <Navigate to="/biolink" replace />
  return <Outlet />
}

export function GuestRoute() {
  const { user, ready, isAdmin } = useAuth()
  if (!ready) return <PageSpinner />
  if (user) return <Navigate to={isAdmin ? '/' : '/biolink'} replace />
  return <Outlet />
}
