// Mesmo desvio H3 dos demais scripts (achado B2 do Opus): `require` com cast estrutural local.
const { readFileSync } = require('fs') as { readFileSync: (caminho: string, codificacao: 'utf8') => string }
const { Buffer: NodeBuffer } = require('buffer') as {
  Buffer: { from: (dados: Uint8Array) => { toString: (codificacao: 'base64') => string } }
}

import { PHONE_CSS_PATH } from './phone-frame'

export interface OgHtmlInput {
  produto: string
  tagline: string
  /** Capturas cruas (sem moldura), em ordem: a moldura vem de `docs/phone.css`. */
  imagens: Uint8Array[]
  /** SVG do selo da família. Só o Rendra informa; um clone não herda a marca (D4). */
  selo?: string
}

const escapar = (texto: string): string =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Última palavra em destaque: `Rendra App` vira `Rendra <span>App</span>`. */
function comDestaque(texto: string): string {
  const partes = texto.trim().split(/\s+/)
  if (partes.length < 2) return escapar(texto)
  const ultima = partes.pop() as string
  return `${escapar(partes.join(' '))} <span>${escapar(ultima)}</span>`
}

/**
 * Página de 1200x630 da `og-image.jpg`, no tema escuro da família (adendo de identidade): fundo
 * #111111, marca em mono, título em #f2f2f2 com a palavra-chave em #e8650a, tagline em #c4c4c4,
 * rodapé em #9a9a9a e dois aparelhos à direita, com a moldura de `docs/phone.css`.
 */
export function buildOgHtml({ produto, tagline, imagens, selo }: OgHtmlInput): string {
  const css = readFileSync(PHONE_CSS_PATH, 'utf8')
  const aparelhos = imagens
    .slice(0, 2)
    .map(
      (png, i) =>
        `<div class="slot slot-${i + 1}"><div class="phone"><img alt="" src="data:image/png;base64,${NodeBuffer.from(png).toString('base64')}"></div></div>`,
    )
    .join('')
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
html,body{margin:0;background:#111111}
${css}
.og{position:relative;width:1200px;height:630px;overflow:hidden;background:#111111;color:#f2f2f2;font-family:"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif}
.marca{position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:14px;font-family:ui-monospace,"Cascadia Code","JetBrains Mono",Consolas,monospace;font-size:20px;letter-spacing:.08em}
.marca b{font-weight:700}
.marca span,h1 span{color:#e8650a}
h1{position:absolute;left:64px;top:210px;width:560px;margin:0;font-size:84px;line-height:1.02;font-weight:800}
.tagline{position:absolute;left:64px;top:410px;width:520px;margin:0;font-size:28px;line-height:1.35;color:#c4c4c4}
.rodape{position:absolute;left:64px;bottom:48px;font-family:ui-monospace,"Cascadia Code","JetBrains Mono",Consolas,monospace;font-size:16px;color:#9a9a9a}
.slot{position:absolute;width:282px;height:590px}
.slot .phone{max-width:none;transform:scale(.68);transform-origin:top left}
.slot-1{left:640px;top:36px}
.slot-2{left:920px;top:96px}
</style></head><body><div class="og" style="width:1200px;height:630px">
<div class="marca">${selo ?? ''}<b>${comDestaque(produto.toUpperCase())}</b></div>
<h1>${comDestaque(produto)}</h1>
<p class="tagline">${escapar(tagline)}</p>
<div class="rodape">React Native · Expo · NativeWind</div>
${aparelhos}
</div></body></html>`
}
