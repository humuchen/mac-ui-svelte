// mac-tree 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface TreeNodeData {
  key: string
  label: string
  disabled?: boolean
  children?: TreeNodeData[]
  [key: string]: unknown
}
