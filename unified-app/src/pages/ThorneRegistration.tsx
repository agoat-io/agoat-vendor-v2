import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  TextField,
  TextArea
} from '@radix-ui/themes'
import { CheckIcon, ChevronLeftIcon } from '@radix-ui/react-icons'
import apiClient from '../config/axios'

interface RegistrationData {
  name: string
  email: string
  healthGoals: string
}

export default function ThorneRegistration() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    healthGoals: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions to register')
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.post('/api/thorne/register', formData)
      
      if (response.data && response.data.success) {
        setSuccess(true)
      } else {
        setError(response.data?.message || 'Registration failed')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container>
        <Card>
          <Box p="6">
            <Flex direction="column" align="center" gap="4">
              <Box style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--green-3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckIcon width="32" height="32" color="var(--green-11)" />
              </Box>
              
              <Heading size="6" align="center">
                Registration Submitted Successfully!
              </Heading>
              
              <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
                Thank you for registering as a patient. Your registration has been submitted and will be reviewed by our practitioner team.
              </Text>
              
              <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
                You will receive an email notification once your account is approved, along with instructions on how to access your private patient portal.
              </Text>
              
              <Flex gap="3" mt="2">
                <Button variant="outline" onClick={() => navigate('/thorne/education')}>
                  Back to Education
                </Button>
                <Button onClick={() => navigate('/')}>
                  Return to Home
                </Button>
              </Flex>
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
        <Button variant="ghost" size="2" onClick={() => navigate('/thorne/education')}>
          <ChevronLeftIcon width="16" height="16" />
          Back to Education
        </Button>
      </Box>

      <Box mb="6">
        <Heading size="8" mb="2">Patient Registration</Heading>
        <Text size="4" color="gray" mb="4">
          Register as a patient to access professional-grade Thorne supplements at practitioner pricing
        </Text>
      </Box>

      <Card>
        <Box p="6">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Box>
                <Text size="3" weight="medium" mb="2">Full Name *</Text>
                <TextField.Root
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </Box>

              <Box>
                <Text size="3" weight="medium" mb="2">Email Address *</Text>
                <TextField.Root
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </Box>

              <Box>
                <Text size="3" weight="medium" mb="2">Health Goals *</Text>
                <TextArea
                  value={formData.healthGoals}
                  onChange={(e) => handleInputChange('healthGoals', e.target.value)}
                  placeholder="Please describe your health goals and any specific areas you'd like to focus on (e.g., immune support, energy, recovery, cognitive health)"
                  rows={4}
                  required
                />
              </Box>

              <Box>
                <Flex gap="2" align="start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '4px' }}
                  />
                  <Text size="2" color="gray">
                    By registering, I acknowledge I am establishing a client relationship with this practice for access to professional-grade Thorne supplements. 
                    I understand that purchases may be fulfilled directly by the practitioner or through Thorne's Patient Express/Web Elite systems, 
                    and the practitioner may receive compensation for these purchases.
                  </Text>
                </Flex>
              </Box>

              {error && (
                <Box>
                  <Text size="3" color="red">{error}</Text>
                </Box>
              )}

              <Button 
                type="submit" 
                size="3" 
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </Flex>
          </form>
        </Box>
      </Card>

      {/* Additional Information */}
      <Card mt="4">
        <Box p="4">
          <Heading size="4" mb="3">What Happens Next?</Heading>
          <Flex direction="column" gap="2">
            <Text size="3" color="gray">
              1. Your registration will be reviewed by our practitioner team
            </Text>
            <Text size="3" color="gray">
              2. You'll receive an email notification once approved
            </Text>
            <Text size="3" color="gray">
              3. Access your private patient portal with catalog and pricing
            </Text>
            <Text size="3" color="gray">
              4. Choose between direct fulfillment or Thorne's Patient Express
            </Text>
          </Flex>
        </Box>
      </Card>

      {/* Medical Disclaimer */}
      <Card mt="4">
        <Box p="4">
          <Text size="2" color="orange" weight="medium">
            ⚠️ Medical Disclaimer: This content is for educational purposes only and not intended to diagnose, treat, cure, or prevent any disease. 
            Please consult with your healthcare provider before starting any supplement regimen.
          </Text>
        </Box>
      </Card>
    </Container>
  )
}
