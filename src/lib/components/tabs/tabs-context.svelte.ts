import { getContext, setContext } from 'svelte'

/** TabPane 注册信息。 */
export interface TabsPaneInfo {
  id: number
  key: string
  label: string
  disabled: boolean
  closable: boolean
}

/** MacTabs 提供给子 TabPane 的上下文。 */
export interface TabsContext {
  panes: TabsPaneInfo[]
  registerPane: (pane: Omit<TabsPaneInfo, 'id'>) => number
  unregisterPane: (id: number) => void
  activeKey: string
  selectTab: (key: string) => void
}

export const TABS_CONTEXT_KEY = Symbol('mac-tabs')

export function provideTabsContext(ctx: TabsContext): void {
  setContext(TABS_CONTEXT_KEY, ctx)
}

export function useTabsContext(): TabsContext | null {
  return getContext<TabsContext | null>(TABS_CONTEXT_KEY) ?? null
}
