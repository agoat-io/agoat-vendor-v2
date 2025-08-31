import React from 'react';
import { Button as RadixButton } from '@radix-ui/themes';

interface ButtonProps {
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  size?: '1' | '2' | '3' | '4';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'pink' | 'gray';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  size = '3',
  color = 'blue',
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) => {
  return (
    <RadixButton
      variant={variant}
      size={size}
      color={color}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      style={{
        width: fullWidth ? '100%' : 'auto',
      }}
      {...props}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          Loading...
        </div>
      ) : (
        children
      )}
    </RadixButton>
  );
};

export default Button;
