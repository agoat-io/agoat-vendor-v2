/**
 * Design System Configuration
 * Implements Radix Themes design tokens and responsive utilities
 * Aligns with NFR-UI-001 requirements for consistent theming
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

// Preconfigured Radix Themes combinations
export const PRECONFIGURED_THEMES = {
  // Modern Professional
  modern: {
    appearance: 'light' as const,
    accentColor: 'blue' as const,
    grayColor: 'slate' as const,
    radius: 'medium' as const,
    scaling: '100%' as const,
  },
  
  // Warm and Friendly
  warm: {
    appearance: 'light' as const,
    accentColor: 'orange' as const,
    grayColor: 'sand' as const,
    radius: 'large' as const,
    scaling: '100%' as const,
  },
  
  // Minimal and Clean
  minimal: {
    appearance: 'light' as const,
    accentColor: 'gray' as const,
    grayColor: 'gray' as const,
    radius: 'small' as const,
    scaling: '95%' as const,
  },
  
  // Vibrant and Energetic
  vibrant: {
    appearance: 'light' as const,
    accentColor: 'purple' as const,
    grayColor: 'mauve' as const,
    radius: 'large' as const,
    scaling: '105%' as const,
  },
  
  // Nature Inspired
  nature: {
    appearance: 'light' as const,
    accentColor: 'green' as const,
    grayColor: 'sage' as const,
    radius: 'medium' as const,
    scaling: '100%' as const,
  },
  
  // Dark Professional
  darkProfessional: {
    appearance: 'dark' as const,
    accentColor: 'blue' as const,
    grayColor: 'slate' as const,
    radius: 'medium' as const,
    scaling: '100%' as const,
  },
  
  // Dark Warm
  darkWarm: {
    appearance: 'dark' as const,
    accentColor: 'orange' as const,
    grayColor: 'sand' as const,
    radius: 'large' as const,
    scaling: '100%' as const,
  },
  
  // Dark Minimal
  darkMinimal: {
    appearance: 'dark' as const,
    accentColor: 'gray' as const,
    grayColor: 'gray' as const,
    radius: 'small' as const,
    scaling: '95%' as const,
  },
};

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

export default {
  DESIGN_TOKENS,
  RESPONSIVE_BREAKPOINTS,
  COMPONENT_TOKENS,
  PRECONFIGURED_THEMES,
  THEME_CONFIG,
  responsive,
  spacing,
};
