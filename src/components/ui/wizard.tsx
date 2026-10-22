import { useState } from 'react'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native'
import { Text } from '../internal/text'
import { gapClass } from '../layout/tokens'
import { cn } from '../../lib/cn'
import { ActionBar } from './action-bar'
import { Progress } from './progress'
import { MotionPresence } from '../internal/motion-view'
import { slideIn } from '../../lib/motion/slide'

export interface WizardStep {
  id: string
  title: string
  description?: string
}

/** Estado de uma etapa (tipo público, paridade com o web; o formato de celular só destaca o erro da etapa atual). */
export type StepStatus = 'complete' | 'current' | 'pending' | 'error'

export interface StepperProps {
  steps: WizardStep[]
  /** Índice da etapa atual (0 é a primeira). */
  current: number
  /** Etapas com erro de validação (índices). */
  errors?: number[]
  testID?: string
}

/**
 * Indicador de etapas no formato de celular: "Etapa 2 de 5", barra de progresso e o nome da etapa.
 * `orientation` e `onStepClick` do web só existem no desktop e ficam fora.
 */
export function Stepper({ steps, current, errors = [], testID }: StepperProps) {
  const step = steps[current]
  return (
    <View testID={testID} dataSet={{ rendra: 'WIZ-002' }} className="min-w-0 flex-col gap-2">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text weight="medium" className="text-xs tabular-nums text-muted-foreground">
          {`Etapa ${current + 1} de ${steps.length}`}
        </Text>
        {errors.includes(current) ? (
          <Text weight="medium" className="text-xs text-destructive-soft-foreground">
            Revise esta etapa
          </Text>
        ) : null}
      </View>
      <Progress value={((current + 1) / steps.length) * 100} size="sm" tone="brand" accessibilityLabel="Progresso" />
      <Text weight="semibold" className="text-base text-foreground">
        {step?.title}
      </Text>
    </View>
  )
}

export interface WizardProps {
  steps: WizardStep[]
  /** Conteúdo de cada etapa, na mesma ordem. */
  children: ReactNode[]
  /** Valida a etapa antes de avançar. Devolva `false` para bloquear (e marcar erro). */
  onValidateStep?: (index: number) => boolean | Promise<boolean>
  onFinish?: () => void | Promise<void>
  onCancel?: () => void
  finishLabel?: string
  /** Rótulo do botão da esquerda na primeira etapa (com `onCancel`). Padrão "Cancelar". */
  cancelLabel?: string
  /** Rótulo do botão da esquerda a partir da segunda etapa. Padrão "Voltar". */
  backLabel?: string
  /** Rótulo do botão da direita nas etapas que não são a última. Padrão "Avançar". */
  nextLabel?: string
  /**
   * Chamado ao tocar em "Pular", que avança para a próxima etapa sem validar a atual. Sem esta
   * prop não há "Pular". A ação fica no menu "Mais ações" do rodapé e não aparece na última etapa.
   */
  onSkip?: () => void
  /** Texto da ação de pular. Padrão "Pular". */
  skipLabel?: string
  /**
   * Espaço entre o indicador, o conteúdo da etapa e o rodapé: `'section'` (padrão, 32 px) ou
   * `'fields'` (16 px). O espaço interno do conteúdo da etapa não muda.
   */
  gap?: 'fields' | 'section'
  /** Rodapé fixo na parte de baixo da tela. Padrão: não, segue junto do conteúdo. */
  stickyFooter?: boolean
}

/**
 * Troca de etapa em `motion="on"`: o conteúdo novo entra com um deslocamento curto na direção da
 * mudança mais fade (só fade com movimento reduzido). Em `off` devolve os filhos como estão (a porta
 * `MotionPresence` não cria nó). No navegador a entrada vai por valores animados, e cada troca de
 * etapa remonta o envoltório (`resetKey`).
 */
function StepTransition({ index, children }: { index: number; children: ReactNode }) {
  const [last, setLast] = useState(index)
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  if (index !== last) {
    setDirection(index > last ? 'left' : 'right')
    setLast(index)
  }
  return (
    <MotionPresence resetKey={String(index)} testID="wizard-etapa" enter={(r) => slideIn(direction, r)}>
      {children}
    </MotionPresence>
  )
}

/**
 * Cadastro em etapas, com validação por etapa e rodapé Voltar / Avançar. Não é controlável: a
 * etapa atual nasce em 0 e só muda por dentro. O estado de cada etapa que precisa sobreviver ao
 * "Voltar" fica no consumidor, porque só o filho da etapa atual é montado.
 */
export function Wizard({
  steps,
  children,
  onValidateStep,
  onFinish,
  onCancel,
  finishLabel = 'Concluir',
  cancelLabel = 'Cancelar',
  backLabel = 'Voltar',
  nextLabel = 'Avançar',
  onSkip,
  skipLabel = 'Pular',
  gap = 'section',
  stickyFooter = false,
}: WizardProps) {
  const [current, setCurrent] = useState(0)
  const [errors, setErrors] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const last = current === steps.length - 1

  const next = async () => {
    setBusy(true)
    try {
      let ok = true
      if (onValidateStep) {
        try {
          ok = await onValidateStep(current)
        } catch {
          // Validação que rejeita conta como etapa não validada: fica marcada com erro, sem promessa solta.
          ok = false
        }
      }
      if (!ok) {
        setErrors((e) => [...new Set([...e, current])])
        return
      }
      setErrors((e) => e.filter((x) => x !== current))
      if (last) await onFinish?.()
      else setCurrent((c) => c + 1)
    } finally {
      setBusy(false)
    }
  }

  const skip = () => {
    // Pular não valida e não mexe nos erros: só avança e avisa o consumidor.
    onSkip?.()
    setCurrent((c) => c + 1)
  }

  return (
    <View dataSet={{ rendra: 'WIZ-001' }} className={cn('min-w-0 flex-col', gapClass[gap])}>
      <Stepper steps={steps} current={current} errors={errors} />
      <View className="min-w-0 flex-col gap-6">
        <StepTransition index={current}>{children[current]}</StepTransition>
      </View>
      <ActionBar
        testID="wizard-rodape"
        sticky={stickyFooter}
        cancel={
          current > 0
            ? { label: backLabel, icon: <ArrowLeft className="text-foreground" />, onPress: () => setCurrent((c) => c - 1) }
            : onCancel
              ? { label: cancelLabel, onPress: onCancel }
              : undefined
        }
        secondary={onSkip && !last ? [{ label: skipLabel, onPress: skip, disabled: busy }] : undefined}
        primary={{
          label: last ? finishLabel : nextLabel,
          icon: last ? <Check className="text-primary-foreground" /> : <ArrowRight className="text-primary-foreground" />,
          onPress: next,
          loading: busy,
          loadingLabel: last ? 'Concluindo...' : 'Validando...',
        }}
      />
    </View>
  )
}
