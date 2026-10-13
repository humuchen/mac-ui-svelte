import type { Preview } from '@storybook/web-components'
// 组件库的设计令牌与基础样式（.mac-scope / --md-* CSS 变量）。
// 演示应用通过 src/app.css 引入；Storybook 需在 preview 中显式引入，
// 否则文档站内所有组件都会丢失主题变量，呈现无样式状态。
import '../src/lib/styles/theme.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
}

export default preview
