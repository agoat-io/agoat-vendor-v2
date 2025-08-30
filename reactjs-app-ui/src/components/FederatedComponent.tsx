import React, { useState, useEffect, Suspense } from 'react';
import { loadComponent } from '../utils/federationLoader';
import { Flex, Text, Button, Spinner, Callout } from '@radix-ui/themes';
import { ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { MockPostsList, MockPostViewer } from './MockFederatedComponents';

interface FederatedComponentProps {
  componentName: string;
  remoteName?: string;
  onError?: (error: Error) => void;
  [key: string]: any; // Allow any other props to be passed to the component
}

/**
 * Wrapper component for loading federated modules at runtime
 * Provides loading states, error handling, and retry logic
 * Federated components are MANDATORY - uses mock components as fallback
 */
const FederatedComponent: React.FC<FederatedComponentProps> = ({
  componentName,
  remoteName = 'viewer',
  onError,
  ...componentProps
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useMock, setUseMock] = useState(false);

  const loadFederatedComponent = async () => {
    setLoading(true);
    setError(null);
    setUseMock(false);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Loading timeout')), 5000);
      });
      
      const loadPromise = loadComponent(remoteName, componentName);
      const LoadedComponent = await Promise.race([loadPromise, timeoutPromise]);
      
      setComponent(() => LoadedComponent);
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(`Error loading federated component ${remoteName}/${componentName}:`, error);
      setError(error);
      setLoading(false);
      
      // Use mock component as fallback
      setUseMock(true);
      
      if (onError) {
        onError(error);
      }
    }
  };

  useEffect(() => {
    // Only try to load if we're in the browser
    if (typeof window !== 'undefined') {
      loadFederatedComponent();
    } else {
      setLoading(false);
      setUseMock(true);
      const ssrError = new Error('Federated components not available during SSR');
      setError(ssrError);
      if (onError) {
        onError(ssrError);
      }
    }
  }, [componentName, remoteName, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" py="9">
        <Spinner size="3" />
        <Text mt="3" color="gray">Loading {componentName}...</Text>
      </Flex>
    );
  }

  // Use mock components when remote service is not available
  if (useMock) {
    console.log(`Using mock component for ${componentName}`);
    
    if (componentName === 'PostsList') {
      return <MockPostsList {...componentProps} />;
    }
    
    if (componentName === 'PostViewer') {
      return <MockPostViewer {...componentProps} />;
    }
    
    // Fallback for unknown components
    return (
      <Callout.Root color="amber" size="2" mt="4">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          Using mock component for {componentName}. Remote service is not available.
        </Callout.Text>
      </Callout.Root>
    );
  }

  // Error state - show error UI with retry option
  if (error && !useMock) {
    return (
      <Callout.Root color="red" size="2" mt="4">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Flex direction="column" gap="2">
          <Callout.Text>
            Failed to load required component {componentName}. Using mock component as fallback.
          </Callout.Text>
          <Button size="1" variant="soft" onClick={handleRetry}>
            <ReloadIcon /> Retry Loading
          </Button>
        </Flex>
      </Callout.Root>
    );
  }

  // Component not found
  if (!Component && !useMock) {
    return (
      <Callout.Root color="red" size="2" mt="4">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          Required component {componentName} could not be rendered. This is a critical error.
        </Callout.Text>
      </Callout.Root>
    );
  }

  // Render the loaded component
  return (
    <Suspense fallback={
      <Flex direction="column" align="center" justify="center" py="9">
        <Spinner size="3" />
        <Text mt="3" color="gray">Rendering {componentName}...</Text>
      </Flex>
    }>
      <Component {...componentProps} />
    </Suspense>
  );
};

export default FederatedComponent;
