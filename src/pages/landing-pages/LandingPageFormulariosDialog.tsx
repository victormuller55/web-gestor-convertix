import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  alterarCampo,
  alterarFormulario,
  apagarCampo,
  apagarFormulario,
  criarCampo,
  criarFormulario,
  listarCampos,
  listarFormularios,
} from '@/lib/api/landingPages'
import { ApiError } from '@/lib/api/client'
import { TIPO_LANDING_PAGE_CAMPO_LABEL } from '@/lib/labels'
import { TipoLandingPageCampo } from '@/types/enums'
import type { LandingPage, LandingPageCampo, LandingPageFormulario } from '@/types/models'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'

type FormForm = {
  nome: string
  titulo: string
  descricao: string
  texto_botao: string
  ativo: boolean
}

type CampoForm = {
  nome_interno: string
  label: string
  tipo: TipoLandingPageCampo
  placeholder: string
  obrigatorio: boolean
  ordem: string
  ativo: boolean
}

const emptyForm: FormForm = {
  nome: 'Contato',
  titulo: 'Fale conosco',
  descricao: '',
  texto_botao: 'Enviar',
  ativo: true,
}

const emptyCampo: CampoForm = {
  nome_interno: '',
  label: '',
  tipo: TipoLandingPageCampo.TEXT,
  placeholder: '',
  obrigatorio: false,
  ordem: '1',
  ativo: true,
}

function slugCampo(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100)
}

