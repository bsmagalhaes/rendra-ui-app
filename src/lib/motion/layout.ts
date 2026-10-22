import { LinearTransition } from 'react-native-reanimated'
import { motionTokens } from '../../theme/motion'
import { easings } from './tokens'

/** Movimento na tela (reordenar, entrar ou sair da lista): 250 ms na curva `move`, a mesma do web. */
export function layoutTransition() {
  return LinearTransition.duration(motionTokens.duration.move).easing(easings.move)
}
