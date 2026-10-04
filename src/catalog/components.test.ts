import {
  CATALOG,
  type ComponentCatalogEntry,
  assertCatalogIntegrity,
  catalogByComponent,
  filesMissingCatalogEntry,
  findComponentsWithMultipleDefaults,
  findComponentsWithoutDefault,
  findDuplicateCodes,
  findInvalidFormatCodes,
  findPresetCollisions,
  getCatalogEntry,
  resolveCatalogCode,
} from './components'

const entradaFabricada = (over: Partial<ComponentCatalogEntry>): ComponentCatalogEntry => ({
  code: 'ZZZ-001',
  name: 'Fabricado',
  component: 'Fabricado',
  file: 'components/ui/fabricado.tsx',
  variantProps: {},
  whenToUse: 'Teste',
  ...over,
})

// Lista literal dos 36 arquivos catalogaveis de src/components/ui (sem index.ts, sem teste;
// eram 33 ate a Tarefa 8.1, que acrescentou spinner.tsx, 34 ate a F2 A.2, que acrescentou rendra-credit.tsx, e 35 ate a F2 C.1, que acrescentou error-page.tsx),
// igual ao levantamento (Fable) secao 3.3.2 e ao veredito do Opus (B6).
const ARQUIVOS_REAIS_DE_COMPONENTE = [
  'components/ui/accordion.tsx',
  'components/ui/action-bar.tsx',
  'components/ui/alert.tsx',
  'components/ui/avatar.tsx',
  'components/ui/badge.tsx',
  'components/ui/brand-feedback-icon.tsx',
  'components/ui/brand-logo.tsx',
  'components/ui/button.tsx',
  'components/ui/button-group.tsx',
  'components/ui/calendar.tsx',
  'components/ui/card.tsx',
  'components/ui/chart.tsx',
  'components/ui/chat/channel-badge.tsx',
  'components/ui/chat/chat-thread.tsx',
  'components/ui/chat/chat-composer.tsx',
  'components/ui/chat/conversation-list.tsx',
  'components/ui/checkbox.tsx',
  'components/ui/date-picker.tsx',
  'components/ui/document-viewer.tsx',
  'components/ui/document-viewer-fallback.tsx',
  'components/ui/drawer.tsx',
  'components/ui/dropdown-menu.tsx',
  'components/ui/empty-state.tsx',
  'components/ui/error-page.tsx',
  'components/ui/field.tsx',
  'components/ui/form.tsx',
  'components/ui/image-viewer.tsx',
  'components/ui/info-hint.tsx',
  'components/ui/input.tsx',
  'components/ui/kanban.tsx',
  'components/ui/list.tsx',
  'components/ui/modal.tsx',
  'components/ui/otp-input.tsx',
  'components/ui/progress.tsx',
  'components/ui/radio-group.tsx',
  'components/ui/wizard.tsx',
  'components/ui/table.tsx',
  'components/ui/data-toolbar.tsx',
  'components/ui/pagination.tsx',
  'components/ui/checklist.tsx',
  'components/ui/rating.tsx',
  'components/ui/rendra-credit.tsx',
  'components/ui/rich-text-editor.tsx',
  'components/ui/select.tsx',
  'components/ui/separator.tsx',
  'components/ui/skeleton.tsx',
  'components/ui/slider.tsx',
  'components/ui/spinner.tsx',
  'components/ui/stat-card.tsx',
  'components/ui/switch.tsx',
  'components/ui/tabs.tsx',
  'components/ui/textarea.tsx',
  'components/ui/timeline.tsx',
  'components/ui/toast.tsx',
]

