import { mount, unmount, createRawSnippet, type Component } from 'svelte'

/**
 * Storybook（web-components 框架）中挂载 Svelte 5 组件的辅助工具。
 *
 * 背景：本项目的 Storybook 使用 @storybook/web-components-vite 框架，
 * 而组件库是 Svelte 5 runes 组件。story 文件通过 render() 返回一个
 * 宿主 DOM 节点，内部用 svelte 的 mount() 挂载组件；宿主节点被
 * Storybook 移除（切换 story / 重渲染）时通过 MutationObserver
 * 自动 unmount，避免定时器、$effect 等泄漏。
 */

type AnyComponent = Component<any, any, any>

/** 为默认 slot（children）构造文本 snippet，与 $lib/test/utils 的 snippet() 行为一致。 */
export function text(content: string) {
  return createRawSnippet(() => ({
    // 空字符串会导致 Svelte snippet 无节点可挂载，用注释节点占位
    render: () => (content === '' ? '<!---->' : content),
    setup: () => {},
  }))
}

/** 构造 HTML 片段 snippet，用于 header/footer/media 等命名 slot 的富内容。 */
export function html(content: string) {
  return createRawSnippet(() => ({
    render: () => content,
    setup: () => {},
  }))
}

/**
 * 挂载 Svelte 组件并返回宿主节点。
 *
 * @param Comp   Svelte 5 组件（如 `import MacButton from './mac-button.svelte'`）
 * @param props  组件属性；slot 内容用 text()/html() 构造 snippet 传入
 */
export function mountSvelte(
  Comp: AnyComponent,
  props: Record<string, unknown> = {},
): HTMLElement {
  const host = document.createElement('div')
  const instance = mount(Comp, { target: host, props })
  // 宿主节点被移出文档时卸载组件实例（释放 $effect / 定时器 / 监听器）
  const observer = new MutationObserver(() => {
    if (!host.isConnected) {
      observer.disconnect()
      unmount(instance)
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return host
}
