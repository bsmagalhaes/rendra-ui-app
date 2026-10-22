import { useState } from 'react'
import { ScrollView } from 'react-native'
import { useDocumentTitle } from '../../src/lib/use-document-title'
import { showcaseGroups } from '../../src/config/showcase'
import { Container, PageHeader, Stack } from '../../src/components/layout'
import { Switch } from '../../src/components/ui'
import { ShowcaseEntries } from '../../src/components/showcase/showcase-entries'
import { MotionProvider } from '../../src/lib/motion/context'
import type { MotionMode } from '../../src/theme/motion'

/** Os 30 componentes da frente de motion, na ordem do pedido (nomes das entradas de `showcase.tsx`). */
const NOMES = [
  'Modal',
  'Drawer',
  'Sheet',
  'DropdownMenu',
  'Toast',
  'Select',
  'DatePicker',
  'Tabs',
  'Accordion',
  'Wizard',
  'Kanban',
  'List',
  'Table',
  'Timeline',
  'Pagination',
  'Card',
  'Button',
  'Switch',
  'Checkbox',
  'RadioGroup',
  'Slider',
  'Input',
  'OtpInput',
  'Rating',
  'StatCard',
  'Chart',
  'Progress',
  'Skeleton',
  'EmptyState',
  'Alert',
] as const

const todas = showcaseGroups.flatMap((group) => group.entries)
const entradas = NOMES.flatMap((nome) => {
  const entrada = todas.find((item) => item.name === nome)
  return entrada ? [entrada] : []
})

export default function ComponentesMotionScreen() {
  useDocumentTitle('Componentes com motion')
  const [motion, setMotion] = useState<MotionMode>('on')

  return (
    <ScrollView tabIndex={0} className="flex-1 bg-background" contentContainerClassName="flex-grow">
      <Container padded>
        <Stack gap="8">
          <PageHeader
            title="Componentes com motion"
            description="Os 30 componentes com movimento, lado a lado com a vitrine. A chave liga e desliga o motion só aqui."
          />
          <Switch
            id="motion-seletor"
            checked={motion === 'on'}
            onCheckedChange={(ligado) => setMotion(ligado ? 'on' : 'off')}
            label="Motion ligado"
            description="O Toast depende da raiz do app e não muda por esta chave."
          />
          <MotionProvider motion={motion}>
            <ShowcaseEntries entries={entradas} />
          </MotionProvider>
        </Stack>
      </Container>
    </ScrollView>
  )
}
