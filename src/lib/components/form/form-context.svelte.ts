import { getContext, setContext } from 'svelte'
import type { FormRule } from './mac-form.svelte'

/** MacForm 提供给子 FormItem 的上下文。 */
export interface FormContext {
  getValue: (path: string) => unknown
  setValue: (path: string, value: unknown) => void
  getRules: (path: string) => FormRule[]
  disabled: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel: boolean
  showFeedback: boolean
  labelAlign: 'left' | 'right' | 'top'
  /** 注册验证器（用于 form.validate()）。 */
  registerValidator: (fn: () => Promise<boolean>) => () => void
  /** 注册重置处理器（用于 form.reset()）。 */
  registerReset: (fn: () => void) => () => void
}

export const FORM_CONTEXT_KEY = Symbol('mac-form')

export function provideFormContext(ctx: FormContext): void {
  setContext(FORM_CONTEXT_KEY, ctx)
}

export function useFormContext(): FormContext | null {
  return getContext<FormContext | null>(FORM_CONTEXT_KEY) ?? null
}