// Tabela literal copiada do Apendice A do veredito do Opus (46 entradas do Bloco 1, sem
// SPIN-001; SPIN-001 entra na Tarefa 8.1, achado C2; LIST-002 entra com o `onReorder` na 1.4.0), para provar paridade
// valor a valor, nao so a contagem.
const TABELA_PARIDADE: [string, string, Record<string, unknown>, true | undefined][] = [
  ['ACRN-001', 'Accordion', {}, undefined],
  ['ACB-001', 'ActionBar', {}, undefined],
  ['ALRT-001', 'Alert', {}, undefined],
  ['AVT-001', 'Avatar', {}, undefined],
  ['AVT-002', 'AvatarGroup', {}, undefined],
  ['BDG-001', 'Badge', {}, undefined],
  ['BFI-001', 'BrandFeedbackIcon', {}, undefined],
  ['LOGO-001', 'BrandLogo', {}, undefined],
  ['BTN-001', 'Button', { variant: 'primary' }, true],
  ['BTN-002', 'Button', { variant: 'secondary' }, undefined],
  ['BTN-003', 'Button', { variant: 'outline' }, undefined],
  ['BTN-004', 'Button', { variant: 'ghost' }, undefined],
  ['BTN-005', 'Button', { variant: 'destructive' }, undefined],
  ['BTN-006', 'Button', { variant: 'link' }, undefined],
  ['BTNG-001', 'ButtonGroup', {}, undefined],
  ['CAL-001', 'Calendar', {}, undefined],
  ['CARD-001', 'Card', {}, undefined],
  ['CHT-001', 'Chart', { type: 'line' }, true],
  ['CHT-002', 'Chart', { type: 'bar' }, undefined],
  ['CHT-003', 'Chart', { type: 'area' }, undefined],
  ['CHT-004', 'Chart', { type: 'pie' }, undefined],
  ['CHT-005', 'Chart', { type: 'combo' }, undefined],
  ['CHT-006', 'Chart', { type: 'gauge' }, undefined],
  ['CHT-007', 'Chart', { type: 'funnel' }, undefined],
  ['CHAT-001', 'ConversationList', {}, undefined],
  ['CHAT-002', 'ChatThread', {}, undefined],
  ['CHAT-003', 'ChatComposer', {}, undefined],
  ['CHK-001', 'Checkbox', {}, undefined],
  ['CHK-002', 'CheckboxGroup', {}, undefined],
  ['DTP-001', 'DatePicker', {}, undefined],
  ['GAV-001', 'Drawer', {}, undefined],
  ['DDM-001', 'DropdownMenuContent', {}, undefined],
  ['VAZ-001', 'EmptyState', {}, undefined],
  ['ERRO-001', 'ErrorPage', {}, undefined],
  ['FLD-001', 'Field', {}, undefined],
  ['FLD-002', 'Label', {}, undefined],
  ['FORM-001', 'Form', {}, undefined],
  ['FORM-002', 'FormSection', {}, undefined],
  ['IMG-001', 'ImageViewer', {}, undefined],
  ['INFO-001', 'InfoHint', {}, undefined],
  ['CAMP-001', 'Input', {}, undefined],
  ['KANB-001', 'Kanban', {}, true],
  ['KANB-002', 'Kanban', { hasDropTargets: true }, undefined],
  ['LIST-001', 'List', {}, true],
  ['LIST-002', 'List', { sortable: true }, undefined],
  ['MOD-001', 'Modal', { type: 'confirm' }, true],
  ['MOD-002', 'Modal', { type: 'form' }, undefined],
  ['MOD-003', 'Modal', { type: 'info' }, undefined],
  ['OTP-001', 'OtpInput', {}, undefined],
  ['PROG-001', 'Progress', {}, undefined],
  ['RDO-001', 'RadioGroup', { variant: 'list' }, true],
  ['RDO-002', 'RadioGroup', { variant: 'cards' }, undefined],
  ['RTG-001', 'Rating', { variant: 'stars' }, true],
  ['RTG-002', 'Rating', { variant: 'scale' }, undefined],
  ['CKLT-001', 'Checklist', {}, undefined],
  ['PAG-001', 'Pagination', {}, undefined],
  ['DTB-001', 'DataToolbar', {}, undefined],
  ['TAB-001', 'Table', {}, undefined],
  ['WIZ-002', 'Stepper', {}, undefined],
  ['WIZ-001', 'Wizard', {}, undefined],
  ['CRED-001', 'RendraCredit', {}, undefined],
  ['DOC-001', 'DocumentViewer', {}, undefined],
  ['RTE-001', 'RichTextEditor', {}, undefined],
  ['SEL-001', 'Select', {}, undefined],
  ['SEP-001', 'Separator', {}, undefined],
  ['SKEL-001', 'Skeleton', {}, undefined],
  ['SLD-001', 'Slider', {}, undefined],
  ['SPIN-001', 'Spinner', {}, undefined],
  ['STAT-001', 'StatCard', {}, undefined],
  ['SWT-001', 'Switch', {}, undefined],
  ['ABA-001', 'Tabs', { variant: 'line' }, true],
  ['ABA-002', 'Tabs', { variant: 'pill' }, undefined],
  ['TXT-001', 'Textarea', {}, undefined],
  ['TLN-001', 'Timeline', {}, undefined],
  ['TST-001', 'toast', {}, undefined],
]

