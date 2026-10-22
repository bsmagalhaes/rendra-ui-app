/** Animação de troca de tela: sob movimento reduzido a tela entra por `fade`; fora dele, a padrão da plataforma. */
export function screenAnimation(reduced: boolean): 'fade' | 'default' {
  return reduced ? 'fade' : 'default'
}
