import '../globals.css';
import type { AppProps } from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';
import { AppThemeProvider } from '../src/components/ThemeProvider';

// Bootstrap Module Federation
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__webpack_init_sharing__ = window.__webpack_init_sharing__ || function() {
    return Promise.resolve();
  };
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppThemeProvider showThemePanel={process.env.NODE_ENV === 'development'}>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </AppThemeProvider>
  );
}

export default MyApp;