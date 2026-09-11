import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { TipoUsuario } from '@/types/enums'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { redefinirSenha, solicitarRecuperacao, verificarCodigo } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { isValidEmail, isValidPassword } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import logoWhite from '@/assets/logos/logo_convertix_white.png'
import logoGreen from '@/assets/logos/logo_convertix_green.png'

type Step = 'login' | 'email' | 'codigo' | 'senha'

export function LoginPage() {
  const { login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [usuarioId, setUsuarioId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onLogin(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.')
    if (!senha) return setError('Informe sua senha.')
    setLoading(true)
    try {
      const usuario = await login(email, senha)
      navigate(usuario.tipo === TipoUsuario.ADMIN ? '/' : '/biolink', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  async function onRecuperar(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.')
    setLoading(true)
    try {
      const res = await solicitarRecuperacao(email)
      setUsuarioId(res.usuario_id)
      setStep('codigo')
      push(res.mensagem || 'Código enviado para o e-mail.', 'success')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o código.')
    } finally {
      setLoading(false)
    }
  }

  async function onCodigo(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!usuarioId || codigo.length !== 6) return setError('Informe o código de 6 dígitos.')
    setLoading(true)
    try {
      const res = await verificarCodigo(usuarioId, codigo)
      if (!res.valido) {
        setError(res.mensagem || 'Código inválido.')
        return
      }
      setStep('senha')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Código inválido.')
    } finally {
      setLoading(false)
    }
  }

  async function onNovaSenha(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!usuarioId) return
    if (!isValidPassword(novaSenha)) return setError('A senha precisa ter pelo menos 8 caracteres.')
    if (novaSenha !== confirma) return setError('As senhas não coincidem.')
    setLoading(true)
    try {
      await redefinirSenha(usuarioId, codigo, novaSenha)
      push('Senha redefinida. Entre com a nova senha.', 'success')
      setSenha('')
      setStep('login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-forest text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,196,74,0.22),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_28%)]" />
        <div className="relative flex w-full flex-col justify-between p-12">
          <div className="flex items-center">
            <img src={logoWhite} alt="Convertix" className="h-9 w-auto max-w-[220px] object-contain object-left" />
          </div>
          <div className="max-w-lg">
            <p className="text-sm tracking-[0.2em] text-brand uppercase">Operação digital</p>
            <h1 className="mt-4 font-display text-5xl leading-tight">
              Um console web para clientes, sites e recorrência.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/65">
              Acompanhe assinaturas, cobranças e BioLinks em uma interface pensada para desktop —
              rápida, clara e pronta para o dia a dia da equipe.
            </p>
          </div>
          <a
            href="https://convertix.net.br/pages/home.html#planos"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            Ver planos no site
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>

      <section className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <img src={logoGreen} alt="Convertix" className="h-8 w-auto max-w-[180px] object-contain object-left" />
          </div>
          {step !== 'login' && (
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep(step === 'email' ? 'login' : 'email')
              }}
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </button>
          )}
          <h2 className="font-display text-4xl text-ink">
            {step === 'login' && 'Entrar no gestor'}
            {step === 'email' && 'Recuperar senha'}
            {step === 'codigo' && 'Código enviado'}
            {step === 'senha' && 'Nova senha'}
          </h2>
          <p className="mt-2 mb-8 text-sm text-muted">
            {step === 'login' && 'Use o e-mail da sua conta Convertix.'}
            {step === 'email' && 'Enviaremos um código de 6 dígitos para o e-mail cadastrado.'}
            {step === 'codigo' && 'Digite o código recebido para continuar.'}
            {step === 'senha' && 'Defina uma senha com no mínimo 8 caracteres.'}
          </p>

          {step === 'login' && (
            <form className="space-y-4" onSubmit={onLogin}>
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Entrar
              </Button>
              <button
                type="button"
                className="w-full text-sm text-muted hover:text-ink"
                onClick={() => {
                  setError('')
                  setStep('email')
                }}
              >
                Esqueci minha senha
              </button>
            </form>
          )}

          {step === 'email' && (
            <form className="space-y-4" onSubmit={onRecuperar}>
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Enviar código
              </Button>
            </form>
          )}

          {step === 'codigo' && (
            <form className="space-y-4" onSubmit={onCodigo}>
              <Input
                label="Código"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Verificar
              </Button>
            </form>
          )}

          {step === 'senha' && (
            <form className="space-y-4" onSubmit={onNovaSenha}>
              <Input
                label="Nova senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
              <Input
                label="Confirmar senha"
                type="password"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Salvar senha
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
