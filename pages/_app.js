import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppProvider, useBaseContext } from '../contexts/AppContext';
import dynamic from 'next/dynamic';
import Head from 'next/head';

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
  ssr: false
});

const LearningTable = dynamic(() => import('../components/ui/LearningTable'), {
  ssr: false
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

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsRouteChanging(true);
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

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router.events]);

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
