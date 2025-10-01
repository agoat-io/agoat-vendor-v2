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
  Separator
} from '@radix-ui/themes'
import { ChevronLeftIcon, StarIcon as ShieldIcon, FileTextIcon, ExclamationTriangleIcon as AlertTriangleIcon } from '@radix-ui/react-icons'
import apiClient from '../config/axios'

interface Settings {
  site_name: string
  practitioner_name: string
  practitioner_credentials: string
  contact_email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
  business_hours: {
    [key: string]: string
  }
  compliance: {
    medical_disclaimer: string
    authorized_seller_notice: string
    satisfaction_guarantee: string
    return_policy: string
  }
  features: {
    enable_direct_fulfillment: boolean
    enable_thorne_express: boolean
    require_patient_approval: boolean
    show_wholesale_pricing: boolean
    enable_order_tracking: boolean
  }
}

export default function ThorneCompliance() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await apiClient.get('/api/thorne/settings')
        if (response.data && response.data.success) {
          setSettings(response.data.data)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load settings')
        console.error('Error fetching settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (loading) {
    return (
      <Container>
        <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
          <Text size="3">Loading compliance information...</Text>
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
              <Text size="4" color="red">Error loading information</Text>
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
      {/* Back Navigation */}
      <Box mb="4">
        <Link to="/thorne/education" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="2">
            <ChevronLeftIcon width="16" height="16" />
            Back to Education
          </Button>
        </Link>
      </Box>

      <Box mb="6">
        <Heading size="8" mb="2">Compliance & Legal Information</Heading>
        <Text size="4" color="gray" mb="4">
          Important information about our Thorne supplement reseller program and compliance requirements
        </Text>
      </Box>

      {/* Medical Disclaimer */}
      {settings?.compliance?.medical_disclaimer && (
        <Card mb="6">
          <Box p="4">
            <Flex gap="3" align="start" mb="3">
              <AlertTriangleIcon width="24" height="24" color="var(--orange-11)" />
              <Box>
                <Heading size="4" mb="2">Medical Disclaimer</Heading>
                <Text size="3" color="gray">
                  {settings.compliance.medical_disclaimer}
                </Text>
              </Box>
            </Flex>
          </Box>
        </Card>
      )}

      {/* Authorized Seller Information */}
      <Card mb="6">
        <Box p="4">
          <Flex gap="3" align="start" mb="3">
            <ShieldIcon width="24" height="24" color="var(--blue-11)" />
            <Box>
              <Heading size="4" mb="2">Authorized Seller Status</Heading>
              <Text size="3" color="gray" mb="3">
                {settings?.compliance?.authorized_seller_notice || 
                  "As an Authorized Seller of Thorne, I provide practitioner-only access to professional-grade supplements. This relationship allows me to sell/distribute products directly to my patients/clients or through Thorne's approved drop-ship programs."}
              </Text>
              <Text size="3" color="gray">
                Key difference from other supplement programs: Thorne allows direct sales to patients (including via private portal), 
                as long as compliance requirements are maintained.
              </Text>
            </Box>
          </Flex>
        </Box>
      </Card>

      {/* Public vs Private Areas */}
      <Card mb="6">
        <Box p="4">
          <Heading size="4" mb="3">Public vs Private Areas</Heading>
          
          <Box mb="4">
            <Heading size="5" mb="2" color="green">🔓 Public Area (No Login Required)</Heading>
            <Text size="3" color="gray" mb="2">Allowed:</Text>
            <Box ml="4" mb="3">
              <Text size="3" color="gray">• Education about health and supplement benefits</Text>
              <Text size="3" color="gray">• Product categories (immune, energy, recovery, sports, etc.)</Text>
              <Text size="3" color="gray">• Thorne brand/product images (unaltered)</Text>
              <Text size="3" color="gray">• Practitioner positioning: "Science-driven, practitioner-trusted supplements"</Text>
              <Text size="3" color="gray">• Call-to-action: "Register as a patient to access practitioner-only pricing"</Text>
            </Box>
            
            <Text size="3" color="gray" mb="2">Prohibited:</Text>
            <Box ml="4">
              <Text size="3" color="red">• Public pricing</Text>
              <Text size="3" color="red">• Public "Shop Now" or checkout</Text>
              <Text size="3" color="red">• Altering product packaging or labels</Text>
            </Box>
          </Box>

          <Separator my="4" />

          <Box>
            <Heading size="5" mb="2" color="blue">🔐 Private / Registered Patient Area</Heading>
            <Text size="3" color="gray" mb="2">Allowed:</Text>
            <Box ml="4" mb="3">
              <Text size="3" color="gray">• Full catalog of Thorne products</Text>
              <Text size="3" color="gray">• Show prices (permitted in private area)</Text>
              <Text size="3" color="gray">• Your own checkout system (if you stock/ship)</Text>
              <Text size="3" color="gray">• Patient links to Patient Express or Web Elite for ordering</Text>
              <Text size="3" color="gray">• Educational content and personalized product recommendations</Text>
            </Box>
            
            <Text size="3" color="gray" mb="2">Prohibited:</Text>
            <Box ml="4">
              <Text size="3" color="red">• Public access to catalog or pricing</Text>
              <Text size="3" color="red">• Open e-commerce to non-patients</Text>
              <Text size="3" color="red">• Ignoring Thorne's satisfaction guarantee</Text>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Order Handling Options */}
      <Card mb="6">
        <Box p="4">
          <Heading size="4" mb="3">Order Handling Options</Heading>
          
          <Box mb="4">
            <Heading size="5" mb="2">Option A – Direct Stock & Resell</Heading>
            <Box ml="4">
              <Text size="3" color="gray">• You buy wholesale from Thorne</Text>
              <Text size="3" color="gray">• Show pricing in private portal</Text>
              <Text size="3" color="gray">• Accept payment + ship</Text>
              <Text size="3" color="gray">• Must honor Thorne's 60-day satisfaction guarantee</Text>
            </Box>
          </Box>

          <Box>
            <Heading size="5" mb="2">Option B – Thorne Fulfillment</Heading>
            <Box ml="4">
              <Text size="3" color="gray">• Patients use Patient Express or Web Elite</Text>
              <Text size="3" color="gray">• Orders + shipping handled by Thorne</Text>
              <Text size="3" color="gray">• You get commission/wholesale credit</Text>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Returns & Quality */}
      <Card mb="6">
        <Box p="4">
          <Heading size="4" mb="3">Returns & Quality Requirements</Heading>
          <Box>
            <Text size="3" color="gray" mb="2">• Accept returns if product is damaged/incorrect, or if patient has clinical complaint</Text>
            <Text size="3" color="gray" mb="2">• No resale of opened/expired products</Text>
            <Text size="3" color="gray" mb="2">• Products must be sold in original, sealed bottles</Text>
            <Text size="3" color="gray" mb="2">• You must reimburse patients for returns if you sold directly</Text>
            <Text size="3" color="gray">
              • Authorized Sellers must offer refund, replacement, or store credit as mentioned in the satisfaction guarantee for 60 days after original purchase
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Satisfaction Guarantee */}
      {settings?.compliance?.satisfaction_guarantee && (
        <Card mb="6">
          <Box p="4">
            <Heading size="4" mb="3">Satisfaction Guarantee</Heading>
            <Text size="3" color="gray" mb="2">
              {settings.compliance.satisfaction_guarantee}
            </Text>
            {settings.compliance.return_policy && (
              <Text size="3" color="gray">
                {settings.compliance.return_policy}
              </Text>
            )}
          </Box>
        </Card>
      )}

      {/* Marketing Guidelines */}
      <Card mb="6">
        <Box p="4">
          <Heading size="4" mb="3">Marketing Do's & Don'ts</Heading>
          
          <Box mb="4">
            <Heading size="5" mb="2" color="green">Do:</Heading>
            <Box ml="4">
              <Text size="3" color="gray">• Educate via blog, social posts, newsletters</Text>
              <Text size="3" color="gray">• Collect registrations on your site</Text>
              <Text size="3" color="gray">• Provide catalog + pricing in private portal</Text>
              <Text size="3" color="gray">• Offer patient-specific email invitations to ordering options</Text>
            </Box>
          </Box>

          <Box>
            <Heading size="5" mb="2" color="red">Don't:</Heading>
            <Box ml="4">
              <Text size="3" color="gray">• Show prices publicly</Text>
              <Text size="3" color="gray">• Run a public storefront or open cart</Text>
              <Text size="3" color="gray">• Alter packaging or labels</Text>
              <Text size="3" color="gray">• Refuse mandated returns or guarantees</Text>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Contact Information */}
      {settings && (
        <Card mb="6">
          <Box p="4">
            <Flex gap="3" align="start" mb="3">
              <FileTextIcon width="24" height="24" color="var(--gray-11)" />
              <Box>
                <Heading size="4" mb="2">Contact Information</Heading>
                <Text size="3" color="gray" mb="2">
                  <strong>Practitioner:</strong> {settings.practitioner_name}, {settings.practitioner_credentials}
                </Text>
                <Text size="3" color="gray" mb="2">
                  <strong>Email:</strong> {settings.contact_email}
                </Text>
                <Text size="3" color="gray" mb="2">
                  <strong>Phone:</strong> {settings.phone}
                </Text>
                {settings.address && (
                  <Text size="3" color="gray">
                    <strong>Address:</strong> {settings.address.street}, {settings.address.city}, {settings.address.state} {settings.address.zip}
                  </Text>
                )}
              </Box>
            </Flex>
          </Box>
        </Card>
      )}

      {/* Bottom Line Summary */}
      <Card>
        <Box p="4">
          <Heading size="4" mb="3">Bottom Line for Thorne Reseller Program</Heading>
          <Box>
            <Text size="3" color="gray" mb="2">• Public site = education + registration funnel, no pricing</Text>
            <Text size="3" color="gray" mb="2">• Private site = full catalog + pricing + direct orders (you fulfill) or via Thorne's official programs</Text>
            <Text size="3" color="gray" mb="2">• Order flexibility: You may legally sell online to patients (private portal), unlike other programs which restrict this</Text>
            <Text size="3" color="gray">• Key compliance: Keep catalog/pricing private, maintain practitioner-client relationship, honor return policies</Text>
          </Box>
        </Box>
      </Card>
    </Container>
  )
}
