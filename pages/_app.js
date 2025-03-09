import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppProvider, useBaseContext } from '../contexts/AppContext';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useCallback } from 'react';

// Import CSS
import '@/styles/output.css';
import '../styles/globals.css';
import '../styles/index.css';

// Import FontAwesome config - optimized to only import what's needed
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faTrashRestore } from '@fortawesome/free-solid-svg-icons/faTrashRestore';
import { faTable } from '@fortawesome/free-solid-svg-icons/faTable';

// Only add the specific icons we use
library.add(faArrowLeft, faFilter, faTrashRestore, faTable);
config.autoAddCss = false;

// Dynamic imports for components that aren't needed immediately
const LoadingScreen = dynamic(() => import('../components/ui/LoadingScreen'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Laden...</div>
});

// LearningTable will be loaded only when needed
const LearningTable = dynamic(() => import('../components/ui/LearningTable'), {
  ssr: false,
  loading: () => null
});

function AuthWrapper({ Component, pageProps }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  const { isDataLoaded } = useBaseContext();

  const publicRoutes = ['/', '/Worterfassung', '/enterdeutsch', '/enterpraeposition', '/enterpraepverben', '/enterredewendung', '/entersprichwort', '/statistics'];

  useEffect(() => {
    if (!loading) {
      if (!session && !publicRoutes.includes(router.pathname)) {
        router.replace('/');
      }
    }
  }, [session, status, router, router.pathname]);

  const isPublicRoute = publicRoutes.includes(router.pathname);

  if (loading || (!isPublicRoute && !isDataLoaded)) {
    return <LoadingScreen />;
  }

  if (!session && !isPublicRoute) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <Component {...pageProps} />
      <LearningTable />
    </>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const router = useRouter();

  // Function to clean up any WebSocket connections using our optimization utilities
  const cleanupWebSockets = useCallback(() => {
    // Use the bfcache-helper.js functionality which is already loaded in _document.js
    if (typeof window !== 'undefined' && window.JsOptimization) {
      try {
        // Start performance monitoring for the cleanup
        window.JsOptimization.PerformanceMonitor.start('websocket-cleanup');
        
        // The actual cleanup is handled by bfcache-helper.js
        // This is just an additional safety measure
        const websockets = Object.keys(window)
          .filter(key => key.includes('WebSocket') || (window[key] && typeof window[key] === 'object' && window[key].OPEN))
          .map(key => window[key]);
        
        websockets.forEach(ws => {
          if (ws && typeof ws.close === 'function') {
            try {
              ws.close();
            } catch (e) {
              console.warn('Error closing WebSocket:', e);
            }
          }
        });
        
        // End performance monitoring
        window.JsOptimization.PerformanceMonitor.end('websocket-cleanup');
      } catch (error) {
        console.warn('Error in WebSocket cleanup:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsRouteChanging(true);
      // Clean up WebSockets before navigation
      cleanupWebSockets();
    };
    const handleRouteChangeComplete = () => {
      setIsRouteChanging(false);
    };
    const handleRouteChangeError = () => {
      setIsRouteChanging(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    // Add event listener for page unload to clean up WebSockets
    window.addEventListener('beforeunload', cleanupWebSockets);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
      window.removeEventListener('beforeunload', cleanupWebSockets);
      
      // Clean up WebSockets when component unmounts
      cleanupWebSockets();
    };
  }, [router.events, cleanupWebSockets]);

  if (isRouteChanging) {
    return <LoadingScreen />;
  }

  return (
    <SessionProvider session={session}>
      <Head>
        <title>Deutsch Lernen - Interaktive Übungen</title>
      </Head>
      <AppProvider>
        <AuthWrapper Component={Component} pageProps={pageProps} />
      </AppProvider>
    </SessionProvider>
  );
}
