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
        <meta httpEquiv="Cache-Control" content="no-cache, must-revalidate" />
            <meta name="description" content="Lerne Deutsch mit interaktiven Übungen zu Vokabeln, Präpositionen, Sprichwörtern und mehr." />
          <meta name="theme-color" content="#ffffff" />
          {/* Fixed duplicate Cache-Control and other http-equiv attributes */}
          <meta httpEquiv="Pragma" content="no-cache" />
          <meta httpEquiv="Expires" content="0" />
          <meta name="back-forward-cache" content="enabled" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
          {/* Preload critical assets */}
        </Head>
        <body>
          <Main />
          <NextScript />
          {/* Add the bfcache helper script */}
        </body>
      </Html>
    );
  }
}

export default MyDocument;