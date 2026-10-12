import { createRawSnippet } from 'svelte'

/**
 * 在测试中为默认 slot（children）构造 snippet。
 * 用法：render(MacButton, { props: { children: snippet('Click') } })
 */
export function snippet(children: string) {
  return createRawSnippet(() => ({
    // 空字符串会导致 Svelte snippet 无节点可挂载，用注释节点占位
    render: () => (children === '' ? '<!---->' : children),
    setup: () => {},
  }))
}

/**
 * 监听组件派发的 mac-* 自定义事件（bubbles + composed，会冒泡到 document）。
 * 返回取消监听的函数。
 */
export function listenEvent(name: string, handler: (detail: unknown) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail)
  document.addEventListener(name, listener)
  return () => document.removeEventListener(name, listener)
}
