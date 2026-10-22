import { Badge, Card, CardContent } from '../ui'
import { Inline, Section } from '../layout'
import type { ShowcaseEntry } from '../../config/showcase'

/**
 * Exemplos cuja raiz já é uma superfície (cartão, indicador, tabela, calendário, quadro, formulário
 * em seções): não ganham outro cartão por fora, para não ter cartão dentro de cartão.
 */
export const COM_SUPERFICIE_PROPRIA = new Set([
  'Card',
  'StatCard',
  'OtpInput',
  'Formulário (RHF)',
  'DataToolbar',
  'Table',
  'Calendar',
  'Kanban',
  'Kanban com destinos',
])

/**
 * Seções da vitrine: para cada entrada, `Section` com os selos de código e o exemplo dentro de um
 * `Card` (exceto os de superfície própria). Compartilhado por `/componentes/[slug]` e por
 * `/componentes-motion`; devolve só as seções (sem nó extra), para ficarem filhas diretas do `Stack`.
 */
export function ShowcaseEntries({ entries }: { entries: readonly ShowcaseEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <Section key={entry.name} title={entry.name} description={entry.description}>
          {entry.codes && entry.codes.length > 0 ? (
            <Inline gap="2">
              {entry.codes.map((code) => (
                <Badge key={code} tone="neutral">
                  {code}
                </Badge>
              ))}
            </Inline>
          ) : null}
          {COM_SUPERFICIE_PROPRIA.has(entry.name) ? (
            entry.render()
          ) : (
            <Card>
              <CardContent>{entry.render()}</CardContent>
            </Card>
          )}
        </Section>
      ))}
    </>
  )
}
