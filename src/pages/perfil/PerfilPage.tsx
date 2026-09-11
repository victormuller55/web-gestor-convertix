import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Building2, Lock, UserRound } from 'lucide-react'
import { alterarUsuario } from '@/lib/api/usuarios'
import { alterarCliente } from '@/lib/api/clientes'
import { ApiError } from '@/lib/api/client'
import { maskDocumento, maskTelefone, onlyDigits } from '@/lib/format'
import { TIPO_USUARIO_LABEL } from '@/lib/labels'
import { isValidDocumento, isValidEmail, isValidPassword } from '@/lib/validators'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import type { Usuario } from '@/types/models'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { Badge } from '@/components/ui/Badge'
import { PageScroll } from '@/components/ui/PageFrame'

export function PerfilPage() {
  const { user, isAdmin, isCliente, setUser } = useAuth()
  const { push } = useToast()

  const [nome, setNome] = useState(user?.nome ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [senha, setSenha] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState(user?.nome_empresa ?? '')
  const [documento, setDocumento] = useState(maskDocumento(user?.documento ?? ''))
  const [telefone, setTelefone] = useState(maskTelefone(user?.telefone ?? ''))
  const [foto, setFoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sessão inválida.')

      if (isAdmin) {
        const atualizado = await alterarUsuario(
          user.id,
          {
            nome: nome.trim(),
            email: email.trim(),
            senha: senha || undefined,
            ativo: user.ativo,
          },
          foto,
        )
        return mergeSession(user, {
          ...atualizado,
          tipo: user.tipo,
          token: user.token,
          cliente_id: user.cliente_id,
        })
      }

      if (isCliente && user.cliente_id != null) {
        const cliente = await alterarCliente(
          user.cliente_id,
          {
            nome_empresa: nomeEmpresa.trim(),
            documento: onlyDigits(documento),
            email: email.trim(),
            telefone: onlyDigits(telefone) || undefined,
            senha: senha || undefined,
          },
          foto,
        )
        return mergeSession(user, {
          ...user,
          email: email.trim(),
          nome_empresa: nomeEmpresa.trim(),
          documento: onlyDigits(documento),
          telefone: onlyDigits(telefone) || null,
          foto: cliente.foto ?? user.foto,
        })
      }

      throw new Error('Perfil não suportado para este usuário.')
    },
    onSuccess: (atualizado) => {
      setUser(atualizado)
      setSenha('')
      setFoto(null)
      push('Perfil atualizado com sucesso.', 'success')
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar perfil.', 'error'),
  })

  if (!user) return null

  function validate() {
    const next: Record<string, string> = {}
    if (isAdmin && !nome.trim()) next.nome = 'Informe o nome.'
    if (!isValidEmail(email)) next.email = 'E-mail inválido.'
    if (!isValidPassword(senha, false)) next.senha = 'Mínimo de 8 caracteres.'
    if (isCliente) {
      if (!nomeEmpresa.trim()) next.nome_empresa = 'Informe o nome da empresa.'
      if (!isValidDocumento(documento)) next.documento = 'CPF ou CNPJ inválido.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    save.mutate()
  }

  return (
    <PageScroll>
      <form id="perfil-form" onSubmit={onSubmit} className="flex min-h-full flex-col pb-8">
        <PageHeader
          eyebrow="Conta"
          title="Meu perfil"
          description="Gerencie sua foto, dados de contato e senha de acesso ao gestor."
          actions={
            <Button type="submit" form="perfil-form" loading={save.isPending}>
              Salvar alterações
            </Button>
          }
        />

        <div className="grid flex-1 items-start lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
          <aside className="border-b border-line p-6 lg:sticky lg:top-0 lg:border-r lg:border-b-0">
            <PhotoPicker
              name={user.nome || user.nome_empresa || undefined}
              currentUrl={user.foto}
              file={foto}
              onChange={setFoto}
              layout="stack"
              size="lg"
            />
            <div className="mt-5 border-t border-line pt-4 text-center">
              <p className="font-display text-xl text-ink">{user.nome || user.nome_empresa}</p>
              <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
              <div className="mt-3 flex justify-center">
                <Badge tone={isAdmin ? 'brand' : 'info'}>{TIPO_USUARIO_LABEL[user.tipo]}</Badge>
              </div>
            </div>
          </aside>

          <div>
            <Section
              icon={<UserRound className="size-4" />}
              title="Dados da conta"
              description="Como você aparece no gestor e o e-mail usado para entrar."
            >
              <div className="grid gap-4 md:grid-cols-2">
                {isAdmin ? (
                  <Input
                    label="Nome"
                    value={nome}
                    error={errors.nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                ) : (
                  <Input
                    label="Nome"
                    value={user.nome ?? ''}
                    disabled
                    hint="Nome de exibição da conta. Não pode ser alterado por aqui."
                  />
                )}
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  error={errors.email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Section>

            {isCliente && (
              <Section
                icon={<Building2 className="size-4" />}
                title="Dados da empresa"
                description="Informações cadastrais usadas em cobranças e no contrato."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Nome da empresa"
                    className="md:col-span-2"
                    value={nomeEmpresa}
                    error={errors.nome_empresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                  />
                  <Input
                    label="CPF ou CNPJ"
                    value={documento}
                    error={errors.documento}
                    onChange={(e) => setDocumento(maskDocumento(e.target.value))}
                  />
                  <Input
                    label="Telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                  />
                </div>
              </Section>
            )}

            <Section
              icon={<Lock className="size-4" />}
              title="Senha de acesso"
              description="Deixe em branco se não quiser trocar a senha agora."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nova senha"
                  type="password"
                  autoComplete="new-password"
                  hint="Opcional. Mínimo de 8 caracteres."
                  value={senha}
                  error={errors.senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </Section>
          </div>
        </div>
      </form>
    </PageScroll>
  )
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-line p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-line pb-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-paper text-brand">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function mergeSession(anterior: Usuario, atualizado: Usuario): Usuario {
  return {
    ...anterior,
    ...atualizado,
    id: anterior.id,
    tipo: anterior.tipo,
    token: anterior.token,
    cliente_id: anterior.cliente_id ?? atualizado.cliente_id,
  }
}
