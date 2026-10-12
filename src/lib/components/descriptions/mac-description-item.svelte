<script lang="ts">
  import type { Snippet } from 'svelte'

  /**
   * @tag mac-description-item
   * @summary MacDescriptions 的子项（用于插槽模式，渲染为隐藏元素）。
   */

  interface Props {
    /** 标签文本。 */
    label?: string
    /** 值文本（替代文本内容）。 */
    value?: string
    /** 该项跨越的列数。 */
    span?: number
    /** 标签的自定义 CSS 样式。 */
    labelStyle?: string
    /** 内容的自定义 CSS 样式。 */
    contentStyle?: string
    /** 子内容（对应 Lit 版默认 slot）。 */
    children?: Snippet
    /** 其余属性透传。 */
    [key: string]: unknown
  }

  let {
    label = '',
    value = '',
    span = 1,
    labelStyle = '',
    contentStyle = '',
    children,
    ...rest
  }: Props = $props()
</script>

<div {...rest} class="mac-description-item" style="display:none" data-label={label} data-value={value} data-span={span} data-label-style={labelStyle} data-content-style={contentStyle}>
  {#if children}{@render children()}{/if}
</div>
