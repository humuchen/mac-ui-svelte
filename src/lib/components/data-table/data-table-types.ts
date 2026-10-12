// mac-data-table 公共类型（独立成 .ts，保证 build:types 可生成声明）

export type DataTableSortOrder = 'asc' | 'desc'

export interface DataTableColumn<T = any> {
  /** 列唯一标识 */
  key: string
  /** 列标题 */
  title: string
  /** 数据字段名（缺省时取 key） */
  dataIndex?: string
  /** 列宽 */
  width?: string | number
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否可排序 */
  sortable?: boolean
  /** 支持的排序方向 */
  sortDirections?: DataTableSortOrder[]
  /** 默认排序方向 */
  defaultSortOrder?: DataTableSortOrder
  /** 本地排序比较函数 */
  sorter?: (a: T, b: T) => number
  /** 自定义单元格渲染（返回 HTML 字符串或文本） */
  render?: (row: T, index: number, column: DataTableColumn<T>) => unknown
  /** 单元格内容超出省略 */
  ellipsis?: boolean
}

export interface DataTablePagination {
  current?: number
  pageSize?: number
  defaultCurrent?: number
  defaultPageSize?: number
  total?: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  simple?: boolean
  disabled?: boolean
  prefix?: string
}

export interface DataTableRowSelection<T = any> {
  type?: 'checkbox' | 'radio'
  selectedRowKeys?: Array<string | number>
  getCheckboxProps?: (row: T, index: number) => { disabled?: boolean }
  disabled?: boolean
}

export interface DataTableSortInfo {
  columnKey: string
  order: DataTableSortOrder
}
