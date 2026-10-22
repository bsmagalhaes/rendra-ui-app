import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

const RevealContext = createContext(false)

/**
 * Marca uma região como "chegada de uso único" (o dashboard): lá o gráfico desenha em 900 ms depois
 * de 200 ms (token `reveal.draw`), e fora dela a rotina é `draw` (420 ms, sem atraso). Quem abre a
 * tela decide; o componente do gráfico só lê.
 */
export function RevealScope({ children }: { children: ReactNode }) {
  return <RevealContext.Provider value>{children}</RevealContext.Provider>
}

/** `true` dentro de um `RevealScope`. */
export function useReveal(): boolean {
  return useContext(RevealContext)
}
