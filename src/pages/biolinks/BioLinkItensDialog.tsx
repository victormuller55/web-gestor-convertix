import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ExternalLink,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  alterarBioLinkItem,
  apagarBioLinkItem,
  criarBioLinkItem,
  listarBioLinkItens,
  reordenarBioLinkItens,
} from '@/lib/api/biolinks'
import { ApiError } from '@/lib/api/client'
import { normalizeUrl } from '@/lib/links'
import { ICONE_BIOLINK_LABEL } from '@/lib/labels'
import { isValidHttpUrl } from '@/lib/validators'
import { useToast } from '@/context/ToastContext'
import { BioLinkItemIcone } from '@/types/enums'
import type { BioLink, BioLinkItem } from '@/types/models'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'

const MAX_ITENS = 8
const CARD_GAP = 8
const DROP_SLOT = 16
const DRAG_EASE = 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)'

const ICONE_TOM: Record<BioLinkItemIcone, string> = {
  WHATSAPP: 'bg-[#25D366] text-white',
  INSTAGRAM: 'bg-[#dd2a7b] text-white',
  TIKTOK: 'bg-ink text-white',
  YOUTUBE: 'bg-[#ff0000] text-white',
  FACEBOOK: 'bg-[#1877f2] text-white',
  LINKEDIN: 'bg-[#0a66c2] text-white',
  X: 'bg-ink text-white',
  TELEGRAM: 'bg-[#229ed9] text-white',
  DISCORD: 'bg-[#5865f2] text-white',
  SPOTIFY: 'bg-[#1db954] text-white',
  PINTEREST: 'bg-[#e60023] text-white',
  THREADS: 'bg-ink text-white',
  SNAPCHAT: 'bg-[#fffc00] text-ink',
  TWITCH: 'bg-[#9146ff] text-white',
  GITHUB: 'bg-ink text-white',
  BEHANCE: 'bg-[#1769ff] text-white',
  DRIBBBLE: 'bg-[#ea4c89] text-white',
  MEDIUM: 'bg-ink text-white',
  SUBSTACK: 'bg-[#ff6719] text-white',
  GOOGLE_MAPS: 'bg-[#34a853] text-white',
  OUTROS: 'bg-forest text-white',
}

function sortItens(itens: BioLinkItem[]) {
  return [...itens].sort((a, b) => a.ordem - b.ordem)
}

function reorder<T>(list: T[], from: number, to: number) {
  if (from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function withOrdem(list: BioLinkItem[]) {
  return list.map((item, index) => ({ ...item, ordem: index + 1 }))
}

function displayUrl(url: string) {
  try {
    const parsed = new URL(normalizeUrl(url))
    const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '')
    return `${parsed.host}${path}`
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '')
  }
}

function initials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return label.slice(0, 2).toUpperCase()
}

function insertIndex(from: number, to: number) {
  return to > from ? to + 1 : to
}

function sameOrder(a: BioLinkItem[], b: BioLinkItem[]) {
  return a.length === b.length && a.every((item, index) => item.id === b[index]?.id)
}

