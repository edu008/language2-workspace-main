import Document, { Html, Head, Main, NextScript } from 'next/document';
import { extractCritical } from '@emotion/server';
import crypto from 'crypto';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const styles = extractCritical(initialProps.html);
    
    // Generate a nonce for scripts
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Determine if we're in development mode
    const isDev = process.env.NODE_ENV !== 'production';

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
      nonce,
      isDev,
    };
  }

  render() {
    return (
      <Html lang="de">
        <Head>
          <meta httpEquiv="Cache-Control" content="no-cache, must-revalidate" />
          {process.env.NODE_ENV === 'production' && (
            <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://cdn.discordapp.com; media-src 'self' data: blob:; object-src 'self' data: blob:; connect-src 'self' ws: wss:; worker-src 'self' blob:;" />
          )}
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
        </Head>
        <body>
          <Main />
          <NextScript nonce={this.props.nonce} />
          {/* Add optimization scripts with nonce */}
          <script src="/bfcache-helper.js" defer nonce={this.props.nonce}></script>
          <script src="/js-optimization.js" defer nonce={this.props.nonce}></script>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
