import '@/styles/output.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import LoadingScreen from '../components/deutsch/LoadingScreen';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppContext } from '../pages/context/AppContext';
import { AppProvider } from '../pages/context/AppContext';
import '../styles/globals.css';
import '../styles/index.css';

config.autoAddCss = false;

function AuthWrapper({ Component, pageProps }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const router = useRouter();
  const { isDataLoaded } = useContext(AppContext);

  const publicRoutes = ['/', '/Worterfassung', '/enterdeutsch', '/enterpraeposition', '/enterpraepverben', '/enterredewendung', '/entersprichwort','/statistics'];

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
  return <Component {...pageProps} />;
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
      <AppProvider>
        <AuthWrapper Component={Component} pageProps={pageProps} />
      </AppProvider>
    </SessionProvider>
  );
}