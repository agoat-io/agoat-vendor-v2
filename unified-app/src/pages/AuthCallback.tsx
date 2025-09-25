import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { currentAzureConfig } from '../config/azureAuth';
import { useAzureAuth } from '../contexts/AzureAuthContext';
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Container
} from '@radix-ui/themes';
import { Spinner } from '../components/ui';

const msalInstance = new PublicClientApplication(currentAzureConfig);

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleSuccessfulLogin } = useAzureAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        
        // Initialize MSAL if not already done
        await msalInstance.initialize();
        
        // Handle the redirect promise
        const response = await msalInstance.handleRedirectPromise();
        
        if (response) {
          // Successful authentication
          if (response.account) {
            // The handleSuccessfulLogin will be called by the context
            setStatus('success');
            
            // Redirect to dashboard or home page
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            throw new Error('No account information received');
          }
        } else {
          // Check if there's an error in the URL
          const errorParam = searchParams.get('error');
          const errorDescription = searchParams.get('error_description');
          
          if (errorParam) {
            throw new Error(errorDescription || errorParam);
          }
          
          // No response and no error, redirect to home
          navigate('/');
        }
      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to login page after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (status === 'processing') {
    return (
      <Container>
        <Box style={{ minHeight: '50vh' }} className="flex items-center justify-center">
          <Card>
            <Box p="6">
              <Flex direction="column" align="center" gap="4">
                <Spinner size="3" />
                <Heading size="4">Processing Authentication</Heading>
                <Text size="3" color="gray" align="center">
                  Please wait while we complete your login...
                </Text>
              </Flex>
            </Box>
          </Card>
        </Box>
      </Container>
    );
  }

  if (status === 'success') {
    return (
      <Container>
        <Box style={{ minHeight: '50vh' }} className="flex items-center justify-center">
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
                  justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  ✅
                </Box>
                <Heading size="4" color="green">Authentication Successful</Heading>
                <Text size="3" color="gray" align="center">
                  You have been successfully logged in. Redirecting to your dashboard...
                </Text>
              </Flex>
            </Box>
          </Card>
        </Box>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container>
        <Box style={{ minHeight: '50vh' }} className="flex items-center justify-center">
          <Card>
            <Box p="6">
              <Flex direction="column" align="center" gap="4">
                <Box style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'var(--red-3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  ❌
                </Box>
                <Heading size="4" color="red">Authentication Failed</Heading>
                <Text size="3" color="gray" align="center">
                  {error || 'An error occurred during authentication.'}
                </Text>
                <Text size="2" color="gray" align="center">
                  Redirecting to login page...
                </Text>
              </Flex>
            </Box>
          </Card>
        </Box>
      </Container>
    );
  }

  return null;
}
