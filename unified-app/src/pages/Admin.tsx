import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  Card, 
  Flex, 
  Grid, 
  Badge,
  Select,
  TextField,
  Separator,
  Spinner
} from '../components/ui'
import { adminApi, TableInfo, TableData, FilterRequest } from '../services/adminApi'
import { DownloadIcon, ReloadIcon, PlusIcon, Cross2Icon } from '@radix-ui/react-icons'

const Admin: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  
  // Filtering
  const [filters, setFilters] = useState<FilterRequest[]>([])
  const [newFilter, setNewFilter] = useState<FilterRequest>({
    column: '',
    operator: 'eq',
    value: ''
  })

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getTables()
      setTables(response.tables)
    } catch (err: any) {
      setError(err.message || 'Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const loadTableData = async (tableName: string, page: number = 1, appliedFilters: FilterRequest[] = []) => {
    try {
      setDataLoading(true)
      setError(null)
      const data = await adminApi.getTableData(tableName, page, pageSize, appliedFilters)
      setTableData(data)
      setCurrentPage(page)
    } catch (err: any) {
      setError(err.message || 'Failed to load table data')
    } finally {
      setDataLoading(false)
    }
  }

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
    setFilters([])
    setNewFilter({ column: '', operator: 'eq', value: '' })
    loadTableData(tableName, 1, [])
  }

  const handleAddFilter = () => {
    if (!newFilter.column || !newFilter.value) {
      alert('Please select a column and enter a value')
      return
    }
    
    const updatedFilters = [...filters, newFilter]
    setFilters(updatedFilters)
    setNewFilter({ column: '', operator: 'eq', value: '' })
    
    if (selectedTable) {
      loadTableData(selectedTable, 1, updatedFilters)
    }
  }

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index)
    setFilters(updatedFilters)
    
    if (selectedTable) {
      loadTableData(selectedTable, 1, updatedFilters)
    }
  }

  const handleClearFilters = () => {
    setFilters([])
    if (selectedTable) {
      loadTableData(selectedTable, 1, [])
    }
  }

  const handlePageChange = (page: number) => {
    if (selectedTable) {
      loadTableData(selectedTable, page, filters)
    }
  }

  const handleExportCSV = () => {
    if (tableData) {
      adminApi.exportToCSV(tableData)
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'null'
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...'
    }
    return String(value)
  }

  const renderPagination = () => {
    if (!tableData) return null

    const { page, total_pages } = tableData
    const pages = []
    
    // Previous button
    pages.push(
      <Button
        key="prev"
        variant="outline"
        size="1"
        disabled={page <= 1}
        onClick={() => handlePageChange(page - 1)}
      >
        Previous
      </Button>
    )

    // Page numbers
    const startPage = Math.max(1, page - 2)
    const endPage = Math.min(total_pages, page + 2)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === page ? "solid" : "outline"}
          size="1"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      )
    }

    // Next button
    pages.push(
      <Button
        key="next"
        variant="outline"
        size="1"
        disabled={page >= total_pages}
        onClick={() => handlePageChange(page + 1)}
      >
        Next
      </Button>
    )

    return (
      <Flex gap="2" justify="center" align="center" mt="4">
        {pages}
      </Flex>
    )
  }

  if (loading) {
    return (
      <Container size="3">
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner />
          <Text ml="3">Loading database tables...</Text>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="3">
        <Card>
          <Box p="4">
            <Text color="red">{error}</Text>
            <Button mt="3" onClick={loadTables}>
              <ReloadIcon />
              Retry
            </Button>
          </Box>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="3">
      <Box mb="6">
        <Heading size="6" mb="2">Database Admin Panel</Heading>
        <Text color="gray">View and manage all database tables</Text>
      </Box>

      {/* Tables Grid */}
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4" mb="6">
        {tables.map((table) => (
          <Card 
            key={table.name} 
            style={{ 
              cursor: 'pointer',
              border: selectedTable === table.name ? '2px solid var(--accent-9)' : '1px solid var(--gray-6)'
            }}
            onClick={() => handleTableSelect(table.name)}
          >
            <Box p="4">
              <Flex justify="between" align="start" mb="3">
                <Heading size="3">{table.name}</Heading>
                <Badge color="blue">{table.row_count.toLocaleString()}</Badge>
              </Flex>
              <Text color="gray" size="2" mb="3">
                {table.description}
              </Text>
              <Flex justify="between" align="center">
                <Text size="1" color="gray">
                  {table.columns.length} columns
                </Text>
                <Button 
                  size="1" 
                  variant="solid"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTableSelect(table.name)
                  }}
                >
                  View Data
                </Button>
              </Flex>
            </Box>
          </Card>
        ))}
      </Grid>

      {/* Data Viewer */}
      {selectedTable && (
        <Card>
          <Box p="4">
            <Flex justify="between" align="center" mb="4">
              <Heading size="4">{selectedTable} Data</Heading>
              <Flex gap="2">
                <Button variant="outline" onClick={() => loadTableData(selectedTable, currentPage, filters)}>
                  <ReloadIcon />
                  Refresh
                </Button>
                <Button variant="solid" onClick={handleExportCSV} disabled={!tableData}>
                  <DownloadIcon />
                  Export CSV
                </Button>
              </Flex>
            </Flex>

            {/* Filters */}
            <Box mb="4" p="4" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-3)' }}>
              <Heading size="3" mb="3">Filters</Heading>
              
              {/* Add Filter */}
              <Flex gap="2" mb="3" align="end">
                <Box style={{ flex: 1 }}>
                  <Text size="2" mb="1">Column</Text>
                  <Select.Root
                    value={newFilter.column}
                    onValueChange={(value) => setNewFilter({ ...newFilter, column: value })}
                  >
                    <Select.Trigger placeholder="Select column" />
                    <Select.Content>
                      {tableData?.columns.map((col) => (
                        <Select.Item key={col} value={col}>{col}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
                
                <Box style={{ flex: 1 }}>
                  <Text size="2" mb="1">Operator</Text>
                  <Select.Root
                    value={newFilter.operator}
                    onValueChange={(value: any) => setNewFilter({ ...newFilter, operator: value })}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="eq">Equals</Select.Item>
                      <Select.Item value="ne">Not Equals</Select.Item>
                      <Select.Item value="like">Contains</Select.Item>
                      <Select.Item value="ilike">Contains (Case Insensitive)</Select.Item>
                      <Select.Item value="gt">Greater Than</Select.Item>
                      <Select.Item value="lt">Less Than</Select.Item>
                      <Select.Item value="gte">Greater Than or Equal</Select.Item>
                      <Select.Item value="lte">Less Than or Equal</Select.Item>
                      <Select.Item value="in">In List</Select.Item>
                      <Select.Item value="not_in">Not In List</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
                
                <Box style={{ flex: 1 }}>
                  <Text size="2" mb="1">Value</Text>
                  <TextField.Root
                    placeholder="Filter value"
                    value={newFilter.value}
                    onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                  />
                </Box>
                
                <Button onClick={handleAddFilter}>
                  <PlusIcon />
                  Add Filter
                </Button>
              </Flex>

              {/* Active Filters */}
              {filters.length > 0 && (
                <Box mb="3">
                  <Text size="2" mb="2">Active Filters:</Text>
                  <Flex gap="2" wrap="wrap">
                    {filters.map((filter, index) => (
                      <Badge key={index} color="green">
                        {filter.column} {filter.operator} "{filter.value}"
                        <Button
                          size="1"
                          variant="ghost"
                          ml="2"
                          onClick={() => handleRemoveFilter(index)}
                        >
                          <Cross2Icon />
                        </Button>
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}

              <Flex gap="2">
                <Button variant="solid" onClick={() => loadTableData(selectedTable, 1, filters)}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </Flex>
            </Box>

            {/* Stats */}
            {tableData && (
              <Flex gap="4" mb="4" p="3" style={{ backgroundColor: 'var(--blue-2)', borderRadius: 'var(--radius-3)' }}>
                <Box textAlign="center">
                  <Text size="4" weight="bold" color="blue">
                    {tableData.total_rows.toLocaleString()}
                  </Text>
                  <Text size="1" color="gray">Total Rows</Text>
                </Box>
                <Box textAlign="center">
                  <Text size="4" weight="bold" color="blue">
                    {tableData.page}
                  </Text>
                  <Text size="1" color="gray">Current Page</Text>
                </Box>
                <Box textAlign="center">
                  <Text size="4" weight="bold" color="blue">
                    {tableData.page_size}
                  </Text>
                  <Text size="1" color="gray">Page Size</Text>
                </Box>
              </Flex>
            )}

            {/* Data Table */}
            {dataLoading ? (
              <Flex justify="center" align="center" py="6">
                <Spinner />
                <Text ml="3">Loading data...</Text>
              </Flex>
            ) : tableData && tableData.rows.length > 0 ? (
              <Box style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--gray-6)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gray-2)' }}>
                      {tableData.columns.map((column) => (
                        <th key={column} style={{ padding: '12px', border: '1px solid var(--gray-6)', textAlign: 'left' }}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'var(--gray-1)' : 'transparent' }}>
                        {tableData.columns.map((column) => (
                          <td key={column} style={{ padding: '12px', border: '1px solid var(--gray-6)' }}>
                            {formatValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            ) : (
              <Box textAlign="center" py="6">
                <Text color="gray">No data found</Text>
              </Box>
            )}

            {/* Pagination */}
            {tableData && tableData.total_pages > 1 && renderPagination()}
          </Box>
        </Card>
      )}
    </Container>
  )
}

export default Admin