export function LandingPageFormulariosDialog({
  landingPage,
  onClose,
}: {
  landingPage: LandingPage
  onClose: () => void
}) {
  const { isAdmin } = useAuth()
  const { push } = useToast()
  const queryClient = useQueryClient()
  const [formulario, setFormulario] = useState<LandingPageFormulario | null>(null)
  const [editingForm, setEditingForm] = useState<LandingPageFormulario | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [form, setForm] = useState<FormForm>(emptyForm)
  const [removingForm, setRemovingForm] = useState<LandingPageFormulario | null>(null)
  const [editingCampo, setEditingCampo] = useState<LandingPageCampo | null>(null)
  const [openCampo, setOpenCampo] = useState(false)
  const [campo, setCampo] = useState<CampoForm>(emptyCampo)
  const [removingCampo, setRemovingCampo] = useState<LandingPageCampo | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formsQuery = useQuery({
    queryKey: ['landing-page-formularios', landingPage.id],
    queryFn: () => listarFormularios(landingPage.id),
  })
  const camposQuery = useQuery({
    queryKey: ['landing-page-campos', formulario?.id],
    queryFn: () => listarCampos(formulario!.id),
    enabled: formulario != null,
  })

  const saveForm = useMutation({
    mutationFn: () => {
      const dados = {
        nome: form.nome.trim(),
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        texto_botao: form.texto_botao.trim(),
        ativo: form.ativo,
      }
      return editingForm
        ? alterarFormulario(landingPage.id, editingForm.id, dados)
        : criarFormulario(landingPage.id, dados)
    },
    onSuccess: () => {
      push(editingForm ? 'Formulário atualizado.' : 'Formulário criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-page-formularios', landingPage.id] })
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      setOpenForm(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const removeForm = useMutation({
    mutationFn: (id: number) => apagarFormulario(landingPage.id, id),
    onSuccess: () => {
      push('Formulário excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-page-formularios', landingPage.id] })
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      setRemovingForm(null)
      setFormulario(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  const saveCampo = useMutation({
    mutationFn: () => {
      const dados = {
        nome_interno: campo.nome_interno,
        label: campo.label.trim(),
        tipo: campo.tipo,
        placeholder: campo.placeholder.trim() || undefined,
        obrigatorio: campo.obrigatorio,
        ordem: Number(campo.ordem) || 1,
        ativo: campo.ativo,
      }
      return editingCampo ? alterarCampo(editingCampo.id, dados) : criarCampo(formulario!.id, dados)
    },
    onSuccess: () => {
      push(editingCampo ? 'Campo atualizado.' : 'Campo criado.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-page-campos', formulario?.id] })
      setOpenCampo(false)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao salvar.', 'error'),
  })

  const removeCampo = useMutation({
    mutationFn: (id: number) => apagarCampo(id),
    onSuccess: () => {
      push('Campo excluído.', 'success')
      queryClient.invalidateQueries({ queryKey: ['landing-page-campos', formulario?.id] })
      setRemovingCampo(null)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  const formularios = formsQuery.data ?? []
  const campos = [...(camposQuery.data ?? [])].sort((a, b) => a.ordem - b.ordem)

  return (
    <>
      <Modal
        open
        wide
        title={formulario ? formulario.nome : 'Formulários'}
        description={formulario ? 'Campos que o visitante preenche.' : `/${landingPage.slug}`}
        onClose={() => (formulario ? setFormulario(null) : onClose())}
        footer={
          <div className="flex justify-end gap-2">
            {formulario ? (
              <Button variant="secondary" onClick={() => setFormulario(null)}>
                Voltar
              </Button>
            ) : (
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>
            )}
            {isAdmin ? (
              formulario ? (
                <Button
                  icon={<Plus className="size-4" />}
                  onClick={() => {
                    setEditingCampo(null)
                    setCampo({ ...emptyCampo, ordem: String((campos.at(-1)?.ordem ?? 0) + 1) })
                    setErrors({})
                    setOpenCampo(true)
                  }}
                >
                  Novo campo
                </Button>
              ) : (
                <Button
                  icon={<Plus className="size-4" />}
                  onClick={() => {
                    setEditingForm(null)
                    setForm(emptyForm)
                    setErrors({})
                    setOpenForm(true)
                  }}
                >
                  Novo formulário
                </Button>
              )
            ) : null}
          </div>
        }
      >
        {formulario ? (
          camposQuery.isLoading ? (
            <PageSpinner />
          ) : campos.length === 0 ? (
            <EmptyState title="Nenhum campo ainda" />
          ) : (
            <div className="space-y-2">
              {campos.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper/40 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-muted">
                      {item.nome_interno} · {TIPO_LANDING_PAGE_CAMPO_LABEL[item.tipo]}
                      {item.obrigatorio ? ' · obrigatório' : ''}
                    </p>
                  </div>
                  <Badge tone={item.ativo ? 'success' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  {isAdmin ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil className="size-4" />}
                        aria-label="Editar campo"
                        onClick={() => {
                          setEditingCampo(item)
                          setCampo({
                            nome_interno: item.nome_interno,
                            label: item.label,
                            tipo: item.tipo,
                            placeholder: item.placeholder ?? '',
                            obrigatorio: item.obrigatorio,
                            ordem: String(item.ordem),
                            ativo: item.ativo,
                          })
                          setErrors({})
                          setOpenCampo(true)
                        }}
                      />
                      <Button
                        variant="ghost-danger"
                        size="sm"
                        icon={<Trash2 className="size-4" />}
                        aria-label="Excluir campo"
                        onClick={() => setRemovingCampo(item)}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )
        ) : formsQuery.isLoading ? (
          <PageSpinner />
        ) : formularios.length === 0 ? (
          <EmptyState title="Nenhum formulário ainda" />
        ) : (
          <div className="space-y-2">
            {formularios.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper/40 px-4 py-3">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setFormulario(item)}>
                  <p className="font-semibold">{item.nome}</p>
                  <p className="text-xs text-muted">{item.titulo}</p>
                </button>
                <Badge tone={item.ativo ? 'success' : 'neutral'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>
                {isAdmin ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil className="size-4" />}
                      aria-label="Editar formulário"
                      onClick={() => {
                        setEditingForm(item)
                        setForm({
                          nome: item.nome,
                          titulo: item.titulo,
                          descricao: item.descricao ?? '',
                          texto_botao: item.texto_botao,
                          ativo: item.ativo,
                        })
                        setErrors({})
                        setOpenForm(true)
                      }}
                    />
                    <Button
                      variant="ghost-danger"
                      size="sm"
                      icon={<Trash2 className="size-4" />}
                      aria-label="Excluir formulário"
                      onClick={() => setRemovingForm(item)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={openForm}
        title={editingForm ? 'Editar formulário' : 'Novo formulário'}
        onClose={() => setOpenForm(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button
              loading={saveForm.isPending}
              onClick={() => {
                const next: Record<string, string> = {}
                if (!form.nome.trim()) next.nome = 'Informe o nome.'
                if (!form.titulo.trim()) next.titulo = 'Informe o título.'
                if (!form.texto_botao.trim()) next.texto_botao = 'Informe o texto do botão.'
                setErrors(next)
                if (!Object.keys(next).length) saveForm.mutate()
              }}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome interno"
            value={form.nome}
            error={errors.nome}
            onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
          />
          <Input
            label="Título"
            value={form.titulo}
            error={errors.titulo}
            onChange={(e) => setForm((current) => ({ ...current, titulo: e.target.value }))}
          />
          <Input
            label="Texto do botão"
            value={form.texto_botao}
            error={errors.texto_botao}
            onChange={(e) => setForm((current) => ({ ...current, texto_botao: e.target.value }))}
          />
          <Textarea
            label="Descrição"
            rows={2}
            value={form.descricao}
            onChange={(e) => setForm((current) => ({ ...current, descricao: e.target.value }))}
          />
          <Switch
            checked={form.ativo}
            onChange={(ativo) => setForm((current) => ({ ...current, ativo }))}
            label="Formulário ativo"
            description="Inativo não recebe envios públicos."
          />
        </div>
      </Modal>

      <Modal
        open={openCampo}
        title={editingCampo ? 'Editar campo' : 'Novo campo'}
        onClose={() => setOpenCampo(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenCampo(false)}>
              Cancelar
            </Button>
            <Button
              loading={saveCampo.isPending}
              onClick={() => {
                const next: Record<string, string> = {}
                if (!campo.label.trim()) next.label = 'Informe o rótulo.'
                if (!/^[a-z0-9_]{2,100}$/.test(campo.nome_interno)) {
                  next.nome_interno = 'Use letras, números e underscore.'
                }
                setErrors(next)
                if (!Object.keys(next).length) saveCampo.mutate()
              }}
            >
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Rótulo"
            value={campo.label}
            error={errors.label}
            onChange={(e) =>
              setCampo((current) => ({
                ...current,
                label: e.target.value,
                nome_interno: editingCampo ? current.nome_interno : slugCampo(e.target.value) || current.nome_interno,
              }))
            }
          />
          <Input
            label="Nome interno"
            hint="Usado no envio público. nome, email e telefone preenchem o lead."
            value={campo.nome_interno}
            error={errors.nome_interno}
            onChange={(e) => setCampo((current) => ({ ...current, nome_interno: slugCampo(e.target.value) }))}
          />
          <Select
            label="Tipo"
            value={campo.tipo}
            onChange={(e) => setCampo((current) => ({ ...current, tipo: e.target.value as TipoLandingPageCampo }))}
          >
            {Object.entries(TIPO_LANDING_PAGE_CAMPO_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Placeholder"
            value={campo.placeholder}
            onChange={(e) => setCampo((current) => ({ ...current, placeholder: e.target.value }))}
          />
          <Input
            label="Ordem"
            value={campo.ordem}
            onChange={(e) => setCampo((current) => ({ ...current, ordem: e.target.value.replace(/\D/g, '') }))}
          />
          <Switch
            checked={campo.obrigatorio}
            onChange={(obrigatorio) => setCampo((current) => ({ ...current, obrigatorio }))}
            label="Obrigatório"
          />
          <Switch
            checked={campo.ativo}
            onChange={(ativo) => setCampo((current) => ({ ...current, ativo }))}
            label="Campo ativo"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removingForm)}
        title="Excluir formulário"
        message={`Deseja excluir ${removingForm?.nome}? Os leads desse formulário também saem.`}
        confirmLabel="Excluir"
        danger
        loading={removeForm.isPending}
        onClose={() => setRemovingForm(null)}
        onConfirm={() => removingForm && removeForm.mutate(removingForm.id)}
      />
      <ConfirmDialog
        open={Boolean(removingCampo)}
        title="Excluir campo"
        message={`Deseja excluir ${removingCampo?.label}?`}
        confirmLabel="Excluir"
        danger
        loading={removeCampo.isPending}
        onClose={() => setRemovingCampo(null)}
        onConfirm={() => removingCampo && removeCampo.mutate(removingCampo.id)}
      />
    </>
  )
}
