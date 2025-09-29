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
} from '@radix-ui/themes';
import { Spinner } from '../components/ui';

export default function AuthLogout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useOIDCAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        setStatus('processing');
        
        // Get return URL from query parameters
        const returnURL = searchParams.get('return_url') || '/';
        
        // Get tokens before clearing them
        const accessToken = localStorage.getItem('oidc_access_token');
        const refreshToken = localStorage.getItem('oidc_refresh_token');
        
        // Clear local user data immediately (Step 2: Clear all tokens and session data)
        localStorage.removeItem('oidc_user');
        localStorage.removeItem('oidc_access_token');
        localStorage.removeItem('oidc_refresh_token');
        
        // Call backend logout endpoint which will:
        // 1. Revoke refresh token via /oauth2/revoke
        // 2. Clear server-side session data
        // 3. Redirect to Cognito /logout endpoint
        let logoutUrl = `/api/auth/oidc/logout?return_url=${encodeURIComponent(returnURL)}`;
        if (refreshToken) {
          logoutUrl += `&refresh_token=${encodeURIComponent(refreshToken)}`;
        }
        if (accessToken) {
          logoutUrl += `&access_token=${encodeURIComponent(accessToken)}`;
        }
        
        // Redirect to backend logout endpoint
        window.location.href = logoutUrl;
        
        // Note: The logout function will redirect to Cognito, so this code
        // may not execute if the redirect happens immediately
        setStatus('success');
        
        // Fallback redirect in case the OIDC logout doesn't redirect
        setTimeout(() => {
          navigate(returnURL);
        }, 2000);
      } catch (err) {
        console.error('Logout error:', err);
        setError(err instanceof Error ? err.message : 'Logout failed');
        setStatus('error');
        
        // Clear local data even if logout failed
        localStorage.removeItem('oidc_user');
        localStorage.removeItem('oidc_access_token');
        localStorage.removeItem('oidc_refresh_token');
        
        // Redirect to home page even if logout failed
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleLogout();
  }, [logout, navigate, searchParams]);

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
