import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
import { HeartIcon, StarIcon, StarIcon as ZapIcon, StarIcon as ShieldIcon, FileTextIcon } from '@radix-ui/react-icons'
import apiClient from '../config/axios'

interface Category {
  id: string
  name: string
  description: string
  icon: string
  benefits: string[]
  color: string
}

interface Settings {
  site_name: string
  practitioner_name: string
  practitioner_credentials: string
  contact_email: string
  phone: string
  compliance: {
    medical_disclaimer: string
    authorized_seller_notice: string
  }
}

export default function ThorneEducation() {
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const [categoriesResponse, settingsResponse] = await Promise.all([
          apiClient.get('/api/thorne/categories'),
          apiClient.get('/api/thorne/settings')
        ])

        if (categoriesResponse.data && categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data)
        }

        if (settingsResponse.data && settingsResponse.data.success) {
          setSettings(settingsResponse.data.data)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
          <Text size="3">Loading...</Text>
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
              <Text size="4" color="red">Error loading content</Text>
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

  return (
    <Container>
      <Box mb="6">
        <Heading size="8" mb="2">
          {settings?.site_name || 'Science-Driven, Practitioner-Trusted Supplements'}
        </Heading>
        <Text size="4" color="gray" mb="4">
          Discover the benefits of professional-grade Thorne supplements for your health and wellness journey
        </Text>
        {settings?.practitioner_name && (
          <Text size="3" color="gray" mb="2">
            Practiced by {settings.practitioner_name}, {settings.practitioner_credentials}
          </Text>
        )}
      </Box>

      {/* Medical Disclaimer */}
      {settings?.compliance?.medical_disclaimer && (
        <Card mb="6">
          <Box p="4">
            <Text size="3" color="orange" weight="medium">
              ⚠️ Medical Disclaimer: {settings.compliance.medical_disclaimer}
            </Text>
          </Box>
        </Card>
      )}

      {/* Product Categories */}
      <Box mb="6">
        <Heading size="6" mb="4">Product Categories</Heading>
        <Grid columns={{ initial: '1', sm: '2', lg: '2' }} gap="4">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon)
            return (
              <Card key={category.id} style={{ cursor: 'pointer' }}>
                <Box p="4">
                  <Flex gap="3" mb="3">
                    <Box style={{ 
                      width: '48px', 
                      height: '48px', 
                      backgroundColor: `var(--${category.color}-3)`, 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent width="24" height="24" color={`var(--${category.color}-11)`} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Heading size="5" mb="2">{category.name}</Heading>
                      <Text size="3" color="gray" style={{ lineHeight: 1.5 }}>
                        {category.description}
                      </Text>
                    </Box>
                  </Flex>
                  
                  <Box mb="3">
                    <Text size="2" weight="medium" mb="2">Key Benefits:</Text>
                    <Flex direction="column" gap="1">
                      {category.benefits.map((benefit, index) => (
                        <Text key={index} size="2" color="gray">
                          • {benefit}
                        </Text>
                      ))}
                    </Flex>
                  </Box>
                  
                  <Link to={`/thorne/category/${category.id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="2">
                      Learn More
                    </Button>
                  </Link>
                </Box>
              </Card>
            )
          })}
        </Grid>
      </Box>

      {/* Why Choose Thorne */}
      <Box mb="6">
        <Heading size="6" mb="4">Why Choose Thorne?</Heading>
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          <Card>
            <Box p="4">
              <Heading size="4" mb="2">Science-Backed</Heading>
              <Text size="3" color="gray">
                Every product is formulated based on scientific research and clinical studies
              </Text>
            </Box>
          </Card>
          <Card>
            <Box p="4">
              <Heading size="4" mb="2">Practitioner Trusted</Heading>
              <Text size="3" color="gray">
                Recommended by healthcare professionals worldwide for their quality and efficacy
              </Text>
            </Box>
          </Card>
          <Card>
            <Box p="4">
              <Heading size="4" mb="2">Quality Assured</Heading>
              <Text size="3" color="gray">
                Rigorous testing and quality control ensure purity and potency in every bottle
              </Text>
            </Box>
          </Card>
        </Grid>
      </Box>

      {/* Call to Action */}
      <Card>
        <Box p="6">
          <Flex direction="column" align="center" gap="4">
            <Heading size="5" align="center">
              Ready to Access Professional-Grade Supplements?
            </Heading>
            <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
              Register as a patient to access practitioner-only pricing and personalized supplement recommendations
            </Text>
            <Link to="/thorne/register" style={{ textDecoration: 'none' }}>
              <Button size="3">
                Register as a Patient
              </Button>
            </Link>
            <Text size="2" color="gray" align="center">
              By registering, you acknowledge establishing a client relationship for access to professional-grade Thorne supplements
            </Text>
          </Flex>
        </Box>
      </Card>

      {/* Compliance Information */}
      <Card mt="4">
        <Box p="4">
          <Flex gap="3" align="start">
            <FileTextIcon width="24" height="24" color="var(--gray-11)" />
            <Box>
              <Heading size="4" mb="2">Compliance & Legal Information</Heading>
              <Text size="3" color="gray" mb="3">
                Learn more about our Thorne supplement reseller program and compliance requirements.
              </Text>
              <Link to="/thorne/compliance" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="2">
                  View Compliance Information
                </Button>
              </Link>
            </Box>
          </Flex>
        </Box>
      </Card>
    </Container>
  )
}