describe('catalogo de componentes', () => {
  it('integridade: sem duplicado, sem formato invalido, exatamente um isDefault por componente com mais de uma variante', () => {
    expect(() => assertCatalogIntegrity()).not.toThrow()
  })

  it('nenhum arquivo real de src/components/ui fica sem entrada', () => {
    expect(filesMissingCatalogEntry(ARQUIVOS_REAIS_DE_COMPONENTE, CATALOG)).toEqual([])
  })

  it('nenhum codigo colide com [TCMN]\\d+ dos presets de modelo (o web para em [TCM]; o app ganha N)', () => {
    expect(findPresetCollisions(CATALOG)).toEqual([])
    expect(findPresetCollisions([entradaFabricada({ code: 'ZN1-001' })])).toEqual(['ZN1-001'])
  })

  it('resolveCatalogCode resolve RendraCredit para CRED-001', () => {
    expect(resolveCatalogCode('RendraCredit', {})).toBe('CRED-001')
  })

  it('resolveCatalogCode resolve ErrorPage para ERRO-001', () => {
    expect(resolveCatalogCode('ErrorPage', {})).toBe('ERRO-001')
  })

  it('resolveCatalogCode resolve cada tipo do Chart para o seu codigo CHT', () => {
    const tipos = ['line', 'bar', 'area', 'pie', 'combo', 'gauge', 'funnel']
    expect(tipos.map((type) => resolveCatalogCode('Chart', { type }))).toEqual([
      'CHT-001', 'CHT-002', 'CHT-003', 'CHT-004', 'CHT-005', 'CHT-006', 'CHT-007',
    ])
  })

  it('resolveCatalogCode distingue o Kanban com destinos (KANB-002) do padrao (KANB-001)', () => {
    expect(resolveCatalogCode('Kanban', {})).toBe('KANB-001')
    expect(resolveCatalogCode('Kanban', { hasDropTargets: false })).toBe('KANB-001')
    expect(resolveCatalogCode('Kanban', { hasDropTargets: true })).toBe('KANB-002')
  })

  it('resolveCatalogCode acha a variante certa', () => {
    expect(resolveCatalogCode('Button', { variant: 'ghost' })).toBe('BTN-004')
    expect(resolveCatalogCode('Modal', { type: 'confirm' })).toBe('MOD-001')
    expect(resolveCatalogCode('Tabs', { variant: 'pill' })).toBe('ABA-002')
    expect(resolveCatalogCode('List', {})).toBe('LIST-001')
    expect(resolveCatalogCode('List', { sortable: true })).toBe('LIST-002')
  })

  it('resolveCatalogCode lanca para componente sem entrada no catalogo, igual ao web (item M1 do veredito do Fable, quebra versionada na 1.0.0)', () => {
    expect(() => resolveCatalogCode('NaoExiste', {})).toThrow(
      /Catálogo: nenhum código cadastrado para o componente "NaoExiste"/,
    )
  })

  it('getCatalogEntry acha a entrada pelo codigo e devolve undefined se nao existir', () => {
    expect(getCatalogEntry('BTN-001')).toMatchObject({ component: 'Button' })
    expect(getCatalogEntry('XXX-999')).toBeUndefined()
  })

  it('catalogByComponent agrupa as variantes de um componente', () => {
    expect(catalogByComponent('Button')).toHaveLength(6)
    expect(catalogByComponent('Accordion')).toHaveLength(1)
  })

  it('findDuplicateCodes acusa codigo repetido e nao acusa o catalogo real', () => {
    expect(findDuplicateCodes(CATALOG)).toEqual([])
    const comDuplicado = [entradaFabricada({ code: 'DUP-001' }), entradaFabricada({ code: 'DUP-001' })]
    expect(findDuplicateCodes(comDuplicado)).toEqual(['DUP-001'])
  })

  it('findInvalidFormatCodes acusa formato fora do padrao e nao acusa o catalogo real', () => {
    expect(findInvalidFormatCodes(CATALOG)).toEqual([])
    const invalido = [entradaFabricada({ code: 'btn1' })]
    expect(findInvalidFormatCodes(invalido)).toEqual(['btn1'])
  })

  it('findComponentsWithoutDefault acusa componente com mais de uma variante sem isDefault', () => {
    expect(findComponentsWithoutDefault(CATALOG)).toEqual([])
    const semPadrao = [
      entradaFabricada({ code: 'FAB-001', component: 'Fabricado', variantProps: { a: 1 } }),
      entradaFabricada({ code: 'FAB-002', component: 'Fabricado', variantProps: { a: 2 } }),
    ]
    expect(findComponentsWithoutDefault(semPadrao)).toEqual(['Fabricado'])
  })

  it('findComponentsWithMultipleDefaults acusa componente com mais de um isDefault', () => {
    expect(findComponentsWithMultipleDefaults(CATALOG)).toEqual([])
    const doisPadroes = [
      entradaFabricada({ code: 'FAB-001', component: 'Fabricado', isDefault: true }),
      entradaFabricada({ code: 'FAB-002', component: 'Fabricado', isDefault: true }),
    ]
    expect(findComponentsWithMultipleDefaults(doisPadroes)).toEqual(['Fabricado'])
  })

  it('assertCatalogIntegrity lanca para cada tipo de problema fabricado', () => {
    expect(() => assertCatalogIntegrity([entradaFabricada({ code: 'DUP-001' }), entradaFabricada({ code: 'DUP-001' })])).toThrow(/duplicado/)
    expect(() => assertCatalogIntegrity([entradaFabricada({ code: 'btn1' })])).toThrow(/formato/)
    expect(() => assertCatalogIntegrity([entradaFabricada({ code: 'T1' })])).toThrow(/colide/)
    expect(() =>
      assertCatalogIntegrity([
        entradaFabricada({ code: 'FAB-001', component: 'Fabricado', variantProps: { a: 1 } }),
        entradaFabricada({ code: 'FAB-002', component: 'Fabricado', variantProps: { a: 2 } }),
      ])
    ).toThrow(/sem isDefault/)
    expect(() =>
      assertCatalogIntegrity([
        entradaFabricada({ code: 'FAB-001', component: 'Fabricado', isDefault: true }),
        entradaFabricada({ code: 'FAB-002', component: 'Fabricado', isDefault: true }),
      ])
    ).toThrow(/mais de um isDefault/)
  })

  it('paridade com o web: 75 entradas (as 49 da F1b e F2 e da Sincronizacao 1, CHT-001 a CHT-007, TLN-001, CAL-001, KANB-001, KANB-002, IMG-001, CHAT-001, CHAT-002, CHAT-003, RTE-001 e DOC-001 da F3, as da Sincronizacao 2 e LIST-002 da 1.4.0) com code/component/variantProps/isDefault iguais (Apendice A do veredito do Opus)', () => {
    expect(CATALOG).toHaveLength(75)
  })

  it.each(TABELA_PARIDADE)('%s (%s) casa code/component/variantProps/isDefault', (code, component, variantProps, isDefault) => {
    const esperado: Record<string, unknown> = { code, component, variantProps }
    if (isDefault) esperado.isDefault = true
    const entry = CATALOG.find((e) => e.code === code)
    expect(entry).toMatchObject(esperado)
    expect(entry?.isDefault).toBe(isDefault)
  })
})
