import { render, act } from '@testing-library/react-native'
import { BrandProvider } from '../brand/brand-provider'
import { showcaseGroups } from './showcase'

describe('showcaseGroups', () => {
  it('tem os grupos, na ordem final', () => {
    expect(showcaseGroups.map((group) => group.slug)).toEqual(['acoes', 'formulario', 'feedback', 'exibicao', 'layout', 'dados', 'planejamento'])
  })

  it('grupo acoes tem as 4 entradas finais', () => {
    const group = showcaseGroups.find((item) => item.slug === 'acoes')
    expect(group?.entries.map((entry) => entry.name)).toEqual(['Button', 'ButtonGroup', 'ActionBar', 'DropdownMenu'])
  })

  it('grupo layout tem as 6 entradas finais', () => {
    const group = showcaseGroups.find((item) => item.slug === 'layout')
    expect(group?.entries.map((entry) => entry.name)).toEqual([
      'Container',
      'Stack',
      'Inline',
      'Grid',
      'Section',
      'PageHeader',
    ])
  })

  it('grupo feedback tem as 10 entradas na ordem da spec (Spinner entra na Sincronizacao 1, Tarefa 8.1)', () => {
    const group = showcaseGroups.find((item) => item.slug === 'feedback')
    expect(group?.entries.map((entry) => entry.name)).toEqual([
      'BrandFeedbackIcon',
      'Alert',
      'Toast',
      'Progress',
      'Skeleton',
      'Spinner',
      'EmptyState',
      'InfoHint',
      'Modal',
      'Drawer',
    ])
  })

  it('formulario tem as 15 entradas na ordem da spec (a 13a, RichTextEditor, e da F3; Rating e Checklist, da Sincronizacao 2)', () => {
    const formulario = showcaseGroups.find((g) => g.slug === 'formulario')!
    expect(formulario.entries.map((e) => e.name)).toEqual([
      'Input',
      'Textarea',
      'Select',
      'Select (lista longa)',
      'Checkbox',
      'RadioGroup',
      'Switch',
      'Slider',
      'OtpInput',
      'DatePicker',
      'Field',
      'Formulário (RHF)',
      'RichTextEditor',
      'Rating',
      'Checklist',
    ])
  })

  it('exibicao tem as 12 entradas na ordem da spec (a 10a, DocumentViewer, e da F3; Stepper e Wizard, da Sincronizacao 2)', () => {
    const grupo = showcaseGroups.find((g) => g.slug === 'exibicao')
    expect(grupo?.entries.map((e) => e.name)).toEqual([
      'Card', 'Badge', 'Avatar', 'List', 'StatCard', 'Accordion', 'Tabs', 'Separator', 'BrandLogo', 'DocumentViewer', 'Stepper', 'Wizard',
    ])
  })

  it('dados tem o Chart com os 7 codigos CHT-001 a CHT-007', () => {
    const grupo = showcaseGroups.find((g) => g.slug === 'dados')
    expect(grupo?.entries.map((e) => e.name)).toEqual(['Chart', 'Timeline', 'Pagination', 'DataToolbar', 'Table'])
    expect(grupo?.entries[0]!.codes).toEqual(['CHT-001', 'CHT-002', 'CHT-003', 'CHT-004', 'CHT-005', 'CHT-006', 'CHT-007'])
  })

  it('as entradas da Sincronizacao 2 trazem os codigos do catalogo (RTG-001/002, CKLT-001, PAG-001, DTB-001, TAB-001, WIZ-002, WIZ-001)', () => {
    const codigos = (slug: string, name: string) => showcaseGroups.find((g) => g.slug === slug)!.entries.find((e) => e.name === name)!.codes
    expect(codigos('formulario', 'Rating')).toEqual(['RTG-001', 'RTG-002'])
    expect(codigos('formulario', 'Checklist')).toEqual(['CKLT-001'])
    expect(codigos('dados', 'Pagination')).toEqual(['PAG-001'])
    expect(codigos('dados', 'DataToolbar')).toEqual(['DTB-001'])
    expect(codigos('dados', 'Table')).toEqual(['TAB-001'])
    expect(codigos('exibicao', 'Stepper')).toEqual(['WIZ-002'])
    expect(codigos('exibicao', 'Wizard')).toEqual(['WIZ-001'])
  })

  it('a List mostra os codigos LIST-001 e LIST-002 (o exemplo ja traz o onReorder)', () => {
    const lista = showcaseGroups.find((g) => g.slug === 'exibicao')!.entries.find((e) => e.name === 'List')!
    expect(lista.codes).toEqual(['LIST-001', 'LIST-002'])
  })

  it('planejamento tem o Calendar e os dois Kanban o ImageViewer e o atendimento, com os codigos CAL-001, KANB-001, KANB-002, IMG-001 e CHAT-001 a CHAT-003', () => {
    const grupo = showcaseGroups.find((g) => g.slug === 'planejamento')
    expect(grupo?.entries.map((e) => e.name)).toEqual(['Calendar', 'Kanban', 'Kanban com destinos', 'ImageViewer', 'Atendimento (chat)'])
    expect(grupo?.entries.map((e) => e.codes)).toEqual([['CAL-001'], ['KANB-001'], ['KANB-002'], ['IMG-001'], ['CHAT-001', 'CHAT-002', 'CHAT-003']])
  })

  it('a vitrine tem 57 entradas reais, 4/15/10/12/6/5/5 por grupo (os grupos dados e planejamento sao da F3; a Sincronizacao 2 acrescenta 7) (Spinner no feedback, Tarefa 8.1; divergencia da spec registrada)', () => {
    const total = showcaseGroups.flatMap((g) => g.entries).length
    expect(total).toBe(57)
    expect(showcaseGroups.map((g) => g.entries.length)).toEqual([4, 15, 10, 12, 6, 5, 5])
  })

  it.each(['acoes', 'layout', 'feedback', 'formulario', 'exibicao', 'dados', 'planejamento'])(
    'toda entrada de %s renderiza sem lançar',
    async (slug) => {
      const group = showcaseGroups.find((item) => item.slug === slug)!
      for (const entry of group.entries) {
        const { unmount } = await render(<BrandProvider>{entry.render()}</BrandProvider>)
        await act(async () => {
          unmount()
        })
      }
    },
  )
})
