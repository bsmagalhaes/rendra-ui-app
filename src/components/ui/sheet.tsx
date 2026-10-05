import type { ReactNode } from 'react'
import { View } from 'react-native'
import { PickerPanel } from '../internal/picker-panel'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  /** Área fixa abaixo do conteúdo, para as ações da folha (use `ActionBar` com `sticky={false}`). */
  footer?: ReactNode
  testID?: string
}

/**
 * Folha inferior (`FOL-001`): sobe de baixo, com título, botão "Fechar" e uma área de rodapé para as
 * ações. Fecha pelo botão, tocando fora, arrastando para baixo ou pelo botão voltar do Android. É a
 * versão pública do painel que já abre o `Select` e o `DatePicker`; só existe no app (o web usa o
 * `Drawer`). Coloque-a fora de listas e de `ScrollView` com `gap`, porque deixa um contêiner vazio no
 * lugar onde está.
 *
 * O pano de fundo escuro atrás da folha também é um botão "Fechar" (tocar fora fecha): em testes, como o
 * Playwright em modo estrito, ache o botão pelo `testID`, não pelo nome "Fechar", que casa os dois. Com
 * `testID="x"`, o botão do cabeçalho é `${testID}-fechar` (`x-fechar`) e o pano de fundo é
 * `${testID}-overlay` (`x-overlay`).
 *
 * O botão "Fechar" do cabeçalho já existe: não ponha outro "Fechar" no `footer` nem no conteúdo. No
 * rodapé fica só o que a folha decide (ex.: "Limpar" e "Aplicar"), e fechar sem aplicar descarta o que
 * foi mexido, então guarde o rascunho fora do estado aplicado.
 */
export function Sheet({ open, onOpenChange, title, children, footer, testID }: SheetProps) {
  return (
    <PickerPanel open={open} onOpenChange={onOpenChange} trigger={null} title={title} footer={footer} testID={testID}>
      <View dataSet={{ rendra: 'FOL-001' }}>{children}</View>
    </PickerPanel>
  )
}
