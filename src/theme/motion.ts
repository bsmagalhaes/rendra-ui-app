/**
 * Tokens de motion (dados puros, sem Reanimated). Os números das curvas, das durações e das
 * escalas são os mesmos do design system web (linguagem única); o app só os executa em
 * `src/lib/motion/tokens.ts`. Contrato público: `as const`, então nenhuma chave existente muda de
 * valor nem de forma; a linguagem nova só entra como chave nova (`src/theme/motion.test.ts` trava).
 */
export type MotionMode = 'off' | 'on'

export const motionTokens = {
  // `press` (toque) e `fast` (saída de overlay) valem o mesmo com propósitos diferentes; `move` desloca na tela.
  duration: { fast: 120, base: 200, slow: 320, draw: 420, pop: 420, pulse: 1000, press: 120, move: 250 },
  delay: { draw: 200 },
  ease: {
    out: [0.22, 1, 0.36, 1],
    inOut: [0.65, 0, 0.35, 1],
    spring: [0.34, 1.56, 0.64, 1],
    // Novas: `move` desloca na tela, `drawer` é a curva de gaveta e folha, `back` é o `spring` com nome honesto (quique).
    move: [0.77, 0, 0.175, 1],
    drawer: [0.32, 0.72, 0, 1],
    back: [0.34, 1.56, 0.64, 1],
  },
  spring: {
    snappy: { stiffness: 420, damping: 34, mass: 1 },
    soft: { stiffness: 220, damping: 26, mass: 1 },
    overshoot: { stiffness: 320, damping: 16, mass: 1 },
    // Forma "duração e razão de amortecimento" (a do web: duration e bounce). `settle` assenta sem passar do
    // ponto; `sheet` é a folha depois do gesto (quique mínimo, a velocidade do dedo entra no `velocity`);
    // `playful` só para a cota rara.
    settle: { duration: 400, dampingRatio: 1 },
    sheet: { duration: 300, dampingRatio: 0.8 },
    playful: { duration: 400, dampingRatio: 0.6 },
  },
  distance: { sm: 8, md: 16, lg: 24 },
  // LEGADO (B1: chave existente não muda de valor): `enter` 0,96 e `pop` 1,08 não são os papéis do web. O código novo
  // lê `scales`, com os mesmos nomes e valores do web (`SCALE` em `lib/motion/tokens.ts` do web).
  scale: { enter: 0.96, press: 0.97, pop: 1.08 },
  scales: { enter: 0.95, tooltip: 0.97, small: 0.9, press: 0.97, pop: 0.8, bump: 1.08 },
  // `cap` é o teto da cascata de rotina (8 itens); `max` fica como estava.
  stagger: { step: 60, max: 360, cap: 480 },
  // Reveal: entrada de uso único (dashboard, contador, gráfico), mais lenta que as interações do dia a dia.
  reveal: { enter: 600, stagger: 120, staggerMax: 960, count: 1200, draw: 900 },
} as const
