import { ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useDocumentTitle } from '../../../src/lib/use-document-title'
import { showcaseGroups } from '../../../src/config/showcase'
import { Container, PageHeader, Stack } from '../../../src/components/layout'
import { ShowcaseEntries } from '../../../src/components/showcase/showcase-entries'

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
          <ShowcaseEntries entries={group.entries} />
        </Stack>
      </Container>
    </ScrollView>
  )
}
