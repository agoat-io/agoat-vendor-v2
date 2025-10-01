import React, { useState, useEffect } from 'react';
import { Button, Dialog, Flex, Text, Card, Code, Badge } from './ui';
import { getHostedUiConfig, getCurrentEnvironment } from '../config/azureAuth';

interface HostedUiPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const HostedUiPopup: React.FC<HostedUiPopupProps> = ({ isOpen, onClose, onLogin }) => {
  const [entraIdUrl, setEntraIdUrl] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('local');
  const [hostedUiConfig, setHostedUiConfig] = useState<any>(null);

  useEffect(() => {
    const currentEnv = getCurrentEnvironment();
    const hostedConfig = getHostedUiConfig();
    
    setEnvironment(import.meta.env.VITE_ENVIRONMENT || 'local');
    setHostedUiConfig(hostedConfig);
    
    // Generate the Entra ID URL for hosted UI
    const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id-here';
    const redirectUri = `${hostedConfig.fullUrl}/auth/callback`;
    const scope = 'openid profile email User.Read';
    const responseType = 'code';
    const responseMode = 'query';
    const prompt = 'select_account';
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: responseType,
      redirect_uri: redirectUri,
      scope: scope,
      response_mode: responseMode,
      prompt: prompt,
      // Add PKCE parameters (these would be generated in real implementation)
      code_challenge_method: 'S256',
      code_challenge: 'YOUR_CODE_CHALLENGE_HERE'
    });
    
    const entraIdUrl = `https://login.microsoftonline.com/common/v2.0/authorize?${params.toString()}`;
    setEntraIdUrl(entraIdUrl);
  }, []);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(entraIdUrl);
    // You could add a toast notification here
  };

  const handleOpenInNewTab = () => {
    window.open(entraIdUrl, '_blank');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>Azure Entra ID Hosted UI</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          This popup simulates the Entra ID hosted UI experience. In production, this would be handled by Azure Entra ID.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          {/* Environment Info */}
          <Card>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Environment Configuration</Text>
              <Flex gap="2" align="center">
                <Badge color="blue">{environment}</Badge>
                <Text size="1" color="gray">
                  {hostedUiConfig?.fullUrl}
                </Text>
              </Flex>
            </Flex>
          </Card>

          {/* Entra ID URL */}
          <Card>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Entra ID Authorization URL</Text>
              <Code size="1" style={{ 
                wordBreak: 'break-all', 
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {entraIdUrl}
              </Code>
              <Flex gap="2" mt="2">
                <Button size="1" variant="soft" onClick={handleCopyUrl}>
                  Copy URL
                </Button>
                <Button size="1" variant="soft" onClick={handleOpenInNewTab}>
                  Open in New Tab
                </Button>
              </Flex>
            </Flex>
          </Card>

          {/* Configuration Details */}
          <Card>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Configuration Details</Text>
              <Flex direction="column" gap="1">
                <Text size="1">
                  <strong>Client ID:</strong> {import.meta.env.VITE_AZURE_CLIENT_ID || 'Not configured'}
                </Text>
                <Text size="1">
                  <strong>Redirect URI:</strong> {hostedUiConfig?.fullUrl}/auth/callback
                </Text>
                <Text size="1">
                  <strong>Scope:</strong> openid profile email User.Read
                </Text>
                <Text size="1">
                  <strong>Response Type:</strong> code
                </Text>
                <Text size="1">
                  <strong>Authority:</strong> https://login.microsoftonline.com/common/v2.0
                </Text>
              </Flex>
            </Flex>
          </Card>

          {/* Instructions */}
          <Card>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Setup Instructions</Text>
              <Text size="1" color="gray">
                1. Configure Azure Entra ID with the redirect URI above<br/>
                2. Set up DNS for {hostedUiConfig?.domain}<br/>
                3. Deploy the hosted UI to {hostedUiConfig?.fullUrl}<br/>
                4. Test the authentication flow
              </Text>
            </Flex>
          </Card>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
          <Button onClick={onLogin}>
            Simulate Login
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
