import { getContext, setContext } from 'svelte'

/** CheckboxGroup 提供给子 Checkbox 的上下文（对应 Lit 版 DOM 祖先查找机制）。 */
export interface CheckboxGroupContext {
  /** 当前组值（响应式）。 */
  value: string[]
  /** 组级尺寸。 */
  size?: 'sm' | 'md' | 'lg'
  /** 组级禁用。 */
  disabled: boolean
  /** 切换某个值。 */
  toggleValue: (value: string, checked: boolean) => void
}

export const CHECKBOX_GROUP_KEY = Symbol('mac-checkbox-group')

export function provideCheckboxGroup(ctx: CheckboxGroupContext): void {
  setContext(CHECKBOX_GROUP_KEY, ctx)
}

export function useCheckboxGroup(): CheckboxGroupContext | null {
  return getContext<CheckboxGroupContext | null>(CHECKBOX_GROUP_KEY) ?? null
}
