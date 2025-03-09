import Document, { Html, Head, Main, NextScript } from 'next/document';
import { extractCritical } from '@emotion/server';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const styles = extractCritical(initialProps.html);
    
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-emotion-css={styles.ids.join(' ')}
            dangerouslySetInnerHTML={{ __html: styles.css }}
          />
        </>
      ),
    };
  }

  render() {
    return (
      <Html lang="de">
        <Head>
          <meta name="description" content="Lerne Deutsch mit interaktiven Übungen zu Vokabeln, Präpositionen, Sprichwörtern und mehr." />
          <meta name="theme-color" content="#ffffff" />
          {/* Add meta tag for back/forward cache eligibility */}
          <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
          <meta http-equiv="Pragma" content="no-cache" />
          <meta http-equiv="Expires" content="0" />
          <meta name="back-forward-cache" content="enabled" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
          
          {/* Preload critical assets */}
          <link rel="preload" href="/_next/static/css/styles.css" as="style" />
        </Head>
        <body>
          <Main />
          <NextScript />
          {/* Add the bfcache helper script */}
          <script src="/bfcache-helper.js" defer></script>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
