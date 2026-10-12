# mac-ui Svelte 迁移规范（组件迁移代理必读）

本文档定义 Lit 版组件 → Svelte 5 组件的统一转换规则。迁移目标目录：

- 源（只读参考）：`/Users/huyang/Documents/WorkBuddy/App/mac-ui/src/components/{name}/mac-{name}.ts`
- 目标：`/Users/huyang/Documents/WorkBuddy/App/mac-ui-svelte/src/lib/components/{name}/`
  - `mac-{name}.svelte`（组件）
  - `mac-{name}.test.ts`（测试）

参考实现（务必先读，模仿其结构）：

- `svelte-ui/src/lib/components/config-provider/mac-config-provider.svelte`
- `svelte-ui/src/lib/components/button/mac-button.svelte` + `mac-button.test.ts`
- `svelte-ui/src/lib/internal/config.svelte.ts`（useMacConfig / resolveSize / resolveTheme）
- `svelte-ui/src/lib/test/utils.ts`（snippet / listenEvent 测试辅助）

技术栈：Svelte 5 runes + TypeScript。不要使用 `createEventDispatcher`（已废弃）、不要使用 Svelte 4 语法。

## 1. 属性（Props）

- Lit `@property` → Svelte Props 接口；字段名、类型、默认值必须与 Lit 版完全一致。
- Lit 版默认 slot → `children?: Snippet`；命名 slot（如 `prefix`/`suffix`/`header`/`footer`）→ 同名可选 Snippet 属性。
- Lit 版两个反向常用属性（`value`、`checked`、`open`、`visible`、`active` 等表单/受控值）→ 用 `$bindable(默认值)` 声明，例如 `let { value = $bindable('') } = $props()`。
- 组件可能需要的 `theme?: MacTheme` 属性：Lit 版 BaseElement 有该属性，所有组件都要有。
- 保留中文 JSDoc 注释（Props 接口字段上用 `/** ... */`）。
- 透传：接口末尾加 `[key: string]: unknown`，模板中 `{...rest}`（rest 需解构获得）。

## 2. 尺寸与主题解析（必须）

组件脚本顶部固定写法：

```ts
import {
  useMacConfig,
  resolveSize,
  resolveTheme,
  type MacSize,
  type MacTheme,
} from '../../internal/config.svelte'

const config = useMacConfig()
const resolvedSize = $derived(resolveSize(size, config))
const resolvedTheme = $derived(resolveTheme(theme, config))
```

根元素固定携带：

```svelte
data-theme={resolvedTheme}
data-size={resolvedSize}
```

## 3. 根元素与样式类

- 每个组件模板最外层的可渲染元素固定添加类：`mac-scope` + 组件类（如 `mac-button`）+ Lit 版原有的宿主类/状态类。
- Lit 版组件样式里的 `:host { display: inline-block; ... }` → 合并到组件根类选择器，如 `.mac-button { display: inline-block; }`（写在 `<style>` 内）。
- `:host([size='sm']) .x` → `.mac-{name}[data-size='sm'] .x`。
- `:host([data-theme='dark']) .x` → `.mac-{name}[data-theme='dark'] .x`。
- `part="xxx"` 属性直接删除（无 Shadow DOM，csspart 概念不存在），不改类名。
- 其余 CSS 规则原样拷贝进 `<style>`（Svelte 自动 scoped，类名无需改动）。
- `::slotted(X)`：Svelte 无 slot 元素，snippet 内容是真实子节点。转换规则：
  - `容器 ::slotted(tag)` → `容器 :global(tag)`
  - `::slotted([slot='header'])` → `.mac-{name} :global([slot='header'])`（按语义挂到对应容器类下）
  - 注意 `:global()` 只包住被匹配的子选择器部分。
- Lit 版 `html\`` 模板里的内联样式/动态 class（`class:xxx` 指令或 `class="... ${expr}"` → `class="... {expr}"`）。

## 4. 事件（必须与 Lit 版名称/详情一致）

- Lit `this.emit('mac-xxx', { detail })` → 组件内：

```ts
let root: HTMLElement | undefined = $state()

function emit(name: string, detail?: unknown) {
  root?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
}
```

根元素 `bind:this={root}`，触发处调用 `emit('mac-xxx', { detail: {...} })`。事件名和 detail 结构必须与 Lit 版 `@event` 标注一致（如 `mac-change`、`mac-tabs-change` + `{ key }`）。
- 同时保留 Lit 版上抛的原生语义（例如表单组件内部 input 的 input/change 事件行为通过 mac-* 事件表达即可，不必重复派发原生事件）。
- 不要把事件改成回调 props（保持 API 兼容）。

## 5. Slot → Snippet

