import { useEffect, useState } from 'react'

/**
 * Adia o desmonte de um overlay enquanto a saída anima. Inativo, `mounted` é `open` no mesmo
 * render e nenhum timer é criado. Ativo, ao fechar mantém `mounted` por `exitMs`; reabrir cancela.
 */
export function usePresence(open: boolean, active: boolean, exitMs: number): boolean {
  const [lingering, setLingering] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (active) setLingering(!open)
  }

  useEffect(() => {
    if (!active || !lingering || open) return
    const timer = setTimeout(() => setLingering(false), exitMs)
    return () => clearTimeout(timer)
  }, [active, lingering, open, exitMs])

  if (!active) return open
  return open || lingering
}
