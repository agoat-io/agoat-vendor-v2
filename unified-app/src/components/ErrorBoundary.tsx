import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Heading, Text, Button, Card, CardContent } from './ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box style={{ padding: '2rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card>
            <CardContent>
              <Box style={{ textAlign: 'center' }}>
                <Heading size="6" mb="3" color="red">
                  Something went wrong
                </Heading>
                <Text size="3" color="gray" mb="4">
                  An unexpected error occurred. Please try refreshing the page.
                </Text>
                {this.state.error && (
                  <Box mb="4" style={{ textAlign: 'left' }}>
                    <Text size="2" color="gray" style={{ fontFamily: 'monospace', backgroundColor: 'var(--gray-2)', padding: '1rem', borderRadius: '4px' }}>
                      {this.state.error.message}
                    </Text>
                  </Box>
                )}
                <Button onClick={this.handleReload} fullWidth>
                  Refresh Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
