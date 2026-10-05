import { ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useDocumentTitle } from '../../../src/lib/use-document-title'
import { showcaseGroups } from '../../../src/config/showcase'
import { Container, Inline, PageHeader, Section, Stack } from '../../../src/components/layout'
import { Badge, Card, CardContent } from '../../../src/components/ui'

/**
 * Exemplos cuja raiz já é uma superfície (cartão, indicador, tabela, calendário, quadro, formulário
 * em seções): não ganham outro cartão por fora, para não ter cartão dentro de cartão.
 */
const COM_SUPERFICIE_PROPRIA = new Set([
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

export function generateStaticParams() {
  return showcaseGroups.map((group) => ({ slug: group.slug }))
}

export default function ComponentesSlugScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const group = showcaseGroups.find((item) => item.slug === slug)
  useDocumentTitle(group ? `Componentes: ${group.title}` : 'Componentes')

  if (!group) {
    return (
      <Container padded className="flex-1 bg-background">
        <PageHeader title="Grupo não encontrado" showTitle />
      </Container>
    )
  }

  return (
    <ScrollView tabIndex={0} className="flex-1 bg-background" contentContainerClassName="flex-grow">
      <Container padded>
        <Stack gap="8">
          <PageHeader title={group.title} showTitle />
          {group.entries.map((entry) => (
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
        </Stack>
      </Container>
    </ScrollView>
  )
}
