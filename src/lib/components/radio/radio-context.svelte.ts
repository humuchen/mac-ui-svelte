import { getContext, setContext } from 'svelte'

/** RadioGroup 提供给子 Radio 的上下文。 */
export interface RadioGroupContext {
  /** 当前选中值（响应式）。 */
  value: string | undefined
  /** 组级尺寸。 */
  size?: 'sm' | 'md' | 'lg'
  /** 组级禁用。 */
  disabled: boolean
  /** 选中某个值。 */
  selectValue: (value: string) => void
}

export const RADIO_GROUP_KEY = Symbol('mac-radio-group')

export function provideRadioGroup(ctx: RadioGroupContext): void {
  setContext(RADIO_GROUP_KEY, ctx)
}

export function useRadioGroup(): RadioGroupContext | null {
  return getContext<RadioGroupContext | null>(RADIO_GROUP_KEY) ?? null
}
