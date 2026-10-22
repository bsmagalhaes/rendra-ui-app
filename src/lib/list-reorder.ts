/**
 * Conta pura do reordenar da `List` (arraste, menu Mover, teclado). Fica em `src/lib` no mesmo
 * padrao de `kanban-move.ts`: sem React, sem layout, testavel com alturas dadas (no Jest nao ha
 * layout real). As funcoes marcadas `'worklet'` rodam dentro do `useAnimatedStyle` da linha.
 */

/** Nova lista com o item de `from` em `to`. Imutavel; devolve a mesma lista se nada muda. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const last = items.length - 1
  if (from === to || from < 0 || to < 0 || from > last || to > last) return items
  const next = items.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** Texto do anuncio ao leitor de tela depois de mover (`to` e o indice de 0 a total - 1). */
export function announcePosition(label: string, to: number, total: number): string {
  return `${label}, posição ${to + 1} de ${total}`
}

/** Alturas efetivas das linhas: a sem medida (ou 0) vale a media das medidas; `null` sem nenhuma medida. */
function effectiveSizes(heights: (number | undefined)[]): number[] | null {
  'worklet'
  const measured = heights.filter((h): h is number => typeof h === 'number' && h > 0)
  if (measured.length === 0) return null
  const average = measured.reduce((sum, h) => sum + h, 0) / measured.length
  return heights.map((h) => (typeof h === 'number' && h > 0 ? h : average))
}

/** Topo (no espaco do conteudo) e altura da linha `index`, contando o separador `gap`; `null` se nao der para medir. */
export function rowSpan(index: number, heights: (number | undefined)[], gap: number): { top: number; size: number } | null {
  'worklet'
  const sizes = effectiveSizes(heights)
  if (!sizes || index < 0 || index >= sizes.length) return null
  let top = 0
  for (let i = 0; i < index; i += 1) top += sizes[i] + gap
  return { top, size: sizes[index] }
}

/**
 * Indice de destino do arraste. `heights` sao as alturas medidas das linhas, na ordem atual
 * (`undefined` ou 0 = linha sem medida, por virtualizacao); `gap` e a altura do separador entre
 * linhas; `dy` e o deslocamento vertical da linha arrastada no espaco do conteudo. Linha sem
 * medida vale a media das medidas; sem nenhuma medida o destino nao muda. O resultado fica entre
 * 0 e o ultimo indice.
 */
export function dragTarget(from: number, dy: number, heights: (number | undefined)[], gap: number): number {
  'worklet'
  const span = rowSpan(from, heights, gap)
  const sizes = effectiveSizes(heights)
  if (!span || !sizes) return from
  const center = span.top + span.size / 2 + dy
  if (center < 0) return 0
  let top = 0
  let found = 0
  for (let index = 0; index < sizes.length; index += 1) {
    if (center >= top) found = index
    top += sizes[index] + gap
  }
  return found
}

/**
 * Passo de rolagem (px por tick) para o dedo na posicao `position` de uma area de altura `height`.
 * Negativo na zona superior, positivo na inferior, 0 no meio; cresce de 0 ate `step` cheio na borda.
 */
export function autoScrollDelta(position: number, height: number, zone: number, step: number): number {
  if (zone <= 0 || height <= 0) return 0
  const top = (zone - position) / zone
  if (top > 0) return -step * Math.min(1, top)
  const bottom = (position - (height - zone)) / zone
  if (bottom > 0) return step * Math.min(1, bottom)
  return 0
}

/** Mantem o deslocamento da rolagem dentro do conteudo. */
export function clampScrollOffset(offset: number, content: number, viewport: number): number {
  const max = Math.max(0, content - viewport)
  return Math.min(max, Math.max(0, offset))
}

/**
 * Deslocamento vertical de uma linha durante o arraste: a arrastada segue o dedo (`dragY`) e as
 * linhas entre a origem e o destino cedem `shift` (altura da arrastada mais o separador).
 */
export function reorderRowOffset(index: number, active: number, target: number, dragY: number, shift: number): number {
  'worklet'
  if (active < 0) return 0
  if (index === active) return dragY
  if (active < target && index > active && index <= target) return -shift
  if (active > target && index >= target && index < active) return shift
  return 0
}
