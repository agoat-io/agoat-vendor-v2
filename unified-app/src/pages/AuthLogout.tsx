import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AuthLogout() {
  const navigate = useNavigate();
  const { logout } = useAzureAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        setStatus('processing');
        await logout();
        setStatus('success');
        
        // Redirect to home page after successful logout
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err) {
        console.error('Logout error:', err);
        setError(err instanceof Error ? err.message : 'Logout failed');
        setStatus('error');
        
        // Redirect to home page even if logout failed
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleLogout();
  }, [logout, navigate]);

  if (status === 'processing') {
    return (
      <Container>
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
                <Heading size="4" color="green">Logged Out Successfully</Heading>
                <Text size="3" color="gray" align="center">
                  You have been successfully logged out. Redirecting to home page...
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
                <Text size="2" color="gray" align="center">
                  Redirecting to home page...
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
