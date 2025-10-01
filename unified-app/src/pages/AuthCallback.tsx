import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOIDCAuth } from '../contexts/OIDCAuthContext';
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Container
} from '../components/ui';
import { Spinner } from '../components/ui';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useOIDCAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        
        // Check if there's an error in the URL
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }
        
        // Check if we have authentication code and state
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (code && state) {
          // This is an OIDC callback - the backend should have already processed it
          // and redirected us back. Check if user is now authenticated
          if (isAuthenticated && user) {
            setStatus('success');
            
            // Redirect to dashboard or home page
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            // Wait a bit for the context to update
            setTimeout(() => {
              if (isAuthenticated && user) {
                setStatus('success');
                setTimeout(() => {
                  navigate('/dashboard');
                }, 2000);
              } else {
                throw new Error('Authentication not completed');
              }
            }, 1000);
          }
        } else {
          // No code/state, redirect to home
          navigate('/');
        }
      } catch (err) {
        console.error('Authentication callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to home page after showing error
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, searchParams, isAuthenticated, user]);

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
