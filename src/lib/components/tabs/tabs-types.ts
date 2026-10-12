// mac-tabs 公共类型（独立成 .ts，保证 build:types 可生成声明）

export interface TabItem {
  /** 唯一键 */
  key: string
  /** 标签文本 */
  label: string
  /** 标签是否禁用 */
  disabled?: boolean
  /** 标签是否可关闭 */
  closable?: boolean
}
