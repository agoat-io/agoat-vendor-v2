import React from 'react';
import { Card as RadixCard, CardProps as RadixCardProps } from '@radix-ui/themes';
import { COMPONENT_TOKENS, spacing } from '../../config/design-system';

interface CardProps extends Omit<RadixCardProps, 'size'> {
  size?: '1' | '2' | '3' | '4';
  variant?: 'surface' | 'classic' | 'ghost';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
  interactive?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  size = '3',
  variant = 'surface',
  padding = 'medium',
  children,
  onClick,
  interactive = false,
  fullWidth = false,
  className,
  ...props
}) => {
  const getPaddingValue = () => {
    switch (padding) {
      case 'none': return '0';
      case 'small': return spacing.card.padding.xs;
      case 'medium': return spacing.card.padding.sm;
      case 'large': return spacing.card.padding.md;
      default: return spacing.card.padding.sm;
    }
  };

  return (
    <RadixCard
      size={size}
      variant={variant}
      style={{
        width: fullWidth ? '100%' : 'auto',
        cursor: interactive ? 'pointer' : 'default',
        transition: interactive ? 'all 0.2s ease-in-out' : 'none',
        ...COMPONENT_TOKENS.card,
      }}
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </RadixCard>
  );
};

// Card Header component
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div
    style={{
      paddingBottom: spacing.card.padding.xs,
      marginBottom: spacing.card.padding.xs,
      borderBottom: '1px solid var(--gray-6)',
    }}
    className={className}
  >
    {children}
  </div>
);

// Card Content component
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={className}>
    {children}
  </div>
);

// Card Footer component
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div
    style={{
      paddingTop: spacing.card.padding.xs,
      marginTop: spacing.card.padding.xs,
      borderTop: '1px solid var(--gray-6)',
    }}
    className={className}
  >
    {children}
  </div>
);

export default Card;
