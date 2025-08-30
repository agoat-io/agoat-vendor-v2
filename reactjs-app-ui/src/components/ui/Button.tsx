import React from 'react';
import { Button as RadixButton, ButtonProps as RadixButtonProps } from '@radix-ui/themes';
import { COMPONENT_TOKENS } from '../../config/design-system';

interface ButtonProps extends Omit<RadixButtonProps, 'size'> {
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
        ...COMPONENT_TOKENS.button,
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

// Add CSS for loading spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default Button;