export function BioLinkItensDialog({ biolink, onClose }: { biolink: BioLink; onClose: () => void }) {
  const { push } = useToast()
  const queryClient = useQueryClient()
  const listRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    id: number
    from: number
    to: number
    startY: number
    offsetY: number
    height: number
    list: BioLinkItem[]
    moved: boolean
    settling: boolean
  } | null>(null)
  const itensRef = useRef<BioLinkItem[]>([])
  const stopDragRef = useRef<(() => void) | null>(null)
  const [itens, setItens] = useState<BioLinkItem[]>([])
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropHint, setDropHint] = useState<{ from: number; to: number; height: number } | null>(null)
  const [lockList, setLockList] = useState(false)
  const [editing, setEditing] = useState<BioLinkItem | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [removing, setRemoving] = useState<BioLinkItem | null>(null)
  const [form, setForm] = useState({
    titulo: '',
    url: '',
    icone: BioLinkItemIcone.OUTROS as BioLinkItemIcone,
    ativo: true,
  })
  const [formError, setFormError] = useState('')

  const itensQuery = useQuery({
    queryKey: ['biolink-itens', biolink.id],
    queryFn: async () => {
      const result = await listarBioLinkItens(biolink.id)
      return Array.isArray(result) ? result : [result]
    },
  })

  useEffect(() => {
    itensRef.current = itens
  }, [itens])

  useEffect(() => {
    if (draggingId != null || lockList || !itensQuery.data) return
    setItens(sortItens(itensQuery.data))
  }, [itensQuery.data, draggingId, lockList])

  useEffect(() => {
    return () => {
      stopDragRef.current?.()
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['biolink-itens', biolink.id] })
  }

  const save = useMutation({
    mutationFn: async () => {
      const url = normalizeUrl(form.url)
      if (!form.titulo.trim()) throw new Error('Informe o título.')
      if (!isValidHttpUrl(url)) throw new Error('URL inválida.')
      const dados = {
        titulo: form.titulo.trim(),
        biolink_id: biolink.id,
        url,
        icone: form.icone,
        ordem: editing?.ordem ?? itens.length + 1,
        ativo: form.ativo,
      }
      return editing ? alterarBioLinkItem(biolink.id, editing.id, dados) : criarBioLinkItem(dados)
    },
    onSuccess: () => {
      push(editing ? 'Link atualizado.' : 'Link adicionado.', 'success')
      invalidate()
      setOpenForm(false)
      setEditing(null)
    },
    onError: (err) => {
      const message = err instanceof ApiError || err instanceof Error ? err.message : 'Falha ao salvar.'
      setFormError(message)
      push(message, 'error')
    },
  })

  const toggle = useMutation({
    mutationFn: (item: BioLinkItem) =>
      alterarBioLinkItem(biolink.id, item.id, {
        titulo: item.titulo,
        biolink_id: biolink.id,
        url: item.url,
        icone: item.icone ?? BioLinkItemIcone.OUTROS,
        ordem: item.ordem,
        ativo: !item.ativo,
      }),
    onMutate: async (item) => {
      setItens((current) => current.map((row) => (row.id === item.id ? { ...row, ativo: !row.ativo } : row)))
    },
    onSuccess: () => invalidate(),
    onError: (err) => {
      invalidate()
      push(err instanceof ApiError ? err.message : 'Falha ao atualizar o link.', 'error')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => apagarBioLinkItem(biolink.id, id),
    onSuccess: () => {
      push('Link excluído.', 'success')
      setRemoving(null)
      invalidate()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Falha ao excluir.', 'error'),
  })

  const persistOrder = useMutation({
    mutationFn: (ordered: BioLinkItem[]) => reordenarBioLinkItens(biolink.id, ordered.map((item) => item.id)),
    onSuccess: (ordered) => {
      const sorted = sortItens(ordered)
      setItens(sorted)
      queryClient.setQueryData(['biolink-itens', biolink.id], sorted)
    },
    onError: (err) => {
      invalidate()
      push(err instanceof ApiError ? err.message : 'Não foi possível salvar a nova ordem.', 'error')
    },
    onSettled: () => setLockList(false),
  })

  function commitOrder(next: BioLinkItem[]) {
    const ordered = withOrdem(next)
    setItens(ordered)
    if (sameOrder(ordered, dragRef.current?.list ?? itensRef.current)) return
    setLockList(true)
    persistOrder.mutate(ordered)
  }

  function cardsInList() {
    return listRef.current
      ? Array.from(listRef.current.querySelectorAll<HTMLElement>('[data-item-id]'))
      : []
  }

  function paintDrag() {
    const drag = dragRef.current
    if (!drag) return
    const opening = drag.to !== drag.from && !drag.settling
    const slot = insertIndex(drag.from, drag.to)
    cardsInList().forEach((el, index) => {
      const active = index === drag.from
      if (active) {
        el.style.transform = `translate3d(0, ${drag.offsetY}px, 0) scale(${drag.settling ? 1 : 1.03})`
        el.style.transition = drag.settling ? DRAG_EASE : 'none'
        el.style.zIndex = '50'
        el.style.willChange = 'transform'
        el.style.position = 'relative'
        return
      }
      const y = opening ? (index >= slot ? DROP_SLOT : -DROP_SLOT) : 0
      el.style.transform = `translate3d(0, ${y}px, 0)`
      el.style.transition = DRAG_EASE
      el.style.zIndex = '1'
      el.style.willChange = 'transform'
    })
  }

  function clearCardStyles() {
    cardsInList().forEach((el) => {
      el.style.transform = ''
      el.style.transition = ''
      el.style.zIndex = ''
      el.style.willChange = ''
      el.style.position = ''
    })
  }

  function openCreate() {
    setEditing(null)
    setForm({ titulo: '', url: '', icone: BioLinkItemIcone.OUTROS, ativo: true })
    setFormError('')
    setOpenForm(true)
  }

  function openEdit(item: BioLinkItem) {
    setEditing(item)
    setForm({
      titulo: item.titulo,
      url: item.url,
      icone: item.icone ?? BioLinkItemIcone.OUTROS,
      ativo: item.ativo,
    })
    setFormError('')
    setOpenForm(true)
  }

  function startDrag(event: ReactPointerEvent, item: BioLinkItem) {
    if (openForm || persistOrder.isPending || event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('a, [role="switch"]')) return
    if (!target.closest('[data-drag-handle]')) return

    event.preventDefault()
    const from = itensRef.current.findIndex((row) => row.id === item.id)
    if (from < 0) return

    const card = listRef.current?.querySelector<HTMLElement>('[data-item-id]')
    const height = card?.offsetHeight ?? 72
    dragRef.current = {
      id: item.id,
      from,
      to: from,
      startY: event.clientY,
      offsetY: 0,
      height,
      list: itensRef.current,
      moved: false,
      settling: false,
    }
    setDraggingId(item.id)
    setDropHint({ from, to: from, height })
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    paintDrag()

    function applyDragPosition(clientY: number) {
      const drag = dragRef.current
      if (!drag || drag.settling) return
      const stride = drag.height + CARD_GAP
      const max = drag.list.length - 1
      drag.offsetY = clientY - drag.startY
      drag.to = Math.max(0, Math.min(max, drag.from + Math.round(drag.offsetY / stride)))
      if (drag.to !== drag.from) drag.moved = true
      setDropHint((prev) =>
        prev?.to === drag.to && prev.from === drag.from
          ? prev
          : { from: drag.from, to: drag.to, height: drag.height },
      )
      paintDrag()
    }

    function onMove(moveEvent: PointerEvent) {
      moveEvent.preventDefault()
      applyDragPosition(moveEvent.clientY)
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      stopDragRef.current = null

      const drag = dragRef.current
      if (!drag) {
        setDraggingId(null)
        setDropHint(null)
        return
      }

      const next = withOrdem(reorder(drag.list, drag.from, drag.to))
      const changed = drag.moved && !sameOrder(next, drag.list)
      setDropHint(null)
      const settleY = (drag.to - drag.from) * (drag.height + CARD_GAP)
      drag.settling = true
      drag.offsetY = settleY
      paintDrag()

      let finished = false
      function finish() {
        if (finished) return
        finished = true
        clearCardStyles()
        dragRef.current = null
        setDraggingId(null)
        if (!changed) return
        setItens(next)
        setLockList(true)
        persistOrder.mutate(next)
      }

      window.setTimeout(finish, 250)
    }

    stopDragRef.current = onUp
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function moveByKeyboard(item: BioLinkItem, delta: number) {
    const from = itensRef.current.findIndex((row) => row.id === item.id)
    const to = Math.max(0, Math.min(itensRef.current.length - 1, from + delta))
    if (from < 0 || from === to) return
    commitOrder(reorder(itensRef.current, from, to))
  }

  return (
    <>
      <Modal
        open
        title={openForm ? (editing ? 'Editar link' : 'Novo link') : `Links de ${biolink.nome_usuario}`}
        description={
          openForm
            ? 'Preencha os dados do botão que aparece no BioLink.'
            : `${itens.length} de ${MAX_ITENS} posições usadas`
        }
        onClose={onClose}
        footer={
          openForm ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button loading={save.isPending} onClick={() => save.mutate()}>
                Salvar link
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Button
                icon={<Plus className="size-4" />}
                disabled={itens.length >= MAX_ITENS}
                onClick={openCreate}
              >
                Adicionar link
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Fechar
              </Button>
            </div>
          )
        }
      >
        {openForm ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              Voltar para a lista
            </button>
            <Input
              label="Título"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            />
            <Input
              label="URL"
              placeholder="https://"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
            <Select
              label="Ícone"
              value={form.icone}
              onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value as BioLinkItemIcone }))}
            >
              {Object.entries(ICONE_BIOLINK_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Switch checked={form.ativo} onChange={(ativo) => setForm((f) => ({ ...f, ativo }))} label="Link ativo" />
            {formError && <p className="text-sm text-danger">{formError}</p>}
          </div>
        ) : itensQuery.isLoading ? (
          <PageSpinner />
        ) : itens.length === 0 ? (
          <EmptyState
            title="Nenhum link ainda"
            description="Adicione WhatsApp, redes ou qualquer URL. Depois arraste os cards para definir a ordem."
            action={
              <Button icon={<Plus className="size-4" />} onClick={openCreate}>
                Adicionar link
              </Button>
            }
          />
        ) : (
          <div className="px-0.5">
            <p className="mb-3 text-sm text-muted">
              Arraste os cards para cima ou para baixo para reorganizar a ordem no BioLink.
            </p>
            <div
              ref={listRef}
              className={cn('relative space-y-2 py-1', draggingId != null && 'select-none')}
            >
              {dropHint && dropHint.to !== dropHint.from && (
                <div
                  key={dropHint.to}
                  aria-hidden
                  className="drop-line pointer-events-none absolute z-10 flex h-8 items-center px-1"
                  style={{
                    left: 4,
                    right: 4,
                    top:
                      4 +
                      insertIndex(dropHint.from, dropHint.to) * (dropHint.height + CARD_GAP) -
                      CARD_GAP / 2 -
                      16,
                  }}
                >
                  <span className="h-1 w-full rounded-full bg-brand shadow-[0_0_14px_rgba(0,196,74,0.8)]" />
                </div>
              )}
              {itens.map((item, index) => {
                const icone = item.icone ?? BioLinkItemIcone.OUTROS
                const label = ICONE_BIOLINK_LABEL[icone]
                const dragging = draggingId === item.id
                return (
                  <article
                    key={item.id}
                    data-item-id={item.id}
                    className={cn(
                      'relative flex items-center gap-2 rounded-2xl border bg-paper py-2.5 pr-2.5 pl-1',
                      dragging
                        ? 'z-50 cursor-grabbing border-brand bg-card shadow-2xl ring-2 ring-brand/30'
                        : 'z-0 border-line hover:border-brand/40 hover:bg-card/60',
                      !item.ativo && !dragging && 'opacity-55',
                      persistOrder.isPending && 'pointer-events-none',
                    )}
                  >
                    <div
                      data-drag-handle
                      className={cn(
                        'flex min-w-0 flex-1 touch-none items-center gap-2',
                        dragging ? 'cursor-grabbing' : 'cursor-grab',
                      )}
                      onPointerDown={(event) => startDrag(event, item)}
                    >
                      <button
                        type="button"
                        aria-label={`Arrastar ${item.titulo}. Posição ${index + 1} de ${itens.length}.`}
                        className="flex h-11 shrink-0 items-center gap-0.5 rounded-xl px-1.5 text-muted hover:bg-card hover:text-ink"
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowUp') {
                            event.preventDefault()
                            moveByKeyboard(item, -1)
                          }
                          if (event.key === 'ArrowDown') {
                            event.preventDefault()
                            moveByKeyboard(item, 1)
                          }
                        }}
                      >
                        <span className="w-4 text-center font-mono text-[11px] font-semibold text-muted">
                          {index + 1}
                        </span>
                        <GripVertical className="size-5" />
                      </button>

                      <span
                        className={cn(
                          'grid size-10 shrink-0 place-items-center rounded-xl text-[11px] font-bold tracking-wide',
                          ICONE_TOM[icone],
                        )}
                      >
                        {initials(label)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold leading-5">{item.titulo}</p>
                        <a
                          href={normalizeUrl(item.url)}
                          target="_blank"
                          rel="noreferrer"
                          title={item.url}
                          className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted hover:text-info"
                        >
                          <span className="min-w-0 truncate">{displayUrl(item.url)}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Switch checked={item.ativo} onChange={() => toggle.mutate(item)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar"
                        aria-label="Editar"
                        icon={<Pencil className="size-4" />}
                        onClick={() => openEdit(item)}
                      />
                      <Button
                        variant="ghost-danger"
                        size="sm"
                        title="Excluir"
                        aria-label="Excluir"
                        icon={<Trash2 className="size-4" />}
                        onClick={() => setRemoving(item)}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Excluir link"
        message={`Deseja excluir ${removing?.titulo}?`}
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </>
  )
}
