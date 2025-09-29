// Runtime Module Federation Loader with Zero-Knowledge Configuration
import React from 'react';

interface RemoteConfig {
  url: string;
  scope: string;
}

interface FederationConfig {
  remotes: Record<string, RemoteConfig>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Cache for loaded remote containers
const remoteContainers = new Map<string, any>();
// Cache for loaded components
const loadedComponents = new Map<string, React.ComponentType<any>>();
// Cache for configuration
let federationConfig: FederationConfig | null = null;

/**
 * Fetch the federation configuration from external JSON file
 */
async function fetchFederationConfig(): Promise<FederationConfig> {
  if (federationConfig) {
    return federationConfig;
  }
  
  try {
    console.log('Fetching federation config from /federation-config.json');
    const response = await fetch('/federation-config.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch federation config: ${response.statusText}`);
    }
    federationConfig = await response.json();
    console.log('Federation config loaded successfully:', federationConfig);
    return federationConfig!;
  } catch (error) {
    console.error('Error fetching federation config:', error);
    // Return a default config to prevent crashes
    return {
      remotes: {},
      timeout: 5000,
      retryAttempts: 1,
      retryDelay: 1000
    } as FederationConfig;
  }
}

/**
 * Load a script dynamically
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Loading script: ${url}`);
    const existingScript = document.querySelector(`script[src="${url}"]`);
    
    if (existingScript) {
      console.log(`Script ${url} already exists`);
      // Script already loaded or loading
      if (existingScript.getAttribute('data-loaded') === 'true') {
        console.log(`Script ${url} already loaded`);
        resolve();
      } else {
        console.log(`Script ${url} is loading, waiting for completion`);
        existingScript.addEventListener('load', () => {
          console.log(`Script ${url} loaded successfully`);
          resolve();
        });
        existingScript.addEventListener('error', (error) => {
          console.error(`Script ${url} failed to load:`, error);
          reject(new Error(`Failed to load script: ${url}`));
        });
      }
      return;
    }
    
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-loaded', 'false');
    
    script.onload = () => {
      console.log(`Script ${url} loaded successfully`);
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error(`Script ${url} failed to load:`, error);
      script.remove();
      reject(new Error(`Failed to load script: ${url}`));
    };
    
    document.head.appendChild(script);
    console.log(`Script ${url} added to document head`);
  });
}

/**
 * Initialize webpack sharing
 */
async function initSharing(): Promise<void> {
  try {
    console.log('Initializing webpack sharing');
    // Check if __webpack_init_sharing__ exists
    if (typeof (window as any).__webpack_init_sharing__ === 'function') {
      console.log('__webpack_init_sharing__ found, calling it');
      await (window as any).__webpack_init_sharing__('default');
      console.log('Webpack sharing initialized successfully');
      
      // Verify share scopes were created
      if ((window as any).__webpack_share_scopes__) {
        console.log('Share scopes available:', Object.keys((window as any).__webpack_share_scopes__));
      } else {
        console.warn('Share scopes not created after initialization');
      }
    } else {
      console.warn('__webpack_init_sharing__ not found');
    }
  } catch (error) {
    console.error('Error initializing webpack sharing:', error);
    throw error;
  }
}

/**
 * Load a remote module with retry logic
 */
async function loadRemoteModule(
  remoteName: string, 
  config: RemoteConfig, 
  attempt = 1
): Promise<any> {
  const maxAttempts = federationConfig?.retryAttempts || 1;
  const retryDelay = federationConfig?.retryDelay || 1000;
  
  console.log(`Loading remote module '${remoteName}' from ${config.url}, attempt ${attempt}`);
  
  // Check cache first
  if (remoteContainers.has(remoteName)) {
    console.log(`Remote '${remoteName}' already loaded from cache.`);
    return remoteContainers.get(remoteName);
  }
  
  try {
    // Load the remote entry script
    console.log(`Loading remote entry script: ${config.url}`);
    await loadScript(config.url);
    
    // Initialize sharing
    await initSharing();
    
    // Get the container from window
    console.log(`Looking for container '${config.scope}' on window`);
    const container = (window as any)[config.scope];
    
    if (!container) {
      console.error(`Container '${config.scope}' not found on window. Available keys:`, Object.keys(window));
      throw new Error(`Container '${config.scope}' not found on window after loading script.`);
    }
    
    console.log(`Container '${config.scope}' found:`, container);
    
    // Initialize the container
    if (container.init) {
      try {
        console.log('Initializing container');
        
        // Ensure sharing is initialized first
        await initSharing();
        
        // Get the share scope
        const shareScope = (window as any).__webpack_share_scopes__?.default || {};
        console.log('Share scope keys:', Object.keys(shareScope));
        console.log('React in share scope:', !!shareScope.react);
        console.log('ReactDOM in share scope:', !!shareScope['react-dom']);

        // Debug: Check if React is available globally
        console.log('React available globally:', typeof (window as any).React);
        console.log('ReactDOM available globally:', typeof (window as any).ReactDOM);

        // Debug: Check what's in the share scope
        if (shareScope.react) {
          console.log('React share scope details:', {
            version: shareScope.react.version,
            loaded: shareScope.react.loaded,
            from: shareScope.react.from
          });
        } else {
          console.log('React not found in share scope');
        }
        
        // Only initialize if not already initialized
        if (!container.__initialized) {
          await container.init(shareScope);
          container.__initialized = true;
          console.log('Container initialized successfully with share scope');
        } else {
          console.log('Container already initialized, skipping initialization');
        }
      } catch (initError) {
        console.error('Error initializing container:', initError);
        // If it's already initialized, that's okay
        if (initError instanceof Error && initError.message && initError.message.includes('already been initialized')) {
          console.log('Container was already initialized, continuing...');
          container.__initialized = true;
        } else {
          throw initError; // Don't continue if container init fails for other reasons
        }
      }
    } else {
      console.log('Container has no init method, skipping initialization');
    }
    
    // Cache the container
    remoteContainers.set(remoteName, container);
    console.log(`Successfully loaded remote module '${remoteName}'.`);
    
    return container;
  } catch (error) {
    console.error(`Error loading remote '${remoteName}':`, error);
    
    if (attempt < maxAttempts) {
      console.warn(`Retrying load for remote '${remoteName}' in ${retryDelay}ms (attempt ${attempt + 1} of ${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return loadRemoteModule(remoteName, config, attempt + 1);
    }
    
    throw error;
  }
}

/**
 * Load a component from a remote module
 */
export async function loadComponent(
  remoteName: string, 
  componentName: string
): Promise<React.ComponentType<any>> {
  const cacheKey = `${remoteName}/${componentName}`;
  
  // Check cache first
  if (loadedComponents.has(cacheKey)) {
    console.log(`Component '${cacheKey}' already loaded from cache.`);
    return loadedComponents.get(cacheKey)!;
  }
  
  console.log(`Loading federated component: ${cacheKey}`);
  
  try {
    // Get configuration
    const config = (await fetchFederationConfig()).remotes[remoteName];
    
    if (!config) {
      throw new Error(`Configuration for remote '${remoteName}' not found.`);
    }
    
    console.log(`Configuration for remote '${remoteName}':`, config);
    
    // Load the remote container
    const container = await loadRemoteModule(remoteName, config);
    
    // Get the module factory
    console.log(`Getting module factory for './${componentName}'`);
    const factory = await container.get(`./${componentName}`);
    
    if (!factory) {
      throw new Error(`Factory for component '${componentName}' not found in remote '${remoteName}'.`);
    }
    
    console.log(`Factory for '${componentName}' found:`, factory);
    
    // Execute the factory to get the module
    console.log(`Executing factory for '${componentName}'`);
    const Module = factory();
    
    console.log(`Module for '${componentName}':`, Module);
    
    // Extract the component (handle both default and named exports)
    const Component = Module.default || Module[componentName] || Module;
    
    if (!Component) {
      console.error(`Available exports in module:`, Object.keys(Module));
      throw new Error(`Component '${componentName}' not found in remote '${remoteName}'.`);
    }
    
    console.log(`Component '${componentName}' extracted successfully:`, Component);
    
    // Cache the component
    loadedComponents.set(cacheKey, Component);
    console.log(`Successfully loaded federated component: ${cacheKey}`);
    
    return Component;
  } catch (error) {
    console.error(`Failed to load component ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * Preload a remote module (useful for performance optimization)
 */
export async function preloadRemote(remoteName: string): Promise<void> {
  try {
    const config = (await fetchFederationConfig()).remotes[remoteName];
    if (config) {
      await loadRemoteModule(remoteName, config);
    }
  } catch (error) {
    console.warn(`Failed to preload remote '${remoteName}':`, error);
  }
}

/**
 * Clear the cache (useful for development)
 */
export function clearFederationCache(): void {
  remoteContainers.clear();
  loadedComponents.clear();
  federationConfig = null;
  console.log('Federation cache cleared.');
}
