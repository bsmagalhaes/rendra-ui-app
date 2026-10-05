import type { TestInstance } from 'test-renderer'

// Cores que uma classe `border-*` pode trazer. Largura (`border`, `border-t`, `border-b-2`...) sem
// nenhuma delas no mesmo literal cai na cor padrão do react-native-web e do RN: preta.
const COR_DE_BORDA = /^border-(border|input|primary|secondary|destructive|success|warning|info|accent|ring|muted|transparent|foreground|card|background|popover)/
const LARGURA_DE_BORDA = /^border(-[trblxyse])?(-\d+)?$/

/** Classes de um nó hospedeiro, em lista (vazia quando não há `className` em texto). */
export function classesDo(no: TestInstance): string[] {
  const valor = no.props.className
  return typeof valor === 'string' ? valor.split(/\s+/).filter(Boolean) : []
}

/** Nós com largura de borda e sem cor de borda no mesmo literal (borda preta no web e no nativo). */
export function bordasSemCor(container: TestInstance): string[] {
  return container
    .queryAll((no) => {
      const classes = classesDo(no)
      return classes.some((c) => LARGURA_DE_BORDA.test(c)) && !classes.some((c) => COR_DE_BORDA.test(c))
    })
    .map((no) => classesDo(no).join(' '))
}
