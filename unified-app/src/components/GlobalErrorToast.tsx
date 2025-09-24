import React, { useEffect, useState } from 'react'
import eventBus from '../utils/eventBus'
import ErrorPopup from './ErrorPopup'

type APIErrorPayload = {
  code?: string
  message?: string
  error_id?: string
  is_business?: boolean
}

const GlobalErrorToast: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<APIErrorPayload | null>(null)

  useEffect(() => {
    const unsub = eventBus.on<APIErrorPayload>('api:error', (payload) => {
      // For technical errors, show generic text with GUID
      const isBusiness = !!payload?.is_business
      const display: APIErrorPayload = {
        code: isBusiness ? (payload.code || 'BUSINESS_ERROR') : 'TECHNICAL_ERROR',
        message: isBusiness ? (payload.message || 'A business rule prevented this action.') : 'An error occurred. Please try again later.',
        error_id: payload.error_id,
        is_business: isBusiness,
      }
      setError(display)
      setOpen(true)
    })
    return () => { unsub && unsub() }
  }, [])

  return (
    <ErrorPopup 
      isOpen={open} 
      onClose={() => setOpen(false)} 
      error={{
        code: error?.code || 'ERROR',
        message: error?.message || 'An error occurred.',
        error_id: error?.error_id,
      }}
      isBusinessError={!!error?.is_business}
    />
  )
}

export default GlobalErrorToast


