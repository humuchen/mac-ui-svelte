/**
 * 将 Lit 版主题（src/styles/theme.ts + shared-styles.ts）机械转换为
 * Svelte 版全局样式（src/lib/styles/theme.css）。
 *
 * 转换规则：
 *   :host                          -> .mac-scope
 *   :host([attr])                  -> .mac-scope[attr]
 *   :host(tag)                     -> tag.mac-scope
 *   :host *                        -> .mac-scope *
 *
 * 说明：Lit 中每个组件的 shadow root 都注入一份 token（:host 生效于宿主）；
 * Svelte 版无 Shadow DOM，改为在每个组件根元素上挂 .mac-scope 类，
 * token 语义与原来逐组件实例生效的行为完全一致（含按实例覆盖 data-theme）。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const readSrc = (p) => readFileSync(`${here}../../src/styles/${p}`, 'utf8')

function extractCss(source) {
  const start = source.indexOf('css`')
  const end = source.lastIndexOf('`')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('未找到 css 模板字面量')
  }
  return source.slice(start + 4, end).trimEnd().replace(/;\s*$/, '')
}

function convert(text) {
  return text
    .replace(/:host\(\[data-theme='dark'\]\)/g, ".mac-scope[data-theme='dark']")
    .replace(/:host\(\[([^\]]+)\]\)/g, '.mac-scope[$1]')
    // :host(tag)（宿主本身是 tag 元素，如 :host(button)）必须先于兜底规则转换，
    // 否则会被 :host\b 规则产出非法选择器 .mac-scope(tag)，导致 lightningcss 构建报错
    .replace(/:host\(([\w-]+)\)/g, '$1.mac-scope')
    .replace(/:host \*/g, '.mac-scope *')
    .replace(/:host\b/g, '.mac-scope')
}

const shared = convert(extractCss(readSrc('shared-styles.ts')))
const theme = convert(extractCss(readSrc('theme.ts')))

const banner = `/*
 * 本文件由 scripts/convert-theme.mjs 从 Lit 版 src/styles/theme.ts 自动生成，请勿手改。
 * 重新生成：node scripts/convert-theme.mjs
 */

`

const out = banner + shared.trim() + '\n\n' + theme.trim() + '\n'

mkdirSync(`${here}../src/lib/styles`, { recursive: true })
writeFileSync(`${here}../src/lib/styles/theme.css`, out)
console.log(
  `已生成 theme.css（${out.split('\n').length} 行）`,
)
