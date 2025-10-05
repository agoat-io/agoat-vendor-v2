import apiClient from '../config/axios'

export interface TableInfo {
  name: string
  description: string
  row_count: number
  columns: ColumnInfo[]
}

export interface ColumnInfo {
  name: string
  type: string
  is_nullable: boolean
  is_primary_key: boolean
  is_unique: boolean
  default_value?: string
}

export interface FilterRequest {
  column: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in'
  value: string
}

export interface TableData {
  table_name: string
  columns: string[]
  rows: Record<string, any>[]
  total_rows: number
  page: number
  page_size: number
  total_pages: number
}

export interface QueryRequest {
  table: string
  page: number
  page_size: number
  filters: FilterRequest[]
  order_by?: string
  order_dir?: 'asc' | 'desc'
}

export interface TablesResponse {
  tables: TableInfo[]
  count: number
}

class AdminApiService {
  /**
   * Get all database tables with metadata
   */
  async getTables(): Promise<TablesResponse> {
    const response = await apiClient.get('/api/admin/tables')
    return response.data
  }

  /**
   * Get paginated data from a specific table
   */
  async getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    filters: FilterRequest[] = [],
    orderBy?: string,
    orderDir: 'asc' | 'desc' = 'asc'
  ): Promise<TableData> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    })

    if (filters.length > 0) {
      params.append('filters', JSON.stringify(filters))
    }

    if (orderBy) {
      params.append('order_by', orderBy)
      params.append('order_dir', orderDir)
    }

    const response = await apiClient.get(`/api/admin/tables/${tableName}?${params}`)
    return response.data
  }

  /**
   * Execute a custom query
   */
  async executeQuery(queryRequest: QueryRequest): Promise<TableData> {
    const response = await apiClient.post('/api/admin/query', queryRequest)
    return response.data
  }

  /**
   * Export table data to CSV format
   */
  exportToCSV(tableData: TableData): void {
    const headers = tableData.columns.join(',')
    const rows = tableData.rows.map(row => 
      tableData.columns.map(col => {
        const value = row[col]
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value !== null && (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n')))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value !== null ? value : ''
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${tableData.table_name}_data.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const adminApi = new AdminApiService()
export default adminApi