- `{#if children}{@render children()}{/if}` 渲染默认内容；命名 slot 同理（`prefix`、`suffix`、`header`、`footer`、`media` 等）。
- Lit 版 `<slot name="x">默认内容</slot>` 的 fallback 内容 → `{#if x}{@render x()}{:else}默认内容{/if}`。

## 6. 生命周期与行为迁移

- `connectedCallback`/`disconnectedCallback` 里的监听器 → `$effect(() => { ...; return () => 清理 })` 或 `onMount`/`$effect` 清理函数。
- `willUpdate` 中的属性联动 → `$derived` / `$effect`。
- `document`/`window` 级监听（拖拽、键盘、点击外部关闭）用 `$effect` + cleanup。
- 定时器（autoplay 等）在 `$effect` 中设置并在清理函数中清除。
- IntersectionObserver / ResizeObserver / matchMedia 在 jsdom 测试环境不可用，代码里需容错（`typeof IntersectionObserver !== 'undefined'`），setup.ts 已提供 mock。

## 7. 动态标签与 SVG

- Lit 中 `svg\`` 模板 → Svelte 中直接写普通 `<svg>` 标签即可。
- `{#each}`、`{#if}` 逻辑与 Lit render() 中的表达式一一对应。

## 8. 模板事件绑定

- Lit `@click=${fn}` → Svelte `onclick={fn}`（Svelte 5 语法，不要用 `on:click`）。
- `onkeydown`、`ontransitionend` 等同理。

## 9. 测试规范（每个组件必须有）

文件 `mac-{name}.test.ts`，使用 vitest + @testing-library/svelte：

```ts
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import MacXxx from './mac-xxx.svelte'
import { snippet, listenEvent } from '$lib/test/utils'

afterEach(cleanup)
```

最少覆盖 4 类用例（对应 AGENTS.md 测试规范）：
1. 默认属性渲染（关键 class/属性断言）。
2. 属性绑定响应（传入不同 props 断言 DOM 变化）。
3. 事件触发（`listenEvent('mac-xxx', ...)` 或 `document.addEventListener` + `fireEvent`）。
4. 条件渲染/交互行为（点击、开关等）。

- 传默认 slot 内容用 `children: snippet('文本')`；命名 slot 传 `prefix: snippet('P')` 等。
- 涉及异步（requestAnimationFrame/setTimeout）的用例用 `vi.useFakeTimers()` + `await act(...)` 或适当 `await new Promise(r => setTimeout(r, 0))`。
- 不要测试纯视觉像素；不要依赖 IntersectionObserver 触发真实回调（可断言 observer 已创建/已 observe）。
- 组件如使用 `$bindable`，可用 `rerender` 或直接 fireEvent 交互后断言。

## 10. 禁止事项

- 不要修改 `svelte-ui/src/lib/index.ts`（由主代理统一维护）。
- 不要修改本文件以外的任何共享文件（config.svelte.ts、test/utils.ts、setup.ts、theme.css、package.json、配置文件）。
- 不要引入新的 npm 依赖。
- 不要创建 `.stories.ts`（演示页由主代理负责）。
- 不要改变公共 API：属性名、默认值、事件名、事件 detail、CSS 类名、CSS 变量名必须与 Lit 版一致。

## 11. 已完成组件（勿重复迁移）

`button`、`config-provider` 已完成且测试通过。

## 12. 已知坑（必须遵守，均已实际踩过）

- `createRawSnippet` 渲染空字符串会崩溃 → `$lib/test/utils` 的 `snippet()` 已兜底为注释节点，测试传空内容直接用 `snippet('')` 即可。
- jsdom 中 `fireEvent.click` 对 `disabled` 元素仍会触发 click 事件 → 组件在派发 mac-* 事件前必须自行判断守卫条件（disabled/loading 等），与真实浏览器行为保持一致。
- 测试查询组件根元素优先用 class/属性选择器（`container.querySelector('.mac-xxx')`），避免 `getByRole` 出现多元素歧义。
- Lit 组件内的模板 ref（`this.xxx` 获取元素）→ Svelte `bind:this`；命令式 DOM 调用（`focus()`、`scrollIntoView()`、`querySelector`、事件监听等）同样通过 `bind:this` 保留，外部监听放 `$effect` 并在清理函数移除。
- 若 Lit 源码目录有辅助模块（如 `date-picker/date-picker-utils.ts`、`animation/animations.ts`、`dock/mac-dock-item.ts` 是独立组件），需一并迁移到 Svelte 版同目录（辅助工具导出保持同名）。
- `window.matchMedia` / `IntersectionObserver` / `ResizeObserver` 在 jsdom 中 setup.ts 已提供基础 mock，但 IntersectionObserver 回调不会真实触发，测试只能断言已创建/已 observe。
- 根元素 `bind:this={root}` 用于 emit；如果组件最外层有多个元素，用一个 `<div class="mac-scope mac-xxx">` 包一层（与 Lit 的 host 元素对应）。
