/**
 * Stories 属性配置冒烟测试。
 *
 * 背景：argTypes 声明了 boolean / number / text 控件、但合并后的 args 中该键
 * 缺失（undefined）时，Controls 面板会退化为 "Set boolean/string/number" 按钮，
 * 需要点击两次才能操作。本测试静态校验：每个 story 的 args（meta + story 级合并）
 * 必须覆盖所有这类控件键，白名单中的键为「组件默认值为 undefined 的可选属性」，
 * 保留 Set 按钮是 Storybook 对可选参数的标准交互。
 */
import { describe, expect, it } from 'vitest'

/** 合并后 args 允许缺失的控件键（组件默认值为 undefined 的可选属性）。 */
const OPTIONAL_KEYS = new Set([
  // 受控值 / 可选数值：默认 undefined，补默认值会改变受控语义或格式化行为
  'value',
  'defaultValue',
  'max',
  'precision',
  'maxLength',
  'inputMaxLength',
  'placeholder',
  'rowKey',
  'rowSelection',
  'expandedKeys',
  'selectedKeys',
  'checkedKeys',
])

/** 会触发 "Set xxx" 退化按钮的控件类型。 */
const DEGRADABLE_CONTROLS = new Set(['boolean', 'number', 'text', 'range'])

function collectControlKeys(argTypes: Record<string, any> | undefined): string[] {
  if (!argTypes) return []
  return Object.entries(argTypes)
    .filter(([, t]) => t && DEGRADABLE_CONTROLS.has(t.control))
    .map(([k]) => k)
}

const storyModules = import.meta.glob('../components/**/*.stories.ts', { eager: true })

describe('Stories 属性配置（Controls 面板防退化）', () => {
  it('每个 story 的 args 覆盖全部 boolean/number/text 控件键（可选属性白名单除外）', () => {
    const problems: string[] = []
    let checked = 0

    for (const [path, mod] of Object.entries(storyModules)) {
      const meta = (mod as any).default
      if (!meta) {
        problems.push(`${path}: 缺少 default 导出`)
        continue
      }
      const controlKeys = collectControlKeys(meta.argTypes)
      const metaArgs = meta.args ?? {}
      const stories = Object.entries(mod).filter(([k, v]) => k !== 'default' && (v as any)?.render)

      for (const [storyName, story] of stories) {
        checked++
        const mergedArgs = { ...metaArgs, ...((story as any).args ?? {}) }
        for (const key of controlKeys) {
          if (OPTIONAL_KEYS.has(key)) continue
          if (mergedArgs[key] === undefined) {
            problems.push(
              `${path} → ${storyName}: 控件 "${key}" 缺少 args 初始值（Controls 面板将退化为 Set 按钮）`,
            )
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(150)
    expect(problems).toEqual([])
  })
})
