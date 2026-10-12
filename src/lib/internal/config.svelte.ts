/**
 * 全局配置上下文（对应 Lit 版 mac-config-provider 的查找机制）。
 *
 * Lit 版通过 DOM 向上遍历查找 mac-config-provider 并用 MutationObserver 监听；
 * Svelte 版使用 context + $state 代理实现同等能力：provider 写入响应式对象，
 * 子组件的 $derived 读取会自动跟随变化。
 */
import { getContext, setContext } from 'svelte'

export type MacTheme = 'light' | 'dark'
export type MacSize = 'sm' | 'md' | 'lg'

export interface MacConfig {
  theme?: MacTheme
  size?: MacSize
}

export const MAC_CONFIG_KEY = Symbol('mac-config')

/** 在 ConfigProvider 内调用，写入全局配置。 */
export function provideMacConfig(config: MacConfig): void {
  setContext(MAC_CONFIG_KEY, config)
}

/** 在组件初始化阶段调用，读取最近的 ConfigProvider 配置；无则返回 null。 */
export function useMacConfig(): MacConfig | null {
  try {
    return getContext<MacConfig | null>(MAC_CONFIG_KEY) ?? null
  } catch {
    // getContext 只能在组件初始化时调用；此处防御非组件上下文
    return null
  }
}

/** 尺寸解析：组件自身 size > provider size > 'md'（与 BaseElement._resolvedSize 一致）。 */
export function resolveSize(size: MacSize | undefined, config: MacConfig | null): MacSize {
  return size ?? config?.size ?? 'md'
}

/** 主题解析：组件自身 theme > provider theme > undefined（与 BaseElement._resolvedTheme 一致）。 */
export function resolveTheme(
  theme: MacTheme | undefined,
  config: MacConfig | null,
): MacTheme | undefined {
  return theme ?? config?.theme ?? undefined
}
