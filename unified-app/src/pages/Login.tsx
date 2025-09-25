import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Card, 
  Heading, 
  Text, 
  Button, 
  Flex, 
  Container,
  Separator
} from '@radix-ui/themes'
import { PersonIcon, LockClosedIcon } from '@radix-ui/react-icons'
import { useAzureAuth } from '../contexts/AzureAuthContext'
import { getCiamConfig } from '../config/azureAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, user, isLoading, error } = useAzureAuth()
  const [showCiamInfo, setShowCiamInfo] = useState(false)
  const ciamConfig = getCiamConfig()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, user, navigate])

  const handleAzureLogin = async () => {
    try {
      await login()
    } catch (err) {
      console.error('Azure login error:', err)
    }
  }

  const handleCiamLogin = () => {
    // Redirect to CIAM hosted login
    window.location.href = ciamConfig.loginUrl
  }

  const handleCiamRegister = () => {
    // Redirect to CIAM hosted registration
    window.location.href = ciamConfig.registerUrl
  }

  const handleCiamInfo = () => {
    setShowCiamInfo(true)
  }

  const handleCiamInfoClose = () => {
    setShowCiamInfo(false)
  }

  return (
    <Container>
      <Box style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: '400px',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-4)'
        }}>
          {/* Header */}
          <Box style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <Box style={{ 
              width: '64px', 
              height: '64px', 
              background: 'linear-gradient(135deg, var(--blue-9) 0%, var(--blue-10) 100%)',
              borderRadius: 'var(--radius-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)'
            }}>
              <PersonIcon width="32" height="32" color="white" />
            </Box>
            <Heading size="6" mb="2">Welcome Back</Heading>
            <Text size="3" color="gray">
              Sign in to your topvitaminsupplies.com account
            </Text>
          </Box>

          <Separator mb="6" />

          {/* Azure Entra ID Login */}
          <Flex direction="column" gap="4">
            <Box>
              <Text size="3" weight="medium" mb="3" style={{ display: 'block', textAlign: 'center' }}>
                Sign in with Microsoft
              </Text>
              <Text size="2" color="gray" mb="4" style={{ textAlign: 'center' }}>
                Use your work or school account to access the platform
              </Text>
            </Box>

            {error && (
              <Box style={{ 
                padding: 'var(--space-3)', 
                background: 'var(--red-2)', 
                border: '1px solid var(--red-6)',
                borderRadius: 'var(--radius-3)',
                color: 'var(--red-11)'
              }}>
                <Text size="2">{error}</Text>
              </Box>
            )}

            <Flex direction="column" gap="3">
              <Button 
                onClick={handleCiamLogin}
                disabled={isLoading}
                size="3"
                style={{ 
                  height: '48px', 
                  background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600'
                }}
              >
                {isLoading ? 'Redirecting...' : 'Sign in with Microsoft (CIAM)'}
              </Button>
              
              <Button 
                onClick={handleCiamRegister}
                disabled={isLoading}
                size="3"
                variant="outline"
                style={{ 
                  height: '48px', 
                  border: '2px solid var(--green-6)',
                  color: 'var(--green-11)',
                  fontWeight: '600'
                }}
              >
                Create Account (CIAM)
              </Button>
              
              <Button 
                onClick={handleCiamInfo}
                disabled={isLoading}
                size="2"
                variant="ghost"
                style={{ 
                  height: '36px', 
                  color: 'var(--gray-11)',
                  fontWeight: '500'
                }}
              >
                CIAM Configuration Info
              </Button>
            </Flex>
          </Flex>

          <Separator my="6" />

          {/* Information */}
          <Box>
            <Text size="2" weight="medium" mb="3" style={{ display: 'block' }}>
              About CIAM Authentication:
            </Text>
            <Flex direction="column" gap="2">
              <Text size="1" color="gray">
                • Secure hosted authentication
              </Text>
              <Text size="1" color="gray">
                • Gmail, Microsoft personal, and work accounts
              </Text>
              <Text size="1" color="gray">
                • Multi-factor authentication (MFA)
              </Text>
              <Text size="1" color="gray">
                • No passwords stored locally
              </Text>
              <Text size="1" color="gray">
                • Hosted at: {ciamConfig.domain}
              </Text>
            </Flex>
          </Box>

          {/* Development Note */}
          <Box mt="4" style={{
            padding: 'var(--space-3)',
            background: 'var(--blue-2)',
            border: '1px solid var(--blue-6)',
            borderRadius: 'var(--radius-3)'
          }}>
            <Text size="1" color="blue">
              <strong>CIAM Mode:</strong> This application uses Azure Entra ID CIAM for authentication. 
              Authentication is handled at {ciamConfig.domain}.
            </Text>
          </Box>
        </Card>
      </Box>

      {/* CIAM Info Popup */}
      {showCiamInfo && (
        <Box style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: 'var(--space-6)'
          }}>
            <Flex direction="column" gap="4">
              <Heading size="4">CIAM Configuration</Heading>
              
              <Box>
                <Text size="2" weight="bold" mb="2">Environment: Local</Text>
                <Text size="1" color="gray">CIAM Domain: {ciamConfig.domain}</Text>
              </Box>
              
              <Box>
                <Text size="2" weight="bold" mb="2">URLs:</Text>
                <Flex direction="column" gap="1">
                  <Text size="1">Login: {ciamConfig.loginUrl}</Text>
                  <Text size="1">Register: {ciamConfig.registerUrl}</Text>
                  <Text size="1">Callback: {ciamConfig.callbackUrl}</Text>
                  <Text size="1">Logout: {ciamConfig.logoutUrl}</Text>
                </Flex>
              </Box>
              
              <Box>
                <Text size="2" weight="bold" mb="2">Setup Required:</Text>
                <Flex direction="column" gap="1">
                  <Text size="1">1. Configure Azure Entra ID CIAM</Text>
                  <Text size="1">2. Set up DNS for {ciamConfig.domain}</Text>
                  <Text size="1">3. Deploy CIAM hosted UI</Text>
                  <Text size="1">4. Configure redirect URIs</Text>
                </Flex>
              </Box>
              
              <Button onClick={handleCiamInfoClose} variant="soft">
                Close
              </Button>
            </Flex>
          </Card>
        </Box>
      )}
    </Container>
  )
}