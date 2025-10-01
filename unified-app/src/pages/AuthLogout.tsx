import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOIDCAuth } from '../contexts/OIDCAuthContext';
import { 
  Box, 
  Heading, 
  Text, 
  Card, 
  Flex, 
  Container,
  Button
} from '../components/ui';
import { Spinner } from '../components/ui';
import { HomeIcon } from '@radix-ui/react-icons';

export default function AuthLogout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useOIDCAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This component is only used as a callback page after Cognito logout
    // It should not initiate logout - that should be done by the OIDCAuthContext
    // Just clear any remaining local data and show success
    try {
      // Clear any remaining local user data
      localStorage.removeItem('oidc_user');
      localStorage.removeItem('oidc_access_token');
      localStorage.removeItem('oidc_refresh_token');
      
      setStatus('success');
    } catch (err) {
      console.error('Error clearing local data:', err);
      setError(err instanceof Error ? err.message : 'Error clearing local data');
      setStatus('error');
    }
  }, []);

  if (status === 'processing') {
    return (
      <Container size="3">
        <Box style={{ minHeight: '50vh' }} className="flex items-center justify-center">
          <Card>
            <Box p="6">
              <Flex direction="column" align="center" gap="4">
                <Spinner size="3" />
                <Heading size="4">Logging Out</Heading>
                <Text size="3" color="gray" align="center">
                  Please wait while we log you out...
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
      <Container size="3">
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
                <Heading size="4" color="green">Logged Out Successfully</Heading>
                <Text size="3" color="gray" align="center">
                  You have been successfully logged out.
                </Text>
                <Button 
                  variant="solid" 
                  size="3" 
                  onClick={() => navigate('/')}
                  style={{ marginTop: '16px' }}
                >
                  <HomeIcon />
                  Back to Homepage
                </Button>
              </Flex>
            </Box>
          </Card>
        </Box>
      </Container>
    );
  }

  if (status === 'error') {
    return (
      <Container size="3">
        <Box style={{ minHeight: '50vh' }} className="flex items-center justify-center">
          <Card>
            <Box p="6">
              <Flex direction="column" align="center" gap="4">
                <Box style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'var(--orange-3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  ⚠️
                </Box>
                <Heading size="4" color="orange">Logout Warning</Heading>
                <Text size="3" color="gray" align="center">
                  {error || 'There was an issue during logout, but you have been logged out locally.'}
                </Text>
                <Button 
                  variant="solid" 
                  size="3" 
                  onClick={() => navigate('/')}
                  style={{ marginTop: '16px' }}
                >
                  <HomeIcon />
                  Back to Homepage
                </Button>
              </Flex>
            </Box>
          </Card>
        </Box>
      </Container>
    );
  }

  return null;
}
