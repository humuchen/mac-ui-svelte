import type { StorybookConfig } from '@storybook/web-components-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // GitHub Pages 项目站点部署在 https://humuchen.github.io/mac-ui-svelte/ 子路径下，
    // base 必须与仓库名一致，否则资源加载全部 404 导致白屏
    config.base = process.env.CI ? '/mac-ui-svelte/' : '/'
    if (process.env.CI) {
      config.build ??= {}
      config.build.assetsDir = ''
    }
    return config
  },
}

export default config
