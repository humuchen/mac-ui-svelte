import type { Meta, StoryObj } from '@storybook/web-components'
import MacTree from './mac-tree.svelte'
import { mountSvelte } from '../../../../.storybook/mount-svelte'
import type { TreeNodeData } from './tree-types'

/** 树形数据（三层结构）。 */
const treeData: TreeNodeData[] = [
  {
    key: '1',
    label: '研发中心',
    children: [
      { key: '1-1', label: '前端组' },
      { key: '1-2', label: '后端组' },
      {
        key: '1-3',
        label: '算法组',
        children: [
          { key: '1-3-1', label: 'NLP 方向' },
          { key: '1-3-2', label: 'CV 方向' },
        ],
      },
    ],
  },
  {
    key: '2',
    label: '产品设计',
    children: [
      { key: '2-1', label: '交互设计' },
      { key: '2-2', label: '视觉设计' },
    ],
  },
  { key: '3', label: '人力资源' },
]

const meta = {
  title: '组件/Tree 树形控件',
  tags: ['autodocs'],
  args: {
    data: treeData,
    emptyText: '暂无数据',
  },
  argTypes: {
    data: { control: 'object', description: '树形数据数组（key/label/children/disabled）' },
    expandedKeys: { control: 'object', description: '展开的节点键（受控）' },
    selectedKeys: { control: 'object', description: '选中的节点键（受控）' },
    checkedKeys: { control: 'object', description: '勾选的节点键（受控）' },
    defaultExpandedKeys: { control: 'object', description: '默认展开的节点键（非受控）' },
    defaultSelectedKeys: { control: 'object', description: '默认选中的节点键（非受控）' },
    defaultCheckedKeys: { control: 'object', description: '默认勾选的节点键（非受控）' },
    defaultExpandAll: { control: 'boolean', description: '是否默认展开所有节点' },
    checkable: { control: 'boolean', description: '是否显示复选框' },
    multiple: { control: 'boolean', description: '是否允许多选' },
    selectable: { control: 'boolean', description: '节点是否可选中' },
    showLine: { control: 'boolean', description: '是否显示连接线' },
    blockNode: { control: 'boolean', description: '整行节点是否可点击' },
    emptyText: { control: 'text', description: '无数据时的空文本' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '组件尺寸（默认继承 ConfigProvider，否则 md）',
    },
    theme: {
      control: 'inline-radio',
      options: ['light', 'dark'],
      description: '组件级主题覆盖',
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** 基础用法：默认收起子节点，点击箭头展开。 */
export const Basic: Story = {
  args: { data: treeData },
  render: (args) => mountSvelte(MacTree, args),
}

/** 默认展开：defaultExpandedKeys 与 defaultExpandAll 并排展示。 */
export const DefaultExpanded: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '48px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'flex-start'

    const makeCell = (label: string) => {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const partialCell = makeCell('defaultExpandedKeys: ["1"]')
    partialCell.appendChild(
      mountSvelte(MacTree, { data: treeData, defaultExpandedKeys: ['1'] }),
    )
    host.appendChild(partialCell)

    const allCell = makeCell('defaultExpandAll: true')
    allCell.appendChild(mountSvelte(MacTree, { data: treeData, defaultExpandAll: true }))
    host.appendChild(allCell)

    return host
  },
}

/** 可勾选：父子节点联动，部分勾选时父节点呈半选状态。 */
export const Checkable: Story = {
  args: {
    data: treeData,
    checkable: true,
    defaultExpandedKeys: ['1', '1-3'],
    defaultCheckedKeys: ['1-1'],
  },
  render: (args) => mountSvelte(MacTree, args),
}

/** 多选 + 连接线：multiple 允许选中多个节点，showLine 显示层级连线。 */
export const MultipleAndLine: Story = {
  args: {
    data: treeData,
    multiple: true,
    showLine: true,
    defaultExpandAll: true,
    defaultSelectedKeys: ['1-1', '2-1'],
  },
  render: (args) => mountSvelte(MacTree, args),
}

/** 禁用节点与空数据：disabled 节点不可交互，data 为空时展示空文本。 */
export const DisabledAndEmpty: Story = {
  render: () => {
    const host = document.createElement('div')
    host.style.display = 'flex'
    host.style.gap = '48px'
    host.style.flexWrap = 'wrap'
    host.style.alignItems = 'flex-start'

    const makeCell = (label: string) => {
      const cell = document.createElement('div')
      const caption = document.createElement('div')
      caption.textContent = label
      caption.style.marginBottom = '8px'
      caption.style.fontSize = '13px'
      caption.style.color = 'var(--md-color-text-secondary)'
      cell.appendChild(caption)
      return cell
    }

    const disabledCell = makeCell('禁用节点（disabled）')
    disabledCell.appendChild(
      mountSvelte(MacTree, {
        data: [
          {
            key: 'd1',
            label: '总公司',
            children: [
              { key: 'd1-1', label: '正常节点' },
              { key: 'd1-2', label: '禁用节点', disabled: true },
            ],
          },
        ] satisfies TreeNodeData[],
        defaultExpandAll: true,
      }),
    )
    host.appendChild(disabledCell)

    const emptyCell = makeCell('空数据（emptyText）')
    emptyCell.appendChild(
      mountSvelte(MacTree, { data: [], emptyText: '暂无数据' }),
    )
    host.appendChild(emptyCell)

    return host
  },
}
