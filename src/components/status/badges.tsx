import { Badge } from '@/components/ui/Badge'
import {
  CICLO_LABEL,
  FORMA_PAGAMENTO_LABEL,
  SITUACAO_ASSINATURA_LABEL,
  STATUS_APLICATIVO_MOBILE_LABEL,
  STATUS_ASSINATURA_LABEL,
  STATUS_PAGAMENTO_LABEL,
  STATUS_SITE_LABEL,
  TIPO_SITE_LABEL,
  enumLabel,
} from '@/lib/labels'
import type {
  CicloAssinatura,
  FormaPagamento,
  SituacaoAssinaturaSite,
  StatusAplicativoMobile,
  StatusAssinatura,
  StatusPagamento,
  StatusSite,
  TipoSite,
} from '@/types/enums'

export function StatusPagamentoBadge({ status }: { status?: StatusPagamento | null }) {
  const tone =
    status === 'RECEIVED' || status === 'CONFIRMED'
      ? 'success'
      : status === 'PENDING'
        ? 'warn'
        : status === 'OVERDUE' || status === 'FAILED'
          ? 'danger'
          : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_PAGAMENTO_LABEL, status)}</Badge>
}

export function StatusAssinaturaBadge({ status }: { status?: StatusAssinatura | null }) {
  const tone = status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_ASSINATURA_LABEL, status)}</Badge>
}

export function StatusSiteBadge({ status }: { status?: StatusSite | null }) {
  const tone =
    status === 'ATIVO' ? 'success' : status === 'EM_DESENVOLVIMENTO' ? 'warn' : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_SITE_LABEL, status)}</Badge>
}

export function StatusAplicativoMobileBadge({ status }: { status?: StatusAplicativoMobile | null }) {
  const tone =
    status === 'PRODUCAO'
      ? 'success'
      : status === 'DESENVOLVIMENTO'
        ? 'warn'
        : status === 'HOMOLOGACAO'
          ? 'info'
          : status === 'ENCERRADO'
            ? 'danger'
            : 'neutral'
  return <Badge tone={tone}>{enumLabel(STATUS_APLICATIVO_MOBILE_LABEL, status)}</Badge>
}

export function SituacaoBadge({ status }: { status?: SituacaoAssinaturaSite | null }) {
  const tone = status === 'EM_DIA' ? 'success' : status === 'VENCIDO' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{enumLabel(SITUACAO_ASSINATURA_LABEL, status)}</Badge>
}

export function TipoSiteBadge({ tipo }: { tipo?: TipoSite | null }) {
  return <Badge tone="info">{enumLabel(TIPO_SITE_LABEL, tipo)}</Badge>
}

export function FormaBadge({ forma }: { forma?: FormaPagamento | null }) {
  return <Badge>{enumLabel(FORMA_PAGAMENTO_LABEL, forma)}</Badge>
}

export function CicloBadge({ ciclo }: { ciclo?: CicloAssinatura | null }) {
  return <Badge>{enumLabel(CICLO_LABEL, ciclo)}</Badge>
}
