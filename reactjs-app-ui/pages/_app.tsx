import '../globals.css';
import type { AppProps } from 'next/app';
import ErrorBoundary from '../components/ErrorBoundary';
import { Theme } from '@radix-ui/themes';

// Bootstrap Module Federation
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__webpack_init_sharing__ = window.__webpack_init_sharing__ || function() {
    return Promise.resolve();
  };
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Theme appearance="light" accentColor="blue" grayColor="gray" radius="medium">
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </Theme>
  );
}

export default MyApp;