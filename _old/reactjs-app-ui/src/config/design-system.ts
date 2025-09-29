/**
 * Design System Configuration
 * Implements Radix Themes design tokens and responsive utilities
 * Aligns with NFR-UI-001 requirements for consistent theming with extensibility
 */

export const DESIGN_TOKENS = {
  // Spacing scale (using Radix Themes spacing tokens)
  spacing: {
    xs: 'var(--space-1)',
    sm: 'var(--space-2)',
    md: 'var(--space-3)',
    lg: 'var(--space-4)',
    xl: 'var(--space-5)',
    '2xl': 'var(--space-6)',
    '3xl': 'var(--space-7)',
    '4xl': 'var(--space-8)',
    '5xl': 'var(--space-9)',
  },

  // Typography scale
  typography: {
    heading: {
      h1: 'var(--font-size-8)',
      h2: 'var(--font-size-7)',
      h3: 'var(--font-size-6)',
      h4: 'var(--font-size-5)',
      h5: 'var(--font-size-4)',
      h6: 'var(--font-size-3)',
    },
    body: {
      large: 'var(--font-size-4)',
      medium: 'var(--font-size-3)',
      small: 'var(--font-size-2)',
      xsmall: 'var(--font-size-1)',
    },
    lineHeight: {
      tight: 'var(--line-height-1)',
      normal: 'var(--line-height-2)',
      relaxed: 'var(--line-height-3)',
      loose: 'var(--line-height-4)',
    },
  },

  // Color tokens
  colors: {
    primary: {
      50: 'var(--blue-1)',
      100: 'var(--blue-2)',
      200: 'var(--blue-3)',
      300: 'var(--blue-4)',
      400: 'var(--blue-5)',
      500: 'var(--blue-6)',
      600: 'var(--blue-7)',
      700: 'var(--blue-8)',
      800: 'var(--blue-9)',
      900: 'var(--blue-10)',
      950: 'var(--blue-11)',
      1000: 'var(--blue-12)',
    },
    gray: {
      50: 'var(--gray-1)',
      100: 'var(--gray-2)',
      200: 'var(--gray-3)',
      300: 'var(--gray-4)',
      400: 'var(--gray-5)',
      500: 'var(--gray-6)',
      600: 'var(--gray-7)',
      700: 'var(--gray-8)',
      800: 'var(--gray-9)',
      900: 'var(--gray-10)',
      950: 'var(--gray-11)',
      1000: 'var(--gray-12)',
    },
    success: {
      50: 'var(--green-1)',
      500: 'var(--green-6)',
      900: 'var(--green-9)',
    },
    warning: {
      50: 'var(--yellow-1)',
      500: 'var(--yellow-6)',
      900: 'var(--yellow-9)',
    },
    error: {
      50: 'var(--red-1)',
      500: 'var(--red-6)',
      900: 'var(--red-9)',
    },
  },

  // Border radius
  borderRadius: {
    none: 'var(--radius-1)',
    sm: 'var(--radius-2)',
    md: 'var(--radius-3)',
    lg: 'var(--radius-4)',
    xl: 'var(--radius-5)',
    full: 'var(--radius-6)',
  },

  // Shadows
  shadows: {
    sm: 'var(--shadow-1)',
    md: 'var(--shadow-2)',
    lg: 'var(--shadow-3)',
    xl: 'var(--shadow-4)',
  },
};

// Responsive breakpoints (using Radix Themes responsive utilities)
export const RESPONSIVE_BREAKPOINTS = {
  mobile: 'max-width: 767px',
  tablet: 'min-width: 768px',
  desktop: 'min-width: 1024px',
  wide: 'min-width: 1280px',
};

// Component-specific design tokens
export const COMPONENT_TOKENS = {
  card: {
    padding: DESIGN_TOKENS.spacing.lg,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    shadow: DESIGN_TOKENS.shadows.sm,
    backgroundColor: DESIGN_TOKENS.colors.gray[50],
  },
  button: {
    padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    fontSize: DESIGN_TOKENS.typography.body.medium,
  },
  input: {
    padding: DESIGN_TOKENS.spacing.sm,
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    borderColor: DESIGN_TOKENS.colors.gray[500],
  },
  header: {
    height: '64px',
    backgroundColor: 'white',
    borderBottom: `1px solid ${DESIGN_TOKENS.colors.gray[500]}`,
  },
  container: {
    maxWidth: '1200px',
    padding: DESIGN_TOKENS.spacing.lg,
  },
};

