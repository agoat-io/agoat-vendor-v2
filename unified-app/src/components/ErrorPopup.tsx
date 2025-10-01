import React from 'react'
import { 
  Box, 
  Button, 
  Flex, 
  Text, 
  Card,
  Badge
} from './ui'
import { Cross2Icon, ExclamationTriangleIcon } from '@radix-ui/react-icons'

interface ErrorPopupProps {
  isOpen: boolean
  onClose: () => void
  error: {
    code: string
    message: string
    details?: string
    error_id?: string
  } | null
  isBusinessError?: boolean
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ 
  isOpen, 
  onClose, 
  error, 
  isBusinessError = false 
}) => {
  if (!isOpen || !error) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <Box p="4">
          <Flex justify="between" align="center" mb="3">
            <Flex align="center" gap="2">
              <ExclamationTriangleIcon className="text-red-500" />
              <Text size="5" weight="bold" color="red">
                {isBusinessError ? 'Business Error' : 'Technical Error'}
              </Text>
            </Flex>
            <Button 
              variant="ghost" 
              size="1" 
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              <Cross2Icon />
            </Button>
          </Flex>

          <Box mb="3">
            <Badge color={isBusinessError ? "orange" : "red"} mb="2">
              {error.code}
            </Badge>
            <Text size="3" weight="medium" mb="2">
              {error.message}
            </Text>
            {error.details && (
              <Text size="2" color="gray" mb="2">
                {error.details}
              </Text>
            )}
            {error.error_id && (
              <Box mt="3" p="2" className="bg-gray-100 rounded">
                <Text size="1" weight="medium" color="gray">
                  Error ID: {error.error_id}
                </Text>
                <Text size="1" color="gray">
                  Please provide this ID when reporting the issue.
                </Text>
              </Box>
            )}
          </Box>

          <Flex justify="end" gap="2">
            <Button variant="soft" onClick={onClose}>
              Close
            </Button>
            {!isBusinessError && (
              <Button variant="solid" color="red">
                Report Issue
              </Button>
            )}
          </Flex>
        </Box>
      </Card>
    </div>
  )
}

export default ErrorPopup
