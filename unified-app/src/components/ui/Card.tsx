import React from 'react';
import { Card as RadixCard } from '@radix-ui/themes';

interface CardProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <RadixCard {...props}>
      {children}
    </RadixCard>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="p-4 border-b">
      {children}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="p-4">
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="p-4 border-t">
      {children}
    </div>
  );
};

export default Card;