// Theme configuration interface for extensibility
export interface ThemeConfiguration {
  appearance: 'light' | 'dark';
  accentColor: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'pink' | 'gray';
  grayColor: 'gray' | 'mauve' | 'slate' | 'sage' | 'olive' | 'sand';
  radius: 'none' | 'small' | 'medium' | 'large' | 'full';
  scaling: '90%' | '95%' | '100%' | '105%' | '110%';
  name: string;
  description: string;
  category: 'preconfigured' | 'custom';
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
    compatibility?: string[];
  };
}

// Preconfigured Radix Themes combinations (Foundation)
export const PRECONFIGURED_THEMES: Record<string, ThemeConfiguration> = {
  // Modern Professional
  modern: {
    appearance: 'light',
    accentColor: 'blue',
    grayColor: 'slate',
    radius: 'medium',
    scaling: '100%',
    name: 'Modern Professional',
    description: 'Clean blue theme with slate grays',
    category: 'preconfigured',
    metadata: {
      tags: ['professional', 'clean', 'modern'],
      compatibility: ['all'],
    },
  },
  
  // Warm and Friendly
  warm: {
    appearance: 'light',
    accentColor: 'orange',
    grayColor: 'sand',
    radius: 'large',
    scaling: '100%',
    name: 'Warm & Friendly',
    description: 'Orange accent with warm sand tones',
    category: 'preconfigured',
    metadata: {
      tags: ['warm', 'friendly', 'approachable'],
      compatibility: ['all'],
    },
  },
  
  // Minimal and Clean
  minimal: {
    appearance: 'light',
    accentColor: 'gray',
    grayColor: 'gray',
    radius: 'small',
    scaling: '95%',
    name: 'Minimal & Clean',
    description: 'Subtle gray theme with small radius',
    category: 'preconfigured',
    metadata: {
      tags: ['minimal', 'clean', 'subtle'],
      compatibility: ['all'],
    },
  },
  
  // Vibrant and Energetic
  vibrant: {
    appearance: 'light',
    accentColor: 'purple',
    grayColor: 'mauve',
    radius: 'large',
    scaling: '105%',
    name: 'Vibrant & Energetic',
    description: 'Purple accent with mauve grays',
    category: 'preconfigured',
    metadata: {
      tags: ['vibrant', 'energetic', 'creative'],
      compatibility: ['all'],
    },
  },
  
  // Nature Inspired
  nature: {
    appearance: 'light',
    accentColor: 'green',
    grayColor: 'sage',
    radius: 'medium',
    scaling: '100%',
    name: 'Nature Inspired',
    description: 'Green accent with sage grays',
    category: 'preconfigured',
    metadata: {
      tags: ['nature', 'organic', 'calm'],
      compatibility: ['all'],
    },
  },
  
  // Dark Professional
  darkProfessional: {
    appearance: 'dark',
    accentColor: 'blue',
    grayColor: 'slate',
    radius: 'medium',
    scaling: '100%',
    name: 'Dark Professional',
    description: 'Dark mode with blue accent',
    category: 'preconfigured',
    metadata: {
      tags: ['dark', 'professional', 'modern'],
      compatibility: ['all'],
    },
  },
  
  // Dark Warm
  darkWarm: {
    appearance: 'dark',
    accentColor: 'orange',
    grayColor: 'sand',
    radius: 'large',
    scaling: '100%',
    name: 'Dark Warm',
    description: 'Dark mode with orange accent',
    category: 'preconfigured',
    metadata: {
      tags: ['dark', 'warm', 'cozy'],
      compatibility: ['all'],
    },
  },
  
  // Dark Minimal
  darkMinimal: {
    appearance: 'dark',
    accentColor: 'gray',
    grayColor: 'gray',
    radius: 'small',
    scaling: '95%',
    name: 'Dark Minimal',
    description: 'Dark mode with gray accent',
    category: 'preconfigured',
    metadata: {
      tags: ['dark', 'minimal', 'clean'],
      compatibility: ['all'],
    },
  },
};

// Custom theme combinations registry
export const CUSTOM_THEMES: Record<string, ThemeConfiguration> = {
  // Example custom theme - can be extended
  corporate: {
    appearance: 'light',
    accentColor: 'blue',
    grayColor: 'slate',
    radius: 'small',
    scaling: '95%',
    name: 'Corporate',
    description: 'Professional corporate theme with conservative styling',
    category: 'custom',
    metadata: {
      author: 'Design Team',
      version: '1.0.0',
      tags: ['corporate', 'professional', 'conservative'],
      compatibility: ['all'],
    },
  },
};

