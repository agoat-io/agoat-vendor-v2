import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Button, 
  Container,
  Spinner
} from '../components/ui';
import { PersonIcon, ExclamationTriangleIcon, ChevronLeftIcon } from '@radix-ui/react-icons';
import { useCognitoAuth, useLoginWithReturnUrl } from '../contexts/CognitoAuthContext';

const CognitoLogin: React.FC = () => {
  const { isAuthenticated, isLoading } = useCognitoAuth();
  const { loginWithCurrentPage } = useLoginWithReturnUrl();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Check if there's a return URL in the query parameters
      const urlParams = new URLSearchParams(location.search);
      const returnUrl = urlParams.get('return_url');
      
      if (returnUrl) {
        console.log('Redirecting to return URL:', returnUrl);
        window.location.href = returnUrl;
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, navigate, location.search]);

  const handleLogin = async () => {
    try {
      // Get return URL from query parameters or use current page
      const urlParams = new URLSearchParams(location.search);
      const returnUrl = urlParams.get('return_url');
      
      if (returnUrl) {
        console.log('Logging in with return URL:', returnUrl);
        await loginWithCurrentPage(); // This will use the current page as return URL
      } else {
        console.log('Logging in with current page as return URL');
        await loginWithCurrentPage();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <Container>
        <Box style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '50vh' 
        }}>
          <Flex direction="column" align="center" gap="3">
            <Spinner size="3" />
            <Text size="3" color="gray">Loading authentication...</Text>
          </Flex>
        </Box>
      </Container>
    );
  }

  if (isAuthenticated) {
    return (
      <Container>
        <Box style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '50vh' 
        }}>
          <Flex direction="column" align="center" gap="3">
            <Spinner size="3" />
            <Text size="3" color="gray">Redirecting to your page...</Text>
          </Flex>
        </Box>
      </Container>
    );
  }

  // Get return URL for display
  const urlParams = new URLSearchParams(location.search);
  const returnUrl = urlParams.get('return_url');
  const displayReturnUrl = returnUrl || window.location.href;

  return (
    <Container>
      <Box style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh' 
      }}>
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          <Box p="6">
            <Flex direction="column" align="center" gap="4">
              {/* Back to Home Button */}
              <Box style={{ alignSelf: 'flex-start', width: '100%' }}>
                <Button 
                  variant="ghost" 
                  onClick={handleBackToHome}
                  style={{ color: 'var(--gray-11)' }}
                >
                  <ChevronLeftIcon />
                  Back to Home
                </Button>
              </Box>

              {/* Logo/Brand */}
              <Box style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: 'var(--blue-9)', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                A
              </Box>

              {/* Title */}
              <Box textAlign="center">
                <Heading size="6" mb="2">Welcome to topvitaminsupplies.com</Heading>
                <Text size="3" color="gray">
                  Professional-grade supplements and practitioner resources
                </Text>
              </Box>

              {/* Return URL Information */}
              {returnUrl && (
                <Box 
                  p="3" 
                  style={{ 
                    backgroundColor: 'var(--blue-2)', 
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--blue-6)',
                    width: '100%'
                  }}
                >
                  <Flex align="start" gap="2">
                    <Box>
                      <Text size="2" weight="medium" color="blue">
                        You'll be returned to:
                      </Text>
                      <Text size="1" color="gray" style={{ 
                        marginTop: '4px',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>
                        {displayReturnUrl}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* Login Button */}
              <Button 
                size="3" 
                onClick={handleLogin}
                style={{ 
                  width: '100%',
                  background: 'var(--blue-9)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '12px 24px'
                }}
              >
                <PersonIcon />
                Sign In with Cognito
              </Button>

              {/* Info */}
              <Box textAlign="center" mt="2">
                <Text size="2" color="gray">
                  You'll be redirected to our secure authentication page
                </Text>
              </Box>

              {/* Features */}
              <Box mt="4" style={{ width: '100%' }}>
                <Text size="2" weight="medium" mb="2">Features:</Text>
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <Box style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: 'var(--green-9)', 
                      borderRadius: '50%' 
                    }} />
                    <Text size="2">Secure authentication with AWS Cognito</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Box style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: 'var(--green-9)', 
                      borderRadius: '50%' 
                    }} />
                    <Text size="2">Access to practitioner pricing</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Box style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: 'var(--green-9)', 
                      borderRadius: '50%' 
                    }} />
                    <Text size="2">Content management for authors</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Box style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: 'var(--green-9)', 
                      borderRadius: '50%' 
                    }} />
                    <Text size="2">Thorne supplement integration</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Box style={{ 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: 'var(--green-9)', 
                      borderRadius: '50%' 
                    }} />
                    <Text size="2">Return to your original page after login</Text>
                  </Flex>
                </Flex>
              </Box>

              {/* Security Notice */}
              <Box mt="4" p="3" style={{ 
                backgroundColor: 'var(--blue-2)', 
                borderRadius: 'var(--radius-2)',
                border: '1px solid var(--blue-6)'
              }}>
                <Flex align="start" gap="2">
                  <ExclamationTriangleIcon color="var(--blue-9)" />
                  <Box>
                    <Text size="2" weight="medium" color="blue">
                      Secure Authentication
                    </Text>
                    <Text size="1" color="gray" style={{ marginTop: '4px' }}>
                      Your credentials are handled securely through AWS Cognito with industry-standard encryption and security practices. You'll be returned to your original page after authentication.
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

export default CognitoLogin;
