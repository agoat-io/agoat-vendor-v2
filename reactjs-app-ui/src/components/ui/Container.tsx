import React from 'react';
import { Box } from '@radix-ui/themes';
import { COMPONENT_TOKENS, spacing, responsive } from '../../config/design-system';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  fluid?: boolean;
  centered?: boolean;
  className?: string;
  size?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  style?: React.CSSProperties;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = COMPONENT_TOKENS.container.maxWidth,
  padding = 'medium',
  fluid = false,
  centered = true,
  className,
  size,
  style,
}) => {
  const getPaddingValue = () => {
    if (fluid) return '0';
    
    switch (padding) {
      case 'none': return '0';
      case 'small': return spacing.container.padding.xs;
      case 'medium': return spacing.container.padding.sm;
      case 'large': return spacing.container.padding.md;
      default: return spacing.container.padding.sm;
    }
  };

  return (
    <Box
      style={{
        maxWidth: fluid ? '100%' : maxWidth,
        margin: centered ? '0 auto' : '0',
        padding: getPaddingValue(),
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      className={className}
    >
      {children}
    </Box>
  );
};

// Responsive Container with breakpoint-specific behavior
interface ResponsiveContainerProps extends ContainerProps {
  breakpoint?: 'mobile' | 'tablet' | 'desktop' | 'wide';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  breakpoint = 'desktop',
  ...props
}) => {
  const getResponsiveMaxWidth = () => {
    switch (breakpoint) {
      case 'mobile': return '100%';
      case 'tablet': return '768px';
      case 'desktop': return '1024px';
      case 'wide': return '1280px';
      default: return COMPONENT_TOKENS.container.maxWidth;
    }
  };

  return (
    <Container
      maxWidth={getResponsiveMaxWidth()}
      {...props}
    >
      {children}
    </Container>
  );
};

// Section Container for content sections
interface SectionContainerProps extends ContainerProps {
  spacing?: 'none' | 'small' | 'medium' | 'large';
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  spacing: sectionSpacing = 'medium',
  ...props
}) => {
  const getSectionPadding = () => {
    switch (sectionSpacing) {
      case 'none': return '0';
      case 'small': return spacing.section.padding.xs;
      case 'medium': return spacing.section.padding.sm;
      case 'large': return spacing.section.padding.md;
      default: return spacing.section.padding.sm;
    }
  };

  return (
    <Box
      style={{
        padding: getSectionPadding(),
        width: '100%',
      }}
    >
      <Container {...props}>
        {children}
      </Container>
    </Box>
  );
};

export default Container;
