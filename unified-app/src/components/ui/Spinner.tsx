import React from 'react'

interface SpinnerProps {
  size?: '1' | '2' | '3' | '4'
}

export const Spinner: React.FC<SpinnerProps> = ({ size = '3' }) => {
  const sizeMap = {
    '1': '12px',
    '2': '16px',
    '3': '20px',
    '4': '24px'
  }

  return (
    <div
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: '2px solid transparent',
        borderTop: '2px solid currentColor',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  )
}

export default Spinner
