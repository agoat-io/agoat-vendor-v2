import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  Badge,
  Grid,
  Tabs
} from '@radix-ui/themes'
import { StarIcon as ShoppingCartIcon, StarIcon as PackageIcon, PersonIcon as UserIcon, HeartIcon } from '@radix-ui/react-icons'
import apiClient from '../config/axios'

interface Patient {
  id: string
  name: string
  email: string
  health_goals: string
  approved: boolean
  registration_date: string
  last_login: string | null
}

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

interface Order {
  id: string
  patient_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  fulfillment: string
  order_date: string
  shipped_date: string | null
  tracking_number: string | null
}

export default function ThornePatientPortal() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [products, setProducts] = useState<ThorneProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('catalog')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        // For demo purposes, we'll use a mock patient ID
        // In a real app, this would come from authentication
        const patientId = 'patient-001'
        
        const [patientResponse, productsResponse, ordersResponse] = await Promise.all([
          apiClient.get(`/api/thorne/patients/${patientId}`),
          apiClient.get('/api/thorne/products'),
          apiClient.get(`/api/thorne/orders/patient/${patientId}`)
        ])

        if (patientResponse.data && patientResponse.data.success) {
          setPatient(patientResponse.data.data)
        }

        if (productsResponse.data && productsResponse.data.success) {
          setProducts(productsResponse.data.data)
        }

        if (ordersResponse.data && ordersResponse.data.success) {
          setOrders(ordersResponse.data.data)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load patient data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddToCart = (product: ThorneProduct) => {
    // In a real app, this would add to cart or redirect to order form
    console.log('Adding to cart:', product)
    alert(`Added ${product.name} to cart. In a real app, this would open the order form.`)
  }

  const handleThorneExpress = (product: ThorneProduct) => {
    // In a real app, this would redirect to Thorne's Patient Express
    console.log('Redirecting to Thorne Express for:', product)
    alert(`Redirecting to Thorne Patient Express for ${product.name}. In a real app, this would open Thorne's ordering system.`)
  }

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Text size="3">Loading patient portal...</Text>
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
              <Text size="4" color="red">Error loading portal</Text>
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

  if (!patient || !patient.approved) {
    return (
      <Container>
        <Card>
          <Box p="6">
            <Flex direction="column" align="center" gap="4">
              <Text size="4" color="orange">Account Pending Approval</Text>
              <Text size="3" color="gray" align="center">
                Your patient account is currently under review. You will receive an email notification once approved.
              </Text>
              <Button onClick={() => window.location.href = '/thorne/education'}>
                Return to Education
              </Button>
            </Flex>
          </Box>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      {/* Patient Header */}
      <Box mb="6">
        <Flex justify="between" align="start" mb="4">
          <Box>
            <Heading size="8" mb="2">Welcome, {patient.name}</Heading>
            <Text size="4" color="gray" mb="2">
              Your private patient portal for professional-grade Thorne supplements
            </Text>
            <Badge color="green">Approved Patient</Badge>
          </Box>
          <Box>
            <Text size="2" color="gray">
              Health Goals: {patient.health_goals}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Navigation Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="catalog">
            <ShoppingCartIcon width="16" height="16" />
            Product Catalog
          </Tabs.Trigger>
          <Tabs.Trigger value="orders">
            <PackageIcon width="16" height="16" />
            Order History
          </Tabs.Trigger>
          <Tabs.Trigger value="profile">
            <UserIcon width="16" height="16" />
            Profile
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          <Tabs.Content value="catalog">
            <Box>
              <Heading size="5" mb="4">Product Catalog</Heading>
              <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
                {products.map((product) => (
                  <Card key={product.id}>
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
                        <Text size="2" color="gray" mb="1">Patient Price</Text>
                        <Text size="4" weight="bold" color="green">
                          ${product.retail_price.toFixed(2)}
                        </Text>
                        <Text size="2" color="gray">
                          (Wholesale: ${product.wholesale_price.toFixed(2)})
                        </Text>
                      </Box>
                      
                      <Flex direction="column" gap="2">
                        <Button 
                          size="2" 
                          disabled={!product.in_stock}
                          onClick={() => handleAddToCart(product)}
                          style={{ width: '100%' }}
                        >
                          <ShoppingCartIcon width="16" height="16" />
                          Order Direct
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="2"
                          disabled={!product.in_stock}
                          onClick={() => handleThorneExpress(product)}
                          style={{ width: '100%' }}
                        >
                          Thorne Patient Express
                        </Button>
                      </Flex>
                    </Box>
                  </Card>
                ))}
              </Grid>
            </Box>
          </Tabs.Content>

          <Tabs.Content value="orders">
            <Box>
              <Heading size="5" mb="4">Order History</Heading>
              {orders.length === 0 ? (
                <Card>
                  <Box p="6">
                    <Flex direction="column" align="center" gap="3">
                      <PackageIcon width="48" height="48" color="var(--gray-8)" />
                      <Text size="4">No orders found</Text>
                      <Text size="3" color="gray">
                        You haven't placed any orders yet. Browse our product catalog to get started.
                      </Text>
                    </Flex>
                  </Box>
                </Card>
              ) : (
                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <Box p="4">
                        <Flex justify="between" align="start" mb="3">
                          <Box>
                            <Heading size="4" mb="1">{order.product_name}</Heading>
                            <Text size="2" color="gray">Order #{order.id}</Text>
                          </Box>
                          <Badge color={order.status === 'fulfilled' ? 'green' : order.status === 'pending' ? 'orange' : 'red'}>
                            {order.status}
                          </Badge>
                        </Flex>
                        
                        <Flex justify="between" align="center" mb="2">
                          <Text size="3">Quantity: {order.quantity}</Text>
                          <Text size="3" weight="bold">${order.total_price.toFixed(2)}</Text>
                        </Flex>
                        
                        <Text size="2" color="gray" mb="2">
                          Fulfillment: {order.fulfillment === 'direct' ? 'Direct' : 'Thorne Express'}
                        </Text>
                        
                        <Text size="2" color="gray">
                          Ordered: {new Date(order.order_date).toLocaleDateString()}
                        </Text>
                        
                        {order.tracking_number && (
                          <Text size="2" color="blue" mt="2">
                            Tracking: {order.tracking_number}
                          </Text>
                        )}
                      </Box>
                    </Card>
                  ))}
                </Grid>
              )}
            </Box>
          </Tabs.Content>

          <Tabs.Content value="profile">
            <Card>
              <Box p="4">
                <Heading size="5" mb="4">Patient Profile</Heading>
                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                  <Box>
                    <Text size="3" weight="medium" mb="2">Name</Text>
                    <Text size="3" color="gray">{patient.name}</Text>
                  </Box>
                  <Box>
                    <Text size="3" weight="medium" mb="2">Email</Text>
                    <Text size="3" color="gray">{patient.email}</Text>
                  </Box>
                  <Box style={{ gridColumn: 'span 2' }}>
                    <Text size="3" weight="medium" mb="2">Health Goals</Text>
                    <Text size="3" color="gray">{patient.health_goals}</Text>
                  </Box>
                  <Box>
                    <Text size="3" weight="medium" mb="2">Registration Date</Text>
                    <Text size="3" color="gray">
                      {new Date(patient.registration_date).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="3" weight="medium" mb="2">Last Login</Text>
                    <Text size="3" color="gray">
                      {patient.last_login ? new Date(patient.last_login).toLocaleDateString() : 'Never'}
                    </Text>
                  </Box>
                </Grid>
              </Box>
            </Card>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {/* Ordering Information */}
      <Card mt="6">
        <Box p="4">
          <Heading size="4" mb="3">Ordering Options</Heading>
          <Grid columns={{ initial: '1', sm: '2' }} gap="4">
            <Box>
              <Flex gap="2" align="start" mb="2">
                <HeartIcon width="20" height="20" color="var(--blue-11)" />
                <Box>
                  <Text size="3" weight="medium">Direct Fulfillment</Text>
                  <Text size="2" color="gray">
                    Orders fulfilled directly by your practitioner with personal service and support
                  </Text>
                </Box>
              </Flex>
            </Box>
            <Box>
              <Flex gap="2" align="start" mb="2">
                <PackageIcon width="20" height="20" color="var(--green-11)" />
                <Box>
                  <Text size="3" weight="medium">Thorne Patient Express</Text>
                  <Text size="2" color="gray">
                    Direct fulfillment by Thorne with fast shipping and Thorne's satisfaction guarantee
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Grid>
        </Box>
      </Card>

      {/* Compliance Notice */}
      <Card mt="4">
        <Box p="4">
          <Text size="2" color="gray">
            As an Authorized Seller of Thorne, I provide practitioner-only access to professional-grade supplements. 
            Purchases are either fulfilled directly by me as your practitioner, or through Thorne's Patient Express/Web Elite systems. 
            I may receive compensation for these purchases. All products are sold in original, sealed bottles and come with Thorne's 60-day satisfaction guarantee.
          </Text>
        </Box>
      </Card>
    </Container>
  )
}