// Theme registry for managing all themes
export class ThemeRegistry {
  private themes: Record<string, ThemeConfiguration> = {};

  constructor() {
    // Initialize with preconfigured themes
    Object.entries(PRECONFIGURED_THEMES).forEach(([key, theme]) => {
      this.registerTheme(key, theme);
    });
    
    // Initialize with custom themes
    Object.entries(CUSTOM_THEMES).forEach(([key, theme]) => {
      this.registerTheme(key, theme);
    });
  }

  registerTheme(key: string, theme: ThemeConfiguration): void {
    // Validate theme configuration
    this.validateTheme(theme);
    this.themes[key] = theme;
  }

  getTheme(key: string): ThemeConfiguration | undefined {
    return this.themes[key];
  }

  getAllThemes(): Record<string, ThemeConfiguration> {
    return { ...this.themes };
  }

  getPreconfiguredThemes(): Record<string, ThemeConfiguration> {
    return Object.fromEntries(
      Object.entries(this.themes).filter(([_, theme]) => theme.category === 'preconfigured')
    );
  }

  getCustomThemes(): Record<string, ThemeConfiguration> {
    return Object.fromEntries(
      Object.entries(this.themes).filter(([_, theme]) => theme.category === 'custom')
    );
  }

  private validateTheme(theme: ThemeConfiguration): void {
    // Validate required properties
    const requiredProps = ['appearance', 'accentColor', 'grayColor', 'radius', 'scaling', 'name', 'description', 'category'];
    requiredProps.forEach(prop => {
      if (!(prop in theme)) {
        throw new Error(`Theme validation failed: Missing required property '${prop}'`);
      }
    });

    // Validate enum values
    const validAppearances = ['light', 'dark'];
    const validAccentColors = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'pink', 'gray'];
    const validGrayColors = ['gray', 'mauve', 'slate', 'sage', 'olive', 'sand'];
    const validRadius = ['none', 'small', 'medium', 'large', 'full'];
    const validScaling = ['90%', '95%', '100%', '105%', '110%'];
    const validCategories = ['preconfigured', 'custom'];

    if (!validAppearances.includes(theme.appearance)) {
      throw new Error(`Invalid appearance: ${theme.appearance}`);
    }
    if (!validAccentColors.includes(theme.accentColor)) {
      throw new Error(`Invalid accent color: ${theme.accentColor}`);
    }
    if (!validGrayColors.includes(theme.grayColor)) {
      throw new Error(`Invalid gray color: ${theme.grayColor}`);
    }
    if (!validRadius.includes(theme.radius)) {
      throw new Error(`Invalid radius: ${theme.radius}`);
    }
    if (!validScaling.includes(theme.scaling)) {
      throw new Error(`Invalid scaling: ${theme.scaling}`);
    }
    if (!validCategories.includes(theme.category)) {
      throw new Error(`Invalid category: ${theme.category}`);
    }
  }
}

// Theme configuration for Radix Themes
export const THEME_CONFIG = {
  appearance: 'light' as const,
  accentColor: 'blue' as const,
  grayColor: 'gray' as const,
  radius: 'medium' as const,
  scaling: '100%' as const,
  panelBackground: 'solid' as const,
  hasBackground: false,
};

// Utility functions for responsive design
export const responsive = {
  mobile: `@media (${RESPONSIVE_BREAKPOINTS.mobile})`,
  tablet: `@media (${RESPONSIVE_BREAKPOINTS.tablet})`,
  desktop: `@media (${RESPONSIVE_BREAKPOINTS.desktop})`,
  wide: `@media (${RESPONSIVE_BREAKPOINTS.wide})`,
};

// Spacing utilities for consistent layout
export const spacing = {
  container: {
    padding: { xs: '16px', sm: '24px', md: '32px' },
    maxWidth: '1200px',
  },
  section: {
    padding: { xs: '24px 0', sm: '32px 0', md: '48px 0' },
  },
  card: {
    padding: { xs: '16px', sm: '20px', md: '24px' },
  },
};

// Initialize theme registry
export const themeRegistry = new ThemeRegistry();

export default {
  DESIGN_TOKENS,
  RESPONSIVE_BREAKPOINTS,
  COMPONENT_TOKENS,
  PRECONFIGURED_THEMES,
  CUSTOM_THEMES,
  THEME_CONFIG,
  responsive,
  spacing,
  themeRegistry,
};
