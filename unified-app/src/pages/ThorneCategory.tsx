import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  Badge,
  Grid
} from '../components/ui'
import { HeartIcon, StarIcon, StarIcon as ZapIcon, StarIcon as ShieldIcon, ChevronLeftIcon } from '@radix-ui/react-icons'
import apiClient from '../config/axios'

interface ThorneProduct {
  id: string
  name: string
  description: string
  category: string
  image_url: string
  wholesale_price: number
  retail_price: number
  sku: string
  in_stock: boolean
  benefits: string[]
  ingredients: string[]
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  benefits: string[]
  color: string
}

export default function ThorneCategory() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [products, setProducts] = useState<ThorneProduct[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const [productsResponse, categoryResponse] = await Promise.all([
          apiClient.get(`/api/thorne/products/category/${categoryId}`),
          apiClient.get(`/api/thorne/categories/${categoryId}`)
        ])

        if (productsResponse.data && productsResponse.data.success) {
          setProducts(productsResponse.data.data)
        }

        if (categoryResponse.data && categoryResponse.data.success) {
          setCategory(categoryResponse.data.data)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchData()
    }
  }, [categoryId])

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'shield': return ShieldIcon
      case 'zap': return ZapIcon
      case 'heart': return HeartIcon
      case 'star': return StarIcon
      default: return HeartIcon
    }
  }

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Text size="3">Loading products...</Text>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Card>
          <Box p="4">
            <Flex direction="column" align="center" gap="3">
              <Text size="4" color="red">Error loading products</Text>
              <Text size="3" color="gray">{error}</Text>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Flex>
          </Box>
        </Card>
      </Container>
    )
  }

  if (!category) {
    return (
      <Container>
        <Card>
          <Box p="4">
            <Text size="4" color="red">Category not found</Text>
          </Box>
        </Card>
      </Container>
    )
  }

  const IconComponent = getIconComponent(category.icon)

  return (
    <Container>
      {/* Back Navigation */}
      <Box mb="4">
        <Link to="/thorne/education" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="2">
            <ChevronLeftIcon width="16" height="16" />
            Back to Education
          </Button>
        </Link>
      </Box>

      {/* Category Header */}
      <Box mb="6">
        <Flex gap="4" align="start" mb="4">
          <Box style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: `var(--${category.color}-3)`, 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconComponent width="32" height="32" color={`var(--${category.color}-11)`} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Heading size="8" mb="2">{category.name}</Heading>
            <Text size="4" color="gray" mb="3">
              {category.description}
            </Text>
            <Flex direction="column" gap="1">
              {category.benefits.map((benefit, index) => (
                <Text key={index} size="3" color="gray">
                  • {benefit}
                </Text>
              ))}
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <Box p="6">
            <Flex direction="column" align="center" gap="3">
              <Text size="4">No products found in this category</Text>
              <Text size="3" color="gray">
                Check back soon for new products in the {category.name} category
              </Text>
            </Flex>
          </Box>
        </Card>
      ) : (
        <Box>
          <Heading size="6" mb="4">Available Products</Heading>
          <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
            {products.map((product) => (
              <Card key={product.id} style={{ cursor: 'pointer' }}>
                <Box p="4">
                  <Box mb="3">
                    <Heading size="4" mb="2">{product.name}</Heading>
                    <Text size="3" color="gray" style={{ lineHeight: 1.5 }}>
                      {product.description}
                    </Text>
                  </Box>
                  
                  <Flex justify="between" align="center" mb="3">
                    <Text size="2" color="gray">SKU: {product.sku}</Text>
                    {product.in_stock ? (
                      <Badge color="green">In Stock</Badge>
                    ) : (
                      <Badge color="red">Out of Stock</Badge>
                    )}
                  </Flex>

                  <Box mb="3">
                    <Text size="2" color="gray" mb="1">Key Benefits:</Text>
                    <Flex direction="column" gap="1">
                      {product.benefits.slice(0, 3).map((benefit, index) => (
                        <Text key={index} size="2" color="gray">
                          • {benefit}
                        </Text>
                      ))}
                    </Flex>
                  </Box>
                  
                  <Box mb="3">
                    <Text size="2" color="gray" mb="1">Pricing available in patient portal</Text>
                    <Text size="3" weight="medium">
                      Register as a patient to view pricing
                    </Text>
                  </Box>
                  
                  <Link to="/thorne/register" style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="2" style={{ width: '100%' }}>
                      Register to View Pricing
                    </Button>
                  </Link>
                </Box>
              </Card>
            ))}
          </Grid>
        </Box>
      )}

      {/* Call to Action */}
      <Card mt="6">
        <Box p="6">
          <Flex direction="column" align="center" gap="4">
            <Heading size="5" align="center">
              Ready to Access {category.name} Products?
            </Heading>
            <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
              Register as a patient to access practitioner-only pricing and personalized recommendations
            </Text>
            <Link to="/thorne/register" style={{ textDecoration: 'none' }}>
              <Button size="3">
                Register as a Patient
              </Button>
            </Link>
          </Flex>
        </Box>
      </Card>
    </Container>
  )
}
