import '@/styles/output.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import LoadingScreen from '../components/deutsch/LoadingScreen';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider, useSession } from 'next-auth/react';
import '../styles/globals.css';
import '../styles/index.css';

config.autoAddCss = false;

// Auth wrapper component to check authentication status
function AuthWrapper({ Component, pageProps }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // List of public routes that don't require authentication
  const publicRoutes = ['/'];

  useEffect(() => {
    // If authentication check is complete
    if (status !== "loading") {
      // If not authenticated and not on a public route, redirect to home
      if (!session && !publicRoutes.includes(router.pathname)) {
        router.replace('/');
      } else {
        // Otherwise, mark as ready to render
        setIsReady(true);
      }
    }
  }, [session, status, router, router.pathname]);

  // Show loading screen while checking auth or during route transitions
  if (loading || !isReady) {
    return <LoadingScreen />;
  }

  // If on a protected route and no session, don't render anything (will redirect)
  if (!session && !publicRoutes.includes(router.pathname)) {
    return <LoadingScreen />;
  }

  // Otherwise render the page
  return <Component {...pageProps} />;
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => setIsRouteChanging(true);
    const handleRouteChangeComplete = () => setIsRouteChanging(false);
    const handleRouteChangeError = () => setIsRouteChanging(false);

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    // Cleanup event listeners
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router.events]);

  // Show loading screen during route changes
  if (isRouteChanging) {
    return <LoadingScreen />;
  }

  return (
    <SessionProvider session={session}>
      <AuthWrapper Component={Component} pageProps={pageProps} />
    </SessionProvider>
  );
}