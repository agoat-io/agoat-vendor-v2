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
    const response = await fetch('/federation-config.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch federation config: ${response.statusText}`);
    }
    federationConfig = await response.json();
    console.log('Federation config loaded:', federationConfig);
    return federationConfig;
  } catch (error) {
    console.error('Error fetching federation config:', error);
    throw new Error('Could not load federation configuration.');
  }
}

/**
 * Load a script dynamically
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    
    if (existingScript) {
      // Script already loaded or loading
      if (existingScript.getAttribute('data-loaded') === 'true') {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error(`Failed to load script: ${url}`)));
      }
      return;
    }
    
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-loaded', 'false');
    
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load script: ${url}`));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Initialize webpack sharing
 */
async function initSharing(): Promise<void> {
  // Check if __webpack_init_sharing__ exists
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
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
  const maxAttempts = federationConfig?.retryAttempts || 3;
  const retryDelay = federationConfig?.retryDelay || 1000;
  
  console.log(`Loading remote module '${remoteName}' from ${config.url}, attempt ${attempt}`);
  
  // Check cache first
  if (remoteContainers.has(remoteName)) {
    console.log(`Remote '${remoteName}' already loaded from cache.`);
    return remoteContainers.get(remoteName);
  }
  
  try {
    // Load the remote entry script
    await loadScript(config.url);
    
    // Initialize sharing
    await initSharing();
    
    // Get the container from window
    const container = (window as any)[config.scope];
    
    if (!container) {
      throw new Error(`Container '${config.scope}' not found on window after loading script.`);
    }
    
    // Initialize the container
    if (container.init) {
      // Check if __webpack_share_scopes__ exists
      const shareScope = (window as any).__webpack_share_scopes__?.default || {};
      await container.init(shareScope);
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
    
    // Load the remote container
    const container = await loadRemoteModule(remoteName, config);
    
    // Get the module factory
    const factory = await container.get(`./${componentName}`);
    
    // Execute the factory to get the module
    const Module = factory();
    
    // Extract the component (handle both default and named exports)
    const Component = Module.default || Module[componentName] || Module;
    
    if (!Component) {
      throw new Error(`Component '${componentName}' not found in remote '${remoteName}'.`);
    }
    
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
