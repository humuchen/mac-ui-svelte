// mac-tree-select 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface TreeOption {
  value: string
  label: string
  disabled?: boolean
  children?: TreeOption[]
}
